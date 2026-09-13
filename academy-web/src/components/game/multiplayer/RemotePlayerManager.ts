/**
 * RemotePlayerManager.ts
 * Manages the lifecycle, updates, spatial proximity, and cleanup of all
 * remote student entities in the Three.js scene.
 */

import * as THREE from 'three';
import { RemotePlayerState } from '../../../types/multiplayer';
import { RemotePlayerEntity } from './RemotePlayerEntity';
import { MultiplayerNetworkEngine } from '../../../services/multiplayer/MultiplayerNetworkEngine';

export interface ClosestPlayerInfo {
  player: RemotePlayerState;
  distance: number;
  worldPos: THREE.Vector3;
}

export class RemotePlayerManager {
  private scene: THREE.Scene;
  private entities: Map<string, RemotePlayerEntity> = new Map();
  private networkEngine: MultiplayerNetworkEngine;

  // Closest player state
  private currentClosest: ClosestPlayerInfo | null = null;
  private onClosestPlayerChange?: (closest: ClosestPlayerInfo | null) => void;

  constructor(scene: THREE.Scene, onClosestPlayerChange?: (closest: ClosestPlayerInfo | null) => void) {
    this.scene = scene;
    this.onClosestPlayerChange = onClosestPlayerChange;
    this.networkEngine = MultiplayerNetworkEngine.instance;

    this.initNetworkListeners();
  }

  private initNetworkListeners(): void {
    // 1. Peer Join
    this.networkEngine.on('onPlayerJoin', (player: RemotePlayerState) => {
      this.spawnOrUpdatePlayer(player);
    });

    // 2. Peer Sync / Update
    this.networkEngine.on('onPlayerUpdate', (player: RemotePlayerState) => {
      this.spawnOrUpdatePlayer(player);
    });

    // 3. Peer Departure
    this.networkEngine.on('onPlayerLeave', (playerId: string) => {
      this.removePlayer(playerId);
    });

    // 4. Peer Chat Speech Bubble
    this.networkEngine.on('onChatMessage', (chat) => {
      const entity = this.entities.get(chat.senderId);
      if (entity) {
        entity.showSpeech(chat.text);
      }
    });

    // Catch up on any players already in the network cache
    const existing = this.networkEngine.getRemotePlayers();
    existing.forEach((p) => {
      this.spawnOrUpdatePlayer(p);
    });
  }

  /**
   * Spawn a new remote entity or update an existing one
   */
  public spawnOrUpdatePlayer(player: RemotePlayerState): void {
    const existing = this.entities.get(player.playerId);
    if (existing) {
      existing.pushState(player);
    } else {
      console.log(`👤 [RemotePlayerManager] Spawning remote student: ${player.username} (${player.playerId})`);
      const newEntity = new RemotePlayerEntity(player, this.scene);
      this.entities.set(player.playerId, newEntity);
    }
  }

  /**
   * Remove and dispose a remote entity
   */
  public removePlayer(playerId: string): void {
    const entity = this.entities.get(playerId);
    if (entity) {
      console.log(`👋 [RemotePlayerManager] Removing departed student: ${entity.state.username}`);
      entity.dispose(this.scene);
      this.entities.delete(playerId);

      if (this.currentClosest?.player.playerId === playerId) {
        this.currentClosest = null;
        this.onClosestPlayerChange?.(null);
      }
    }
  }

  /**
   * Called every frame in the Cyber3DWorld render loop
   */
  public updateAll(delta: number, time: number, cameraPos: THREE.Vector3, localPlayerPos: THREE.Vector3): void {
    let nearest: ClosestPlayerInfo | null = null;
    let nearestDist = Infinity;

    for (const entity of this.entities.values()) {
      entity.update(delta, time, cameraPos);

      // Check proximity to local player for [E] Interaction
      const dist = localPlayerPos.distanceTo(entity.rootGroup.position);
      if (dist <= 3.8 && dist < nearestDist) {
        nearestDist = dist;
        nearest = {
          player: entity.state,
          distance: Math.round(dist * 10) / 10,
          worldPos: entity.rootGroup.position.clone(),
        };
      }
    }

    // Notify if closest player changed
    const targetNearest: ClosestPlayerInfo | null = nearest;
    if (targetNearest?.player.playerId !== this.currentClosest?.player.playerId) {
      this.currentClosest = targetNearest;
      this.onClosestPlayerChange?.(targetNearest);
    } else if (targetNearest && this.currentClosest) {
      this.currentClosest.distance = targetNearest.distance;
    }
  }

  public getPlayerCount(): number {
    return this.entities.size;
  }

  public getPlayerList(): RemotePlayerState[] {
    return Array.from(this.entities.values()).map((e) => e.state);
  }

  public getClosestPlayer(): ClosestPlayerInfo | null {
    return this.currentClosest;
  }

  /**
   * Cleanup everything on unmount
   */
  public disposeAll(): void {
    this.entities.forEach((entity) => {
      entity.dispose(this.scene);
    });
    this.entities.clear();
    this.currentClosest = null;
  }
}
