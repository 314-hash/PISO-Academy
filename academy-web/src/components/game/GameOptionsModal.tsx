import React from 'react';
import { useAcademy, ControlSettings } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  Sliders,
  Eye,
  Zap,
  RotateCcw,
  X,
  Check,
  Compass,
  Crosshair,
  Smartphone,
  Cpu,
  RefreshCw,
} from 'lucide-react';

interface GameOptionsModalProps {
  onClose: () => void;
}

export const GameOptionsModal: React.FC<GameOptionsModalProps> = ({ onClose }) => {
  const { controlSettings, setControlSettings, setNotification } = useAcademy();

  const updateSetting = <K extends keyof ControlSettings>(key: K, val: ControlSettings[K]) => {
    SoundFX.playClick();
    setControlSettings((prev) => {
      const next = { ...prev, [key]: val };
      localStorage.setItem('piso_control_settings', JSON.stringify(next));
      return next;
    });
  };

  const handleResetDefaults = () => {
    SoundFX.playLaser();
    const def: ControlSettings = {
      cameraMode: 'isometric',
      flightSpeed: 'normal',
      zoom: 18,
      soundVolume: 80,
      particleDensity: 'high',
      controlScheme: 'camera_relative',
      invertPitch: false,
      invertYaw: false,
      swapJoystickSide: false,
      autoTargetLock: true,
      performanceTier: 'balanced',
    };
    setControlSettings(def);
    localStorage.setItem('piso_control_settings', JSON.stringify(def));
    setNotification({
      message: 'Control settings reset to default.',
      type: 'info',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-[#0F172A] border-2 border-cyan-500/70 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161F30]/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl">
              ⚙️
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-cyan-400 uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30">
                  SYSTEM OPTIONS
                </span>
                <span className="text-xs text-slate-400 font-mono">PISO Metaverse Engine</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Flight Controls & Compatibility
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* Navigation & Control Scheme (Fixes Inverted Controls) */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span>Directional Movement Scheme (Direksyon ng Kontrol)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'camera_relative',
                  label: 'Camera-Relative (Recommended)',
                  desc: 'W always moves into screen, regardless of camera rotation. Eliminates inverted navigation!',
                },
                {
                  id: 'world_axis',
                  label: 'Fixed World Coordinates',
                  desc: 'W always moves North in world space regardless of camera heading.',
                },
              ].map((opt) => {
                const isActive = (controlSettings.controlScheme || 'camera_relative') === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSetting('controlScheme', opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                        : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Invert Axes & Auto-Lock Toggles */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>Invert & Targeting Compatibility</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Invert Pitch */}
              <button
                onClick={() => updateSetting('invertPitch', !controlSettings.invertPitch)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  controlSettings.invertPitch
                    ? 'border-amber-400 bg-amber-500/20 text-white'
                    : 'border-slate-800 bg-[#161F30] text-slate-400'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-xs">Invert Pitch (Y)</div>
                  <div className="text-[10px] text-slate-400">Vertical camera drag</div>
                </div>
                <span className={`text-xs font-mono font-bold ${controlSettings.invertPitch ? 'text-amber-400' : 'text-slate-600'}`}>
                  {controlSettings.invertPitch ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Invert Yaw */}
              <button
                onClick={() => updateSetting('invertYaw', !controlSettings.invertYaw)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  controlSettings.invertYaw
                    ? 'border-amber-400 bg-amber-500/20 text-white'
                    : 'border-slate-800 bg-[#161F30] text-slate-400'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-xs">Invert Yaw (X)</div>
                  <div className="text-[10px] text-slate-400">Horizontal camera drag</div>
                </div>
                <span className={`text-xs font-mono font-bold ${controlSettings.invertYaw ? 'text-amber-400' : 'text-slate-600'}`}>
                  {controlSettings.invertYaw ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* Smart Auto-Target Lock */}
              <button
                onClick={() => updateSetting('autoTargetLock', controlSettings.autoTargetLock === false ? true : false)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                  controlSettings.autoTargetLock !== false
                    ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'border-slate-800 bg-[#161F30] text-slate-400'
                }`}
              >
                <div className="text-left">
                  <div className="font-bold text-xs flex items-center space-x-1">
                    <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Auto-Target Lock</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Snap to nearest monster</div>
                </div>
                <span className={`text-xs font-mono font-bold ${controlSettings.autoTargetLock !== false ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {controlSettings.autoTargetLock !== false ? 'ON' : 'OFF'}
                </span>
              </button>
            </div>
          </div>

          {/* Android Mobile Layout (Swap Joystick Hand) */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-rose-400" />
              <span>Mobile Touch Hand Orientation</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: false, label: 'Left Thumb Joystick', desc: 'Standard layout: Left joystick, right skills & buttons' },
                { id: true, label: 'Right Thumb Joystick', desc: 'Inverted layout: Right joystick, left skills & buttons' },
              ].map((opt) => {
                const isActive = (controlSettings.swapJoystickSide || false) === opt.id;
                return (
                  <button
                    key={String(opt.id)}
                    onClick={() => updateSetting('swapJoystickSide', opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-rose-400 bg-rose-500/20 text-white shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                        : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Device Hardware Compatibility Tier */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Hardware Compatibility & Performance Tier</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Battery Saver', desc: 'Low-spec Android / 30fps' },
                { id: 'balanced', label: 'Balanced (60fps)', desc: 'Standard mobile & laptop' },
                { id: 'ultra', label: 'Ultra Cyber (120fps)', desc: 'High-end gaming rigs' },
              ].map((opt) => {
                const isActive = (controlSettings.performanceTier || 'balanced') === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSetting('performanceTier', opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-purple-400 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Camera Mode */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span>Camera Perspective (Anggulo ng Kamera)</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'isometric', label: 'Isometric Chase', desc: 'Stable 45° angle' },
                { id: 'follow', label: 'Cockpit Follow', desc: 'Trails behind drone' },
                { id: 'topdown', label: 'Top-Down Radar', desc: 'Direct 90° view' },
              ].map((opt) => {
                const isActive = controlSettings.cameraMode === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSetting('cameraMode', opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                        : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Flight Speed */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Base Thruster Velocity (Bilis ng Paglipad)</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'normal', label: 'Standard Cruise (14 m/s)', desc: 'Smooth & precise handling' },
                { id: 'turbo', label: 'Hyperdrive Warp (24 m/s)', desc: 'Fast exploration across New Manila' },
              ].map((opt) => {
                const isActive = controlSettings.flightSpeed === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSetting('flightSpeed', opt.id as any)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                        : 'border-slate-800 bg-[#161F30] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{opt.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Zoom Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-slate-400 font-bold uppercase flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-blue-400" />
                <span>Camera Elevation / Zoom</span>
              </span>
              <span className="text-cyan-400 font-bold">{controlSettings.zoom}m</span>
            </div>
            <input
              type="range"
              min="12"
              max="32"
              step="1"
              value={controlSettings.zoom}
              onChange={(e) => updateSetting('zoom', Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>Close Tactical (12m)</span>
              <span>Overview Radar (32m)</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#161F30]/90">
          <button
            onClick={handleResetDefaults}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white font-mono transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all flex items-center space-x-2"
          >
            <Check className="w-4 h-4" />
            <span>I-save at Isara</span>
          </button>
        </div>
      </div>
    </div>
  );
};
