import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAcademy, AvatarSkinId, safeHexColor } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  createHumanoidCharacter,
  createPetDroneCompanion,
  CharacterMeshInstance,
  PetDroneInstance,
} from './CharacterMeshBuilder';

export interface DistrictInfo {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  pos: [number, number]; // [x, z]
  color: number;
  toolView: 'courses' | 'lab' | 'deploy' | 'verify' | 'profile' | 'projects' | 'faucet' | 'worldmap';
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
}

export const Cyber3DWorld: React.FC<Cyber3DWorldProps> = ({
  onProximityChange,
  onDistrictSelect,
  onMentorProximity,
  onMentorSelect,
  onCruiseTargetChange,
  playerPosRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeNearbyDistrictRef = useRef<DistrictInfo | null>(null);
  const activeNearbyMentorRef = useRef<NPCLocationInfo | null>(null);

  const onDistrictSelectRef = useRef(onDistrictSelect);
  const onMentorSelectRef = useRef(onMentorSelect);
  const onMentorProximityRef = useRef(onMentorProximity);
  const onProximityChangeRef = useRef(onProximityChange);
  const onCruiseTargetChangeRef = useRef(onCruiseTargetChange);

  useEffect(() => {
    onDistrictSelectRef.current = onDistrictSelect;
    onMentorSelectRef.current = onMentorSelect;
    onMentorProximityRef.current = onMentorProximity;
    onProximityChangeRef.current = onProximityChange;
    onCruiseTargetChangeRef.current = onCruiseTargetChange;
  });

  const { avatarSkin, avatarMode, humanAvatar, controlSettings } = useAcademy();

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

    // 4. Procedural Cyber Skyline (Buildings)
    const buildingGroup = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    const cityRadii = [45, 60, 75];

    cityRadii.forEach((r) => {
      const count = Math.floor(r * 0.7);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = Math.cos(angle) * (r + (Math.random() * 8 - 4));
        const z = Math.sin(angle) * (r + (Math.random() * 8 - 4));
        const height = Math.random() * 26 + 8;
        const width = Math.random() * 4.5 + 3;

        const isGold = Math.random() > 0.6;
        const bMat = new THREE.MeshBasicMaterial({
          color: isGold ? 0x161F30 : 0x0F172A,
          wireframe: Math.random() > 0.45,
        });

        const building = new THREE.Mesh(boxGeo, bMat);
        building.scale.set(width, height, width);
        building.position.set(x, height / 2, z);
        buildingGroup.add(building);

        if (Math.random() > 0.5) {
          const beaconGeo = new THREE.SphereGeometry(0.5, 8, 8);
          const beaconMat = new THREE.MeshBasicMaterial({
            color: isGold ? 0xF59E0B : 0x3B82F6,
          });
          const beacon = new THREE.Mesh(beaconGeo, beaconMat);
          beacon.position.set(x, height + 0.8, z);
          buildingGroup.add(beacon);
        }
      }
    });
    scene.add(buildingGroup);

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

    // 12. Input Handling & Fast Navigation Destinations
    const keys = { w: false, s: false, a: false, d: false, shift: false };

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
      if (k === 'w' || k === 'arrowup') keys.w = true;
      if (k === 's' || k === 'arrowdown') keys.s = true;
      if (k === 'a' || k === 'arrowleft') keys.a = true;
      if (k === 'd' || k === 'arrowright') keys.d = true;
      if (e.shiftKey) keys.shift = true;

      // N Key: GUARANTEED rotation to the next NPC Mentor!
      if (k === 'n') {
        cycleNextMentor();
        return;
      }

      // E Key interacts with nearby Mentor/District within 4.0 units, OR cycles/moves to the NEXT option!
      if (k === 'e') {
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
      if (k === 'w' || k === 'arrowup') keys.w = false;
      if (k === 's' || k === 'arrowdown') keys.s = false;
      if (k === 'a' || k === 'arrowleft') keys.a = false;
      if (k === 'd' || k === 'arrowright') keys.d = false;
      if (!e.shiftKey) keys.shift = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

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
        orbitAngle -= dx * 0.007;
        elevationAngle = Math.max(0.2, Math.min(1.3, elevationAngle + dy * 0.007));
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

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('contextmenu', handleContextMenu);

    // 13. Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let droneHeading = 0;

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

      if (moveX !== 0 || moveZ !== 0) {
        if (targetPos) {
          targetPos = null;
          pendingInteractRef.current = null;
          targetMentorIndex = -1;
          (clickBeacon.material as THREE.MeshBasicMaterial).opacity = 0;
          onCruiseTargetChangeRef.current?.(null);
        }
        const mag = Math.sqrt(moveX * moveX + moveZ * moveZ);
        droneGroup.position.x += (moveX / mag) * speed * delta;
        droneGroup.position.z += (moveZ / mag) * speed * delta;
        droneHeading = Math.atan2(moveX, -moveZ);
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

      // Constrain within bounds
      droneGroup.position.x = Math.max(-70, Math.min(70, droneGroup.position.x));
      droneGroup.position.z = Math.max(-70, Math.min(70, droneGroup.position.z));

      // Humanoid Walking Rig vs Drone Hover Mechanics
      const isMoving = (moveX !== 0 || moveZ !== 0) || targetPos !== null;

      if (avatarMode === 'human' && characterInstance) {
        if (isMoving) {
          humanWalkPhase += delta * (keys.shift ? 14 : 9);
        }
        characterInstance.updateAnimation(humanWalkPhase, isMoving, delta, time);
        droneGroup.position.y = isMoving ? 0.05 + Math.abs(Math.sin(humanWalkPhase)) * 0.03 : 0.05;
      } else {
        // Drone Hover Bob
        droneGroup.position.y = 1.4 + Math.sin(time * 3.5) * 0.12;
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
      window.removeEventListener('piso-navigate-to-mentor', handleNavigateToMentorEvent);
      window.removeEventListener('piso-cycle-next-mentor', handleCycleNextMentorEvent);
      window.removeEventListener('piso-cancel-autopilot', handleCancelAutopilot);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
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
  }, [avatarSkin, avatarMode, humanAvatar, controlSettings, playerPosRef]);

  return <div ref={containerRef} className="w-full h-full cursor-crosshair select-none" />;
};
