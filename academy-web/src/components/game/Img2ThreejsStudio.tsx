import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  Sparkles,
  Box,
  Layers,
  Code2,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Rocket,
  ShieldCheck,
  Eye,
  Sliders,
  Award,
} from 'lucide-react';

interface SculptPreset {
  id: string;
  name: string;
  category: string;
  tagline: string;
  color: number;
  spec: {
    primitives: string[];
    materialType: string;
    partsCount: number;
    roughness: number;
    metalness: number;
  };
  generator: (group: THREE.Group, isWireframe: boolean) => void;
  codeSnippet: string;
}

export const PRESETS: SculptPreset[] = [
  {
    id: 'seal',
    name: 'Katunayan Gold Seal (0x...1014)',
    category: 'Soulbound Credential',
    tagline: 'Procedural 12-pointed Sun Medallion & Rotating Obsidian Core',
    color: 0xF59E0B,
    spec: {
      primitives: ['CylinderGeometry', 'ConeGeometry', 'TorusGeometry', 'OctahedronGeometry'],
      materialType: 'MeshStandardMaterial (Gold PBR)',
      partsCount: 16,
      roughness: 0.25,
      metalness: 0.85,
    },
    generator: (group, isWireframe) => {
      // 1. Central Medallion Base
      const baseGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.4, 24);
      const baseMat = new THREE.MeshStandardMaterial({
        color: 0xD97706,
        wireframe: isWireframe,
        metalness: 0.8,
        roughness: 0.2,
      });
      const base = new THREE.Mesh(baseGeo, baseMat);
      group.add(base);

      // 2. 12 Philippine Sun Rays
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const rayGeo = new THREE.ConeGeometry(0.35, 1.2, 4);
        const rayMat = new THREE.MeshStandardMaterial({
          color: 0xFBBF24,
          wireframe: isWireframe,
          metalness: 0.9,
          roughness: 0.15,
        });
        const ray = new THREE.Mesh(rayGeo, rayMat);
        ray.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5);
        ray.rotation.z = -angle + Math.PI / 2;
        ray.rotation.x = Math.PI / 2;
        group.add(ray);
      }

      // 3. Inner Rotating Obsidian Gem
      const gemGeo = new THREE.OctahedronGeometry(1.1, 0);
      const gemMat = new THREE.MeshStandardMaterial({
        color: 0x0B0F17,
        emissive: 0x2563EB,
        emissiveIntensity: 0.6,
        wireframe: isWireframe,
        metalness: 0.9,
        roughness: 0.1,
      });
      const gem = new THREE.Mesh(gemGeo, gemMat);
      gem.position.y = 0.5;
      group.add(gem);

      // 4. Floating Halos
      const haloGeo = new THREE.TorusGeometry(1.6, 0.05, 8, 32);
      const haloMat = new THREE.MeshBasicMaterial({ color: 0xF59E0B });
      const halo = new THREE.Mesh(haloGeo, haloMat);
      halo.rotation.x = Math.PI / 2;
      halo.position.y = 0.6;
      group.add(halo);
    },
    codeSnippet: `// Katunayan Gold Seal - img2threejs Procedural Sculpt
const group = new THREE.Group();
const base = new THREE.Mesh(
  new THREE.CylinderGeometry(2.0, 2.2, 0.4, 24),
  new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.2 })
);
group.add(base);

for (let i = 0; i < 12; i++) {
  const angle = (i / 12) * Math.PI * 2;
  const ray = new THREE.Mesh(
    new THREE.ConeGeometry(0.35, 1.2, 4),
    new THREE.MeshStandardMaterial({ color: 0xFBBF24, metalness: 0.9, roughness: 0.15 })
  );
  ray.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5);
  group.add(ray);
}
// Precompile 0x...1014 ERC-5192 Katunayan Verified`,
  },
  {
    id: 'haribon',
    name: 'Haribon (Philippine Eagle Drone)',
    category: 'Avian Automaton',
    tagline: 'Procedural Aerodynamic Wings & Biomorphic Chassis',
    color: 0x3B82F6,
    spec: {
      primitives: ['OctahedronGeometry', 'BoxGeometry', 'ConeGeometry', 'TorusGeometry'],
      materialType: 'MeshStandardMaterial (Aero-Graphene)',
      partsCount: 14,
      roughness: 0.35,
      metalness: 0.65,
    },
    generator: (group, isWireframe) => {
      // Fuselage / Raptor Body
      const bodyGeo = new THREE.OctahedronGeometry(1.5, 1);
      const bodyMat = new THREE.MeshStandardMaterial({
        color: 0x1E293B,
        wireframe: isWireframe,
        metalness: 0.7,
        roughness: 0.3,
      });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.scale.set(0.9, 0.7, 1.8);
      group.add(body);

      // Swept Wings (Left & Right)
      [-1, 1].forEach((side) => {
        const wingGeo = new THREE.BoxGeometry(2.6, 0.08, 0.9);
        const wingMat = new THREE.MeshStandardMaterial({
          color: 0x2563EB,
          wireframe: isWireframe,
          metalness: 0.8,
          roughness: 0.2,
        });
        const wing = new THREE.Mesh(wingGeo, wingMat);
        wing.position.set(side * 2.0, 0.1, -0.2);
        wing.rotation.y = side * -0.25;
        wing.rotation.z = side * -0.15;
        group.add(wing);

        // Wingtip Beacons
        const tipGeo = new THREE.ConeGeometry(0.2, 0.8, 4);
        const tipMat = new THREE.MeshBasicMaterial({ color: 0x06B6D4 });
        const tip = new THREE.Mesh(tipGeo, tipMat);
        tip.position.set(side * 3.3, 0.1, -0.3);
        tip.rotation.z = side * -Math.PI / 2;
        group.add(tip);
      });

      // Beak / Cockpit
      const beakGeo = new THREE.ConeGeometry(0.4, 1.0, 4);
      const beakMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        wireframe: isWireframe,
        metalness: 0.9,
        roughness: 0.1,
      });
      const beak = new THREE.Mesh(beakGeo, beakMat);
      beak.position.set(0, -0.1, 1.5);
      beak.rotation.x = Math.PI / 2;
      group.add(beak);
    },
    codeSnippet: `// Haribon Philippine Eagle - img2threejs Procedural Sculpt
const eagleGroup = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.OctahedronGeometry(1.5, 1),
  new THREE.MeshStandardMaterial({ color: 0x1E293B, metalness: 0.7 })
);
body.scale.set(0.9, 0.7, 1.8);
eagleGroup.add(body);

[-1, 1].forEach(side => {
  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.9), new THREE.MeshStandardMaterial({ color: 0x2563EB }));
  wing.position.set(side * 2.0, 0.1, -0.2);
  eagleGroup.add(wing);
});`,
  },
  {
    id: 'jeepney',
    name: 'Sarao Cyber-Jeepney 2090',
    category: 'King of the Road',
    tagline: 'Ribbed Bumper, Stainless Hood & Tricolor Neon Underglow',
    color: 0xEAB308,
    spec: {
      primitives: ['BoxGeometry', 'CylinderGeometry', 'SphereGeometry', 'TorusGeometry'],
      materialType: 'MeshStandardMaterial (Chrome & Manila Neon)',
      partsCount: 18,
      roughness: 0.2,
      metalness: 0.9,
    },
    generator: (group, isWireframe) => {
      // Main Cabin
      const cabGeo = new THREE.BoxGeometry(2.0, 1.2, 3.8);
      const cabMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        wireframe: isWireframe,
        metalness: 0.85,
        roughness: 0.2,
      });
      const cab = new THREE.Mesh(cabGeo, cabMat);
      cab.position.y = 0.9;
      group.add(cab);

      // Hood
      const hoodGeo = new THREE.BoxGeometry(1.8, 0.8, 1.6);
      const hoodMat = new THREE.MeshStandardMaterial({
        color: 0xCBD5E1,
        wireframe: isWireframe,
        metalness: 0.95,
        roughness: 0.1,
      });
      const hood = new THREE.Mesh(hoodGeo, hoodMat);
      hood.position.set(0, 0.6, 2.2);
      group.add(hood);

      // Chrome Horse Mascot
      const horseGeo = new THREE.ConeGeometry(0.18, 0.5, 4);
      const horseMat = new THREE.MeshStandardMaterial({
        color: 0xF59E0B,
        wireframe: isWireframe,
        metalness: 1.0,
      });
      const horse = new THREE.Mesh(horseGeo, horseMat);
      horse.position.set(0, 1.15, 2.7);
      group.add(horse);

      // Dual Headlights
      [-0.6, 0.6].forEach((x) => {
        const lightGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const lightMat = new THREE.MeshBasicMaterial({ color: 0xFACC15 });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.rotation.x = Math.PI / 2;
        light.position.set(x, 0.6, 3.05);
        group.add(light);
      });

      // Neon Underglow Ring
      const glowGeo = new THREE.RingGeometry(1.4, 1.7, 24);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xEF4444,
        side: THREE.DoubleSide,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.rotation.x = Math.PI / 2;
      glow.position.y = 0.15;
      group.add(glow);
    },
    codeSnippet: `// Sarao Cyber-Jeepney 2090 - img2threejs Procedural Sculpt
const jeep = new THREE.Group();
const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.2, 3.8), new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.85 }));
const hood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 1.6), new THREE.MeshStandardMaterial({ color: 0xCBD5E1, metalness: 0.95 }));
hood.position.set(0, 0.6, 2.2);
jeep.add(cabin, hood);`,
  },
  {
    id: 'babaylan',
    name: 'Babaylan AI Divination Prism',
    category: 'Oracle Precompile 0x...1009',
    tagline: 'Crystalline Icosahedron & Orbiting Concentric Rune Rings',
    color: 0xA855F7,
    spec: {
      primitives: ['IcosahedronGeometry', 'TorusGeometry', 'OctahedronGeometry'],
      materialType: 'MeshStandardMaterial (Amethyst Glass)',
      partsCount: 10,
      roughness: 0.1,
      metalness: 0.9,
    },
    generator: (group, isWireframe) => {
      // Core Amethyst Crystal
      const coreGeo = new THREE.IcosahedronGeometry(1.4, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x9333EA,
        emissive: 0x7E22CE,
        emissiveIntensity: 0.5,
        wireframe: isWireframe,
        metalness: 0.8,
        roughness: 0.1,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      group.add(core);

      // Concentric Orbit Rings
      const ring1 = new THREE.Mesh(
        new THREE.TorusGeometry(2.1, 0.05, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0xE879F9 })
      );
      ring1.rotation.x = Math.PI / 3;
      group.add(ring1);

      const ring2 = new THREE.Mesh(
        new THREE.TorusGeometry(2.6, 0.04, 8, 36),
        new THREE.MeshBasicMaterial({ color: 0x06B6D4 })
      );
      ring2.rotation.y = Math.PI / 4;
      group.add(ring2);
    },
    codeSnippet: `// Babaylan AI Oracle Prism (0x...1009) - img2threejs Procedural Sculpt
const prismGroup = new THREE.Group();
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(1.4, 0),
  new THREE.MeshStandardMaterial({ color: 0x9333EA, emissive: 0x7E22CE, metalness: 0.8 })
);
prismGroup.add(core);`,
  },
];

export const Img2ThreejsStudio: React.FC = () => {
  const { setNotification, recordQuestProgress } = useAcademy();
  const [selectedPreset, setSelectedPreset] = useState<SculptPreset>(PRESETS[0]);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'spec' | 'code'>('preview');

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const meshGroupRef = useRef<THREE.Group | null>(null);

  // Build 3D Scene
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070A10);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 3, 7);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    const amb = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(amb);

    const dirLight1 = new THREE.DirectionalLight(0xF59E0B, 2.5);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x3B82F6, 2.0);
    dirLight2.position.set(-5, -2, -5);
    scene.add(dirLight2);

    // Grid Floor
    const grid = new THREE.GridHelper(20, 20, 0xF59E0B, 0x1E293B);
    grid.position.y = -1.6;
    scene.add(grid);

    // Active Model Group
    const group = new THREE.Group();
    group.position.y = 0.2;
    scene.add(group);
    meshGroupRef.current = group;

    selectedPreset.generator(group, isWireframe);

    // Orbit State
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;

    const onPointerDown = (e: MouseEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: MouseEvent) => {
      if (isDragging && group) {
        const dx = e.clientX - prevX;
        const dy = e.clientY - prevY;
        group.rotation.y += dx * 0.01;
        group.rotation.x += dy * 0.01;
        prevX = e.clientX;
        prevY = e.clientY;
      }
    };

    const onPointerUp = () => (isDragging = false);

    container.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (isRotating && group && !isDragging) {
        group.rotation.y += 0.012;
      }
      camera.lookAt(0, 0.2, 0);
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
      cancelAnimationFrame(animationId);
      container.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [selectedPreset, isWireframe, isRotating]);

  const handleSelectPreset = (p: SculptPreset) => {
    SoundFX.playClick();
    setSelectedPreset(p);
  };

  const handleCopyCode = () => {
    SoundFX.playSuccess();
    navigator.clipboard.writeText(selectedPreset.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setNotification({
      message: 'Procedural Three.js code copied to clipboard!',
      type: 'success',
    });
  };

  const handleBindToCertificate = () => {
    SoundFX.playLevelUp();
    recordQuestProgress('smart-forge', 1);
    setNotification({
      message: `🎉 3D Sculpt "${selectedPreset.name}" bound to Soulbound Katunayan Certificate (0x...1014)! +100 XP!`,
      type: 'success',
    });
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#0B0F17] text-slate-200 select-none overflow-hidden">
      {/* Left Panel: Preset Gallery & img2threejs Spec Pipeline */}
      <div className="w-full md:w-80 border-r border-slate-800 bg-[#0F172A] p-4 flex flex-col space-y-4 overflow-y-auto">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-xs font-bold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded">
              IMG2THREEJS v2.0
            </span>
            <span className="text-xs text-slate-400 font-mono">Code-Only 3D</span>
          </div>
          <h3 className="text-sm font-bold text-white mt-1">Procedural 3D NFT Studio</h3>
          <p className="text-[11px] text-slate-400">
            Reconstruct reference imagery into pure code-only Three.js models for PISO Chain smart contracts.
          </p>
        </div>

        {/* Presets List */}
        <div className="space-y-2 flex-1">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Mga Huwaran at Pamana (Filipino 3D Presets)
          </span>
          {PRESETS.map((p) => {
            const isSel = selectedPreset.id === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  isSel
                    ? 'bg-[#161F30] border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : 'bg-[#161F30]/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-white">{p.name}</h4>
                  <span className="text-[9px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {p.spec.partsCount} parts
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">{p.tagline}</p>
              </button>
            );
          })}
        </div>

        {/* img2threejs Pipeline Specs */}
        <div className="p-3.5 rounded-xl bg-[#161F30] border border-slate-800 font-mono text-[11px] space-y-1.5">
          <div className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Sculpt Contract Specs</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            Material: <strong className="text-white">{selectedPreset.spec.materialType}</strong>
          </div>
          <div className="text-slate-400 text-[10px]">
            Primitives:{' '}
            <span className="text-cyan-400">{selectedPreset.spec.primitives.join(', ')}</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            Roughness / Metalness:{' '}
            <span className="text-white">
              {selectedPreset.spec.roughness} / {selectedPreset.spec.metalness}
            </span>
          </div>
        </div>

        {/* Action: Bind to Certificate */}
        <button
          onClick={handleBindToCertificate}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-slate-950 font-mono text-xs font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center space-x-2"
        >
          <Award className="w-4 h-4" />
          <span>I-bind sa Katunayan NFT</span>
        </button>
      </div>

      {/* Right Area: Interactive 3D Canvas + Code Tabs */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Canvas Toolbar */}
        <div className="p-3 border-b border-slate-800 bg-[#0F172A]/90 flex items-center justify-between z-10 font-mono text-xs">
          <div className="flex items-center space-x-2">
            {[
              { id: 'preview', label: '3D Preview', icon: Eye },
              { id: 'code', label: 'Three.js Code', icon: Code2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsWireframe(!isWireframe)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                isWireframe
                  ? 'border-cyan-400 bg-cyan-500/20 text-cyan-300'
                  : 'border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Wireframe: {isWireframe ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={() => setIsRotating(!isRotating)}
              className={`px-2.5 py-1 rounded-lg border text-[11px] transition-all ${
                isRotating
                  ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                  : 'border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Rotate: {isRotating ? 'ON' : 'OFF'}
            </button>
            <button
              onClick={handleCopyCode}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] flex items-center space-x-1 shadow-sm transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        {/* Main Content: 3D Canvas or Code View */}
        <div className="flex-1 relative overflow-hidden">
          {/* 3D WebGL Canvas */}
          <div
            ref={containerRef}
            className={`w-full h-full cursor-grab active:cursor-grabbing ${
              activeTab !== 'preview' ? 'hidden' : 'block'
            }`}
          />

          {/* Controls Tip Overlay */}
          {activeTab === 'preview' && (
            <div className="absolute bottom-3 left-3 pointer-events-none font-mono text-[10px] text-slate-500 bg-slate-950/70 p-1.5 rounded border border-slate-800">
              Drag to rotate 360° | Procedural Three.js Model (0 KB external download)
            </div>
          )}

          {/* Code Viewer Tab */}
          {activeTab === 'code' && (
            <div className="w-full h-full p-6 overflow-y-auto font-mono text-xs text-slate-300 bg-[#070A10]">
              <pre className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800 text-amber-300 overflow-x-auto leading-relaxed">
                {selectedPreset.codeSnippet}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
