/**
 * GlbAvatarService.ts
 * High-performance 3D .GLB/.GLTF Avatar Service for PISO Academy Metaverse.
 * 
 * Supports:
 * - Ready Player Me rigged avatars (Mixamo / standard humanoid bones)
 * - Meshy.ai AI-generated 3D character models (.glb)
 * - Tripo3D AI image-to-3D models (.glb)
 * - Custom drag-and-drop .glb/.gltf binary files
 * 
 * Features:
 * - IndexedDB binary persistence (survives browser refresh)
 * - Automatic Bounding Box Normalization & Ground Anchoring (target height: 1.8m, feet at Y=0)
 * - Embedded Animation clip playback (Mixamo/RPM walk, run, idle)
 * - Procedural locomotion fallback for unrigged/static AI meshes (bobbing, sway, tilt, jump, mine)
 * - Full CharacterMeshInstance contract compliance for zero-friction engine integration
 */

import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { CharacterMeshInstance, HumanoidRig } from '../components/game/CharacterMeshBuilder';

export interface GlbAvatarMetadata {
  id: string;
  name: string;
  source: 'ready_player_me' | 'meshy' | 'tripo' | 'custom_upload' | 'preset' | 'cyberpunk';
  fileSize: number; // in bytes
  triangleCount: number;
  meshCount: number;
  hasBones: boolean;
  boneCount: number;
  hasAnimations: boolean;
  animationNames: string[];
  originalHeight: number;
  normalizedScale: number;
  uploadedAt: number;
}

export interface GlbAvatarLoadResult {
  instance: CharacterMeshInstance;
  metadata: GlbAvatarMetadata;
  gltf: GLTF;
}

const DB_NAME = 'piso_metaverse_glb_db_v1';
const DB_STORE = 'avatars';
const ACTIVE_AVATAR_KEY = 'active_custom_glb_avatar_meta';

// ─── IndexedDB Storage for Large GLB Binaries ─────────────────────────────────

class GlbStorageManager {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const req = window.indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_STORE)) {
          db.createObjectStore(DB_STORE, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });

    return this.dbPromise;
  }

  async saveGlb(id: string, fileData: ArrayBuffer | Blob, metadata: GlbAvatarMetadata): Promise<void> {
    const db = await this.getDB();
    const arrayBuffer = fileData instanceof Blob ? await fileData.arrayBuffer() : fileData;
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readwrite');
      const store = tx.objectStore(DB_STORE);
      store.put({ id, data: arrayBuffer, metadata, savedAt: Date.now() });
      tx.oncomplete = () => {
        try {
          localStorage.setItem(ACTIVE_AVATAR_KEY, JSON.stringify(metadata));
        } catch {}
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async getGlb(id: string): Promise<{ data: ArrayBuffer; metadata: GlbAvatarMetadata } | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(DB_STORE, 'readonly');
        const store = tx.objectStore(DB_STORE);
        const req = store.get(id);
        req.onsuccess = () => {
          if (req.result) {
            resolve({ data: req.result.data, metadata: req.result.metadata });
          } else {
            resolve(null);
          }
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  async getActiveGlb(): Promise<{ data: ArrayBuffer; metadata: GlbAvatarMetadata } | null> {
    try {
      const raw = localStorage.getItem(ACTIVE_AVATAR_KEY);
      if (!raw) return null;
      const meta = JSON.parse(raw) as GlbAvatarMetadata;
      if (!meta?.id) return null;
      return await this.getGlb(meta.id);
    } catch {
      return null;
    }
  }

  async clearActiveGlb(): Promise<void> {
    try {
      localStorage.removeItem(ACTIVE_AVATAR_KEY);
    } catch {}
  }
}

export const glbStorage = new GlbStorageManager();

// ─── GLB Avatar Normalizer & Engine Factory ───────────────────────────────────

export class GlbAvatarService {
  private static loader = new GLTFLoader();

  /**
   * Parses and normalizes a .glb/.gltf ArrayBuffer or Blob
   */
  static async loadFromBuffer(
    buffer: ArrayBuffer,
    fileName: string = 'custom_avatar.glb',
    source: GlbAvatarMetadata['source'] = 'custom_upload'
  ): Promise<GlbAvatarLoadResult> {
    const gltf = await new Promise<GLTF>((resolve, reject) => {
      this.loader.parse(
        buffer,
        '',
        (loadedGltf) => resolve(loadedGltf),
        (err) => reject(err)
      );
    });

    const metadata = this.analyzeAndNormalizeModel(gltf, fileName, source, buffer.byteLength);
    const instance = this.createCharacterInstance(gltf, metadata);

    // Save to IndexedDB as active avatar
    try {
      await glbStorage.saveGlb(metadata.id, buffer, metadata);
    } catch (e) {
      console.warn('Could not persist GLB to IndexedDB:', e);
    }

    return { instance, metadata, gltf };
  }

  /**
   * Loads a .glb from an online or local URL
   */
  static async loadFromUrl(
    url: string,
    displayName: string = 'Imported Avatar',
    source: GlbAvatarMetadata['source'] = 'preset'
  ): Promise<GlbAvatarLoadResult> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch avatar GLB: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    return this.loadFromBuffer(buffer, displayName, source);
  }

  /**
   * Analyzes geometry, calculates bounding box, and normalizes scale & position
   */
  private static analyzeAndNormalizeModel(
    gltf: GLTF,
    name: string,
    source: GlbAvatarMetadata['source'],
    fileSize: number
  ): GlbAvatarMetadata {
    const root = gltf.scene;
    let triangleCount = 0;
    let meshCount = 0;
    let boneCount = 0;

    // 1. Traverse and analyze meshes, materials, and skeletons
    root.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        meshCount++;
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.frustumCulled = false; // Prevent premature clipping

        if (mesh.geometry) {
          const posAttr = mesh.geometry.attributes.position;
          if (mesh.geometry.index) {
            triangleCount += mesh.geometry.index.count / 3;
          } else if (posAttr) {
            triangleCount += posAttr.count / 3;
          }
        }

        // Ensure materials display nicely under PISO scene lighting
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if (m instanceof THREE.MeshStandardMaterial) {
              m.roughness = Math.max(0.2, Math.min(0.9, m.roughness));
              m.side = THREE.DoubleSide; // Fix single-sided cloth holes from AI generators
            }
          });
        }
      }

      if ((obj as THREE.Bone).isBone) {
        boneCount++;
      }
    });

    // 2. Measure Bounding Box to determine original dimensions
    root.updateMatrixWorld(true);
    const bbox = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    bbox.getSize(size);

    const originalHeight = size.y > 0.001 ? size.y : 1.8;
    const targetHeight = 1.8; // Target standard player avatar height (1.8m)
    const normalizedScale = targetHeight / originalHeight;

    // 3. Apply uniform normalization scale
    root.scale.set(normalizedScale, normalizedScale, normalizedScale);
    root.updateMatrixWorld(true);

    // 4. Center X and Z, and anchor feet precisely on the ground (Y = 0)
    const scaledBbox = new THREE.Box3().setFromObject(root);
    const center = new THREE.Vector3();
    scaledBbox.getCenter(center);

    // Offset the model scene so center is at (0, 0) and lowest point is Y = 0
    root.position.x = -center.x;
    root.position.z = -center.z;
    root.position.y = -scaledBbox.min.y;

    const animNames = gltf.animations.map((a) => a.name || 'Unnamed Clip');

    return {
      id: `glb_avatar_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      source,
      fileSize,
      triangleCount: Math.round(triangleCount),
      meshCount,
      hasBones: boneCount > 0,
      boneCount,
      hasAnimations: gltf.animations.length > 0,
      animationNames: animNames,
      originalHeight,
      normalizedScale,
      uploadedAt: Date.now(),
    };
  }

  /**
   * Constructs an animation-ready CharacterMeshInstance wrapping the GLB scene
   */
  static createCharacterInstance(
    gltf: GLTF,
    metadata: GlbAvatarMetadata
  ): CharacterMeshInstance {
    const rootGroup = new THREE.Group();
    const charGroup = new THREE.Group();
    rootGroup.add(charGroup);

    // Add normalized GLB model scene inside character group
    charGroup.add(gltf.scene);

    // 1. Ground Energy Ring / Footstep Anchor
    const pedRingGeo = new THREE.TorusGeometry(0.85, 0.02, 8, 28);
    const pedRingMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
    const groundRing = new THREE.Mesh(pedRingGeo, pedRingMat);
    groundRing.rotation.x = Math.PI / 2;
    groundRing.position.y = 0.02;
    rootGroup.add(groundRing);

    // 2. Subtle Under-Avatar Ambient Point Light
    const auraLight = new THREE.PointLight(0x06B6D4, 1.2, 4.5);
    auraLight.position.set(0, 0.4, 0);
    rootGroup.add(auraLight);

    // 3. Animation Mixer & Embedded Clips Setup
    let mixer: THREE.AnimationMixer | null = null;
    let walkAction: THREE.AnimationAction | null = null;
    let idleAction: THREE.AnimationAction | null = null;
    let runAction: THREE.AnimationAction | null = null;
    let currentAction: THREE.AnimationAction | null = null;

    if (gltf.animations && gltf.animations.length > 0) {
      mixer = new THREE.AnimationMixer(gltf.scene);

      // Search for standard clips (Mixamo, RPM, Blender naming conventions)
      const findClip = (...keywords: string[]): THREE.AnimationClip | undefined => {
        return gltf.animations.find((a) => {
          const lower = a.name.toLowerCase();
          return keywords.some((k) => lower.includes(k));
        });
      };

      const walkClip = findClip('walk', 'walking', 'run_forward', 'locomotion');
      const runClip = findClip('run', 'running', 'sprint', 'fast');
      const idleClip = findClip('idle', 'stand', 'breath', 'default') || gltf.animations[0];

      if (walkClip) walkAction = mixer.clipAction(walkClip);
      if (runClip) runAction = mixer.clipAction(runClip);
      if (idleClip) idleAction = mixer.clipAction(idleClip);

      if (idleAction) {
        idleAction.play();
        currentAction = idleAction;
      } else if (gltf.animations[0]) {
        currentAction = mixer.clipAction(gltf.animations[0]);
        currentAction.play();
      }
    }

    // Collect bones for procedural manipulation if rigged
    const bones = new Map<string, THREE.Bone>();
    gltf.scene.traverse((obj) => {
      if ((obj as THREE.Bone).isBone) {
        bones.set(obj.name.toLowerCase(), obj as THREE.Bone);
      }
    });

    const leftArmBone = bones.get('leftarm') || bones.get('arm_l') || bones.get('leftupperarm');
    const rightArmBone = bones.get('rightarm') || bones.get('arm_r') || bones.get('rightupperarm');

    // 4. Unified Animation Update Loop
    const updateAnimation = (
      walkPhase: number,
      isMoving: boolean,
      delta: number,
      time: number,
      isJumping: boolean = false,
      isDoubleJump: boolean = false,
      jumpVelocityY: number = 0,
      isMining: boolean = false
    ) => {
      // A. Embedded Skeletal Animation Update
      if (mixer) {
        mixer.update(delta);

        // Switch between Idle and Walk/Run actions if available
        let targetAction: THREE.AnimationAction | null = idleAction;
        if (isMoving) {
          targetAction = runAction || walkAction || idleAction;
        }

        if (targetAction && targetAction !== currentAction) {
          currentAction?.fadeOut(0.2);
          targetAction.reset().fadeIn(0.2).play();
          currentAction = targetAction;
        }
      }

      // B. Procedural Locomotion Fallback / Layering
      // If the model has no embedded walk clip, or is a static unrigged mesh (Meshy/Tripo):
      if (!walkAction || isMining || isJumping) {
        if (isMoving) {
          // Dynamic hip bounce & sway
          const bob = Math.abs(Math.sin(walkPhase * 2)) * 0.08;
          charGroup.position.y = bob;
          charGroup.rotation.z = Math.sin(walkPhase) * 0.035; // Lateral tilt
          charGroup.rotation.x = 0.06; // Forward athletic lean

          // Procedural arm swing if bones exist
          if (leftArmBone) leftArmBone.rotation.x = Math.sin(walkPhase) * 0.35;
          if (rightArmBone) rightArmBone.rotation.x = -Math.sin(walkPhase) * 0.35;
        } else {
          // Idle breathing
          charGroup.position.y = Math.sin(time * 2.5) * 0.015;
          charGroup.rotation.z = 0;
          charGroup.rotation.x = 0;
          if (leftArmBone) leftArmBone.rotation.x = 0;
          if (rightArmBone) rightArmBone.rotation.x = 0;
        }

        // Jumping posture
        if (isJumping) {
          charGroup.rotation.x = -0.12; // Slight back arch
          if (isDoubleJump) {
            charGroup.rotation.x = time * 8; // Double-jump backflip!
          }
        }

        // Mining action swing
        if (isMining) {
          charGroup.rotation.x = 0.2 + Math.sin(time * 16) * 0.25;
          if (rightArmBone) {
            rightArmBone.rotation.x = -1.2 + Math.sin(time * 16) * 0.8;
          }
        }
      }

      // Pulse ground energy ring
      if (groundRing) {
        const ringScale = 1.0 + Math.sin(time * 3) * 0.06;
        groundRing.scale.set(ringScale, ringScale, 1.0);
      }
    };

    const dummyGroup = new THREE.Group();
    const rig: HumanoidRig = {
      torso: dummyGroup,
      head: dummyGroup,
      leftArm: (leftArmBone as any) || dummyGroup,
      rightArm: (rightArmBone as any) || dummyGroup,
      leftLeg: dummyGroup,
      rightLeg: dummyGroup,
      leftKnee: dummyGroup,
      rightKnee: dummyGroup,
    };

    return {
      rootGroup,
      charGroup,
      rig,
      capeGroup: null,
      sunHaloGroup: null,
      groundRing,
      auraLight,
      updateAnimation,
    };
  }
}

// ─── Curated High-Fidelity Preset Avatars (Ready Player Me / Open Metaverse) ──
export interface GlbPresetAvatar {
  id: string;
  name: string;
  subtitle: string;
  category: 'ready_player_me' | 'meshy' | 'tripo' | 'cyberpunk';
  icon: string;
  badge: string;
  color: string;
  url: string;
  description: string;
}

export const SAMPLE_GLB_AVATARS: GlbPresetAvatar[] = [
  {
    id: 'rpm_cyber_builder',
    name: 'Cyberpunk Solidity Builder',
    subtitle: 'Ready Player Me Full-Body Rig',
    category: 'ready_player_me',
    icon: '⚡',
    badge: 'RPM Rigged',
    color: '#06B6D4',
    url: 'https://models.readyplayer.me/64db3b4f620e7d0bfba7b3d1.glb',
    description: 'Full-body humanoid avatar with high-precision skeletal rig, custom jacket, and cybernetic sneakers.',
  },
  {
    id: 'rpm_ai_oracle',
    name: 'Babaylan AI Priestess',
    subtitle: 'Ready Player Me Diwata Rig',
    category: 'ready_player_me',
    icon: '🔮',
    badge: 'RPM Rigged',
    color: '#A855F7',
    url: 'https://models.readyplayer.me/64dc878598921e1026021e1d.glb',
    description: 'Diwata-inspired oracle with flowing hair, mystic ceremonial garments, and full facial blendshapes.',
  },
  {
    id: 'rpm_datu_sovereign',
    name: 'Datu Sovereign Commander',
    subtitle: 'Ready Player Me Gold Armor',
    category: 'ready_player_me',
    icon: '👑',
    badge: 'RPM Rigged',
    color: '#F59E0B',
    url: 'https://models.readyplayer.me/64dc883598921e102602283e.glb',
    description: 'Leader of the Bayanihan DAO with ceremonial gold armor plates and sovereign stance.',
  },
];
