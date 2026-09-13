/**
 * RemotePlayerEntity.ts
 * 3D Representation, Rigging, Animation, Nametag Billboard, and Speech Bubble
 * for a remote student in the PISO Academy Metaverse.
 * 
 * Inspired by Third Room's modular avatar & nametag systems.
 */

import * as THREE from 'three';
import {
  RemotePlayerState,
  RemotePlayerTransform,
  PlayerMovementAnimState,
} from '../../../types/multiplayer';
import {
  createHumanoidCharacter,
  createPetDroneCompanion,
  CharacterMeshInstance,
  PetDroneInstance,
} from '../CharacterMeshBuilder';
import { InterpolationBuffer } from '../../../services/multiplayer/InterpolationBuffer';
import { getRankForLevel } from '../../../data/progressionMeta';

export class RemotePlayerEntity {
  public playerId: string;
  public state: RemotePlayerState;
  public rootGroup: THREE.Group;
  private characterInstance: CharacterMeshInstance | null = null;
  private petDroneInstance: PetDroneInstance | null = null;
  private droneBody: THREE.Mesh | null = null;
  private interpolationBuffer: InterpolationBuffer;

  // Nametag Billboard
  private nametagSprite: THREE.Sprite | null = null;
  private nametagCanvas: HTMLCanvasElement | null = null;
  private nametagCtx: CanvasRenderingContext2D | null = null;
  private nametagTexture: THREE.CanvasTexture | null = null;

  // 3D Speech Bubble Billboard
  private speechSprite: THREE.Sprite | null = null;
  private speechCanvas: HTMLCanvasElement | null = null;
  private speechCtx: CanvasRenderingContext2D | null = null;
  private speechTexture: THREE.CanvasTexture | null = null;
  private speechTimer = 0;

  // Animation walk phase
  private walkPhase = 0;

  constructor(state: RemotePlayerState, scene: THREE.Scene) {
    this.playerId = state.playerId;
    this.state = { ...state };
    this.rootGroup = new THREE.Group();
    this.rootGroup.name = `remote_player_${this.playerId}`;
    this.interpolationBuffer = new InterpolationBuffer(20, 80);

    // Initial position
    const t = state.transform || { x: 0, y: 0.05, z: 0, heading: 0, vx: 0, vy: 0, vz: 0 };
    this.rootGroup.position.set(t.x, t.y || 0.05, t.z);
    this.rootGroup.rotation.y = t.heading || 0;
    this.interpolationBuffer.push(t, state.animState || 'idle', state.timestamp || Date.now());

    // 1. Build 3D Avatar (Humanoid or Recon Drone)
    this.buildAvatar();

    // 2. Build Floating Billboard Nametag
    this.buildNametag();

    // 3. Build Floating 3D Speech Bubble
    this.buildSpeechBubble();

    // Add to main Three.js scene
    scene.add(this.rootGroup);
  }

  /**
   * Constructs the modular 3D avatar matching the remote player's config
   */
  private buildAvatar(): void {
    if (this.state.avatarMode === 'human' || this.state.avatarMode === 'custom_glb' || !this.state.avatarMode) {
      this.characterInstance = createHumanoidCharacter(this.state.humanAvatar);
      this.rootGroup.add(this.characterInstance.rootGroup);

      // Optional Companion Drone
      if (this.state.humanAvatar?.petDrone?.enabled !== false) {
        const petSkin = this.state.humanAvatar?.petDrone?.skin || 'panday';
        const petAura = this.state.humanAvatar?.petDrone?.auraColor || '#F59E0B';
        this.petDroneInstance = createPetDroneCompanion(petSkin, petAura);
        this.petDroneInstance.group.position.set(0.9, 1.6, -0.9);
        this.rootGroup.add(this.petDroneInstance.group);
      }
    } else {
      // Recon Drone Chassis
      const bodyGeo = new THREE.DodecahedronGeometry(0.8, 1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x0EA5E9,
        roughness: 0.35,
        metalness: 0.6,
      });
      this.droneBody = new THREE.Mesh(bodyGeo, bodyMat);
      this.droneBody.position.y = 1.2;
      this.rootGroup.add(this.droneBody);
    }
  }

  /**
   * Floating 3D Billboard Nametag
   */
  private buildNametag(): void {
    this.nametagCanvas = document.createElement('canvas');
    this.nametagCanvas.width = 512;
    this.nametagCanvas.height = 140;
    this.nametagCtx = this.nametagCanvas.getContext('2d');

    this.updateNametagCanvas();

    if (this.nametagCanvas) {
      this.nametagTexture = new THREE.CanvasTexture(this.nametagCanvas);
      this.nametagTexture.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({
        map: this.nametagTexture,
        transparent: true,
        depthTest: false,
      });
      this.nametagSprite = new THREE.Sprite(mat);
      this.nametagSprite.scale.set(3.6, 1.0, 1);
      this.nametagSprite.position.set(0, 2.7, 0); // Above avatar head
      this.rootGroup.add(this.nametagSprite);
    }
  }

  /**
   * Render Canvas contents for Nametag (Name, Rank, Level, Presence)
   */
  public updateNametagCanvas(): void {
    if (!this.nametagCtx || !this.nametagCanvas) return;
    const ctx = this.nametagCtx;
    const w = this.nametagCanvas.width;
    const h = this.nametagCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background Cyber Pill
    ctx.fillStyle = 'rgba(11, 15, 23, 0.88)';
    ctx.strokeStyle = '#38BDF8'; // Sky blue border for remote students
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(16, 16, w - 32, h - 32, 24);
    ctx.fill();
    ctx.stroke();

    // Top status strip
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.roundRect(48, 16, w - 96, 4, 2);
    ctx.fill();

    // Presence dot color
    let presenceColor = '#10B981'; // 🟢 Online
    let presenceText = 'ONLINE';
    if (this.state.presence === 'studying') {
      presenceColor = '#3B82F6';
      presenceText = 'STUDYING';
    } else if (this.state.presence === 'in_lab') {
      presenceColor = '#A855F7';
      presenceText = 'IN LAB';
    } else if (this.state.presence === 'on_quest') {
      presenceColor = '#F59E0B';
      presenceText = 'ON QUEST';
    } else if (this.state.presence === 'mining') {
      presenceColor = '#EC4899';
      presenceText = 'MINING';
    }

    // Draw Presence Dot
    ctx.fillStyle = presenceColor;
    ctx.beginPath();
    ctx.arc(42, 54, 8, 0, Math.PI * 2);
    ctx.fill();

    // Draw Username
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px monospace, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const displayUser =
      this.state.username?.length > 15
        ? this.state.username.slice(0, 13) + '..'
        : this.state.username || 'Student';
    ctx.fillText(displayUser, 60, 52);

    // Draw Rank Title & Level
    const rank = getRankForLevel(this.state.level || 1);
    ctx.fillStyle = rank.color || '#FBBF24';
    ctx.font = 'bold 20px monospace, sans-serif';
    ctx.fillText(`${rank.badgeIcon} ${rank.tier} • Lv.${this.state.level || 1}`, 42, 94);

    // Draw Digital Power Badge
    ctx.fillStyle = '#06B6D4';
    ctx.font = 'bold 18px monospace, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`⚡ ${this.state.digitalPower || 100} DP`, w - 42, 94);

    if (this.nametagTexture) {
      this.nametagTexture.needsUpdate = true;
    }
  }

  /**
   * Floating 3D Speech Bubble
   */
  private buildSpeechBubble(): void {
    this.speechCanvas = document.createElement('canvas');
    this.speechCanvas.width = 512;
    this.speechCanvas.height = 140;
    this.speechCtx = this.speechCanvas.getContext('2d');

    if (this.speechCanvas) {
      this.speechTexture = new THREE.CanvasTexture(this.speechCanvas);
      this.speechTexture.minFilter = THREE.LinearFilter;
      const mat = new THREE.SpriteMaterial({
        map: this.speechTexture,
        transparent: true,
        depthTest: false,
        opacity: 0,
      });
      this.speechSprite = new THREE.Sprite(mat);
      this.speechSprite.scale.set(4.5, 1.2, 1);
      this.speechSprite.position.set(0, 3.8, 0); // Above nametag
      this.rootGroup.add(this.speechSprite);
    }
  }

  /**
   * Trigger 3D Speech Bubble popup when remote student sends chat
   */
  public showSpeech(text: string): void {
    if (!this.speechCtx || !this.speechCanvas || !this.speechSprite) return;
    const ctx = this.speechCtx;
    const w = this.speechCanvas.width;
    const h = this.speechCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Speech Box
    ctx.fillStyle = 'rgba(11, 15, 23, 0.94)';
    ctx.strokeStyle = '#06B6D4';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(14, 14, w - 28, h - 38, 20);
    ctx.fill();
    ctx.stroke();

    // Pointer down
    ctx.beginPath();
    ctx.moveTo(w / 2 - 12, h - 24);
    ctx.lineTo(w / 2, h - 4);
    ctx.lineTo(w / 2 + 12, h - 24);
    ctx.fillStyle = 'rgba(11, 15, 23, 0.94)';
    ctx.fill();
    ctx.strokeStyle = '#06B6D4';
    ctx.stroke();

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px monospace, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const trimmed = text.length > 32 ? text.slice(0, 29) + '...' : text;
    ctx.fillText(trimmed, w / 2, 54);

    if (this.speechTexture) {
      this.speechTexture.needsUpdate = true;
      (this.speechSprite.material as THREE.SpriteMaterial).opacity = 1;
      this.speechTimer = 6.0; // Stay visible for 6 seconds
    }
  }

  /**
   * Push incoming network packet into historian
   */
  public pushState(newState: RemotePlayerState): void {
    this.state = { ...this.state, ...newState };
    if (newState.transform) {
      this.interpolationBuffer.push(
        newState.transform,
        newState.animState || 'idle',
        newState.timestamp || Date.now()
      );
    }
    this.updateNametagCanvas();
  }

  /**
   * Frame-by-frame interpolation update in Three.js render loop
   */
  public update(delta: number, time: number, cameraPos: THREE.Vector3): void {
    // 1. Sample interpolated transform & anim state
    const sampled = this.interpolationBuffer.sample(Date.now());
    const t = sampled.transform;

    // Smooth movement
    this.rootGroup.position.set(t.x, t.y, t.z);
    this.rootGroup.rotation.y = t.heading;

    // 2. Drive Humanoid Rig Animations
    if (this.characterInstance) {
      const speed = Math.hypot(t.vx || 0, t.vz || 0);
      const isMoving = speed > 0.1 || sampled.animState === 'walk' || sampled.animState === 'run';
      const isJumping = sampled.animState === 'jump' || (t.vy !== 0 && t.y > 0.3);

      if (isMoving) {
        const walkFreq = speed > 16 ? 16 : 10;
        this.walkPhase += delta * walkFreq;
      }

      this.characterInstance.updateAnimation(
        this.walkPhase,
        isMoving,
        delta,
        time,
        isJumping,
        false,
        t.vy || 0,
        sampled.animState === 'mine' || !!this.state.isMining
      );

      if (this.petDroneInstance) {
        this.petDroneInstance.updateFollow(this.rootGroup.position, t.heading, time, delta);
      }
    } else if (this.droneBody) {
      this.droneBody.rotation.y = time * 2;
    }

    // 3. Distance-based LOD and billboard fading
    const distToCamera = this.rootGroup.position.distanceTo(cameraPos);

    if (this.nametagSprite) {
      if (distToCamera > 55) {
        this.nametagSprite.visible = false;
      } else {
        this.nametagSprite.visible = true;
        // Fade smoothly between 35m and 55m
        const fade = distToCamera > 35 ? Math.max(0, 1 - (distToCamera - 35) / 20) : 1;
        (this.nametagSprite.material as THREE.SpriteMaterial).opacity = fade;
      }
    }

    // 4. Update Speech Bubble Timer
    if (this.speechTimer > 0 && this.speechSprite) {
      this.speechTimer -= delta;
      if (this.speechTimer < 1.0) {
        (this.speechSprite.material as THREE.SpriteMaterial).opacity = Math.max(0, this.speechTimer);
      }
      if (this.speechTimer <= 0) {
        this.speechSprite.visible = false;
      } else {
        this.speechSprite.visible = true;
      }
    }
  }

  /**
   * Complete cleanup of all 3D geometries, materials, textures, and sprites
   * Guarantees ZERO Three.js memory leaks when students leave!
   */
  public dispose(scene: THREE.Scene): void {
    scene.remove(this.rootGroup);

    // Dispose Nametag
    if (this.nametagSprite) {
      this.nametagSprite.material.dispose();
      this.nametagTexture?.dispose();
    }

    // Dispose Speech Bubble
    if (this.speechSprite) {
      this.speechSprite.material.dispose();
      this.speechTexture?.dispose();
    }

    // Traverse and dispose all child meshes & materials
    this.rootGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else if (child.material) {
          child.material.dispose();
        }
      }
    });

    this.interpolationBuffer.clear();
  }
}
