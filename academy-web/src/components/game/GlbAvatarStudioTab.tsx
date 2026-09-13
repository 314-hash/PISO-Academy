/**
 * GlbAvatarStudioTab.tsx
 * Interactive Drag & Drop .GLB/.GLTF Avatar Loader Studio for PISO Academy Metaverse.
 * 
 * Compatible with:
 * - Ready Player Me (.glb)
 * - Meshy.ai (.glb)
 * - Tripo3D (.glb)
 * - Mixamo / Blender exported rigged & unrigged humanoid meshes
 * 
 * Follows the 60-30-10 Filipino Cyberpunk Design System:
 * 60% Dominant: #0B0F17 (Deep Void Slate)
 * 30% Secondary: #1E293B (Cyber Slate Panels & Cards)
 * 10% Accent: #06B6D4 / #F59E0B (Neon Cyan & Sun Gold)
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  GlbAvatarService,
  GlbAvatarMetadata,
  SAMPLE_GLB_AVATARS,
  glbStorage,
} from '../../services/GlbAvatarService';
import {
  Upload,
  Sparkles,
  Bot,
  User,
  Check,
  RotateCcw,
  Zap,
  Globe,
  Sliders,
  Layers,
  Award,
  AlertCircle,
  FileCode,
  Link,
  Eye,
  CheckCircle2,
  Trash2,
  Play,
} from 'lucide-react';

export const GlbAvatarStudioTab: React.FC = () => {
  const {
    avatarMode,
    setAvatarMode,
    customGlbAvatar,
    setCustomGlbAvatar,
    equipGlbAvatar,
    setNotification,
  } = useAcademy();

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>('');
  const [previewMetadata, setPreviewMetadata] = useState<GlbAvatarMetadata | null>(customGlbAvatar);
  const [isWireframe, setIsWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [activeAnimName, setActiveAnimName] = useState<string>('');

  const previewMountRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentGltfRef = useRef<THREE.Group | null>(null);
  const modelPivotRef = useRef<THREE.Group | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Map<string, THREE.AnimationAction>>(new Map());

  // ─── 3D Viewport Setup for Live Preview ───────────────────────────────────────

  useEffect(() => {
    const container = previewMountRef.current;
    if (!container) return;

    const width = container.clientWidth || 420;
    const height = container.clientHeight || 420;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0f17);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 50);
    camera.position.set(0, 1.2, 3.4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    // Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x06b6d4, 2.0);
    keyLight.position.set(2, 4, 3);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf59e0b, 1.4);
    fillLight.position.set(-2, 3, -2);
    scene.add(fillLight);

    // Circular Hologram Floor Grid
    const gridHelper = new THREE.PolarGridHelper(1.8, 16, 8, 32, 0x06b6d4, 0x1e293b);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    const modelPivot = new THREE.Group();
    modelPivotRef.current = modelPivot;
    scene.add(modelPivot);

    // Mouse drag rotation controls
    let isDragging = false;
    let prevMouseX = 0;
    let targetRotationY = 0;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMouseX = e.clientX;
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - prevMouseX;
      prevMouseX = e.clientX;
      targetRotationY += deltaX * 0.015;
    };
    const onMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    // Touch orbit controls for mobile/tablet
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        prevMouseX = e.touches[0].clientX;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging || e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      prevMouseX = e.touches[0].clientX;
      targetRotationY += deltaX * 0.015;
    };
    const onTouchEnd = () => {
      isDragging = false;
    };

    container.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let animId = 0;
    const clock = new THREE.Clock();

    const render = () => {
      animId = requestAnimationFrame(render);
      const delta = clock.getDelta();

      if (autoRotate && !isDragging) {
        targetRotationY += delta * 0.45;
      }

      modelPivot.rotation.y = THREE.MathUtils.lerp(modelPivot.rotation.y, targetRotationY, 0.1);

      if (mixerRef.current) {
        mixerRef.current.update(delta);
      }

      renderer.render(scene, camera);
    };
    render();

    // Load active avatar from IndexedDB into preview if available
    glbStorage.getActiveGlb().then((stored) => {
      if (stored) {
        GlbAvatarService.loadFromBuffer(stored.data, stored.metadata.name, stored.metadata.source)
          .then((res) => {
            mountGltfInPreview(res.gltf, modelPivot, res.metadata);
          })
          .catch(() => {});
      }
    });

    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const mountGltfInPreview = (
    gltf: any,
    pivot: THREE.Group | THREE.Object3D,
    metadata: GlbAvatarMetadata
  ) => {
    // Clear previous model
    if (currentGltfRef.current) {
      pivot.remove(currentGltfRef.current);
    }
    actionsRef.current.clear();

    const cloneScene = gltf.scene.clone(true);
    currentGltfRef.current = cloneScene;
    pivot.add(cloneScene);
    setPreviewMetadata(metadata);

    // Setup preview animations if clips exist
    if (gltf.animations && gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(cloneScene);
      mixerRef.current = mixer;

      gltf.animations.forEach((clip: THREE.AnimationClip) => {
        const action = mixer.clipAction(clip);
        actionsRef.current.set(clip.name, action);
      });

      const firstClip = gltf.animations[0].name;
      actionsRef.current.get(firstClip)?.play();
      setActiveAnimName(firstClip);
    } else {
      mixerRef.current = null;
      setActiveAnimName('');
    }
  };

  // Wireframe toggle update
  useEffect(() => {
    if (!currentGltfRef.current) return;
    currentGltfRef.current.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        if (mesh.material) {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          mats.forEach((m) => {
            if ('wireframe' in m) {
              (m as any).wireframe = isWireframe;
            }
          });
        }
      }
    });
  }, [isWireframe]);

  // ─── File Handling & Drag & Drop ──────────────────────────────────────────────

  const handleFileSelected = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setNotification({
        message: '⚠️ Paki-upload lamang ang valid na .GLB o .GLTF 3D model file!',
        type: 'error',
      });
      return;
    }

    try {
      setIsLoading(true);
      setLoadingProgress(`Binabasa ang 3D model: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)...`);
      SoundFX.playLaser();

      const buffer = await file.arrayBuffer();
      setLoadingProgress('Ina-analyze ang bones, meshes, at embedded animations...');

      const detectedSource: GlbAvatarMetadata['source'] =
        file.name.toLowerCase().includes('rpm') || file.name.toLowerCase().includes('readyplayer')
          ? 'ready_player_me'
          : file.name.toLowerCase().includes('meshy')
          ? 'meshy'
          : file.name.toLowerCase().includes('tripo')
          ? 'tripo'
          : 'custom_upload';

      const result = await GlbAvatarService.loadFromBuffer(buffer, file.name, detectedSource);

      if (previewMountRef.current) {
        const pivot = modelPivotRef.current || currentGltfRef.current?.parent;
        if (pivot) {
          mountGltfInPreview(result.gltf, pivot, result.metadata);
        }
      }

      SoundFX.playLevelUp();
      setNotification({
        message: `✨ Matagumpay na na-load ang .GLB model: "${result.metadata.name}"!`,
        type: 'success',
      });
    } catch (err: any) {
      console.error('Failed to load GLB file:', err);
      setNotification({
        message: `❌ Nabigo ang pag-load ng GLB: ${err?.message || 'Invalid file format'}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  };

  // ─── URL Loader Handler ───────────────────────────────────────────────────────

  const handleLoadUrl = async () => {
    if (!urlInput.trim()) return;

    try {
      setIsLoading(true);
      setLoadingProgress(`Kino-konekta sa remote avatar URL: ${urlInput.slice(0, 45)}...`);
      SoundFX.playLaser();

      const result = await GlbAvatarService.loadFromUrl(
        urlInput.trim(),
        'Remote Ready Player Me Avatar',
        urlInput.includes('readyplayer') ? 'ready_player_me' : 'custom_upload'
      );

      if (previewMountRef.current) {
        const pivot = modelPivotRef.current || currentGltfRef.current?.parent;
        if (pivot) {
          mountGltfInPreview(result.gltf, pivot, result.metadata);
        }
      }

      SoundFX.playLevelUp();
      setNotification({
        message: `✨ Na-load ang Avatar mula sa URL: "${result.metadata.name}"!`,
        type: 'success',
      });
      setUrlInput('');
    } catch (err: any) {
      setNotification({
        message: `❌ Nabigo ang pag-load mula sa URL. Siguraduhing accessible ang CORS ng .glb file.`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // ─── Preset Sample Loader ─────────────────────────────────────────────────────

  const handleLoadPreset = async (preset: typeof SAMPLE_GLB_AVATARS[0]) => {
    try {
      setIsLoading(true);
      setLoadingProgress(`Naglo-load ng Preset: ${preset.name}...`);
      SoundFX.playLaser();

      const result = await GlbAvatarService.loadFromUrl(preset.url, preset.name, preset.category);

      if (previewMountRef.current) {
        const pivot = modelPivotRef.current || currentGltfRef.current?.parent;
        if (pivot) {
          mountGltfInPreview(result.gltf, pivot, result.metadata);
        }
      }

      SoundFX.playLevelUp();
      setNotification({
        message: `✨ Na-load ang sample preset: "${preset.name}"!`,
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: `⚠️ Hindi ma-load ang external preset: ${err?.message}`,
        type: 'error',
      });
    } finally {
      setIsLoading(false);
      setLoadingProgress('');
    }
  };

  // ─── Equip Active Avatar in 3D Metaverse ──────────────────────────────────────

  const handleEquipMetaverse = () => {
    if (!previewMetadata) {
      setNotification({
        message: 'Mag-upload o pumili muna ng .GLB avatar bago mag-equip!',
        type: 'error',
      });
      return;
    }

    SoundFX.playLevelUp();
    equipGlbAvatar(previewMetadata);
    setNotification({
      message: `👤 Aktibo na ang 3D .GLB Avatar: "${previewMetadata.name}" sa PISO Metaverse World!`,
      type: 'success',
    });
  };

  const handleRevertProcedural = () => {
    SoundFX.playClick();
    setAvatarMode('human');
    setCustomGlbAvatar(null);
    glbStorage.clearActiveGlb();
    setNotification({
      message: 'Bumalik sa Procedural Humanoid Founder Avatar mode.',
      type: 'info',
    });
  };

  const isCustomGlbActive = avatarMode === 'custom_glb';

  return (
    <div className="w-full flex flex-col space-y-4 text-slate-100 p-1">
      {/* Top Banner & Status Indicator */}
      <div className="flex flex-wrap items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-blue-950/70 border border-cyan-500/40 backdrop-blur-md shadow-xl gap-3">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(6,182,212,0.4)] text-slate-950">
            🤖
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-black tracking-wide text-white uppercase">
                3D .GLB / .GLTF Avatar Studio
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                MESHY • TRIPO • READY PLAYER ME
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Auto-Scaling (1.8m) • Bone Rigging • Embedded Clips & Procedural Locomotion
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isCustomGlbActive ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-400/50 text-emerald-300 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>CUSTOM .GLB ACTIVE IN 3D WORLD</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              <span>PROCEDURAL AVATAR ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left Dropzone & Controls, Right Live 3D Viewport */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (5 cols): Drag-and-Drop, Presets, URL Input */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Drag & Drop Card */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 text-center ${
              isDragOver
                ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_rgba(6,182,212,0.4)] scale-[1.01]'
                : 'border-slate-700 hover:border-cyan-500/60 bg-slate-900/60 hover:bg-slate-900/90'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".glb,.gltf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelected(e.target.files[0]);
                }
              }}
            />

            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3 shadow-inner group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7 animate-bounce" />
            </div>

            <h4 className="text-sm font-bold text-white mb-1">
              Drag & Drop ang iyong 3D .GLB File Dito
            </h4>
            <p className="text-xs text-slate-400 max-w-xs mb-3">
              I-export ang rigged model mula sa <strong className="text-cyan-300">Ready Player Me</strong>,{' '}
              <strong className="text-purple-300">Meshy.ai</strong>, o{' '}
              <strong className="text-amber-300">Tripo3D</strong>.
            </p>

            <span className="px-3 py-1 rounded-xl bg-slate-800/90 border border-slate-600 text-cyan-300 text-xs font-mono font-bold">
              📁 Piliin Mula sa Computer (.glb / .gltf)
            </span>
          </div>

          {/* Remote URL Loader */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-1.5">
              <Link className="w-3.5 h-3.5 text-cyan-400" />
              <span>O Mag-load Gamit ang Direct .GLB URL</span>
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://models.readyplayer.me/...glb"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:outline-none text-xs font-mono text-white placeholder-slate-500"
              />
              <button
                type="button"
                onClick={handleLoadUrl}
                disabled={isLoading || !urlInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-bold font-mono transition active:scale-95 shrink-0"
              >
                LOAD URL
              </button>
            </div>
          </div>

          {/* Quick Presets Catalog */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>1-Click Sample Preset Models</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Ready to test</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {SAMPLE_GLB_AVATARS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleLoadPreset(preset)}
                  disabled={isLoading}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition group"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{preset.icon}</span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{preset.subtitle}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/20">
                    TEST
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Revert Button if Custom GLB Active */}
          {isCustomGlbActive && (
            <button
              type="button"
              onClick={handleRevertProcedural}
              className="flex items-center justify-center space-x-2 p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold transition active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Bumalik sa Procedural Humanoid Avatar</span>
            </button>
          )}
        </div>

        {/* Right Column (7 cols): 3D Viewport Preview & Telemetry */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          {/* 3D Viewport Box */}
          <div className="relative w-full h-80 md:h-96 rounded-2xl bg-gradient-to-b from-slate-950 to-[#0B0F17] border border-cyan-500/30 overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Viewport Header Controls */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-auto">
              <div className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-slate-900/85 border border-slate-700/80 backdrop-blur-md text-[11px] font-mono text-cyan-300">
                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                <span>3D Turntable (Drag to Orbit)</span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => setIsWireframe(!isWireframe)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition ${
                    isWireframe
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                      : 'bg-slate-900/85 text-slate-300 border-slate-700'
                  }`}
                  title="Toggle Wireframe Mesh"
                >
                  WIREFRAME
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRotate(!autoRotate)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition ${
                    autoRotate
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-900/85 text-slate-400 border-slate-700'
                  }`}
                  title="Toggle Auto Spin"
                >
                  SPIN {autoRotate ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Three.js Canvas Container */}
            <div ref={previewMountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20 text-center">
                <div className="w-12 h-12 rounded-full border-4 border-cyan-400 border-t-transparent animate-spin mb-3" />
                <div className="text-sm font-bold text-cyan-300 font-mono mb-1">
                  PISO GLB ENGINE PROCESSING
                </div>
                <div className="text-xs text-slate-400 font-mono max-w-sm">{loadingProgress}</div>
              </div>
            )}

            {/* Viewport Bottom Overlay: Animation Selector */}
            {previewMetadata?.hasAnimations && previewMetadata.animationNames.length > 0 && (
              <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between p-2 rounded-xl bg-slate-900/90 border border-slate-800 backdrop-blur-md">
                <span className="text-[11px] font-mono text-slate-400 flex items-center space-x-1.5">
                  <Play className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Animations ({previewMetadata.animationNames.length}):</span>
                </span>
                <div className="flex items-center space-x-1 overflow-x-auto max-w-[65%]">
                  {previewMetadata.animationNames.map((anim) => (
                    <button
                      key={anim}
                      type="button"
                      onClick={() => {
                        actionsRef.current.forEach((act) => act.stop());
                        const target = actionsRef.current.get(anim);
                        if (target) {
                          target.reset().fadeIn(0.2).play();
                          setActiveAnimName(anim);
                        }
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition ${
                        activeAnimName === anim
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {anim}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Model Telemetry & Inspection Card */}
          {previewMetadata ? (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/30 flex flex-col space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white">{previewMetadata.name}</h4>
                  <p className="text-[11px] text-cyan-400 font-mono">
                    Source: {previewMetadata.source.replace('_', ' ').toUpperCase()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleEquipMetaverse}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs font-mono transition-all shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95"
                >
                  <Zap className="w-4 h-4 fill-slate-950" />
                  <span>EQUIP IN METAVERSE</span>
                </button>
              </div>

              {/* Stats Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">FILE SIZE</span>
                  <span className="text-white font-bold">
                    {(previewMetadata.fileSize / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">TRIANGLES</span>
                  <span className="text-white font-bold">
                    {previewMetadata.triangleCount.toLocaleString()}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">RIG / BONES</span>
                  <span className="text-white font-bold">
                    {previewMetadata.hasBones ? `✅ ${previewMetadata.boneCount} Bones` : '❌ Unrigged'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">NORMALIZED SCALE</span>
                  <span className="text-cyan-300 font-bold">
                    {previewMetadata.normalizedScale.toFixed(3)}x (1.8m)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 flex items-center justify-center text-center text-xs text-slate-400 font-mono py-8">
              I-drag at i-drop ang isang .GLB file o pumili ng preset sa kaliwa upang matingnan ang 3D preview at telemetry nito.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
