/**
 * MultiplayerNetworkEngine.ts
 * Central Multiplayer Networking Engine for PISO Academy Metaverse.
 * 
 * Provides:
 * 1. BroadcastChannel inter-window real-time mesh (zero-latency, instant local testing across tabs).
 * 2. Gun.js decentralized graph relay synchronization across network peers.
 * 3. Graceful Single-Player Fallback when network connectivity is lost.
 * 4. 15 Hz throttled player state synchronization.
 * 5. Heartbeat watchdog & stale peer removal.
 */

import {
  RemotePlayerState,
  NetworkPacketEnvelope,
  NetworkChatPayload,
  NetworkInteractionPayload,
  MultiplayerProvider,
  MultiplayerProviderEvents,
} from '../../types/multiplayer';

const BROADCAST_CHANNEL_NAME = 'piso_metaverse_channel_v1';
const GUN_SYNC_KEY = 'piso_metaverse_players_v1';
const HEARTBEAT_INTERVAL_MS = 2000;
const PEER_TIMEOUT_MS = 8000;
const SEND_THROTTLE_MS = 60; // ~16.6 updates/sec

export class MultiplayerNetworkEngine implements MultiplayerProvider {
  public static instance: MultiplayerNetworkEngine = new MultiplayerNetworkEngine();

  public id = 'piso_multiplayer_engine';
  private localPlayer: RemotePlayerState | null = null;
  private currentRoomId = 'genesis_academy_main';
  private broadcastChannel: BroadcastChannel | null = null;
  private remotePlayers: Map<string, RemotePlayerState> = new Map();
  private peerLastSeen: Map<string, number> = new Map();
  private isConnected = false;
  private connectionStatus: 'connected' | 'reconnecting' | 'disconnected' | 'solo' = 'disconnected';

  private lastSentTime = 0;
  private heartbeatInterval: any = null;
  private staleCheckInterval: any = null;

  // Event Listeners
  private eventHandlers: {
    [K in keyof MultiplayerProviderEvents]: Set<MultiplayerProviderEvents[K]>;
  } = {
    onPlayerJoin: new Set(),
    onPlayerLeave: new Set(),
    onPlayerUpdate: new Set(),
    onChatMessage: new Set(),
    onInteraction: new Set(),
    onConnectionStatusChange: new Set(),
  };

  private constructor() {
    // Singleton
  }

  /**
   * Connect local player to the multiplayer world
   */
  public async connect(localPlayer: RemotePlayerState): Promise<void> {
    this.localPlayer = { ...localPlayer };

    try {
      // 1. Initialize BroadcastChannel for instant local & tab-to-tab peer connectivity
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.broadcastChannel.onmessage = (event: MessageEvent) => {
          this.handleIncomingPacket(event.data);
        };
      }

      // 2. Initialize Gun.js graph mesh listener for inter-machine P2P if available
      this.initGunMesh();

      this.isConnected = true;
      this.setConnectionStatus('connected');

      // 3. Broadcast Join Packet to announce arrival to all existing peers
      this.broadcastPacket({
        type: 'player_join',
        roomId: this.currentRoomId,
        senderId: this.localPlayer.playerId,
        timestamp: Date.now(),
        payload: this.localPlayer,
      });

      // 4. Start Heartbeat & Stale Watchdog
      this.startWatchdog();

      console.log(`🌐 [MultiplayerEngine] Connected student: ${localPlayer.username} (${localPlayer.playerId})`);
    } catch (err) {
      console.warn('⚠️ [MultiplayerEngine] Connecting fallback mode:', err);
      this.setConnectionStatus('solo');
    }
  }

  /**
   * Disconnect and broadcast departure
   */
  public async disconnect(): Promise<void> {
    if (this.localPlayer) {
      this.broadcastPacket({
        type: 'player_leave',
        roomId: this.currentRoomId,
        senderId: this.localPlayer.playerId,
        timestamp: Date.now(),
        payload: { playerId: this.localPlayer.playerId },
      });
    }

    this.stopWatchdog();

    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }

    this.remotePlayers.clear();
    this.peerLastSeen.clear();
    this.isConnected = false;
    this.setConnectionStatus('disconnected');
    console.log('🌐 [MultiplayerEngine] Disconnected from metaverse.');
  }

  public async joinRoom(roomId: string): Promise<void> {
    if (this.currentRoomId !== roomId) {
      this.currentRoomId = roomId;
      this.remotePlayers.clear();
      this.peerLastSeen.clear();
      if (this.localPlayer) {
        this.broadcastPacket({
          type: 'player_join',
          roomId: this.currentRoomId,
          senderId: this.localPlayer.playerId,
          timestamp: Date.now(),
          payload: this.localPlayer,
        });
      }
    }
  }

  public async leaveRoom(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Send throttled player state (called from Cyber3DWorld render loop)
   */
  public sendPlayerState(state: RemotePlayerState): void {
    if (!this.isConnected) return;
    this.localPlayer = { ...state };

    const now = Date.now();
    if (now - this.lastSentTime < SEND_THROTTLE_MS) {
      return; // Throttled to ~16 Hz
    }
    this.lastSentTime = now;

    this.broadcastPacket({
      type: 'player_sync',
      roomId: this.currentRoomId,
      senderId: state.playerId,
      timestamp: now,
      payload: state,
    });
  }

  /**
   * Send Chat message (world or proximity)
   */
  public sendChatMessage(text: string, isProximity: boolean, worldPos?: [number, number, number]): void {
    if (!this.localPlayer) return;

    const chatPayload: NetworkChatPayload = {
      messageId: `chat_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: this.localPlayer.playerId,
      senderName: this.localPlayer.username,
      senderRank: this.localPlayer.rankTitle,
      text,
      isProximity,
      worldPos: worldPos || [
        this.localPlayer.transform.x,
        this.localPlayer.transform.y,
        this.localPlayer.transform.z,
      ],
      timestamp: Date.now(),
    };

    // Broadcast chat packet
    this.broadcastPacket({
      type: 'player_chat',
      roomId: this.currentRoomId,
      senderId: this.localPlayer.playerId,
      timestamp: Date.now(),
      payload: chatPayload,
    });

    // Also notify local listeners
    this.emit('onChatMessage', chatPayload);
  }

  /**
   * Send direct interaction request (duel, study, profile view, friend request)
   */
  public sendInteraction(
    targetPlayerId: string,
    action: NetworkInteractionPayload['action'],
    metadata?: any
  ): void {
    if (!this.localPlayer) return;

    const payload: NetworkInteractionPayload = {
      fromPlayerId: this.localPlayer.playerId,
      fromPlayerName: this.localPlayer.username,
      toPlayerId: targetPlayerId,
      action,
      metadata,
    };

    this.broadcastPacket({
      type: 'player_interact',
      roomId: this.currentRoomId,
      senderId: this.localPlayer.playerId,
      timestamp: Date.now(),
      payload,
    });
  }

  /**
   * Send emote
   */
  public sendEmote(emote: string): void {
    if (!this.localPlayer) return;

    this.broadcastPacket({
      type: 'player_emote',
      roomId: this.currentRoomId,
      senderId: this.localPlayer.playerId,
      timestamp: Date.now(),
      payload: { emote, playerId: this.localPlayer.playerId },
    });
  }

  public getRemotePlayers(): Map<string, RemotePlayerState> {
    return new Map(this.remotePlayers);
  }

  public getRemotePlayer(playerId: string): RemotePlayerState | undefined {
    return this.remotePlayers.get(playerId);
  }

  public getConnectedPeerCount(): number {
    return this.remotePlayers.size;
  }

  public getLocalPlayer(): RemotePlayerState | null {
    return this.localPlayer;
  }

  public getConnectionStatus() {
    return this.connectionStatus;
  }

  // --- INTERNAL PACKET HANDLING ---

  private broadcastPacket(packet: NetworkPacketEnvelope): void {
    // 1. BroadcastChannel (Inter-window / Inter-tab)
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(packet);
      } catch (err) {
        // Channel closed or failed
      }
    }

    // 2. Gun.js P2P Graph Relay
    if (typeof window !== 'undefined' && (window as any).Gun && (window as any).__pisoGunInstance) {
      try {
        const gun = (window as any).__pisoGunInstance;
        if (packet.type === 'player_sync') {
          gun.get(GUN_SYNC_KEY).get(packet.senderId).put(JSON.stringify(packet));
        } else if (packet.type === 'player_chat') {
          gun.get('piso_metaverse_chats_v1').set(JSON.stringify(packet));
        }
      } catch (e) {
        // Silent catch for graph error
      }
    }
  }

  private handleIncomingPacket(packet: NetworkPacketEnvelope): void {
    if (!packet || typeof packet !== 'object') return;
    if (packet.senderId === this.localPlayer?.playerId) return; // Ignore own echoes
    if (packet.roomId && packet.roomId !== this.currentRoomId) return; // Ignore different room

    const now = Date.now();
    this.peerLastSeen.set(packet.senderId, now);

    switch (packet.type) {
      case 'player_join': {
        const player = packet.payload as RemotePlayerState;
        if (player && player.playerId) {
          const isNew = !this.remotePlayers.has(player.playerId);
          this.remotePlayers.set(player.playerId, player);
          if (isNew) {
            this.emit('onPlayerJoin', player);
            // Respond with own state so the newcomer immediately discovers us!
            if (this.localPlayer) {
              this.broadcastPacket({
                type: 'player_sync',
                roomId: this.currentRoomId,
                senderId: this.localPlayer.playerId,
                timestamp: Date.now(),
                payload: this.localPlayer,
              });
            }
          }
        }
        break;
      }

      case 'player_sync': {
        const player = packet.payload as RemotePlayerState;
        if (player && player.playerId) {
          const isNew = !this.remotePlayers.has(player.playerId);
          this.remotePlayers.set(player.playerId, player);
          if (isNew) {
            this.emit('onPlayerJoin', player);
          } else {
            this.emit('onPlayerUpdate', player);
          }
        }
        break;
      }

      case 'player_leave': {
        const { playerId } = packet.payload || {};
        if (playerId && this.remotePlayers.has(playerId)) {
          this.remotePlayers.delete(playerId);
          this.peerLastSeen.delete(playerId);
          this.emit('onPlayerLeave', playerId);
        }
        break;
      }

      case 'player_chat': {
        const chat = packet.payload as NetworkChatPayload;
        if (chat) {
          this.emit('onChatMessage', chat);
        }
        break;
      }

      case 'player_interact': {
        const interaction = packet.payload as NetworkInteractionPayload;
        if (interaction && (!interaction.toPlayerId || interaction.toPlayerId === this.localPlayer?.playerId)) {
          this.emit('onInteraction', interaction);
        }
        break;
      }
    }
  }

  private initGunMesh(): void {
    if (typeof window === 'undefined' || !(window as any).Gun) return;
    try {
      if (!(window as any).__pisoGunInstance) {
        const peers = [
          'https://gun-manhattan.herokuapp.com/gun',
          'https://peer.waller.asia/gun',
        ];
        (window as any).__pisoGunInstance = (window as any).Gun({
          peers,
          localStorage: false,
          radisk: false,
        });
      }

      const gun = (window as any).__pisoGunInstance;
      gun.get(GUN_SYNC_KEY).map().on((dataStr: any, senderId: string) => {
        if (!dataStr || typeof dataStr !== 'string') return;
        try {
          const packet = JSON.parse(dataStr) as NetworkPacketEnvelope;
          if (packet && packet.senderId !== this.localPlayer?.playerId) {
            this.handleIncomingPacket(packet);
          }
        } catch {}
      });
    } catch (e) {
      console.warn('Gun.js mesh init fallback:', e);
    }
  }

  private startWatchdog(): void {
    this.stopWatchdog();

    // Heartbeat announcement every 2s
    this.heartbeatInterval = setInterval(() => {
      if (this.localPlayer && this.isConnected) {
        this.broadcastPacket({
          type: 'player_sync',
          roomId: this.currentRoomId,
          senderId: this.localPlayer.playerId,
          timestamp: Date.now(),
          payload: this.localPlayer,
        });
      }
    }, HEARTBEAT_INTERVAL_MS);

    // Stale peer check every 3s
    this.staleCheckInterval = setInterval(() => {
      const now = Date.now();
      this.peerLastSeen.forEach((lastSeen, peerId) => {
        if (now - lastSeen > PEER_TIMEOUT_MS) {
          console.log(`⏱️ [MultiplayerEngine] Peer timed out: ${peerId}`);
          this.remotePlayers.delete(peerId);
          this.peerLastSeen.delete(peerId);
          this.emit('onPlayerLeave', peerId);
        }
      });
    }, 3000);
  }

  private stopWatchdog(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.staleCheckInterval) {
      clearInterval(this.staleCheckInterval);
      this.staleCheckInterval = null;
    }
  }

  private setConnectionStatus(status: 'connected' | 'reconnecting' | 'disconnected' | 'solo') {
    this.connectionStatus = status;
    this.emit('onConnectionStatusChange', status);
  }

  // --- EVENT SUBSCRIPTION ---

  public on<K extends keyof MultiplayerProviderEvents>(event: K, handler: MultiplayerProviderEvents[K]): void {
    this.eventHandlers[event].add(handler as any);
  }

  public off<K extends keyof MultiplayerProviderEvents>(event: K, handler: MultiplayerProviderEvents[K]): void {
    this.eventHandlers[event].delete(handler as any);
  }

  private emit<K extends keyof MultiplayerProviderEvents>(
    event: K,
    ...args: Parameters<MultiplayerProviderEvents[K]>
  ): void {
    const handlers = this.eventHandlers[event];
    handlers.forEach((handler) => {
      try {
        (handler as any)(...args);
      } catch (err) {
        console.error(`Error in multiplayer event handler [${event}]:`, err);
      }
    });
  }
}
