import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAcademy, AvatarSkinId, safeHexColor, DEFAULT_KEYBINDS, KeybindConfig } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  createHumanoidCharacter,
  createPetDroneCompanion,
  CharacterMeshInstance,
  PetDroneInstance,
} from './CharacterMeshBuilder';
import { FILIPINO_PUNS, ANIME_SKILLS, AnimeSkillDef } from '../../data/filipinoCultureItems';
import {
  PpfClothInstance,
  FABRIC_PRESETS,
  SphereCollider,
} from '../../services/PpfContactPhysicsEngine';
import {
  TerranianWorldEngine,
  WorldGenOptions,
} from '../../services/TerranianWorldEngine';
import { MonsterSpawnEngine } from '../../services/MonsterSpawnEngine';
import { MiningBlockEngine } from '../../services/MiningBlockEngine';
import { PlayerStatsEngine } from '../../services/PlayerStatsEngine';

export interface DistrictInfo {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  pos: [number, number]; // [x, z]
  color: number;
  toolView: 'courses' | 'lab' | 'deploy' | 'verify' | 'profile' | 'projects' | 'faucet' | 'worldmap' | 'chat';
}

export const DISTRICTS: DistrictInfo[] = [
  {
    id: 'genesis',
    name: 'Genesis Plaza',
    tagline: 'PISO Chain L1 Central Core (2026001)',
    icon: '₱',
    pos: [0, 0],
    color: 0xF59E0B, // Sun Gold
    toolView: 'profile',
  },
  {
    id: 'worldmap',
    name: 'PISO World Map & Orbiting Hub',
    tagline: 'DePIN 3D Global Blockchain Network & Rewards',
    icon: '🌍',
    pos: [-15, 15],
    color: 0x38BDF8, // Cyan Sky
    toolView: 'worldmap',
  },
  {
    id: 'forge',
    name: 'Smart Contract Forge',
    tagline: 'Interactive Solidity Coding Laboratory',
    icon: '💻',
    pos: [24, -8],
    color: 0x3B82F6, // Royal Azure
    toolView: 'lab',
  },
  {
    id: 'temple',
    name: 'Katunayan Temple',
    tagline: 'Soulbound Credential Verifier (0x...1014)',
    icon: '🏛️',
    pos: [-24, -8],
    color: 0xFBBF24, // Gold
    toolView: 'verify',
  },
  {
    id: 'launchpad',
    name: 'Deploy Launchpad',
    tagline: 'Direct PISO Devnet Deployment Rig',
    icon: '🚀',
    pos: [0, -28],
    color: 0x10B981, // Emerald
    toolView: 'deploy',
  },
  {
    id: 'citadel',
    name: 'Babaylan AI Citadel',
    tagline: 'AI Oracle & Agent Architectures (0x...1009)',
    icon: '🔮',
    pos: [0, 26],
    color: 0xA855F7, // Purple
    toolView: 'courses',
  },
  {
    id: 'faucet',
    name: 'Bayanihan Faucet Obelisk',
    tagline: 'Testnet Gas Dispenser (1.0 ₱ Drip)',
    icon: '💧',
    pos: [15, 15],
    color: 0x06B6D4, // Cyan
    toolView: 'faucet',
  },
  {
    id: 'chat-spire',
    name: 'Gun.js Validator Spire',
    tagline: 'Decentralized P2P Mesh & Validator Consensus Chat',
    icon: '💬',
    pos: [16, -18],
    color: 0x8B5CF6, // Cyber Purple
    toolView: 'chat',
  },
];

export interface NPCLocationInfo {
  id: 'panday' | 'babaylan' | 'datu';
  name: string;
  title: string;
  pos: [number, number];
  color: number;
  avatar: string;
}

export const NPC_LOCATIONS: NPCLocationInfo[] = [
  {
    id: 'panday',
    name: 'Master Panday (Kiko)',
    title: 'Smart Contract Architect',
    pos: [20, -2],
    color: 0xF59E0B,
    avatar: '⚒️',
  },
  {
    id: 'babaylan',
    name: 'Babaylan Maya',
    title: 'Cryptographic AI Seer',
    pos: [5, 23],
    color: 0xA855F7,
    avatar: '🔮',
  },
  {
    id: 'datu',
    name: 'Kapitan Datu',
    title: 'Bayanihan DAO Elder',
    pos: [-6, 3],
    color: 0x3B82F6,
    avatar: '👑',
  },
];

export interface CruiseTargetInfo {
  id: 'panday' | 'babaylan' | 'datu';
  name: string;
  avatar: string;
  title: string;
  color: string;
  distance: number;
}

interface Cyber3DWorldProps {
  onProximityChange: (district: DistrictInfo | null) => void;
  onDistrictSelect: (district: DistrictInfo) => void;
  onMentorProximity: (mentor: NPCLocationInfo | null) => void;
  onMentorSelect: (mentor: NPCLocationInfo) => void;
  onCruiseTargetChange?: (target: CruiseTargetInfo | null) => void;
  playerPosRef: React.MutableRefObject<{ x: number; z: number; heading: number }>;
  onMiningEngineReady?: (engine: MiningBlockEngine) => void;
  onMonsterEngineReady?: (engine: MonsterSpawnEngine) => void;
}

export const Cyber3DWorld: React.FC<Cyber3DWorldProps> = ({
  onProximityChange,
  onDistrictSelect,
  onMentorProximity,
  onMentorSelect,
  onCruiseTargetChange,
  playerPosRef,
  onMiningEngineReady,
  onMonsterEngineReady,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeNearbyDistrictRef = useRef<DistrictInfo | null>(null);
  const activeNearbyMentorRef = useRef<NPCLocationInfo | null>(null);

  const onDistrictSelectRef = useRef(onDistrictSelect);
  const onMentorSelectRef = useRef(onMentorSelect);
  const onMentorProximityRef = useRef(onMentorProximity);
  const onProximityChangeRef = useRef(onProximityChange);
  const onCruiseTargetChangeRef = useRef(onCruiseTargetChange);
  const onMiningEngineReadyRef = useRef(onMiningEngineReady);
  const onMonsterEngineReadyRef = useRef(onMonsterEngineReady);

  const { avatarSkin, avatarMode, humanAvatar, controlSettings } = useAcademy();
  const controlSettingsRef = useRef(controlSettings);

  useEffect(() => {
    onDistrictSelectRef.current = onDistrictSelect;
    onMentorSelectRef.current = onMentorSelect;
    onMentorProximityRef.current = onMentorProximity;
    onProximityChangeRef.current = onProximityChange;
    onCruiseTargetChangeRef.current = onCruiseTargetChange;
    onMiningEngineReadyRef.current = onMiningEngineReady;
    onMonsterEngineReadyRef.current = onMonsterEngineReady;
    controlSettingsRef.current = controlSettings;
  });

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0B0F17);
    scene.fog = new THREE.FogExp2(0x0B0F17, 0.014);

    const camera = new THREE.PerspectiveCamera(
      52,
      container.clientWidth / container.clientHeight,
      0.1,
      600
    );

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0x1E293B, 2.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xF59E0B, 1.4);
    dirLight.position.set(25, 45, 25);
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x2563EB, 3.5, 60);
    blueLight.position.set(0, 12, 0);
    scene.add(blueLight);

    // 3. Cyber Grid Floor
    const gridHelper = new THREE.GridHelper(160, 80, 0xF59E0B, 0x1E293B);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const planeGeo = new THREE.PlaneGeometry(260, 260);
    const planeMat = new THREE.MeshBasicMaterial({ color: 0x070A10 });
    const floor = new THREE.Mesh(planeGeo, planeMat);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 4. Terranian Procedural 3D World Engine (Multi-Octave Terrain, Rivers, Buildings, Trees & Living Fauna)
    let activeTerranianEngine = new TerranianWorldEngine({
      biome: 'cyberManila',
      seed: 42,
    });
    scene.add(activeTerranianEngine.worldGroup);
    activeTerranianEngine.generate();

    // 5. Mining & Building Block Engine
    let activeMiningEngine = new MiningBlockEngine(scene);
    activeMiningEngine.spawnWorldBlocks(42);
    onMiningEngineReadyRef.current?.(activeMiningEngine);

    // Event listener for real-time procedural world regeneration from Terranian Studio
    const handleWorldRegenerate = (e: Event) => {
      const ce = e as CustomEvent<WorldGenOptions>;
      if (ce.detail) {
        scene.remove(activeTerranianEngine.worldGroup);
        activeTerranianEngine.dispose();
        activeTerranianEngine = new TerranianWorldEngine(ce.detail);
        scene.add(activeTerranianEngine.worldGroup);
        activeTerranianEngine.generate();

        activeMiningEngine.dispose();
        activeMiningEngine = new MiningBlockEngine(scene);
        activeMiningEngine.spawnWorldBlocks(ce.detail.seed);
        onMiningEngineReadyRef.current?.(activeMiningEngine);
      }
    };
    window.addEventListener('piso-world-regenerate', handleWorldRegenerate);

    // 5. Starfield Particles
    const particleCount = controlSettings.particleDensity === 'low' ? 300 : controlSettings.particleDensity === 'high' ? 1000 : 600;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 180;
      positions[i + 1] = Math.random() * 50 + 2;
      positions[i + 2] = (Math.random() - 0.5) * 180;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x94A3B8,
      size: 0.6,
      transparent: true,
      opacity: 0.7,
    });
    const starField = new THREE.Points(particleGeo, particleMat);
    scene.add(starField);

    // 6. District Monuments
    const monumentMeshes: { mesh: THREE.Group; district: DistrictInfo }[] = [];
    DISTRICTS.forEach((d) => {
      const g = new THREE.Group();
      g.position.set(d.pos[0], 0, d.pos[1]);

      const baseGeo = new THREE.CylinderGeometry(3.5, 4.2, 0.6, 16);
      const baseMat = new THREE.MeshBasicMaterial({ color: 0x161F30, wireframe: true });
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.y = 0.3;
      g.add(base);

      const ringGeo = new THREE.RingGeometry(2.2, 2.5, 32);
      const ringMat = new THREE.MeshBasicMaterial({ color: d.color, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.62;
      g.add(ring);

      const coreGeo =
        d.id === 'citadel'
          ? new THREE.IcosahedronGeometry(1.6, 0)
          : d.id === 'temple'
          ? new THREE.ConeGeometry(1.6, 3, 4)
          : d.id === 'chat-spire'
          ? new THREE.DodecahedronGeometry(1.6, 0)
          : new THREE.OctahedronGeometry(1.5, 0);

      const coreMat = new THREE.MeshBasicMaterial({ color: d.color, wireframe: true });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = 3.5;
      g.add(core);

      const beamGeo = new THREE.CylinderGeometry(0.12, 0.8, 25, 8);
      const beamMat = new THREE.MeshBasicMaterial({ color: d.color, transparent: true, opacity: 0.25 });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = 12.5;
      g.add(beam);

      scene.add(g);
      monumentMeshes.push({ mesh: g, district: d });
    });

    // 6B. PPF Contact Solver Dynamic Cloth Banner (Genesis Central Plaza)
    const ppfBanner = new PpfClothInstance(4.2, 2.2, 16, 12, FABRIC_PRESETS.silk);
    ppfBanner.pinTopEdge();
    ppfBanner.mesh.position.set(0, 4.0, -5.5);
    scene.add(ppfBanner.mesh);

    // Banner cyber support poles
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 4.8, 8);
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.25 });
    const poleL = new THREE.Mesh(poleGeo, poleMat);
    poleL.position.set(-2.1, 2.4, -5.5);
    scene.add(poleL);
    const poleR = new THREE.Mesh(poleGeo, poleMat);
    poleR.position.set(2.1, 2.4, -5.5);
    scene.add(poleR);
    const crossBarGeo = new THREE.CylinderGeometry(0.04, 0.04, 4.3, 8);
    const crossBar = new THREE.Mesh(crossBarGeo, poleMat);
    crossBar.rotation.z = Math.PI / 2;
    crossBar.position.set(0, 4.0, -5.5);
    scene.add(crossBar);

    // 6C. 3D Procedural Monster Engine (Giga Buwaya Titans + Small Monster Farms)
    const monsterSpawnEngine = new MonsterSpawnEngine(scene);
    onMonsterEngineReadyRef.current?.(monsterSpawnEngine);

    // 6D. 3D Holographic Auto-Target Lock Reticle
    const reticleGroup = new THREE.Group();
    reticleGroup.visible = false;
    const reticleRingGeo = new THREE.RingGeometry(1.6, 1.85, 4); // Diamond crosshair
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xEF4444, // Red target lock
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    const reticleRing = new THREE.Mesh(reticleRingGeo, reticleMat);
    reticleRing.rotation.x = -Math.PI / 2;
    reticleGroup.add(reticleRing);

    // Reticle corner ticks
    const tickMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
    for (let i = 0; i < 4; i++) {
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.12), tickMat);
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      tick.position.set(Math.cos(angle) * 2.2, 0, Math.sin(angle) * 2.2);
      reticleGroup.add(tick);
    }

    // Overhead Range Label
    const reticleCanvas = document.createElement('canvas');
    reticleCanvas.width = 256;
    reticleCanvas.height = 64;
    const reticleCtx = reticleCanvas.getContext('2d')!;
    const reticleTexture = new THREE.CanvasTexture(reticleCanvas);
    const reticleSpriteMat = new THREE.SpriteMaterial({ map: reticleTexture, transparent: true });
    const reticleSprite = new THREE.Sprite(reticleSpriteMat);
    reticleSprite.scale.set(3.2, 0.8, 1);
    reticleSprite.position.y = 1.4;
    reticleGroup.add(reticleSprite);
    scene.add(reticleGroup);

    // Helper for floating 3D holographic title billboard nameplates
    const createBillboardLabel = (text: string, subtext: string, colorHex: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 140;
      const ctx = canvas.getContext('2d');
      if (!ctx) return new THREE.Group();

      // Cyber container pill
      ctx.fillStyle = 'rgba(11, 15, 23, 0.88)';
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(12, 12, 488, 116, 24);
      ctx.fill();
      ctx.stroke();

      // Top glowing accent strip
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      ctx.roundRect(40, 12, 432, 6, 3);
      ctx.fill();

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(text, 256, 68);

      // Subtitle
      ctx.fillStyle = colorHex;
      ctx.font = 'bold 22px monospace';
      ctx.fillText(subtext, 256, 106);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(5.5, 1.5, 1);
      return sprite;
    };

    // 7. On-Chain NPC Holograms
    const npcMeshes: { mesh: THREE.Group; mentor: NPCLocationInfo }[] = [];
    NPC_LOCATIONS.forEach((npc) => {
      const g = new THREE.Group();
      g.position.set(npc.pos[0], 0, npc.pos[1]);

      // Small Pedestal
      const pedGeo = new THREE.CylinderGeometry(1.4, 1.8, 0.4, 12);
      const pedMat = new THREE.MeshBasicMaterial({ color: 0x161F30, wireframe: true });
      const ped = new THREE.Mesh(pedGeo, pedMat);
      ped.position.y = 0.2;
      g.add(ped);

      // Rotating Pedestal Ring
      const ringGeo = new THREE.RingGeometry(1.2, 1.4, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: npc.color, side: THREE.DoubleSide });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.42;
      g.add(ring);

      // Holographic NPC Core (Humanoid/Prism shape)
      const coreGeo =
        npc.id === 'panday'
          ? new THREE.DodecahedronGeometry(0.8)
          : npc.id === 'babaylan'
          ? new THREE.OctahedronGeometry(0.9)
          : new THREE.IcosahedronGeometry(0.85);

      const coreMat = new THREE.MeshBasicMaterial({
        color: npc.color,
        wireframe: true,
      });
      const npcCore = new THREE.Mesh(coreGeo, coreMat);
      npcCore.position.y = 2.0;
      g.add(npcCore);

      // Inner Light
      const light = new THREE.PointLight(npc.color, 2, 8);
      light.position.y = 2.0;
      g.add(light);

      // 3D Billboard Nameplate above core (Visible from afar)
      const labelSprite = createBillboardLabel(
        `${npc.avatar} ${npc.name}`,
        npc.title.toUpperCase(),
        `#${npc.color.toString(16).padStart(6, '0')}`
      );
      labelSprite.position.y = 3.6;
      g.add(labelSprite);

      scene.add(g);
      npcMeshes.push({ mesh: g, mentor: npc });
    });

    // 8. Dynamic Player Builder Avatar (Humanoid Builder vs Recon Drone)
    const droneGroup = new THREE.Group();
    const spawnX = typeof playerPosRef.current?.x === 'number' ? playerPosRef.current.x : 0;
    const spawnZ = typeof playerPosRef.current?.z === 'number' ? playerPosRef.current.z : 8;
    droneGroup.position.set(spawnX, avatarMode === 'human' ? 0.05 : 1.4, spawnZ);

    let droneRing: THREE.Mesh | null = null;
    let characterInstance: CharacterMeshInstance | null = null;
    let petDroneInstance: PetDroneInstance | null = null;
    let humanWalkPhase = 0;

    if (avatarMode === 'human') {
      // 8A. Procedural Full-Body 3D Character (PISO Chain Founder Datu Sovereign / Custom Avatar)
      characterInstance = createHumanoidCharacter(humanAvatar);
      droneGroup.add(characterInstance.rootGroup);
      droneRing = characterInstance.groundRing;

      // Active Companion Pet Recon Drone following the avatar
      if (humanAvatar?.petDrone?.enabled !== false) {
        const petSkin = humanAvatar?.petDrone?.skin || avatarSkin || 'panday';
        const petAura = humanAvatar?.petDrone?.auraColor || humanAvatar?.auraColor || '#F59E0B';
        petDroneInstance = createPetDroneCompanion(petSkin, petAura);
        petDroneInstance.group.position.set(spawnX + 0.9, 1.6, spawnZ - 0.9);
        scene.add(petDroneInstance.group);
      }
    } else {
      // 8B. Recon Drone Chassis Mode (Based on avatarSkin)
      let droneHullColor = 0x1E293B;
      let droneVisorColor = 0x3B82F6;
      let droneRingColor = 0xF59E0B;
      let thrusterLightColor = 0x3B82F6;

      if (avatarSkin === 'panday') {
        droneHullColor = 0x2A1C0E;
        droneVisorColor = 0xF59E0B;
        droneRingColor = 0xD97706;
        thrusterLightColor = 0xF97316;
      } else if (avatarSkin === 'babaylan') {
        droneHullColor = 0x24113A;
        droneVisorColor = 0xC084FC;
        droneRingColor = 0xA855F7;
        thrusterLightColor = 0xE879F9;
      } else if (avatarSkin === 'jeepney') {
        droneHullColor = 0x334155;
        droneVisorColor = 0xEAB308;
        droneRingColor = 0xEF4444;
        thrusterLightColor = 0xFACC15;
      } else if (avatarSkin === 'sentinel') {
        droneHullColor = 0x0F172A;
        droneVisorColor = 0xEF4444;
        droneRingColor = 0x94A3B8;
        thrusterLightColor = 0xF43F5E;
      }

      // Main Chassis
      const bodyGeo =
        avatarSkin === 'jeepney'
          ? new THREE.BoxGeometry(1.4, 0.6, 1.6)
          : avatarSkin === 'panday'
          ? new THREE.DodecahedronGeometry(0.85, 1)
          : avatarSkin === 'babaylan'
          ? new THREE.IcosahedronGeometry(0.8)
          : new THREE.OctahedronGeometry(0.8, 1);

      const bodyMat = new THREE.MeshBasicMaterial({ color: droneHullColor });
      const droneBody = new THREE.Mesh(bodyGeo, bodyMat);
      droneGroup.add(droneBody);

      // Visor
      const visorGeo = new THREE.BoxGeometry(0.6, 0.15, 0.3);
      const visorMat = new THREE.MeshBasicMaterial({ color: droneVisorColor });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.1, 0.6);
      droneGroup.add(visor);

      // Core Ring
      const ringGeo = new THREE.TorusGeometry(1.0, 0.04, 8, 24);
      const ringMat = new THREE.MeshBasicMaterial({ color: droneRingColor });
      droneRing = new THREE.Mesh(ringGeo, ringMat);
      droneRing.rotation.x = Math.PI / 2;
      droneGroup.add(droneRing);

      // Thruster
      const thrusterLight = new THREE.PointLight(thrusterLightColor, 2.5, 8);
      thrusterLight.position.set(0, -0.4, -0.6);
      droneGroup.add(thrusterLight);
    }

    scene.add(droneGroup);

    // 8D. PPF Dynamic Cloth Physics Hero Cape with 100% Penetration-Free Cubic Barrier
    const ppfCape = new PpfClothInstance(1.0, 1.3, 10, 10, FABRIC_PRESETS.silk);
    ppfCape.pinVertex(0);
    ppfCape.pinVertex(1);
    ppfCape.pinVertex(9);
    ppfCape.pinVertex(10);
    ppfCape.mesh.position.set(0, avatarMode === 'human' ? 1.6 : 0.8, -0.2);
    droneGroup.add(ppfCape.mesh);

    const avatarBodyCollider: SphereCollider = {
      center: new THREE.Vector3(0, 1.0, 0),
      radius: 0.42,
      dynamicStiffness: 4.5,
    };

    // Broadcast Listener for PPF Studio Physics Updates
    const handlePpfUpdateEvent = (e: Event) => {
      const custom = e as CustomEvent<{
        presetId: string;
        barrierThreshold: number;
        contactStiffness: number;
        windSpeed: number;
        gravityY: number;
      }>;
      if (custom.detail) {
        const p = FABRIC_PRESETS[custom.detail.presetId];
        if (p) {
          ppfBanner.setPreset(p);
          ppfCape.setPreset(p);
        }
        avatarBodyCollider.dynamicStiffness = custom.detail.contactStiffness;
        ppfBanner.wind.set(custom.detail.windSpeed * 0.8, 0.3, custom.detail.windSpeed * 0.6);
        ppfCape.wind.set(custom.detail.windSpeed * 0.4, 0.2, custom.detail.windSpeed * 0.5);
      }
    };
    window.addEventListener('piso-ppf-update-physics', handlePpfUpdateEvent);
    let speechBubbleTimer = 0;
    const speechCanvas = document.createElement('canvas');
    speechCanvas.width = 512;
    speechCanvas.height = 160;
    const speechCtx = speechCanvas.getContext('2d');
    const speechTexture = new THREE.CanvasTexture(speechCanvas);
    speechTexture.minFilter = THREE.LinearFilter;
    const speechMat = new THREE.SpriteMaterial({
      map: speechTexture,
      transparent: true,
      depthWrite: false,
      opacity: 0,
    });
    const speechBubbleSprite = new THREE.Sprite(speechMat);
    speechBubbleSprite.scale.set(5.2, 1.6, 1);
    speechBubbleSprite.position.set(0, avatarMode === 'human' ? 3.4 : 2.6, 0);
    droneGroup.add(speechBubbleSprite);

    const showAvatarSpeechBubble = (sender: string, text: string, isValidator: boolean) => {
      if (!speechCtx) return;
      speechCtx.clearRect(0, 0, 512, 160);

      // Cyber chat bubble box
      speechCtx.fillStyle = 'rgba(11, 15, 23, 0.94)';
      speechCtx.strokeStyle = isValidator ? '#A855F7' : '#F59E0B';
      speechCtx.lineWidth = 4;
      speechCtx.beginPath();
      speechCtx.roundRect(12, 12, 488, 120, 22);
      speechCtx.fill();
      speechCtx.stroke();

      // Top glowing indicator strip
      speechCtx.fillStyle = isValidator ? '#A855F7' : '#F59E0B';
      speechCtx.beginPath();
      speechCtx.roundRect(40, 12, 432, 5, 2);
      speechCtx.fill();

      // Pointer triangle at bottom
      speechCtx.beginPath();
      speechCtx.moveTo(246, 132);
      speechCtx.lineTo(256, 150);
      speechCtx.lineTo(266, 132);
      speechCtx.fillStyle = 'rgba(11, 15, 23, 0.94)';
      speechCtx.fill();
      speechCtx.strokeStyle = isValidator ? '#A855F7' : '#F59E0B';
      speechCtx.stroke();

      // Sender tag
      speechCtx.fillStyle = isValidator ? '#C084FC' : '#FBBF24';
      speechCtx.font = 'bold 20px monospace';
      speechCtx.textAlign = 'center';
      speechCtx.fillText(`${isValidator ? '🛡️ ' : '⚡ '}${sender.toUpperCase()}`, 256, 44);

      // Message text
      speechCtx.fillStyle = '#FFFFFF';
      speechCtx.font = 'bold 24px monospace';
      const displayText = text.length > 34 ? text.slice(0, 31) + '...' : text;
      speechCtx.fillText(displayText, 256, 88);

      speechTexture.needsUpdate = true;
      speechMat.opacity = 1;
      speechBubbleTimer = 7.0; // Stay visible for 7 seconds
    };

    const handleAvatarChatEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ sender: string; text: string; isValidator?: boolean }>;
      if (customEvent.detail) {
        showAvatarSpeechBubble(
          customEvent.detail.sender,
          customEvent.detail.text,
          !!customEvent.detail.isValidator
        );
      }
    };
    window.addEventListener('piso-avatar-chat', handleAvatarChatEvent);

    // --- 8b. ANIME SUPER POWERS & IMPACT EXPLOSIONS ENGINE ---
    let screenShakeIntensity = 0;

    // Laser Beam Group (Dragon Ball Kamehameha / Naruto Lightning Beam)
    const laserBeamGroup = new THREE.Group();
    laserBeamGroup.visible = false;

    // Core beam cylinder
    const beamLength = 32;
    const beamCoreMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.95 });
    const beamCoreGeo = new THREE.CylinderGeometry(0.45, 0.45, beamLength, 16);
    const beamCore = new THREE.Mesh(beamCoreGeo, beamCoreMat);
    beamCore.rotation.x = Math.PI / 2;
    beamCore.position.z = beamLength / 2;
    laserBeamGroup.add(beamCore);

    // Outer Aura Sheath
    const beamSheathMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, transparent: true, opacity: 0.45, side: THREE.BackSide });
    const beamSheathGeo = new THREE.CylinderGeometry(0.85, 0.85, beamLength, 16);
    const beamSheath = new THREE.Mesh(beamSheathGeo, beamSheathMat);
    beamSheath.rotation.x = Math.PI / 2;
    beamSheath.position.z = beamLength / 2;
    laserBeamGroup.add(beamSheath);

    // Corkscrew Lightning Spiral around beam
    const spiralRings: THREE.Mesh[] = [];
    for (let r = 0; r < 8; r++) {
      const spRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.9, 0.04, 6, 16),
        new THREE.MeshBasicMaterial({ color: 0x67E8F9, transparent: true, opacity: 0.8 })
      );
      spRing.position.z = 2 + r * 4;
      laserBeamGroup.add(spRing);
      spiralRings.push(spRing);
    }
    scene.add(laserBeamGroup);

    // Ki Energy Gathering Charge Sphere
    const kiChargeMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4, wireframe: true });
    const kiChargeSphere = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 12), kiChargeMat);
    kiChargeSphere.visible = false;
    scene.add(kiChargeSphere);

    // Anime Impact Explosion Group
    const explosionGroup = new THREE.Group();
    explosionGroup.visible = false;

    // Fiery energy expansion dome
    const fireballMat = new THREE.MeshBasicMaterial({ color: 0xEF4444, transparent: true, opacity: 0.9 });
    const fireball = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 16), fireballMat);
    explosionGroup.add(fireball);

    // Expanding ground shockwave ring
    const groundShockMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    const groundShock = new THREE.Mesh(new THREE.RingGeometry(0.5, 1.4, 32), groundShockMat);
    groundShock.rotation.x = -Math.PI / 2;
    groundShock.position.y = 0.08;
    explosionGroup.add(groundShock);

    // Spark particle burst
    const sparkCount = 28;
    const sparkGeo = new THREE.BufferGeometry();
    const sparkPos = new Float32Array(sparkCount * 3);
    const sparkVels: THREE.Vector3[] = [];
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = 0;
      sparkPos[i * 3 + 1] = 0.5;
      sparkPos[i * 3 + 2] = 0;
      sparkVels.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 16,
          Math.random() * 12 + 2,
          (Math.random() - 0.5) * 16
        )
      );
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const sparkMat = new THREE.PointsMaterial({ color: 0xFDE047, size: 0.5, transparent: true, opacity: 1 });
    const sparkPoints = new THREE.Points(sparkGeo, sparkMat);
    explosionGroup.add(sparkPoints);
    scene.add(explosionGroup);

    // Flying 3D Tsinelas Projectile Group
    const flyingTsinelasGroup = new THREE.Group();
    flyingTsinelasGroup.visible = false;

    const tsinelasSole = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.06, 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0284C7, roughness: 0.5 })
    );
    flyingTsinelasGroup.add(tsinelasSole);

    const tsinelasStrap = new THREE.Mesh(
      new THREE.TorusGeometry(0.14, 0.03, 6, 16),
      new THREE.MeshStandardMaterial({ color: 0xDC2626 })
    );
    tsinelasStrap.rotation.x = Math.PI / 3;
    tsinelasStrap.position.set(0, 0.08, -0.05);
    flyingTsinelasGroup.add(tsinelasStrap);

    // Comic "BAM!" impact billboard
    const bamCanvas = document.createElement('canvas');
    bamCanvas.width = 256;
    bamCanvas.height = 128;
    const bamCtx = bamCanvas.getContext('2d');
    if (bamCtx) {
      bamCtx.fillStyle = '#EF4444';
      bamCtx.beginPath();
      const cx = 128, cy = 64, spikes = 10, outer = 55, inner = 30;
      for (let i = 0; i < spikes * 2; i++) {
        const rad = (i / (spikes * 2)) * Math.PI * 2;
        const dist = i % 2 === 0 ? outer : inner;
        const x = cx + Math.cos(rad) * dist;
        const y = cy + Math.sin(rad) * dist;
        if (i === 0) bamCtx.moveTo(x, y);
        else bamCtx.lineTo(x, y);
      }
      bamCtx.closePath();
      bamCtx.fill();
      bamCtx.lineWidth = 4;
      bamCtx.strokeStyle = '#FDE047';
      bamCtx.stroke();
      bamCtx.fillStyle = '#FFFFFF';
      bamCtx.font = '900 32px monospace';
      bamCtx.textAlign = 'center';
      bamCtx.fillText('BAM!', cx, cy + 10);
    }
    const bamTexture = new THREE.CanvasTexture(bamCanvas);
    const bamMat = new THREE.SpriteMaterial({ map: bamTexture, transparent: true, opacity: 0 });
    const bamSprite = new THREE.Sprite(bamMat);
    bamSprite.scale.set(3.5, 1.8, 1);
    scene.add(bamSprite);
    scene.add(flyingTsinelasGroup);

    // --- 3D FLOATING COMBAT DAMAGE NUMBERS ---
    interface FloatingDamageItem {
      sprite: THREE.Sprite;
      timer: number;
      maxTime: number;
      velY: number;
    }
    const floatingDamageItems: FloatingDamageItem[] = [];

    const spawnDamagePopup = (text: string, colorHex: string, worldPos: THREE.Vector3, scale = 1.0) => {
      const canvas = document.createElement('canvas');
      canvas.width = 384;
      canvas.height = 96;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = '900 32px monospace, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = colorHex;
        ctx.shadowBlur = 14;

        ctx.fillStyle = 'rgba(11, 15, 23, 0.92)';
        ctx.beginPath();
        ctx.roundRect(10, 10, 364, 76, 20);
        ctx.fill();

        ctx.lineWidth = 3.5;
        ctx.strokeStyle = colorHex;
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, 192, 48);
      }

      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 1, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(4.4 * scale, 1.1 * scale, 1);
      sprite.position.copy(worldPos).add(new THREE.Vector3(0, 2.0, 0));
      scene.add(sprite);

      floatingDamageItems.push({
        sprite,
        timer: 0,
        maxTime: 1.4,
        velY: 2.2,
      });
    };

    // --- ADDITIONAL 3D ATTACK MESHES ---
    // 1. Rasengan Swirling Sphere Group
    const rasenganGroup = new THREE.Group();
    rasenganGroup.visible = false;
    const rCoreGeo = new THREE.SphereGeometry(0.38, 16, 16);
    const rCoreMat = new THREE.MeshBasicMaterial({ color: 0x38BDF8, transparent: true, opacity: 0.9 });
    const rCore = new THREE.Mesh(rCoreGeo, rCoreMat);
    rasenganGroup.add(rCore);
    const rRingMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4, wireframe: true });
    const rRing1 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 6, 24), rRingMat);
    rRing1.rotation.x = Math.PI / 4;
    rasenganGroup.add(rRing1);
    const rRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.02, 6, 24), rRingMat);
    rRing2.rotation.y = Math.PI / 4;
    rasenganGroup.add(rRing2);
    scene.add(rasenganGroup);

    // 2. Bathala's Lightning Storm Group
    const stormGroup = new THREE.Group();
    stormGroup.visible = false;
    const stormBolts: THREE.Mesh[] = [];
    const boltMat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
    for (let i = 0; i < 5; i++) {
      const bMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 28, 6), boltMat);
      stormBolts.push(bMesh);
      stormGroup.add(bMesh);
    }
    scene.add(stormGroup);

    // 3. Walis Tambo Cyclone Tornado Mesh
    const cycloneMat = new THREE.MeshBasicMaterial({ color: 0x10B981, transparent: true, opacity: 0, wireframe: true });
    const cycloneMesh = new THREE.Mesh(new THREE.ConeGeometry(2.4, 4.0, 16, 1, true), cycloneMat);
    cycloneMesh.rotation.x = Math.PI;
    cycloneMesh.position.y = 1.8;
    scene.add(cycloneMesh);

    // 4. Tabo Hydro Wave Mesh
    const hydroMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4, transparent: true, opacity: 0, side: THREE.DoubleSide });
    const hydroWaveMesh = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.35, 8, 24, Math.PI), hydroMat);
    hydroWaveMesh.rotation.x = -Math.PI / 2;
    scene.add(hydroWaveMesh);

    // Active super power attack state
    interface ActiveAttackState {
      type: string;
      timer: number;
      origin: THREE.Vector3;
      heading: number;
      impactPoint: THREE.Vector3;
      damageApplied?: boolean;
    }
    let currentAttack: ActiveAttackState | null = null;

    const applyMonsterCombatHit = (impactPos: THREE.Vector3, hitRadius: number, baseDmg: number, skillName: string) => {
      const hits = monsterSpawnEngine.applyDamage(
        { x: impactPos.x, z: impactPos.z },
        hitRadius,
        baseDmg,
        skillName
      );
      if (hits.length > 0) {
        for (const h of hits) {
          if (h.slain && h.isBoss) {
            screenShakeIntensity = 3.2; // Massive titan defeat screen shake
          }
        }
      }
    };

    const triggerSuperPower = (powerId: string) => {
      const origin = droneGroup.position.clone();

      // Smart Nearest-Target Auto-Locking
      const nearestTarget = monsterSpawnEngine.getNearestAliveMonster(
        { x: droneGroup.position.x, z: droneGroup.position.z },
        42
      );

      let impactPoint: THREE.Vector3;
      if (nearestTarget && controlSettings.autoTargetLock !== false) {
        const tPos = nearestTarget.monster.mesh.position;
        const dx = tPos.x - droneGroup.position.x;
        const dz = tPos.z - droneGroup.position.z;
        droneHeading = Math.atan2(dx, -dz);
        droneGroup.rotation.y = droneHeading;
        impactPoint = tPos.clone();
      } else {
        const forwardDist = powerId === 'chidori' ? 18 : powerId === 'rasengan' ? 22 : powerId === 'gatling' ? 8 : 28;
        const fwd = new THREE.Vector3(Math.sin(droneHeading), 0, -Math.cos(droneHeading));
        impactPoint = origin.clone().add(fwd.multiplyScalar(forwardDist));
      }

      currentAttack = {
        type: powerId,
        timer: 0,
        origin,
        heading: droneHeading,
        impactPoint,
      };

      const skill = ANIME_SKILLS.find((s) => s.id === powerId);

      if (powerId === 'kamehameha') {
        showAvatarSpeechBubble('DATU SOVEREIGN', 'KA... ME... HA... ME... PISOOOOO! 🔥', true);
        SoundFX.playAnimeCharge();
      } else if (powerId === 'chidori') {
        showAvatarSpeechBubble('DATU SOVEREIGN', '⚡ CHIDORI NG MERALCO! 1.21 GW! ⚡', true);
        SoundFX.playChidoriLightning();
      } else if (powerId === 'tsinelas') {
        showAvatarSpeechBubble('NANAY', 'WALANG MINTIS ANG TSINELAS KO! 🩴🎯', false);
        SoundFX.playLaser();
      } else if (powerId === 'gear5') {
        showAvatarSpeechBubble('JOYBOY DATU', 'HAHAHA! GEAR 5 LOKO-LOKO BOUNCE! 🤪✨', false);
        SoundFX.playGear5Laugh();
      } else if (powerId === 'rasengan') {
        showAvatarSpeechBubble('DATU SHINOBI', '🌀 RASENGAN NG BAGUIO! SPIRAL BURST! 🌀', true);
        SoundFX.playRasenganSpiral();
      } else if (powerId === 'gatling') {
        showAvatarSpeechBubble('LUFFY BUILDER', '🥊 GOMU GOMU NO SAPAPOK GATLING! 🥊', false);
        SoundFX.playGatlingRapidPunch();
      } else if (powerId === 'lightning_storm') {
        showAvatarSpeechBubble('BATHALA', '⛈️ PARUSAHAN ANG MGA EXPLOITER! ⛈️', true);
        SoundFX.playThunderstormStrike();
      } else if (powerId === 'cyclone_spin') {
        showAvatarSpeechBubble('PANDAY SPEED', '🌪️ WALIS TAMBO WHIRLWIND! SWEEP ALL BUGS! 🌪️', false);
        SoundFX.playCycloneSpin();
      } else if (powerId === 'hydro_wave') {
        showAvatarSpeechBubble('BABAYLAN MAYA', '🌊 TABO HYDRO SURGE! LINISIN ANG REVERTS! 🌊', false);
        SoundFX.playWaterSurge();
      } else if (powerId === 'pun') {
        const randomPun = FILIPINO_PUNS[Math.floor(Math.random() * FILIPINO_PUNS.length)];
        showAvatarSpeechBubble('PINOY BUILDER', randomPun, false);
        SoundFX.playFunnyPunBoing();
        screenShakeIntensity = 0.6;
        spawnDamagePopup('❤️ 100 EMOTIONAL DAMAGE!', '#EC4899', origin);
      }
    };

    const handleSuperPowerEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ powerId: string }>;
      if (customEvent.detail && customEvent.detail.powerId) {
        triggerSuperPower(customEvent.detail.powerId);
      }
    };
    window.addEventListener('piso-trigger-superpower', handleSuperPowerEvent);

    const handleScreenShakeEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ intensity?: number }>;
      screenShakeIntensity = customEvent.detail?.intensity || 1.4;
    };
    window.addEventListener('piso-trigger-screen-shake', handleScreenShakeEvent);

    // Auto Idle Attack Holographic Ring
    const autoAttackRingMat = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
      wireframe: true,
    });
    const autoAttackRing = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.85, 32), autoAttackRingMat);
    autoAttackRing.rotation.x = -Math.PI / 2;
    autoAttackRing.position.y = 0.08;
    autoAttackRing.visible = false;
    scene.add(autoAttackRing);

    let isAutoAttackMode = false;
    let autoAttackTimer = 0;
    const handleAutoAttackEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ active: boolean }>;
      isAutoAttackMode = !!customEvent.detail?.active;
      autoAttackRing.visible = isAutoAttackMode;
      if (isAutoAttackMode) {
        showAvatarSpeechBubble('SYSTEM AI', '🤖 AUTO-IDLE COMBAT ACTIVE! ROTATING DPS!', false);
      }
    };
    window.addEventListener('piso-toggle-auto-attack', handleAutoAttackEvent);

    // 9. Click-to-Fly Target Beacon (Pulsing Ground Ring)
    const clickTargetGeo = new THREE.RingGeometry(0.6, 0.85, 32);
    const clickTargetMat = new THREE.MeshBasicMaterial({
      color: 0x06B6D4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
    });
    const clickBeacon = new THREE.Mesh(clickTargetGeo, clickTargetMat);
    clickBeacon.rotation.x = -Math.PI / 2;
    clickBeacon.position.y = 0.05;
    scene.add(clickBeacon);

    // 10. Block Pulse Shockwave (3-second block interval)
    const waveGeo = new THREE.RingGeometry(0.5, 1.2, 48);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0xF59E0B,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });
    const blockWave = new THREE.Mesh(waveGeo, waveMat);
    blockWave.rotation.x = -Math.PI / 2;
    blockWave.position.set(0, 0.08, 0);
    scene.add(blockWave);
    let waveScale = 1;

    // 11. Camera Orbit State (Non-disorienting controls!)
    let orbitAngle = 0; // Horizontal angle
    let elevationAngle = 0.65; // ~37 degrees up
    let zoomDistance = controlSettings.zoom || 18;
    let isRightDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;

    // 12. Input Handling & Jump Mechanics
    const keys = { w: false, s: false, a: false, d: false, shift: false, space: false, eHold: false };

    // Jump & Double Jump State
    let jumpCount = 0; // 0 = grounded, 1 = single jump, 2 = double jump
    let jumpVelocityY = 0;
    let jumpOffsetY = 0;
    const JUMP_FORCE = 11.5;
    const DOUBLE_JUMP_FORCE = 12.5;
    const GRAVITY = 32.0;

    // Visual jump shockwave rings (pool of 2 rings for single & double jump)
    const jumpRingGeo = new THREE.RingGeometry(0.5, 0.85, 32);
    const createJumpRing = (color: number) => {
      const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });
      const ring = new THREE.Mesh(jumpRingGeo, mat);
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.05;
      scene.add(ring);
      return { mesh: ring, material: mat, active: false, scale: 1, opacity: 0 };
    };

    const singleJumpEffect = createJumpRing(0x06B6D4); // Cyan shockwave for 1st jump
    const doubleJumpEffect = createJumpRing(0xF59E0B); // Amber radiant shockwave for double jump

    const triggerJumpFX = (fx: typeof singleJumpEffect, x: number, y: number, z: number) => {
      fx.mesh.position.set(x, Math.max(0.04, y), z);
      fx.scale = 0.8;
      fx.opacity = 0.95;
      fx.material.opacity = 0.95;
      fx.mesh.scale.set(0.8, 0.8, 1);
      fx.active = true;
    };

    const triggerJump = () => {
      if (jumpCount === 0) {
        // First jump: launch upwards from ground
        jumpCount = 1;
        jumpVelocityY = JUMP_FORCE;
        jumpOffsetY = 0.08;
        SoundFX.playJump();
        triggerJumpFX(singleJumpEffect, droneGroup.position.x, droneGroup.position.y, droneGroup.position.z);
      } else if (jumpCount === 1) {
        // Double jump: mid-air thruster boost!
        jumpCount = 2;
        jumpVelocityY = DOUBLE_JUMP_FORCE;
        SoundFX.playDoubleJump();
        triggerJumpFX(doubleJumpEffect, droneGroup.position.x, droneGroup.position.y, droneGroup.position.z);
      }
    };

    const handlePlayerJumpEvent = () => {
      triggerJump();
    };

    window.addEventListener('piso-player-jump', handlePlayerJumpEvent);

    // Target navigation state
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let targetPos: THREE.Vector3 | null = null;
    let targetMentorIndex = -1;
    const pendingInteractRef = {
      current: null as
        | { type: 'mentor'; mentor: NPCLocationInfo }
        | { type: 'district'; district: DistrictInfo }
        | null,
    };

    // Cycle list for user-friendly [E] key travel ("moving to next options")
    const destinations = [
      { type: 'mentor' as const, name: 'Master Panday (Forge)', pos: [20, -2], payload: NPC_LOCATIONS.find(n => n.id === 'panday')! },
      { type: 'district' as const, name: 'Smart Contract Forge', pos: [24, -8], payload: DISTRICTS.find(d => d.id === 'forge')! },
      { type: 'mentor' as const, name: 'Babaylan Maya (Citadel)', pos: [5, 23], payload: NPC_LOCATIONS.find(n => n.id === 'babaylan')! },
      { type: 'district' as const, name: 'Babaylan AI Citadel', pos: [0, 26], payload: DISTRICTS.find(d => d.id === 'citadel')! },
      { type: 'district' as const, name: 'Bayanihan Faucet (1.0 ₱)', pos: [15, 15], payload: DISTRICTS.find(d => d.id === 'faucet')! },
      { type: 'district' as const, name: 'Genesis Plaza Core', pos: [0, 0], payload: DISTRICTS.find(d => d.id === 'genesis')! },
      { type: 'mentor' as const, name: 'Kapitan Datu (Plaza)', pos: [-6, 3], payload: NPC_LOCATIONS.find(n => n.id === 'datu')! },
      { type: 'district' as const, name: 'Katunayan Temple (0x...1014)', pos: [-24, -8], payload: DISTRICTS.find(d => d.id === 'temple')! },
      { type: 'district' as const, name: 'Deploy Launchpad Rig', pos: [0, -28], payload: DISTRICTS.find(d => d.id === 'launchpad')! },
    ];
    let nextDestIndex = 0;

    // Guaranteed Mentor Navigation: targets the specific mentor and emits cruise telemetry
    const navigateToMentorByIndex = (index: number) => {
      targetMentorIndex = index;
      const targetMentor = NPC_LOCATIONS[targetMentorIndex];
      if (!targetMentor) return;

      SoundFX.playWarp();
      // Target position slightly in front of the mentor (+2.0 units in Z)
      targetPos = new THREE.Vector3(targetMentor.pos[0], 0, targetMentor.pos[1] + 2.0);
      pendingInteractRef.current = { type: 'mentor', mentor: targetMentor };

      clickBeacon.position.set(targetMentor.pos[0], 0.05, targetMentor.pos[1]);
      (clickBeacon.material as THREE.MeshBasicMaterial).color.setHex(targetMentor.color);
      (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0.95;

      const dist = Math.hypot(targetPos.x - droneGroup.position.x, targetPos.z - droneGroup.position.z);
      onCruiseTargetChangeRef.current?.({
        id: targetMentor.id,
        name: targetMentor.name,
        avatar: targetMentor.avatar,
        title: targetMentor.title,
        color: '#' + targetMentor.color.toString(16).padStart(6, '0'),
        distance: dist,
      });
    };

    // Cycle Next Mentor: ALWAYS increments to the next mentor in the list
    // 0 (Panday) -> 1 (Babaylan) -> 2 (Datu) -> 0 (Panday)
    const cycleNextMentor = () => {
      if (targetMentorIndex === -1) {
        let nearestIdx = 0;
        let minDistance = Infinity;
        NPC_LOCATIONS.forEach((m, idx) => {
          const dist = Math.hypot(droneGroup.position.x - m.pos[0], droneGroup.position.z - m.pos[1]);
          if (dist < minDistance) {
            minDistance = dist;
            nearestIdx = idx;
          }
        });
        const nextIdx = (nearestIdx + 1) % NPC_LOCATIONS.length;
        navigateToMentorByIndex(nextIdx);
      } else {
        const nextIdx = (targetMentorIndex + 1) % NPC_LOCATIONS.length;
        navigateToMentorByIndex(nextIdx);
      }
    };

    const handleCancelAutopilot = () => {
      targetPos = null;
      pendingInteractRef.current = null;
      (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
      onCruiseTargetChangeRef.current?.(null);
    };

    const handleNavigateToMentorEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ mentorId: 'panday' | 'babaylan' | 'datu' }>;
      const idx = NPC_LOCATIONS.findIndex(m => m.id === customEvent.detail?.mentorId);
      if (idx !== -1) {
        navigateToMentorByIndex(idx);
      }
    };

    const handleCycleNextMentorEvent = () => {
      cycleNextMentor();
    };

    window.addEventListener('piso-navigate-to-mentor', handleNavigateToMentorEvent);
    window.addEventListener('piso-cycle-next-mentor', handleCycleNextMentorEvent);
    window.addEventListener('piso-cancel-autopilot', handleCancelAutopilot);

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const k = e.key.toLowerCase();
      const kb = controlSettingsRef.current.keybinds || DEFAULT_KEYBINDS;

      const isJumpKey = (kb.jump === ' ' && (e.code === 'Space' || e.key === ' ')) || k === (kb.jump || ' ').toLowerCase();
      if (isJumpKey) {
        e.preventDefault();
        keys.space = true;
        triggerJump();
        return;
      }

      const isFwd = k === (kb.forward || 'w').toLowerCase() || k === 'arrowup';
      const isBack = k === (kb.backward || 's').toLowerCase() || k === 'arrowdown';
      const isLeft = k === (kb.left || 'a').toLowerCase() || k === 'arrowleft';
      const isRight = k === (kb.right || 'd').toLowerCase() || k === 'arrowright';
      const isSprint = (kb.sprint === 'shift' && e.shiftKey) || k === (kb.sprint || 'shift').toLowerCase();

      if (isFwd) keys.w = true;
      if (isBack) keys.s = true;
      if (isLeft) keys.a = true;
      if (isRight) keys.d = true;
      if (isSprint) keys.shift = true;

      // Avatar Options on 'N' (or configured key)
      if (k === (kb.avatarOptions || 'n').toLowerCase() || k === 'n') {
        window.dispatchEvent(new CustomEvent('piso-open-avatar-options'));
        return;
      }

      // Inventory & Bidding Market on 'I' (or configured key)
      if (k === (kb.inventory || 'i').toLowerCase() || k === 'i') {
        window.dispatchEvent(new CustomEvent('piso-open-inventory'));
        return;
      }

      // Auto-Attack / Reticle Lock Toggle
      if (k === (kb.autoAttack || 'z').toLowerCase()) {
        window.dispatchEvent(new CustomEvent('piso-toggle-auto-attack'));
        return;
      }

      // Builder Mode Toggle (Default 'v')
      if (k === (kb.builderMode || 'v').toLowerCase()) {
        activeMiningEngine.builderMode = !activeMiningEngine.builderMode;
        return;
      }

      // Mining & Building Studio
      if (k === (kb.miningStudio || 'm').toLowerCase()) {
        window.dispatchEvent(new CustomEvent('piso-open-mining-studio'));
        return;
      }

      // Primary Anime Skill / Hold E to Seek Nearest Block
      if (k === (kb.skillPrimary || 'e').toLowerCase() || k === 'e') {
        keys.eHold = true;
        const playerStats = PlayerStatsEngine.getStats();
        const miningResult = activeMiningEngine.mineNearestBlock(droneGroup.position, playerStats.level, 3.5);
        if (miningResult) {
          SoundFX.playLaser?.();
          PlayerStatsEngine.addMiningExp(miningResult.block.type, miningResult.exp);
          miningTimer = 0.5;
        } else {
          const powerId = humanAvatar?.equippedPinoyItems?.superpower || 'kamehameha';
          window.dispatchEvent(new CustomEvent('piso-trigger-superpower', { detail: { powerId } }));
        }
        return;
      }

      // Mine Nearest Block: "Q" (or configured key)
      if (k === (kb.mine || 'q').toLowerCase()) {
        const playerStats = PlayerStatsEngine.getStats();
        const miningResult = activeMiningEngine.mineNearestBlock(droneGroup.position, playerStats.level, 3.5);
        if (miningResult) {
          SoundFX.playLaser?.(); // Mining sound effect
          PlayerStatsEngine.addMiningExp(miningResult.block.type, miningResult.exp);
          miningTimer = 0.5; // Trigger axe chopping animation for 0.5s
          return;
        }
      }

      // NPC Interact / Talk / Cycle Key: Letter B (or configured key)
      if (k === (kb.interact || 'b').toLowerCase() || k === 'b') {
        // 0. Builder mode placement
        if (activeMiningEngine.builderMode) {
          const buildDist = 3.5;
          const bx = droneGroup.position.x + Math.sin(droneHeading) * buildDist;
          const bz = droneGroup.position.z - Math.cos(droneHeading) * buildDist;
          const buildPos = new THREE.Vector3(bx, 0, bz);
          activeMiningEngine.placeBlock(activeMiningEngine.selectedBlockType, buildPos);
          return;
        }

        // 1. Check if directly in front of a mentor (within tight 4.0 units)
        let closestMentor: { mentor: NPCLocationInfo; dist: number } | null = null;
        for (const { mentor } of npcMeshes) {
          const dx = droneGroup.position.x - mentor.pos[0];
          const dz = droneGroup.position.z - mentor.pos[1];
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= 4.0 && (!closestMentor || dist < closestMentor.dist)) {
            closestMentor = { mentor, dist };
          }
        }
        if (closestMentor) {
          SoundFX.playBlip();
          onMentorSelectRef.current(closestMentor.mentor);
          return;
        }

        // 2. Check if near a district monument (within 5.0 units)
        let closestDistrict: { district: DistrictInfo; dist: number } | null = null;
        for (const { district } of monumentMeshes) {
          const dx = droneGroup.position.x - district.pos[0];
          const dz = droneGroup.position.z - district.pos[1];
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist <= 5.0 && (!closestDistrict || dist < closestDistrict.dist)) {
            closestDistrict = { district, dist };
          }
        }
        if (closestDistrict) {
          SoundFX.playWarp();
          onDistrictSelectRef.current(closestDistrict.district);
          return;
        }

        // 3. Cycle to Next Option ("moving to next options")
        const dest = destinations[nextDestIndex];
        nextDestIndex = (nextDestIndex + 1) % destinations.length;

        if (dest && dest.payload) {
          SoundFX.playWarp();
          const targetOffset = dest.type === 'mentor' ? 2.0 : 3.0;
          targetPos = new THREE.Vector3(dest.pos[0], 0, dest.pos[1] + targetOffset);
          if (dest.type === 'mentor') {
            const m = dest.payload as NPCLocationInfo;
            targetMentorIndex = NPC_LOCATIONS.findIndex(npc => npc.id === m.id);
            pendingInteractRef.current = { type: 'mentor', mentor: m };
            (clickBeacon.material as THREE.MeshBasicMaterial).color.setHex(m.color);

            const dist = Math.hypot(targetPos.x - droneGroup.position.x, targetPos.z - droneGroup.position.z);
            onCruiseTargetChangeRef.current?.({
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              title: m.title,
              color: '#' + m.color.toString(16).padStart(6, '0'),
              distance: dist,
            });
          } else {
            const d = dest.payload as DistrictInfo;
            pendingInteractRef.current = { type: 'district', district: d };
            (clickBeacon.material as THREE.MeshBasicMaterial).color.setHex(d.color);
            onCruiseTargetChangeRef.current?.(null);
          }

          clickBeacon.position.set(dest.pos[0], 0.05, dest.pos[1]);
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0.95;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const kb = controlSettingsRef.current.keybinds || DEFAULT_KEYBINDS;
      const isJumpKey = (kb.jump === ' ' && (e.code === 'Space' || e.key === ' ')) || k === (kb.jump || ' ').toLowerCase();
      if (isJumpKey) {
        keys.space = false;
      }
      if (k === (kb.skillPrimary || 'e').toLowerCase() || k === 'e') {
        keys.eHold = false;
      }
      if (k === (kb.forward || 'w').toLowerCase() || k === 'arrowup') keys.w = false;
      if (k === (kb.backward || 's').toLowerCase() || k === 'arrowdown') keys.s = false;
      if (k === (kb.left || 'a').toLowerCase() || k === 'arrowleft') keys.a = false;
      if (k === (kb.right || 'd').toLowerCase() || k === 'arrowright') keys.d = false;
      if (!e.shiftKey && (k === (kb.sprint || 'shift').toLowerCase() || kb.sprint === 'shift')) keys.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Live Real-Time 3D Avatar Suiting update (When player buys/earns gear while walking online or idle)
    const handleAvatarUpdatedEvent = (e: Event) => {
      const custom = e as CustomEvent<{ humanAvatar?: any }>;
      const updatedConfig = custom.detail?.humanAvatar || (JSON.parse(localStorage.getItem('piso_human_avatar') || 'null'));
      if (updatedConfig && droneGroup) {
        if (characterInstance) {
          droneGroup.remove(characterInstance.rootGroup);
        }
        characterInstance = createHumanoidCharacter(updatedConfig);
        droneGroup.add(characterInstance.rootGroup);
        droneRing = characterInstance.groundRing;
        droneGroup.position.y = 0.05;
      }
    };
    window.addEventListener('piso-avatar-updated', handleAvatarUpdatedEvent);

    // Pointer Events for Click-to-Move, NPC/District Interaction, and Right-Click Orbit
    const handlePointerDown = (e: MouseEvent) => {
      if (e.button === 2) {
        // Right click: start orbit camera
        isRightDragging = true;
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
        return;
      }

      if (e.button === 0) {
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);

        // 1. Check if clicked directly on an NPC Mentor
        for (const { mesh, mentor } of npcMeshes) {
          const npcHits = raycaster.intersectObjects(mesh.children, true);
          if (npcHits.length > 0) {
            const dx = droneGroup.position.x - mentor.pos[0];
            const dz = droneGroup.position.z - mentor.pos[1];
            const dist = Math.sqrt(dx * dx + dz * dz);
            const idx = NPC_LOCATIONS.findIndex(m => m.id === mentor.id);
            if (dist <= 4.0) {
              SoundFX.playBlip();
              onMentorSelectRef.current(mentor);
              return;
            } else {
              if (idx !== -1) navigateToMentorByIndex(idx);
              SoundFX.playClick();
              return;
            }
          }
        }

        // 2. Check if clicked directly on a District Monument
        for (const { mesh, district } of monumentMeshes) {
          const distHits = raycaster.intersectObjects(mesh.children, true);
          if (distHits.length > 0) {
            const dx = droneGroup.position.x - district.pos[0];
            const dz = droneGroup.position.z - district.pos[1];
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist <= 5.0) {
              SoundFX.playWarp();
              onDistrictSelectRef.current(district);
              return;
            } else {
              targetPos = new THREE.Vector3(district.pos[0], 0, district.pos[1] + 3);
              pendingInteractRef.current = { type: 'district', district };
              clickBeacon.position.set(district.pos[0], 0.05, district.pos[1]);
              (clickBeacon.material as THREE.MeshBasicMaterial).color.setHex(district.color);
              (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0.9;
              onCruiseTargetChangeRef.current?.(null);
              SoundFX.playClick();
              return;
            }
          }
        }

        // 3. Fallback: Raycast to ground floor
        const intersects = raycaster.intersectObject(floor);
        if (intersects.length > 0) {
          targetPos = intersects[0].point;
          pendingInteractRef.current = null;
          targetMentorIndex = -1;
          clickBeacon.position.x = targetPos.x;
          clickBeacon.position.z = targetPos.z;
          (clickBeacon.material as THREE.MeshBasicMaterial).color.setHex(0x06B6D4);
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0.9;
          onCruiseTargetChangeRef.current?.(null);
          SoundFX.playClick();
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (isRightDragging) {
        const dx = e.clientX - prevPointerX;
        const dy = e.clientY - prevPointerY;
        const yawMul = controlSettings.invertYaw ? 1 : -1;
        const pitchMul = controlSettings.invertPitch ? -1 : 1;
        orbitAngle += dx * 0.007 * yawMul;
        elevationAngle = Math.max(0.2, Math.min(1.3, elevationAngle + dy * 0.007 * pitchMul));
        prevPointerX = e.clientX;
        prevPointerY = e.clientY;
      } else {
        // Hover raycast for cursor state
        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(mouse, camera);

        let isOverInteractive = false;
        for (const { mesh } of npcMeshes) {
          if (raycaster.intersectObjects(mesh.children, true).length > 0) {
            isOverInteractive = true;
            break;
          }
        }
        if (!isOverInteractive) {
          for (const { mesh } of monumentMeshes) {
            if (raycaster.intersectObjects(mesh.children, true).length > 0) {
              isOverInteractive = true;
              break;
            }
          }
        }
        container.style.cursor = isOverInteractive ? 'pointer' : 'crosshair';
      }
    };

    const handlePointerUp = () => {
      isRightDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomDistance = Math.max(10, Math.min(32, zoomDistance + e.deltaY * 0.02));
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent context menu on right click
    };

    // Mobile Touch Orbit & Pinch-to-Zoom
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchOrbiting = false;
    let initialPinchDist = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isTouchOrbiting = true;
      } else if (e.touches.length === 2) {
        isTouchOrbiting = false;
        initialPinchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1 && isTouchOrbiting) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;
        const yawMul = controlSettings.invertYaw ? 1 : -1;
        const pitchMul = controlSettings.invertPitch ? -1 : 1;
        orbitAngle += dx * 0.007 * yawMul;
        elevationAngle = Math.max(0.2, Math.min(1.3, elevationAngle + dy * 0.007 * pitchMul));
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      } else if (e.touches.length === 2 && initialPinchDist > 0) {
        const currentDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const diff = currentDist - initialPinchDist;
        zoomDistance = Math.max(10, Math.min(32, zoomDistance - diff * 0.03));
        initialPinchDist = currentDist;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 0) {
        isTouchOrbiting = false;
        initialPinchDist = 0;
      }
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    // Mobile Touch Joystick Movement listener
    let mobileInput = { x: 0, z: 0, intensity: 0, active: false };
    const handleMobileMoveEvent = (e: Event) => {
      const custom = e as CustomEvent<{ x: number; z: number; intensity: number; active: boolean }>;
      if (custom.detail) {
        mobileInput = custom.detail;
      }
    };
    window.addEventListener('piso-mobile-move', handleMobileMoveEvent);

    // 13. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let droneHeading = 0;
    let miningTimer = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Determine movement speed
      const baseSpeed = controlSettings.flightSpeed === 'turbo' ? 22 : 14;
      const speed = keys.shift ? baseSpeed * 1.5 : baseSpeed;

      let moveX = 0;
      let moveZ = 0;

      if (keys.w) moveZ -= 1;
      if (keys.s) moveZ += 1;
      if (keys.a) moveX -= 1;
      if (keys.d) moveX += 1;

      // 0. Auto-Seek & Auto-Mine Nearest Block when E is held
      let isSeekingBlock = false;
      if (keys.eHold && activeMiningEngine) {
        const playerStats = PlayerStatsEngine.getStats();
        const targetBlock = activeMiningEngine.getNearestAvailableBlock(droneGroup.position, 250, playerStats.level);
        if (targetBlock) {
          isSeekingBlock = true;
          if (targetPos) {
            targetPos = null;
            pendingInteractRef.current = null;
            targetMentorIndex = -1;
            onCruiseTargetChangeRef.current?.(null);
          }

          const targetX = targetBlock.mesh.position.x;
          const targetZ = targetBlock.mesh.position.z;
          const dx = targetX - droneGroup.position.x;
          const dz = targetZ - droneGroup.position.z;
          const dist = Math.sqrt(dx * dx + dz * dz);

          // Position glowing beacon on target block
          clickBeacon.position.set(targetX, 0.05, targetZ);
          (clickBeacon.material as THREE.MeshBasicMaterial).color.setHex(targetBlock.def.color || 0x06B6D4);
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0.9;
          clickBeacon.scale.set(1 + Math.sin(time * 10) * 0.25, 1 + Math.sin(time * 10) * 0.25, 1);

          if (dist > 2.8) {
            // Run straight to the nearest block
            const step = Math.min(speed * delta, dist);
            droneGroup.position.x += (dx / dist) * step;
            droneGroup.position.z += (dz / dist) * step;
            droneHeading = Math.atan2(dx, -dz) + Math.PI;
          } else {
            // Reached mining proximity: mine block with hero axe!
            const miningResult = activeMiningEngine.mineNearestBlock(droneGroup.position, playerStats.level, 3.5);
            if (miningResult) {
              SoundFX.playLaser?.();
              PlayerStatsEngine.addMiningExp(miningResult.block.type, miningResult.exp);
              miningTimer = 0.5; // Trigger axe chopping animation
            }
          }
        }
      }

      if (!isSeekingBlock && !targetPos && !pendingInteractRef.current) {
        if ((clickBeacon.material as THREE.MeshBasicMaterial).opacity > 0) {
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
        }
      }

      // 1. Mobile Virtual Touch Joystick Movement (Camera-Relative)
      if (mobileInput.active && mobileInput.intensity > 0.05) {
        if (targetPos) {
          targetPos = null;
          pendingInteractRef.current = null;
          targetMentorIndex = -1;
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
          onCruiseTargetChangeRef.current?.(null);
        }

        // Convert joystick to camera-relative world direction
        const joyAngle = Math.atan2(mobileInput.x, -mobileInput.z);
        const worldAngle = joyAngle + orbitAngle;
        const moveMag = speed * mobileInput.intensity;

        const moveWorldX = Math.sin(worldAngle) * moveMag;
        const moveWorldZ = -Math.cos(worldAngle) * moveMag;

        droneGroup.position.x += moveWorldX * delta;
        droneGroup.position.z += moveWorldZ * delta;
        // Face the actual world direction of travel (+ PI to fix inverted mesh facing)
        droneHeading = worldAngle + Math.PI;

      } else if (moveX !== 0 || moveZ !== 0) {
        if (targetPos) {
          targetPos = null;
          pendingInteractRef.current = null;
          targetMentorIndex = -1;
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
          onCruiseTargetChangeRef.current?.(null);
        }
        const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
        if (controlSettings.controlScheme !== 'world_axis') {
          // Camera-Relative: W moves in the direction the camera is facing
          const keyAngle = Math.atan2(moveX, -moveZ);
          const worldAngle = keyAngle + orbitAngle;
          const moveWorldX = Math.sin(worldAngle) * speed;
          const moveWorldZ = -Math.cos(worldAngle) * speed;
          droneGroup.position.x += moveWorldX * delta;
          droneGroup.position.z += moveWorldZ * delta;
          // Face the actual world direction of travel (+ PI to fix inverted mesh facing)
          droneHeading = worldAngle + Math.PI;
        } else {
          // World-Axis: translate the raw input into a world movement vector,
          // then derive heading from where we actually moved, not the raw keys.
          const nx = moveX / mag;
          const nz = moveZ / mag;
          droneGroup.position.x += nx * speed * delta;
          droneGroup.position.z += nz * speed * delta;
          // Calculate heading from actual movement vector (+ PI for mesh alignment)
          droneHeading = Math.atan2(nx, -nz) + Math.PI;
        }
      } else if (targetPos) {
        const dx = targetPos.x - droneGroup.position.x;
        const dz = targetPos.z - droneGroup.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist > 0.4) {
          droneGroup.position.x += (dx / dist) * speed * delta;
          droneGroup.position.z += (dz / dist) * speed * delta;
          droneHeading = Math.atan2(dx, -dz);
          // Animate click beacon pulse
          clickBeacon.scale.set(1 + Math.sin(time * 8) * 0.2, 1 + Math.sin(time * 8) * 0.2, 1);

          // Real-time cruise feedback for HUD
          if (pendingInteractRef.current?.type === 'mentor') {
            const m = pendingInteractRef.current.mentor;
            onCruiseTargetChangeRef.current?.({
              id: m.id,
              name: m.name,
              avatar: m.avatar,
              title: m.title,
              color: '#' + m.color.toString(16).padStart(6, '0'),
              distance: dist,
            });
          }
        } else {
          targetPos = null;
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
          onCruiseTargetChangeRef.current?.(null);

          // Trigger pending interaction upon arrival!
          if (pendingInteractRef.current) {
            if (pendingInteractRef.current.type === 'mentor') {
              SoundFX.playBlip();
              onMentorSelectRef.current(pendingInteractRef.current.mentor);
            } else if (pendingInteractRef.current.type === 'district') {
              SoundFX.playWarp();
              onDistrictSelectRef.current(pendingInteractRef.current.district);
            }
            pendingInteractRef.current = null;
          }
        }
      }

      // Constrain within expanded procedural world bounds (380m terrain)
      droneGroup.position.x = Math.max(-170, Math.min(170, droneGroup.position.x));
      droneGroup.position.z = Math.max(-170, Math.min(170, droneGroup.position.z));

      // Update Jump & Double Jump Physics
      if (jumpCount > 0 || jumpOffsetY > 0) {
        jumpOffsetY += jumpVelocityY * delta;
        jumpVelocityY -= GRAVITY * delta;

        if (jumpOffsetY <= 0) {
          jumpOffsetY = 0;
          jumpVelocityY = 0;
          jumpCount = 0; // Touchdown reset!
        }
      }

      // Animate Jump FX Rings
      [singleJumpEffect, doubleJumpEffect].forEach((fx) => {
        if (fx.active) {
          fx.scale += delta * 12;
          fx.opacity -= delta * 2.4;
          if (fx.opacity <= 0) {
            fx.active = false;
            fx.opacity = 0;
          }
          fx.mesh.scale.set(fx.scale, fx.scale, 1);
          fx.material.opacity = Math.max(0, fx.opacity);
        }
      });

      // Update 3D Speech Bubble Fade
      if (speechBubbleTimer > 0) {
        speechBubbleTimer -= delta;
        if (speechBubbleTimer < 1.0) {
          speechMat.opacity = Math.max(0, speechBubbleTimer);
        } else {
          speechMat.opacity = 1;
        }
      } else {
        speechMat.opacity = 0;
      }

      // Update Terranian Procedural World Animations (Waves, Eagles, Carabaos, Fish)
      activeTerranianEngine.update(delta, time);
      const terrainH = activeTerranianEngine.sampleTerrainHeight(droneGroup.position.x, droneGroup.position.z);

      // Update Mining & Building blocks
      activeMiningEngine.update(delta);

      if (activeMiningEngine.builderMode) {
        const buildDist = 3.5;
        const bx = droneGroup.position.x + Math.sin(droneHeading) * buildDist;
        const bz = droneGroup.position.z - Math.cos(droneHeading) * buildDist;
        const buildPos = new THREE.Vector3(bx, terrainH, bz);
        // Only allow placement if not colliding with self (distance > 2)
        const canPlace = Math.sqrt((bx - droneGroup.position.x)**2 + (bz - droneGroup.position.z)**2) > 2.0;
        activeMiningEngine.updateGhostBlock(buildPos, canPlace);
      } else {
        activeMiningEngine.updateGhostBlock(droneGroup.position, false);
      }

      // Humanoid Walking Rig vs Drone Hover Mechanics with Continuous Terrain Elevation
      const isMoving = (moveX !== 0 || moveZ !== 0) || targetPos !== null || isSeekingBlock;
      const isJumping = jumpCount > 0 || jumpOffsetY > 0.04;

      if (miningTimer > 0) {
        miningTimer -= delta;
      }
      const isMining = miningTimer > 0;

      if (avatarMode === 'human' && characterInstance) {
        if (isMoving && !isJumping) {
          humanWalkPhase += delta * (keys.shift ? 14 : 9);
        }
        characterInstance.updateAnimation(
          humanWalkPhase,
          isMoving,
          delta,
          time,
          isJumping,
          jumpCount === 2,
          jumpVelocityY,
          isMining
        );
        const groundY = (isMoving && !isJumping ? 0.05 + Math.abs(Math.sin(humanWalkPhase)) * 0.03 : 0.05) + terrainH;
        droneGroup.position.y = groundY + jumpOffsetY;
      } else {
        // Drone Hover Bob + Jump Offset on terrain
        const hoverY = 1.4 + Math.sin(time * 3.5) * 0.12 + terrainH;
        droneGroup.position.y = hoverY + jumpOffsetY;
      }

      // Companion Pet Recon Drone spring follow physics
      if (petDroneInstance) {
        petDroneInstance.updateFollow(droneGroup.position, droneHeading, time, delta);
      }

      droneGroup.rotation.y = THREE.MathUtils.lerp(droneGroup.rotation.y, droneHeading, 0.15);
      if (droneRing) droneRing.rotation.z = time * 2.5;

      // Update exported playerPosRef for Minimap
      playerPosRef.current = {
        x: droneGroup.position.x,
        z: droneGroup.position.z,
        heading: droneGroup.rotation.y,
      };

      // 13b. Animate Active Anime Super Power Attack
      if (currentAttack) {
        currentAttack.timer += delta;
        const attackTimer = currentAttack.timer;

        if (currentAttack.type === 'kamehameha') {
          if (attackTimer < 0.6) {
            // Charging Ki orb at hands
            kiChargeSphere.visible = true;
            kiChargeMat.color.setHex(0x38BDF8);
            const handPos = droneGroup.position.clone().add(
              new THREE.Vector3(Math.sin(currentAttack.heading) * 1.1, 1.2, -Math.cos(currentAttack.heading) * 1.1)
            );
            kiChargeSphere.position.copy(handPos);
            kiChargeSphere.scale.setScalar(0.8 + Math.sin(time * 35) * 0.4);
          } else if (attackTimer < 1.6) {
            // Firing Laser Beam
            kiChargeSphere.visible = false;
            laserBeamGroup.visible = true;
            beamCoreMat.color.setHex(0x38BDF8);
            beamSheathMat.color.setHex(0xF59E0B);
            laserBeamGroup.position.copy(droneGroup.position).add(new THREE.Vector3(0, 1.2, 0));
            laserBeamGroup.rotation.y = currentAttack.heading;

            spiralRings.forEach((sp, idx) => {
              sp.rotation.z = time * 24 + idx * 0.4;
              sp.scale.setScalar(0.9 + Math.sin(time * 18 + idx) * 0.2);
            });

            // Impact trigger at 0.9s
            if (attackTimer >= 0.9 && !explosionGroup.visible) {
              explosionGroup.visible = true;
              explosionGroup.position.copy(currentAttack.impactPoint);
              fireballMat.color.setHex(0xEF4444);
              groundShockMat.color.setHex(0xF59E0B);
              fireball.scale.setScalar(1);
              groundShock.scale.setScalar(1);
              SoundFX.playAnimeExplosion();
              screenShakeIntensity = 2.4; // MASSIVE IMPACT SCREEN SHAKE
              spawnDamagePopup('💥 3,500 SUPERNOVA PLASMA!', '#06B6D4', currentAttack.impactPoint, 1.25);
              applyMonsterCombatHit(currentAttack.impactPoint, 14, 3500, 'Kamehame-PISO');
            }

            if (explosionGroup.visible) {
              fireball.scale.addScalar(delta * 14);
              fireballMat.opacity = Math.max(0, 1.6 - (attackTimer - 0.9) * 2);
              groundShock.scale.addScalar(delta * 22);
              groundShockMat.opacity = Math.max(0, 1.6 - (attackTimer - 0.9) * 2);

              const posAttr = sparkGeo.attributes.position as THREE.BufferAttribute;
              for (let i = 0; i < sparkCount; i++) {
                posAttr.setXYZ(
                  i,
                  posAttr.getX(i) + sparkVels[i].x * delta,
                  posAttr.getY(i) + sparkVels[i].y * delta,
                  posAttr.getZ(i) + sparkVels[i].z * delta
                );
              }
              posAttr.needsUpdate = true;
            }
          } else {
            laserBeamGroup.visible = false;
            explosionGroup.visible = false;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'chidori') {
          if (attackTimer < 0.25) {
            kiChargeSphere.visible = true;
            kiChargeMat.color.setHex(0xA855F7);
            const handPos = droneGroup.position.clone().add(
              new THREE.Vector3(Math.sin(currentAttack.heading) * 1.1, 1.2, -Math.cos(currentAttack.heading) * 1.1)
            );
            kiChargeSphere.position.copy(handPos);
            kiChargeSphere.scale.setScalar(0.7 + Math.random() * 0.5);
          } else if (attackTimer < 1.2) {
            kiChargeSphere.visible = false;
            laserBeamGroup.visible = true;
            beamCoreMat.color.setHex(0xC084FC);
            beamSheathMat.color.setHex(0x06B6D4);
            laserBeamGroup.position.copy(droneGroup.position).add(new THREE.Vector3(0, 1.2, 0));
            laserBeamGroup.rotation.y = currentAttack.heading;

            if (attackTimer >= 0.4 && !explosionGroup.visible) {
              explosionGroup.visible = true;
              explosionGroup.position.copy(currentAttack.impactPoint);
              fireballMat.color.setHex(0xA855F7);
              groundShockMat.color.setHex(0x06B6D4);
              fireball.scale.setScalar(1);
              groundShock.scale.setScalar(1);
              SoundFX.playAnimeExplosion();
              screenShakeIntensity = 1.6; // Electric tremor
              spawnDamagePopup('⚡ 1,200 PIERCING SHOCK!', '#A855F7', currentAttack.impactPoint, 1.1);
              applyMonsterCombatHit(currentAttack.impactPoint, 9, 1200, 'Chidori ng Meralco');
            }

            if (explosionGroup.visible) {
              fireball.scale.addScalar(delta * 12);
              fireballMat.opacity = Math.max(0, 1.5 - (attackTimer - 0.4) * 2);
              groundShock.scale.addScalar(delta * 18);
              groundShockMat.opacity = Math.max(0, 1.5 - (attackTimer - 0.4) * 2);
            }
          } else {
            laserBeamGroup.visible = false;
            explosionGroup.visible = false;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'tsinelas') {
          if (attackTimer < 0.7) {
            flyingTsinelasGroup.visible = true;
            const progress = attackTimer / 0.7;
            flyingTsinelasGroup.position.lerpVectors(currentAttack.origin, currentAttack.impactPoint, progress);
            flyingTsinelasGroup.position.y = 1.4 + Math.sin(progress * Math.PI) * 2.5; // Arc trajectory
            flyingTsinelasGroup.rotation.x += delta * 45;
            flyingTsinelasGroup.rotation.y += delta * 35;
          } else if (attackTimer < 1.5) {
            flyingTsinelasGroup.visible = false;
            if (bamMat.opacity === 0) {
              bamSprite.position.copy(currentAttack.impactPoint).add(new THREE.Vector3(0, 1.8, 0));
              bamMat.opacity = 1;
              SoundFX.playTsinelasSlap();
              screenShakeIntensity = 1.8;
              spawnDamagePopup('🩴 650 DISCIPLINE SLAP!', '#0284C7', currentAttack.impactPoint, 1.05);
              applyMonsterCombatHit(currentAttack.impactPoint, 7, 650, 'Tsinelas ni Nanay');
            }
            bamSprite.scale.addScalar(delta * 3);
            bamMat.opacity = Math.max(0, 1 - (attackTimer - 0.7) * 1.5);
          } else {
            bamMat.opacity = 0;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'gear5') {
          if (attackTimer < 0.25) {
            droneGroup.scale.set(1.4, 0.5, 1.4);
          } else if (attackTimer < 0.6) {
            droneGroup.scale.set(0.8, 1.3, 0.8);
            droneGroup.position.y += delta * 22;
          } else if (attackTimer < 0.75) {
            droneGroup.scale.set(1.5, 0.6, 1.5);
            if (!explosionGroup.visible) {
              explosionGroup.visible = true;
              explosionGroup.position.copy(droneGroup.position);
              groundShockMat.color.setHex(0xFDE047);
              groundShock.scale.setScalar(1);
              SoundFX.playAnimeExplosion();
              screenShakeIntensity = 2.4; // Ground tremor
              spawnDamagePopup('🌟 9,999 MAXIMUM OVERKILL!', '#FACC15', droneGroup.position, 1.35);
              applyMonsterCombatHit(droneGroup.position, 22, 9999, 'Gear 5 Loko-Loko');
            }
            groundShock.scale.addScalar(delta * 24);
            groundShockMat.opacity = Math.max(0, 1 - (attackTimer - 0.6) * 3);
          } else {
            droneGroup.scale.set(1, 1, 1);
            explosionGroup.visible = false;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'rasengan') {
          if (attackTimer < 0.55) {
            rasenganGroup.visible = true;
            const progress = attackTimer / 0.55;
            rasenganGroup.position.lerpVectors(currentAttack.origin, currentAttack.impactPoint, progress);
            rasenganGroup.position.y = 1.3 + Math.sin(progress * Math.PI) * 0.4;
            rCore.rotation.y += delta * 30;
            rRing1.rotation.z += delta * 25;
            rRing2.rotation.x += delta * 25;
          } else if (attackTimer < 1.4) {
            rasenganGroup.visible = false;
            if (!explosionGroup.visible) {
              explosionGroup.visible = true;
              explosionGroup.position.copy(currentAttack.impactPoint);
              fireballMat.color.setHex(0x38BDF8);
              groundShockMat.color.setHex(0x06B6D4);
              fireball.scale.setScalar(1);
              groundShock.scale.setScalar(1);
              SoundFX.playAnimeExplosion();
              screenShakeIntensity = 1.8;
              spawnDamagePopup('🌀 2,200 SPIRAL VORTEX!', '#38BDF8', currentAttack.impactPoint, 1.15);
              applyMonsterCombatHit(currentAttack.impactPoint, 10, 2200, 'Rasengan ng Baguio');
            }
            fireball.scale.addScalar(delta * 12);
            fireballMat.opacity = Math.max(0, 1.5 - (attackTimer - 0.55) * 2);
            groundShock.scale.addScalar(delta * 18);
            groundShockMat.opacity = Math.max(0, 1.5 - (attackTimer - 0.55) * 2);
          } else {
            explosionGroup.visible = false;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'gatling') {
          if (attackTimer < 0.75) {
            screenShakeIntensity = 0.8;
            droneGroup.position.x += (Math.random() - 0.5) * 0.12;
            droneGroup.position.z += (Math.random() - 0.5) * 0.12;
            if (!currentAttack.damageApplied && attackTimer > 0.35) {
              currentAttack.damageApplied = true;
              spawnDamagePopup('🥊 1,800 RAPID COMBO!', '#F97316', currentAttack.impactPoint, 1.1);
              applyMonsterCombatHit(currentAttack.impactPoint, 8, 1800, 'Sapapok Gatling');
            }
          } else {
            currentAttack = null;
          }
        } else if (currentAttack.type === 'lightning_storm') {
          if (attackTimer < 1.2) {
            stormGroup.visible = true;
            const impact = currentAttack.impactPoint;
            stormBolts.forEach((bolt, idx) => {
              const angle = (idx / 5) * Math.PI * 2 + attackTimer * 3;
              const radius = 3.5 + Math.sin(attackTimer * 8 + idx) * 0.8;
              bolt.position.set(
                impact.x + Math.cos(angle) * radius,
                Math.max(0, 14 - attackTimer * 16),
                impact.z + Math.sin(angle) * radius
              );
              bolt.rotation.z = (Math.random() - 0.5) * 0.2;
            });
            if (!currentAttack.damageApplied && attackTimer > 0.3) {
              currentAttack.damageApplied = true;
              screenShakeIntensity = 2.2;
              spawnDamagePopup('⛈️ 5,000 DIVINE WRATH!', '#EAB308', currentAttack.impactPoint, 1.3);
              applyMonsterCombatHit(currentAttack.impactPoint, 18, 5000, "Bathala's Lightning Storm");
            }
          } else {
            stormGroup.visible = false;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'cyclone_spin') {
          if (attackTimer < 0.85) {
            droneGroup.rotation.y += delta * 30;
            cycloneMesh.position.copy(droneGroup.position).add(new THREE.Vector3(0, 1.6, 0));
            cycloneMesh.rotation.y -= delta * 35;
            cycloneMat.opacity = Math.sin((attackTimer / 0.85) * Math.PI) * 0.85;
            screenShakeIntensity = 1.4;
            if (!currentAttack.damageApplied && attackTimer > 0.3) {
              currentAttack.damageApplied = true;
              spawnDamagePopup('🌪️ 1,400 SWEEP DAMAGE!', '#10B981', droneGroup.position, 1.1);
              applyMonsterCombatHit(droneGroup.position, 12, 1400, 'Walis Cyclone Spin');
            }
          } else {
            cycloneMat.opacity = 0;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'hydro_wave') {
          if (attackTimer < 0.95) {
            const prog = attackTimer / 0.95;
            hydroWaveMesh.position.lerpVectors(currentAttack.origin, currentAttack.impactPoint, prog);
            hydroWaveMesh.position.y = 0.2;
            hydroWaveMesh.rotation.z = currentAttack.heading;
            hydroWaveMesh.scale.setScalar(1 + prog * 2.2);
            hydroMat.opacity = Math.sin(prog * Math.PI) * 0.85;
            if (!currentAttack.damageApplied && attackTimer > 0.45) {
              currentAttack.damageApplied = true;
              screenShakeIntensity = 1.3;
              spawnDamagePopup('🌊 800 PURIFIED DELUGE!', '#06B6D4', currentAttack.impactPoint, 1.05);
              applyMonsterCombatHit(currentAttack.impactPoint, 14, 800, 'Tabo Hydro Surge');
            }
          } else {
            hydroMat.opacity = 0;
            currentAttack = null;
          }
        } else if (currentAttack.type === 'pun') {
          if (attackTimer > 1.0) {
            currentAttack = null;
          }
        }
      }

      // Update 3D Floating Combat Damage Popups
      for (let i = floatingDamageItems.length - 1; i >= 0; i--) {
        const item = floatingDamageItems[i];
        item.timer += delta;
        item.sprite.position.y += item.velY * delta;
        const prog = item.timer / item.maxTime;
        item.sprite.material.opacity = Math.max(0, 1 - prog);
        if (item.timer >= item.maxTime) {
          scene.remove(item.sprite);
          item.sprite.material.dispose();
          floatingDamageItems.splice(i, 1);
        }
      }

      // Smart Nearest-Target Auto-Lock Nearest Monster Search & Reticle Animation
      const nearestTarget = monsterSpawnEngine.getNearestAliveMonster(
        { x: droneGroup.position.x, z: droneGroup.position.z },
        42
      );

      if (nearestTarget && controlSettings.autoTargetLock !== false) {
        reticleGroup.visible = true;
        const tPos = nearestTarget.monster.mesh.position;
        const targetElevation = nearestTarget.monster.isBoss ? 11.2 : 3.4;
        reticleGroup.position.set(tPos.x, tPos.y + targetElevation, tPos.z);
        reticleRing.rotation.z = time * 3.5;
        const pulse = 1 + Math.sin(time * 12) * 0.14;
        reticleRing.scale.set(pulse, pulse, 1);

        // Update range canvas HUD
        reticleCtx.clearRect(0, 0, 256, 64);
        reticleCtx.fillStyle = 'rgba(239, 68, 68, 0.88)';
        reticleCtx.beginPath();
        reticleCtx.roundRect(6, 6, 244, 52, 14);
        reticleCtx.fill();
        reticleCtx.lineWidth = 2;
        reticleCtx.strokeStyle = '#FFFFFF';
        reticleCtx.stroke();
        reticleCtx.fillStyle = '#FFFFFF';
        reticleCtx.font = 'bold 20px monospace';
        reticleCtx.textAlign = 'center';
        reticleCtx.fillText(`🎯 LOCK: ${nearestTarget.distance}m`, 128, 38);
        reticleTexture.needsUpdate = true;
      } else {
        reticleGroup.visible = false;
      }

      // Animate Auto Idle Attack Ring & Idle Sweep
      if (isAutoAttackMode) {
        autoAttackRing.position.copy(droneGroup.position);
        autoAttackRing.position.y = 0.08;
        autoAttackRing.rotation.z += delta * 2.5;

        // In idle (standing still): if nearest target exists, face it; otherwise sweep 360 degrees.
        // Only update droneHeading — rotation.y is driven exclusively by the lerp below.
        const isStationary = !keys.w && !keys.s && !keys.a && !keys.d && !targetPos;
        if (isStationary) {
          if (nearestTarget && controlSettings.autoTargetLock !== false) {
            const dx = nearestTarget.monster.mesh.position.x - droneGroup.position.x;
            const dz = nearestTarget.monster.mesh.position.z - droneGroup.position.z;
            droneHeading = Math.atan2(dx, -dz);
          } else {
            droneHeading += delta * 0.45;
          }
        }

        // Periodic auto attack pulse every 1.4s targeting nearest monster
        autoAttackTimer += delta;
        if (autoAttackTimer >= 1.4) {
          autoAttackTimer = 0;
          if (nearestTarget && controlSettings.autoTargetLock !== false) {
            applyMonsterCombatHit(nearestTarget.monster.mesh.position, 14, 550, 'Auto Idle Attack');
          } else {
            applyMonsterCombatHit(droneGroup.position, 12, 550, 'Auto Idle Attack');
          }
        }
      }

      // Update 3D Monster Engine (Giga Buwaya Titans + Small Monster Farms)
      monsterSpawnEngine.update(delta, { x: droneGroup.position.x, z: droneGroup.position.z });

      // 14. Camera Handling (Isometric Chase vs Follow vs Top-Down)
      let camX: number;
      let camY: number;
      let camZ: number;

      if (controlSettings.cameraMode === 'topdown') {
        camX = droneGroup.position.x;
        camY = droneGroup.position.y + zoomDistance * 1.3;
        camZ = droneGroup.position.z + 0.1;
      } else if (controlSettings.cameraMode === 'follow') {
        camX = droneGroup.position.x - Math.sin(droneGroup.rotation.y + orbitAngle) * zoomDistance;
        camZ = droneGroup.position.z + Math.cos(droneGroup.rotation.y + orbitAngle) * zoomDistance;
        camY = droneGroup.position.y + zoomDistance * 0.55;
      } else {
        // 'isometric' (Default, stable 45° angle decoupled from drone turning)
        camX = droneGroup.position.x - Math.sin(orbitAngle) * zoomDistance * Math.cos(elevationAngle);
        camZ = droneGroup.position.z + Math.cos(orbitAngle) * zoomDistance * Math.cos(elevationAngle);
        camY = droneGroup.position.y + zoomDistance * Math.sin(elevationAngle);
      }

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, camX, 0.09);
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, camY, 0.09);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, camZ, 0.09);
      camera.lookAt(droneGroup.position.x, droneGroup.position.y + 0.8, droneGroup.position.z);

      // Screen Shake Physics (Anime Impact Vibration)
      if (screenShakeIntensity > 0.005) {
        camera.position.x += (Math.random() - 0.5) * screenShakeIntensity;
        camera.position.y += (Math.random() - 0.5) * screenShakeIntensity;
        camera.position.z += (Math.random() - 0.5) * screenShakeIntensity * 0.4;
        screenShakeIntensity *= Math.pow(0.04, delta);
      } else {
        screenShakeIntensity = 0;
      }

      // Rotate Monument Crystal Cores
      monumentMeshes.forEach(({ mesh }) => {
        const core = mesh.children[2];
        if (core) {
          core.rotation.y = time * 0.8;
          core.position.y = 3.5 + Math.sin(time * 2) * 0.25;
        }
      });

      // Rotate NPC Holographic Cores
      npcMeshes.forEach(({ mesh }) => {
        const core = mesh.children[2];
        if (core) {
          core.rotation.y = time * 1.2;
          core.position.y = 2.0 + Math.sin(time * 2.5) * 0.15;
        }
      });

      // Expand Block Pulse Shockwave
      waveScale += delta * 12;
      if (waveScale > 40) waveScale = 0.5;
      blockWave.scale.set(waveScale, waveScale, 1);
      (blockWave.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - waveScale / 40);

      // 15. Proximity Detection (Mentors & Districts) - Suppressed while traveling via targetPos
      let foundNearbyMentor: NPCLocationInfo | null = null;
      if (!targetPos) {
        for (const { mentor } of npcMeshes) {
          const dx = droneGroup.position.x - mentor.pos[0];
          const dz = droneGroup.position.z - mentor.pos[1];
          if (Math.sqrt(dx * dx + dz * dz) <= 4.0) {
            foundNearbyMentor = mentor;
            break;
          }
        }
      }

      if (foundNearbyMentor?.id !== activeNearbyMentorRef.current?.id) {
        activeNearbyMentorRef.current = foundNearbyMentor;
        onMentorProximityRef.current(foundNearbyMentor);
        if (foundNearbyMentor) SoundFX.playBlip();
      }

      let foundNearbyDistrict: DistrictInfo | null = null;
      if (!foundNearbyMentor && !targetPos) {
        for (const { district } of monumentMeshes) {
          const dx = droneGroup.position.x - district.pos[0];
          const dz = droneGroup.position.z - district.pos[1];
          if (Math.sqrt(dx * dx + dz * dz) <= 5.0) {
            foundNearbyDistrict = district;
            break;
          }
        }
      }

      if (foundNearbyDistrict?.id !== activeNearbyDistrictRef.current?.id) {
        activeNearbyDistrictRef.current = foundNearbyDistrict;
        onProximityChangeRef.current(foundNearbyDistrict);
        if (foundNearbyDistrict) SoundFX.playWarp();
      }

      // 16. PPF Contact Solver Dynamic Cloth Physics Step (Banner & Cape)
      const windTurbulence = new THREE.Vector3(
        Math.sin(time * 2.2) * 1.5 + 2.2,
        Math.cos(time * 1.6) * 0.35,
        Math.sin(time * 2.8) * 1.2 + 1.0
      );
      ppfBanner.step(delta, 3, [], windTurbulence);

      const isTraveling = (keys.w || keys.s || keys.a || keys.d || (mobileInput.active && mobileInput.intensity > 0.05) || !!targetPos);
      const capeWind = new THREE.Vector3(
        -Math.sin(droneHeading) * speed * (isTraveling ? 1.3 : 0.15) + windTurbulence.x * 0.25,
        -0.2,
        Math.cos(droneHeading) * speed * (isTraveling ? 1.3 : 0.15) + windTurbulence.z * 0.25
      );
      ppfCape.step(delta, 3, [avatarBodyCollider], capeWind);

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('piso-world-regenerate', handleWorldRegenerate);
      scene.remove(activeTerranianEngine.worldGroup);
      activeTerranianEngine.dispose();

      activeMiningEngine.dispose();
      activeTerranianEngine.dispose();
      window.removeEventListener('piso-ppf-update-physics', handlePpfUpdateEvent);
      scene.remove(ppfBanner.mesh);
      scene.remove(poleL);
      scene.remove(poleR);
      scene.remove(crossBar);
      droneGroup.remove(ppfCape.mesh);
      ppfBanner.dispose();
      ppfCape.dispose();
      poleGeo.dispose();
      crossBarGeo.dispose();
      poleMat.dispose();
      monsterSpawnEngine.dispose();
      scene.remove(reticleGroup);
      reticleTexture.dispose();
      reticleMat.dispose();
      reticleRingGeo.dispose();
      window.removeEventListener('piso-avatar-chat', handleAvatarChatEvent);
      window.removeEventListener('piso-trigger-superpower', handleSuperPowerEvent);
      window.removeEventListener('piso-trigger-screen-shake', handleScreenShakeEvent);
      window.removeEventListener('piso-toggle-auto-attack', handleAutoAttackEvent);
      scene.remove(autoAttackRing);
      droneGroup.remove(speechBubbleSprite);
      scene.remove(laserBeamGroup);
      scene.remove(kiChargeSphere);
      scene.remove(explosionGroup);
      scene.remove(flyingTsinelasGroup);
      scene.remove(bamSprite);
      speechTexture.dispose();
      speechMat.dispose();
      window.removeEventListener('piso-player-jump', handlePlayerJumpEvent);
      window.removeEventListener('piso-navigate-to-mentor', handleNavigateToMentorEvent);
      window.removeEventListener('piso-cycle-next-mentor', handleCycleNextMentorEvent);
      window.removeEventListener('piso-cancel-autopilot', handleCancelAutopilot);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('piso-avatar-updated', handleAvatarUpdatedEvent);
      window.removeEventListener('resize', handleResize);
      scene.remove(singleJumpEffect.mesh);
      scene.remove(doubleJumpEffect.mesh);
      jumpRingGeo.dispose();
      singleJumpEffect.material.dispose();
      doubleJumpEffect.material.dispose();
      window.removeEventListener('piso-mobile-move', handleMobileMoveEvent);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('contextmenu', handleContextMenu);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      if (petDroneInstance) {
        scene.remove(petDroneInstance.group);
      }
      renderer.dispose();
    };
  }, [avatarSkin, avatarMode, humanAvatar, playerPosRef]);

  return <div ref={containerRef} className="w-full h-full cursor-crosshair select-none" style={{ touchAction: 'none' }} />;
};
