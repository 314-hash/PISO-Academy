/**
 * multiplayer.ts
 * Core types and data contracts for PISO Academy Metaverse Multiplayer Architecture.
 * Inspired by Matrix Third Room's decoupled network entity and interpolation model.
 */

import { HumanAvatarConfig, AvatarSkinId } from '../context/AcademyContext';
import { PlayerClassId, FilipinoRankTier } from './playerProgression';

export type PlayerPresenceStatus =
  | 'online'      // 🟢 General exploration
  | 'studying'    // 📚 In lesson or quiz
  | 'in_lab'      // 🧪 Active Solidity Forge code
  | 'on_quest'    // ⚔️ Engaging monsters / quests
  | 'mining'      // ⚒️ Mining blocks in voxel fields
  | 'afk';        // 🟡 Idle

export type PlayerMovementAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'double_jump'
  | 'attack'
  | 'mine';

export interface RemotePlayerTransform {
  x: number;
  y: number;
  z: number;
  heading: number;       // In radians
  vx: number;            // Linear velocity X
  vy: number;            // Vertical jump velocity
  vz: number;            // Linear velocity Z
}

export interface RemotePlayerState {
  playerId: string;
  username: string;
  walletAddress?: string | null;
  isGuest: boolean;
  avatarMode: 'human' | 'drone' | 'custom_glb';
  avatarSkin: AvatarSkinId;
  humanAvatar: HumanAvatarConfig;
  playerClass: PlayerClassId;
  rankTier: FilipinoRankTier;
  rankTitle: string;
  level: number;
  digitalPower: number;
  currentZone: string;   // e.g. 'genesis', 'forge', 'temple', etc.
  presence: PlayerPresenceStatus;
  animState: PlayerMovementAnimState;
  isMining?: boolean;
  transform: RemotePlayerTransform;
  timestamp: number;     // Epoch millisecond timestamp of transmission
  ping?: number;
}

export type NetworkMessageType =
  | 'player_sync'       // Periodic transform & state packet (15 Hz)
  | 'player_join'       // Announcement when student joins room
  | 'player_leave'      // Announcement on departure or disconnect
  | 'player_chat'       // World or proximity text chat
  | 'player_speech'     // Floating 3D speech bubble trigger
  | 'player_interact'   // Direct player interaction request
  | 'player_emote'      // Emotes (wave, bow, dance, thumbs_up)
  | 'study_invite'      // Cooperative learning request
  | 'request_snapshot'  // Request snapshot of all online peers from room
  | 'player_snapshot';  // Full list of active peers sent to newcomer

export interface NetworkChatPayload {
  messageId: string;
  senderId: string;
  senderName: string;
  senderRank: string;
  text: string;
  isProximity: boolean;
  worldPos?: [number, number, number];
  timestamp: number;
}

export interface NetworkInteractionPayload {
  fromPlayerId: string;
  fromPlayerName: string;
  toPlayerId: string;
  action: 'profile_view' | 'study_invite' | 'duel_challenge' | 'friend_request' | 'say_hello';
  metadata?: any;
}

export interface NetworkPacketEnvelope<T = any> {
  type: NetworkMessageType;
  roomId: string;
  senderId: string;
  timestamp: number;
  payload: T;
}

export interface MultiplayerProviderEvents {
  onPlayerJoin: (player: RemotePlayerState) => void;
  onPlayerLeave: (playerId: string) => void;
  onPlayerUpdate: (player: RemotePlayerState) => void;
  onChatMessage: (chat: NetworkChatPayload) => void;
  onInteraction: (interaction: NetworkInteractionPayload) => void;
  onConnectionStatusChange: (status: 'connected' | 'reconnecting' | 'disconnected' | 'solo') => void;
}

export interface MultiplayerProvider {
  id: string;
  connect(localPlayer: RemotePlayerState): Promise<void>;
  disconnect(): Promise<void>;
  joinRoom(roomId: string): Promise<void>;
  leaveRoom(): Promise<void>;
  sendPlayerState(state: RemotePlayerState): void;
  sendChatMessage(text: string, isProximity: boolean, worldPos?: [number, number, number]): void;
  sendInteraction(targetPlayerId: string, action: NetworkInteractionPayload['action'], metadata?: any): void;
  sendEmote(emote: string): void;
  getRemotePlayers(): Map<string, RemotePlayerState>;
  on<K extends keyof MultiplayerProviderEvents>(event: K, handler: MultiplayerProviderEvents[K]): void;
  off<K extends keyof MultiplayerProviderEvents>(event: K, handler: MultiplayerProviderEvents[K]): void;
}
