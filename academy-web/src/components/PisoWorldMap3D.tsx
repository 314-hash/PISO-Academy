import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { useAcademy } from '../context/AcademyContext';
import { SoundFX } from '../services/soundFX';
import { PISO_ECOSYSTEM_NODES, PisoEcosystemNode } from '../data/pisoEcosystemNodes';
import { MultiplayerNetworkEngine } from '../services/multiplayer/MultiplayerNetworkEngine';
import { RemotePlayerState } from '../types/multiplayer';
import { DISTRICTS } from './game/Cyber3DWorld';
import {
  Globe,
  ExternalLink,
  Sparkles,
  Award,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  ChevronRight,
  Sliders,
  X,
  Search,
  Filter,
  Key,
  Users,
  Radio,
  Signal,
  MessageSquare,
  Swords,
  Copy,
  Check,
  Send,
} from 'lucide-react';

// Math utility to convert latitude & longitude into 3D Cartesian coordinates on a sphere of radius R
function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

// Generate realistic continent landmass point clusters procedurally
function generateContinentParticles(radius: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  // Regional seed boxes: [minLat, maxLat, minLng, maxLng, density]
  const landmasses: [number, number, number, number, number][] = [
    // Philippines (Dense cluster)
    [5, 19, 118, 126, 90],
    // Southeast Asia (Indonesia, Malaysia, Vietnam, Thailand)
    [-10, 22, 95, 120, 80],
    // East Asia (Japan, Korea, Eastern China)
    [22, 45, 110, 142, 100],
    // South Asia (India)
    [8, 32, 68, 88, 60],
    // Europe & UK
    [36, 62, -10, 35, 130],
    // Middle East
    [15, 36, 35, 60, 50],
    // North America (US & Canada)
    [25, 60, -125, -70, 140],
    // Central & South America
    [-35, 15, -75, -35, 100],
    // Australia & NZ
    [-38, -12, 115, 153, 70],
    // Africa
    [-32, 34, -15, 45, 90],
    // Nordic / Iceland
    [60, 68, -25, 20, 40],
  ];

  landmasses.forEach(([minLat, maxLat, minLng, maxLng, count]) => {
    for (let i = 0; i < count; i++) {
      const lat = minLat + Math.random() * (maxLat - minLat);
      const lng = minLng + Math.random() * (maxLng - minLng);
      points.push(latLngToVector3(lat, lng, radius));
    }
  });

  return points;
}

// Helper to locate nearest district name for coordinates
function getNearestDistrictName(x: number, z: number): string {
  let nearestName = 'Genesis Plaza';
  let minDistance = Infinity;
  for (const d of DISTRICTS) {
    const dist = Math.hypot(x - d.pos[0], z - d.pos[1]);
    if (dist < minDistance) {
      minDistance = dist;
      nearestName = d.name;
    }
  }
  return `${nearestName} (${Math.round(x)}, ${Math.round(z)})`;
}

export const PisoWorldMap3D: React.FC = () => {
  const {
    claimedEcosystemRewards,
    claimEcosystemReward,
    xp,
    levelTitle,
    setActiveView,
    wallet,
  } = useAcademy();

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Orbit speed state: default to 0.5x slow-motion as requested!
  const [orbitSpeed, setOrbitSpeed] = useState<number>(0.5);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('wallet-studio');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showOnlyUnclaimed, setShowOnlyUnclaimed] = useState<boolean>(false);
  const [isHoveredOverNode, setIsHoveredOverNode] = useState<string | null>(null);

  // Multiplayer Metaverse state & peers
  const [activeMapTab, setActiveMapTab] = useState<'ecosystem' | 'multiplayer'>('ecosystem');
  const [remotePlayers, setRemotePlayers] = useState<RemotePlayerState[]>([]);
  const [multiplayerStatus, setMultiplayerStatus] = useState<string>('connected');
  const [interactionToast, setInteractionToast] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  useEffect(() => {
    const syncPlayers = () => {
      try {
        const peers = Array.from(MultiplayerNetworkEngine.instance.getRemotePlayers().values());
        setRemotePlayers(peers);
        setMultiplayerStatus(MultiplayerNetworkEngine.instance.getConnectionStatus());
      } catch {}
    };

    syncPlayers();
    const interval = setInterval(syncPlayers, 1000);

    const onJoin = () => syncPlayers();
    const onLeave = () => syncPlayers();
    const onUpdate = () => syncPlayers();

    MultiplayerNetworkEngine.instance.on('onPlayerJoin', onJoin);
    MultiplayerNetworkEngine.instance.on('onPlayerLeave', onLeave);
    MultiplayerNetworkEngine.instance.on('onPlayerUpdate', onUpdate);

    return () => {
      clearInterval(interval);
      MultiplayerNetworkEngine.instance.off('onPlayerJoin', onJoin);
      MultiplayerNetworkEngine.instance.off('onPlayerLeave', onLeave);
      MultiplayerNetworkEngine.instance.off('onPlayerUpdate', onUpdate);
    };
  }, []);

  const handleWave = (player: RemotePlayerState) => {
    SoundFX.playClick();
    MultiplayerNetworkEngine.instance.sendEmote('wave');
    MultiplayerNetworkEngine.instance.sendChatMessage(`Kumusta, ${player.username}! 👋`, false);
    setInteractionToast(`Nag-wave ka kay ${player.username}! 👋`);
    setTimeout(() => setInteractionToast(null), 3500);
  };

  const handleDuelChallenge = (player: RemotePlayerState) => {
    SoundFX.playClick();
    MultiplayerNetworkEngine.instance.sendInteraction(player.playerId, 'duel_challenge');
    setInteractionToast(`Hamon sa Duel naipadala kay ${player.username}! ⚔️`);
    setTimeout(() => setInteractionToast(null), 3500);
  };

  const handleBroadcastWave = () => {
    SoundFX.playClick();
    MultiplayerNetworkEngine.instance.sendEmote('wave');
    MultiplayerNetworkEngine.instance.sendChatMessage('Kumusta mga kapwa explorer sa Metaverse! 🇵🇭👋', false);
    setInteractionToast('Nag-broadcast ka ng pagbati sa buong Metaverse! 📢👋');
    setTimeout(() => setInteractionToast(null), 3500);
  };

  const handleCopy = (address: string) => {
    SoundFX.playClick();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2500);
  };

  const selectedNode = useMemo(
    () => PISO_ECOSYSTEM_NODES.find((n) => n.id === selectedNodeId) || PISO_ECOSYSTEM_NODES[0],
    [selectedNodeId]
  );

  const claimedCount = useMemo(() => {
    return PISO_ECOSYSTEM_NODES.filter((n) => claimedEcosystemRewards.includes(n.id)).length;
  }, [claimedEcosystemRewards]);

  const totalPossibleXp = useMemo(() => {
    return PISO_ECOSYSTEM_NODES.reduce((acc, curr) => acc + curr.rewardXp, 0);
  }, []);

  const earnedEcosystemXp = useMemo(() => {
    return PISO_ECOSYSTEM_NODES.filter((n) => claimedEcosystemRewards.includes(n.id)).reduce(
      (acc, curr) => acc + curr.rewardXp,
      0
    );
  }, [claimedEcosystemRewards]);

  const filteredNodes = useMemo(() => {
    return PISO_ECOSYSTEM_NODES.filter((n) => {
      const matchesCat = filterCategory === 'all' || n.category === filterCategory;
      const matchesSearch =
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.tagline.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClaim = !showOnlyUnclaimed || !claimedEcosystemRewards.includes(n.id);
      return matchesCat && matchesSearch && matchesClaim;
    });
  }, [filterCategory, searchQuery, showOnlyUnclaimed, claimedEcosystemRewards]);

  // Three.js animation and globe lifecycle
  const sceneRef = useRef<{
    globeGroup: THREE.Group;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    targetRotation: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 560;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060911);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(0, 1.2, 6.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    container.appendChild(renderer.domElement);

    // Studio Illumination
    const ambLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambLight);

    const sunLight = new THREE.DirectionalLight(0xf59e0b, 3.0);
    sunLight.position.set(6, 4, 5);
    scene.add(sunLight);

    const azureRimLight = new THREE.DirectionalLight(0x38bdf8, 2.2);
    azureRimLight.position.set(-6, -2, -4);
    scene.add(azureRimLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 1.8, 15);
    cyanPoint.position.set(0, 4, 3);
    scene.add(cyanPoint);

    // Cosmic Starfield
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPositions[i] = (Math.random() - 0.5) * 80;
      starPositions[i + 1] = (Math.random() - 0.5) * 80;
      starPositions[i + 2] = (Math.random() - 0.5) * 80;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.1,
      transparent: true,
      opacity: 0.7,
    });
    const starPoints = new THREE.Points(starGeo, starMat);
    scene.add(starPoints);

    // Globe Root Group
    const globeRadius = 2.1;
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Dark Cyber Core Sphere
    const coreGeo = new THREE.SphereGeometry(globeRadius, 64, 64);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0x070c18,
      roughness: 0.75,
      metalness: 0.25,
      emissive: 0x050811,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // 2. Latitude & Longitude Wireframe Grid
    const wireGeo = new THREE.WireframeGeometry(new THREE.SphereGeometry(globeRadius * 1.002, 24, 16));
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x1e3a8a,
      transparent: true,
      opacity: 0.28,
    });
    const wireLines = new THREE.LineSegments(wireGeo, wireMat);
    globeGroup.add(wireLines);

    // 3. Procedural Glowing Continents Particles
    const landPoints = generateContinentParticles(globeRadius * 1.01);
    const landGeo = new THREE.BufferGeometry().setFromPoints(landPoints);
    const landMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.05,
      transparent: true,
      opacity: 0.85,
    });
    const landMesh = new THREE.Points(landGeo, landMat);
    globeGroup.add(landMesh);

    // 4. Atmosphere Outer Halo Shell
    const atmoGeo = new THREE.SphereGeometry(globeRadius * 1.08, 32, 32);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
    globeGroup.add(atmoMesh);

    // 5. Equatorial & Tilted Orbiting DePIN Rings
    const ringGeo = new THREE.RingGeometry(globeRadius * 1.35, globeRadius * 1.37, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x06b6d4,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide,
    });
    const orbitRing = new THREE.Mesh(ringGeo, ringMat);
    orbitRing.rotation.x = Math.PI * 0.4;
    globeGroup.add(orbitRing);

    // 6. DePIN Satellite Relay Nodes along the ring
    const satellitesGroup = new THREE.Group();
    for (let s = 0; s < 6; s++) {
      const angle = (s / 6) * Math.PI * 2;
      const r = globeRadius * 1.36;
      const sat = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.04, 0.08),
        new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xf59e0b,
          emissiveIntensity: 0.8,
        })
      );
      sat.position.set(Math.cos(angle) * r, Math.sin(angle) * r * 0.4, Math.sin(angle) * r);
      satellitesGroup.add(sat);
    }
    globeGroup.add(satellitesGroup);

    // 7. Interactive 3D Beacon Pins for all 15 Nodes
    const pinsMap = new Map<string, THREE.Group>();
    const pinRaycastTargets: THREE.Object3D[] = [];

    // Manila genesis vector for arcs
    const manilaVec = latLngToVector3(14.5995, 120.9842, globeRadius);

    PISO_ECOSYSTEM_NODES.forEach((node) => {
      const pinPos = latLngToVector3(node.lat, node.lng, globeRadius);
      const pinGroup = new THREE.Group();
      pinGroup.position.copy(pinPos);

      // Align vertical axis of beacon radially outward
      pinGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pinPos.clone().normalize());

      // Colored beam cylinder
      const beamHeight = node.isGenesisHint ? 0.45 : 0.32;
      const beamGeo = new THREE.CylinderGeometry(
        node.isGenesisHint ? 0.025 : 0.015,
        node.isGenesisHint ? 0.05 : 0.035,
        beamHeight,
        8
      );
      const beamMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(node.color),
        transparent: true,
        opacity: node.isGenesisHint ? 0.95 : 0.75,
      });
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.y = beamHeight / 2;
      pinGroup.add(beam);

      // Top floating octahedron gem
      const gemSize = node.isGenesisHint ? 0.08 : 0.055;
      const gemGeo = new THREE.OctahedronGeometry(gemSize);
      const gemMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(node.color),
        emissive: new THREE.Color(node.color),
        emissiveIntensity: 0.9,
        metalness: 0.8,
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.y = beamHeight + gemSize;
      (gem as any).nodeId = node.id;
      pinGroup.add(gem);
      pinRaycastTargets.push(gem);

      // Pulsing Base Ground Ring
      const groundRing = new THREE.Mesh(
        new THREE.RingGeometry(0.04, node.isGenesisHint ? 0.09 : 0.07, 16),
        new THREE.MeshBasicMaterial({
          color: new THREE.Color(node.color),
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        })
      );
      groundRing.rotation.x = Math.PI / 2;
      pinGroup.add(groundRing);

      // Special 8-Ray Philippine Sun Halo for Wallet Studio (The Genesis Start Hint!)
      if (node.isGenesisHint) {
        const sunRing = new THREE.Mesh(
          new THREE.RingGeometry(0.09, 0.12, 8),
          new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
          })
        );
        sunRing.position.y = beamHeight + 0.02;
        sunRing.rotation.x = Math.PI / 2;
        pinGroup.add(sunRing);
      }

      globeGroup.add(pinGroup);
      pinsMap.set(node.id, pinGroup);

      // Draw transaction arc from Manila to other international hubs
      if (node.id !== 'wallet-studio') {
        const destVec = pinPos;
        const midPoint = manilaVec.clone().add(destVec).multiplyScalar(0.5);
        const arcHeight = manilaVec.distanceTo(destVec) * 0.45;
        midPoint.normalize().multiplyScalar(globeRadius + arcHeight);

        const curve = new THREE.QuadraticBezierCurve3(manilaVec, midPoint, destVec);
        const curvePoints = curve.getPoints(24);
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        const curveMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(node.color),
          transparent: true,
          opacity: 0.35,
        });
        const arcLine = new THREE.Line(curveGeo, curveMat);
        globeGroup.add(arcLine);
      }
    });

    // Mouse drag interaction state
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    const targetRotation = { x: 0.2, y: 0.6 };

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        targetRotation.y += deltaX * 0.005;
        targetRotation.x += deltaY * 0.005;
        targetRotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, targetRotation.x));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }

      // Raycaster hover check
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinRaycastTargets);
      if (intersects.length > 0) {
        const hitId = (intersects[0].object as any).nodeId;
        if (hitId) setIsHoveredOverNode(hitId);
      } else {
        setIsHoveredOverNode(null);
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouse = new THREE.Vector2(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1
      );
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(pinRaycastTargets);
      if (intersects.length > 0) {
        const hitId = (intersects[0].object as any).nodeId;
        if (hitId) {
          SoundFX.playClick();
          setSelectedNodeId(hitId);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(4.0, Math.min(9.5, camera.position.z + e.deltaY * 0.004));
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('click', onClick);
    container.addEventListener('wheel', onWheel, { passive: false });

    sceneRef.current = {
      globeGroup,
      camera,
      renderer,
      targetRotation,
    };

    // Animation Loop with Slow Motion 0.5x Default
    let animId = 0;
    let clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Slow-motion 0.5x orbit speed
      const baseSpeed = 0.003;
      const speed = baseSpeed * orbitSpeed;

      if (!isDragging) {
        targetRotation.y += speed;
      }

      // Smooth damping
      globeGroup.rotation.y += (targetRotation.y - globeGroup.rotation.y) * 0.1;
      globeGroup.rotation.x += (targetRotation.x - globeGroup.rotation.x) * 0.1;

      // Gentle counter-rotation for satellites
      satellitesGroup.rotation.y += speed * 0.8;

      // Pulse pin gems
      pinsMap.forEach((pGroup, id) => {
        const isSelected = id === selectedNodeId;
        const isHovered = id === isHoveredOverNode;
        const scale = isSelected ? 1.4 : isHovered ? 1.2 : 1.0;
        pGroup.scale.set(scale, scale, scale);
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('click', onClick);
      container.removeEventListener('wheel', onWheel);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [orbitSpeed, selectedNodeId, isHoveredOverNode]);

  // Focus camera on selected node's geographic latitude and longitude
  const handleFocusNode = (node: PisoEcosystemNode) => {
    setSelectedNodeId(node.id);
    SoundFX.playClick();

    if (sceneRef.current) {
      // Calculate target rotation to bring this lat/lng to front facing camera
      const targetY = -(node.lng + 90) * (Math.PI / 180);
      const targetX = (node.lat) * (Math.PI / 180) * 0.4;
      sceneRef.current.targetRotation.y = targetY;
      sceneRef.current.targetRotation.x = targetX;
    }
  };

  const handleClaim = (node: PisoEcosystemNode) => {
    SoundFX.playLevelUp();
    claimEcosystemReward(node.id, node.rewardXp, node.rewardBadge);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Top Header Banner & Stats */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0C121E] via-[#111A2E] to-[#0C121E] border border-blue-500/30 shadow-[0_0_40px_rgba(37,99,235,0.2)] relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 via-cyan-500 to-amber-400 p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#090E17] rounded-[14px] flex items-center justify-center text-2xl">
                🌍
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-black text-amber-400 uppercase tracking-widest px-2.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  DEPIN 3D WORLD MAP & REWARDS
                </span>
                <span className="text-xs text-cyan-400 font-mono flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>15 Ecosystem Hubs Active</span>
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                PISO Chain 3D Global Blockchain Network
              </h1>
              <p className="text-xs text-slate-400 font-sans max-w-2xl mt-1">
                Mag-navigate sa interactive 3D globe na umiikot sa slow-motion (0.5x speed). Galugarin ang 15 dApps, subukan ang mga on-chain tasks, at kolektahin ang mga gantimpalang XP at Katunayan Badges.
              </p>
            </div>
          </div>

          {/* Orbit Speed Switcher (Defaulting to Slow Motion 0.5x) */}
          <div className="flex flex-wrap items-center gap-2 bg-[#090E17] p-2 rounded-2xl border border-slate-800 font-mono text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold px-2 flex items-center space-x-1">
              <Sliders className="w-3.5 h-3.5 text-blue-400" />
              <span>Orbit Speed:</span>
            </span>
            {[
              { label: '0.25x Slow', val: 0.25 },
              { label: '0.5x (Slow-Mo) ✓', val: 0.5 },
              { label: '1.0x Realtime', val: 1.0 },
              { label: 'Pause', val: 0 },
            ].map((spd) => (
              <button
                key={spd.val}
                onClick={() => {
                  SoundFX.playClick();
                  setOrbitSpeed(spd.val);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  orbitSpeed === spd.val
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Global Rewards Stats Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">Nasukat na Hubs:</span>
            <span className="text-lg font-black text-white font-mono">15 Global Beacons</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">Nakubrang Gantimpala:</span>
            <span className="text-lg font-black text-amber-400 font-mono">
              {claimedCount} / {PISO_ECOSYSTEM_NODES.length} Claimed
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">Kabuuang XP Pool:</span>
            <span className="text-lg font-black text-emerald-400 font-mono">
              {earnedEcosystemXp} / {totalPossibleXp} XP
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-slate-400 text-[11px] block">L1 Genesis RPC:</span>
            <span className="text-xs font-bold text-cyan-300 truncate block mt-1">
              piso-rpc-dev.loca.lt
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs: 3D Ecosystem Hubs vs Metaverse Campus Roster */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0A0F1D] p-2.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              SoundFX.playClick();
              setActiveMapTab('ecosystem');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
              activeMapTab === 'ecosystem'
                ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>🌐 15 PISO Ecosystem Hubs & Rewards</span>
          </button>

          <button
            onClick={() => {
              SoundFX.playClick();
              setActiveMapTab('multiplayer');
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all ${
              activeMapTab === 'multiplayer'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>👥 Online Metaverse Students & Roster</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-mono border border-emerald-400/30">
              {remotePlayers.length} Online
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono text-slate-400 px-2">
          <span className="flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-400">P2P Mesh:</span>
            <span className="text-emerald-400 font-bold uppercase">{multiplayerStatus}</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">Silid: <strong className="text-cyan-300">genesis_academy_main</strong></span>
        </div>
      </div>

      {/* Toast Feedback */}
      {interactionToast && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-xs flex items-center justify-between animate-fade-in shadow-[0_0_25px_rgba(16,185,129,0.2)]">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{interactionToast}</span>
          </div>
          <button onClick={() => setInteractionToast(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* MULTIPLAYER ROSTER VIEW */}
      {activeMapTab === 'multiplayer' && (
        <div className="space-y-6 animate-fade-in">
          {/* Network Diagnostics & Quick Controls Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0C1525] via-[#111F35] to-[#0C1525] border border-cyan-500/30 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center text-2xl shrink-0">
                  🛰️
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center space-x-2">
                    <span>Metaverse Real-Time Peer Registry</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Synchronized (16 Hz)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-sans mt-0.5">
                    Lahat ng aktibong estudyante sa 3D Academy Metaverse. Maaaring magpadala ng emotes, makipag-duel, o mag-usap sa pamamagitan ng P2P data mesh.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <button
                  onClick={handleBroadcastWave}
                  className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:brightness-110 text-white font-mono text-xs font-bold uppercase flex items-center justify-center space-x-2 shadow-md transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Mag-broadcast ng Wave 👋</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/80 font-mono text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Mga Kasamang Online:</span>
                <span className="text-lg font-black text-emerald-400">{remotePlayers.length} Peers</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Iyong Karakter:</span>
                <span className="text-sm font-bold text-cyan-300 truncate block mt-0.5">{levelTitle}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">Latency / Ping:</span>
                <span className="text-sm font-bold text-emerald-400">~16 ms (Real-Time)</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400 block">P2P Network Relays:</span>
                <span className="text-[11px] text-amber-300 truncate block mt-0.5">BroadcastChannel + Gun</span>
              </div>
            </div>
          </div>

          {/* Peer Grid or Solo Empty State */}
          {remotePlayers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {remotePlayers.map((player) => {
                const zone = getNearestDistrictName(player.transform?.x || 0, player.transform?.z || 0);
                const avatarIcon =
                  player.avatarMode === 'custom_glb'
                    ? '🤖'
                    : player.avatarMode === 'drone'
                    ? '🛸'
                    : '🎓';
                const avatarLabel =
                  player.avatarMode === 'custom_glb'
                    ? 'Custom 3D GLB'
                    : player.avatarMode === 'drone'
                    ? 'Recon Drone'
                    : 'Sovereign Student';

                return (
                  <div
                    key={player.playerId}
                    className="p-5 rounded-3xl bg-[#0F172A] border-2 border-emerald-500/30 hover:border-emerald-400/60 shadow-xl space-y-4 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-2xl shadow-inner">
                          {avatarIcon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-500/30 uppercase">
                              {avatarLabel}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <h4 className="text-base font-black text-white mt-1">
                            {player.username}
                          </h4>
                          <span className="text-xs font-mono text-cyan-300 font-bold">
                            {player.rankTitle || 'PISO Cadet'}
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
                        {player.animState || 'idle'}
                      </span>
                    </div>

                    {/* Location & Wallet Details */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Lokasyon:</span>
                        <span className="text-cyan-300 font-bold truncate max-w-[200px]" title={zone}>
                          📍 {zone}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Wallet:</span>
                        <div className="flex items-center space-x-1">
                          <span className="text-amber-300 font-bold">
                            {player.walletAddress
                              ? `${player.walletAddress.slice(0, 6)}...${player.walletAddress.slice(-4)}`
                              : '0x...Burner'}
                          </span>
                          {player.walletAddress && (
                            <button
                              onClick={() => handleCopy(player.walletAddress!)}
                              className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                              title="Kopyahin ang Wallet Address"
                            >
                              {copiedAddress === player.walletAddress ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Coordinates:</span>
                        <span className="text-slate-400">
                          X: {Math.round(player.transform?.x || 0)}, Y: {Math.round(player.transform?.y || 0)}, Z: {Math.round(player.transform?.z || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => handleWave(player)}
                        className="py-2 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                      >
                        <span>👋 Kumaway</span>
                      </button>

                      <button
                        onClick={() => handleDuelChallenge(player)}
                        className="py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center justify-center space-x-1.5 transition-all active:scale-95"
                      >
                        <Swords className="w-3.5 h-3.5" />
                        <span>⚔️ Hamunin</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-10 rounded-3xl bg-[#0B101D] border-2 border-dashed border-slate-800 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-400/30 text-3xl flex items-center justify-center mx-auto shadow-glow">
                🧑‍🚀
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-lg font-black text-white">
                  Ikaw Pa Lamang Ang Explorer Sa Silid Na Ito
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Kasalukuyan kang naka-connect sa <strong>genesis_academy_main</strong> silid. Upang makita ang real-time multi-peer sync, magbukas ng bagong browser tab o ibang browser (hal. Chrome + Edge o Incognito).
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 max-w-lg mx-auto text-left font-mono text-xs space-y-2">
                <div className="text-amber-400 font-bold flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Subukan ang Instant Discovery:</span>
                </div>
                <div className="text-slate-300 text-[11px] leading-relaxed">
                  1. I-duplicate ang tab na ito sa iyong browser.<br/>
                  2. Sa bagong tab, ilipat ang iyong karakter gamit ang W/A/S/D.<br/>
                  3. Agad silang lilitaw sa 3D Metaverse, sa radar minimap, at dito sa World Roster nang walang delay!
                </div>
              </div>

              <button
                onClick={handleBroadcastWave}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:brightness-110 text-slate-950 font-mono text-xs font-black uppercase shadow-glow transition-all active:scale-95"
              >
                📢 Mag-Broadcast ng Signal sa Metaverse
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3D ECOSYSTEM VIEW */}
      {activeMapTab === 'ecosystem' && (
        <>
          {/* 2. ⭐ BEST HINT TO START: WALLET STUDIO HERO CALLOUT */}
          <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/20 via-[#161F30] to-blue-900/20 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-start space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-2xl font-black shadow-glow shrink-0">
            🔑
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-black text-slate-950 bg-amber-400 px-2 py-0.5 rounded uppercase tracking-wider">
                👑 STEP 1: PINAKAMAINAM NA SIMULA (BEST PLACE TO START)
              </span>
              <span className="text-xs font-mono text-amber-300 font-bold">+500 XP Milestone</span>
            </div>
            <h3 className="text-lg font-black text-white mt-1">
              PISO Wallet Studio (Mainnet) — Ang Susì sa Buong Ecosystem
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl mt-0.5">
              Bago mag-deploy, mag-swap, o mag-mina, <strong>lumikha muna ng iyong sariling Sovereign Web3 Keypair sa Wallet Studio</strong>. Dito naka-angkla ang iyong private keys at account abstraction para ma-claim ang Genesis Starter Pack!
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              SoundFX.playClick();
              window.dispatchEvent(new CustomEvent('piso-open-wallet-terminal'));
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400 text-cyan-300 font-mono text-xs font-bold uppercase flex items-center justify-center space-x-2 shadow-sm transition-all active:scale-95"
            title="Buksan ang In-Game Wallet Studio Terminal (Hotkey: W o K)"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>In-Game Sandbox Terminal [W]</span>
          </button>

          <a
            href="https://piso-blockchain.vercel.app/wallet"
            target="_blank"
            rel="noreferrer"
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-mono text-xs font-black uppercase flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95"
          >
            <span>Buksan ang Wallet Studio ↗</span>
            <ExternalLink className="w-4 h-4" />
          </a>

          <button
            onClick={() => {
              const walletNode = PISO_ECOSYSTEM_NODES.find((n) => n.id === 'wallet-studio')!;
              handleClaim(walletNode);
            }}
            disabled={claimedEcosystemRewards.includes('wallet-studio')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
              claimedEcosystemRewards.includes('wallet-studio')
                ? 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {claimedEcosystemRewards.includes('wallet-studio')
                ? 'Claimed (+500 XP)'
                : 'I-claim Starter Perk'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Main 3D Canvas & Node Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: 3D Interactive Globe Container */}
        <div className="lg:col-span-8 bg-[#090E17] rounded-3xl border border-slate-800/90 overflow-hidden relative shadow-2xl flex flex-col" style={{ minHeight: '580px' }}>
          {/* Overlay HUD Badges */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 font-mono text-xs">
            <span className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-slate-300 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>Rotasyon: {orbitSpeed}x Slow-Mo</span>
            </span>
            <span className="px-3 py-1 rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 text-amber-400 font-bold">
              Target: {selectedNode.name}
            </span>
          </div>

          <div className="absolute top-4 right-4 z-20 flex items-center space-x-2">
            <button
              onClick={() => {
                SoundFX.playClick();
                const walletNode = PISO_ECOSYSTEM_NODES.find((n) => n.id === 'wallet-studio')!;
                handleFocusNode(walletNode);
              }}
              className="px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm"
              title="I-focus sa Manila Genesis Hub (Wallet Studio)"
            >
              <span>🔑 I-focus sa Step 1</span>
            </button>
            <button
              onClick={() => {
                SoundFX.playClick();
                if (sceneRef.current) {
                  sceneRef.current.targetRotation.x = 0.2;
                  sceneRef.current.targetRotation.y = 0.6;
                  sceneRef.current.camera.position.set(0, 1.2, 6.2);
                }
              }}
              className="p-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
              title="I-reset ang Camera"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* 3D Canvas Div */}
          <div
            ref={canvasContainerRef}
            className="w-full flex-1 cursor-grab active:cursor-grabbing relative"
            style={{ minHeight: '520px' }}
          />

          {/* Bottom Interactive Globe Hint */}
          <div className="px-6 py-3 bg-[#0B0F19]/90 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="text-cyan-400">💡 TIP:</span>
              <span>I-drag ang mouse upang paikutin ang mundo (360°). I-scroll ang wheel para mag-zoom. I-click ang anumang kumikinang na beacon pin upang siyasatin.</span>
            </div>
            <span className="text-slate-500 hidden sm:inline">Three.js WebGL Engine</span>
          </div>
        </div>

        {/* Right Side: Selected Node Inspector & Rewards Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-6 rounded-3xl bg-[#0F172A] border-2 border-blue-500/40 shadow-xl space-y-5 relative">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/20"
                  style={{ backgroundColor: `${selectedNode.color}25`, borderColor: selectedNode.color }}
                >
                  {selectedNode.icon}
                </div>
                <div>
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase"
                    style={{
                      color: selectedNode.color,
                      borderColor: `${selectedNode.color}40`,
                      backgroundColor: `${selectedNode.color}15`,
                    }}
                  >
                    {selectedNode.badge}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1 leading-snug">
                    {selectedNode.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    📍 {selectedNode.city}, {selectedNode.country}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{selectedNode.tagline}</p>

            {/* Lore Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 italic font-sans">
              "{selectedNode.questLore}"
            </div>

            {/* Key Features */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                Mga Kakayahan ng Module:
              </span>
              <div className="space-y-1.5">
                {selectedNode.features.map((feat, idx) => (
                  <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                    <span className="text-cyan-400 font-bold">•</span>
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quest & Reward Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase flex items-center space-x-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Ecosystem Reward</span>
                </span>
                <span className="text-xs font-mono font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  +{selectedNode.rewardXp} XP
                </span>
              </div>

              <div className="text-xs text-slate-200">
                <strong>Gawain:</strong> {selectedNode.questTask}
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <span className="text-[10px] font-mono text-slate-400">Commemorative Badge:</span>
                <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                  {selectedNode.rewardBadge}
                </span>
              </div>

              <button
                onClick={() => handleClaim(selectedNode)}
                disabled={claimedEcosystemRewards.includes(selectedNode.id)}
                className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all flex items-center justify-center space-x-2 ${
                  claimedEcosystemRewards.includes(selectedNode.id)
                    ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 shadow-glow font-black'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {claimedEcosystemRewards.includes(selectedNode.id)
                    ? '✓ Na-claim Na Ang Reward (+XP)'
                    : `I-claim ang Reward (+${selectedNode.rewardXp} XP)`}
                </span>
              </button>
            </div>

            {/* Launch dApp Button & Terminal Trigger */}
            <div className="space-y-2">
              {selectedNode.id === 'wallet-studio' && (
                <button
                  onClick={() => {
                    SoundFX.playClick();
                    window.dispatchEvent(new CustomEvent('piso-open-wallet-terminal'));
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold uppercase flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
                >
                  <Key className="w-4 h-4 text-amber-300" />
                  <span>Buksan ang In-Game Sandbox Terminal [W]</span>
                </button>
              )}

              <a
                href={selectedNode.url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase flex items-center justify-center space-x-2 transition-all shadow-md active:scale-95"
              >
                <span>Bisitahin ang dApp sa PISO Network ↗</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Complete 15 Ecosystem Hubs Directory & Filter Grid */}
      <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-white flex items-center space-x-2">
              <span>Lahat ng 15 PISO Chain Ecosystem Hubs & Rewards</span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                100% On-Chain Map
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Pumili ng anumang hub upang mag-zoom in ang 3D globe at i-claim ang kaakibat na XP milestone.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="relative flex-1 md:w-56">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Maghanap ng dApp o lungsod..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono focus:border-blue-400 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowOnlyUnclaimed(!showOnlyUnclaimed)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all ${
                showOnlyUnclaimed
                  ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {showOnlyUnclaimed ? 'Unclaimed Only ✓' : 'Lahat ng Hubs'}
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-3">
          {[
            { id: 'all', label: 'Lahat (15)' },
            { id: 'Core Gateway', label: '👑 Core Gateways' },
            { id: 'DePIN & Infra', label: '🛰️ DePIN & Infra' },
            { id: 'AI & Bots', label: '🌸 AI & Bots' },
            { id: 'DeFi & Payments', label: '🔄 DeFi & Payments' },
            { id: 'Governance & Enterprise', label: '🏛️ Governance & Enterprise' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                filterCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNodes.map((node) => {
            const isClaimed = claimedEcosystemRewards.includes(node.id);
            const isSelected = selectedNode.id === node.id;

            return (
              <div
                key={node.id}
                onClick={() => handleFocusNode(node)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-[#162035] border-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.25)]'
                    : 'bg-[#161F30]/70 border-slate-800 hover:border-slate-700 hover:bg-[#161F30]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-md border border-white/20"
                        style={{ backgroundColor: `${node.color}25`, borderColor: node.color }}
                      >
                        {node.icon}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs flex items-center space-x-1.5">
                          <span>{node.name}</span>
                          {node.isGenesisHint && (
                            <span className="text-[9px] font-mono font-bold text-slate-950 bg-amber-400 px-1.5 py-0.2 rounded">
                              START HERE
                            </span>
                          )}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          📍 {node.city}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      +{node.rewardXp} XP
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2.5 line-clamp-2">{node.tagline}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
                    🏅 {node.rewardBadge}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaim(node);
                      }}
                      disabled={isClaimed}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                        isClaimed
                          ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
                      }`}
                    >
                      {isClaimed ? '✓ Claimed' : 'Claim Reward'}
                    </button>

                    <a
                      href={node.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                      title="Bisitahin ang dApp"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      </>
      )}
    </div>
  );
};
