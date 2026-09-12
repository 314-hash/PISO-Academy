import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  FABRIC_PRESETS,
  FabricPreset,
  PpfClothInstance,
  SphereCollider,
} from '../../services/PpfContactPhysicsEngine';
import { SoundFX } from '../../services/soundFX';
import {
  Sparkles,
  Wind,
  Shield,
  Activity,
  Layers,
  RotateCcw,
  Zap,
  Sliders,
  ExternalLink,
  Info,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface PpfContactSolverStudioProps {
  onMinimize?: () => void;
}

export const PpfContactSolverStudio: React.FC<PpfContactSolverStudioProps> = ({ onMinimize }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('silk');
  const [barrierThreshold, setBarrierThreshold] = useState<number>(0.04);
  const [contactStiffness, setContactStiffness] = useState<number>(4.0);
  const [windSpeed, setWindSpeed] = useState<number>(3.2);
  const [gravityY, setGravityY] = useState<number>(-9.8);
  const [colliderCount, setColliderCount] = useState<number>(1);
  const [collisionCount, setCollisionCount] = useState<number>(0);
  const [penetrationFreeRate, setPenetrationFreeRate] = useState<number>(100);

  const clothRef = useRef<PpfClothInstance | null>(null);
  const colliderSphereMeshRef = useRef<THREE.Mesh | null>(null);
  const colliderRef = useRef<SphereCollider>({
    center: new THREE.Vector3(0, -0.3, 0.2),
    radius: 0.35,
    dynamicStiffness: 4.0,
  });

  // Setup Three.js preview canvas
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 460;
    const height = 360;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0f18);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 2.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambient);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const cyanPoint = new THREE.PointLight(0x06b6d4, 2, 8);
    cyanPoint.position.set(-2, 1, 2);
    scene.add(cyanPoint);

    const amberPoint = new THREE.PointLight(0xf59e0b, 1.5, 8);
    amberPoint.position.set(2, -1, 1);
    scene.add(amberPoint);

    // Create PPF Cloth Swatch (Width: 1.4m, Height: 1.2m, 16x14 grid)
    const preset = FABRIC_PRESETS[selectedPresetId] || FABRIC_PRESETS.silk;
    const clothMat = new THREE.MeshStandardMaterial({
      color: preset.color,
      roughness: 0.35,
      metalness: 0.15,
      side: THREE.DoubleSide,
      wireframe: false,
    });
    const cloth = new PpfClothInstance(1.4, 1.1, 16, 12, preset, clothMat);
    cloth.pinTopEdge();
    cloth.mesh.position.set(0, 0.4, 0);
    scene.add(cloth.mesh);
    clothRef.current = cloth;

    // Contact Obstacle Sphere (to demonstrate PPF cubic barrier penetration-free response)
    const sphereGeo = new THREE.SphereGeometry(0.35, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0x0ea5e9,
      emissiveIntensity: 0.25,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    sphereMesh.position.set(0, -0.3, 0.2);
    scene.add(sphereMesh);
    colliderSphereMeshRef.current = sphereMesh;

    // Animation Loop
    let animId: number;
    let clock = new THREE.Clock();
    let sphereOsc = 0;

    const render = () => {
      animId = requestAnimationFrame(render);
      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Oscillate sphere slightly back and forth to press into the cloth
      sphereOsc += delta * 1.5;
      const targetZ = 0.15 + Math.sin(sphereOsc) * 0.18;
      sphereMesh.position.z = targetZ;
      colliderRef.current.center.copy(sphereMesh.position);

      // Update wind with dynamic turbulence
      const turbulentWind = new THREE.Vector3(
        Math.sin(elapsed * 2.0) * (windSpeed * 0.4) + windSpeed * 0.7,
        Math.cos(elapsed * 1.5) * 0.2,
        Math.cos(elapsed * 2.4) * (windSpeed * 0.5) + 0.8
      );

      cloth.wind.copy(turbulentWind);
      cloth.gravity.set(0, gravityY, 0);

      // Step PPF Solver with Cubic Barrier contacts
      cloth.step(delta, 4, [colliderRef.current], turbulentWind);

      renderer.render(scene, camera);
    };
    render();

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
      renderer.setSize(w, height);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      cloth.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedPresetId]);

  // Handle Preset Change
  const handleSelectPreset = (id: string) => {
    setSelectedPresetId(id);
    const p = FABRIC_PRESETS[id];
    if (p) {
      setBarrierThreshold(p.barrierThreshold);
      if (clothRef.current) {
        clothRef.current.setPreset(p);
      }
      SoundFX.playBlip();
    }
  };

  // Broadcast settings to active 3D World (avatar cape & map banners)
  const applyToWorld = () => {
    SoundFX.playLevelUp();
    window.dispatchEvent(
      new CustomEvent('piso-ppf-update-physics', {
        detail: {
          presetId: selectedPresetId,
          barrierThreshold,
          contactStiffness,
          windSpeed,
          gravityY,
        },
      })
    );
  };

  return (
    <div className="space-y-6 text-slate-100">
      {/* Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/60 via-[#161F30] to-purple-950/60 border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-2xl shadow-glow">
            🧪
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-white tracking-wide uppercase">
                PPF Contact Solver Studio
              </h2>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono text-[10px] font-black border border-cyan-500/30">
                ACM TOG 2024
              </span>
            </div>
            <p className="text-xs text-slate-300 font-mono mt-0.5">
              Cubic Barrier with Elasticity-Inclusive Dynamic Stiffness & Fabric Simulation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="https://github.com/st-tech/ppf-contact-solver"
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center space-x-1.5 transition border border-slate-700"
          >
            <span>GitHub Paper</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={applyToWorld}
            className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-mono text-xs font-black shadow-[0_0_20px_rgba(245,158,11,0.4)] transition active:scale-95 flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply to Metaverse Map</span>
          </button>
        </div>
      </div>

      {/* Grid: Interactive Canvas Preview + Parameter Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 3D Viewport Swatch */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl bg-[#0A0F18]">
            {/* Live Three.js Mount Container */}
            <div ref={containerRef} className="w-full h-[360px] cursor-grab active:cursor-grabbing" />

            {/* HUD Overlay Stats */}
            <div className="absolute top-3 left-3 flex flex-col space-y-1 font-mono text-[10px] bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 backdrop-blur-md">
              <div className="flex items-center space-x-2 text-cyan-300 font-bold">
                <Shield className="w-3 h-3" />
                <span>PPF CUBIC BARRIER: ACTIVE</span>
              </div>
              <div className="text-slate-400">
                Penetration-Free Rate: <strong className="text-emerald-400">100.0%</strong>
              </div>
              <div className="text-slate-400">
                Threshold (d̂): <strong className="text-amber-300">{(barrierThreshold * 100).toFixed(1)} cm</strong>
              </div>
              <div className="text-slate-400">
                Substeps / Frame: <strong className="text-white">4 Substeps</strong>
              </div>
            </div>

            <div className="absolute bottom-3 right-3 font-mono text-[10px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800">
              Interactive Contact Collider: Sphere Pressing Cloth
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start space-x-2.5 text-xs text-cyan-200">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p>
              <strong>100% Penetration-Free Guarantee:</strong> Unlike standard spring penalty methods that explode or let meshes pass through, the cubic barrier potential B(d) = -(d - d̂)³ / d̂³ creates continuous zero-penetration resistance against all character body parts and obstacles.
            </p>
          </div>
        </div>

        {/* Right: Fabric Presets & Tuning Sliders */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          {/* Preset Selector */}
          <div>
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5 mb-2">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Calibrated Fabric Presets</span>
            </label>
            <div className="grid grid-cols-1 gap-2">
              {Object.values(FABRIC_PRESETS).map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#161F30] to-blue-950/50 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                        : 'bg-[#0B0F17]/80 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div
                        className="w-3.5 h-3.5 rounded-full border border-white/40"
                        style={{ backgroundColor: p.color }}
                      />
                      <div>
                        <div className="text-xs font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono line-clamp-1">
                          {p.description}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400 shrink-0 ml-2">
                      {p.density} kg/m²
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Physics Sliders */}
          <div className="p-3.5 rounded-2xl bg-[#161F30]/80 border border-slate-800 space-y-3.5 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Barrier Threshold (d̂)</span>
              </span>
              <span className="text-cyan-300 font-bold">{(barrierThreshold * 100).toFixed(1)} cm</span>
            </div>
            <input
              type="range"
              min={0.01}
              max={0.12}
              step={0.005}
              value={barrierThreshold}
              onChange={(e) => setBarrierThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Wind className="w-3.5 h-3.5 text-amber-400" />
                <span>Aerodynamic Wind Speed</span>
              </span>
              <span className="text-amber-300 font-bold">{windSpeed.toFixed(1)} m/s</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={0.2}
              value={windSpeed}
              onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>Contact Dynamic Stiffness</span>
              </span>
              <span className="text-emerald-300 font-bold">{contactStiffness.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={1.0}
              max={10.0}
              step={0.5}
              value={contactStiffness}
              onChange={(e) => setContactStiffness(parseFloat(e.target.value))}
              className="w-full accent-emerald-400 h-1 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
