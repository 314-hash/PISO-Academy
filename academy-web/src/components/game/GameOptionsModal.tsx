import React from 'react';
import { useAcademy, ControlSettings } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import { Sliders, Volume2, VolumeX, Eye, Zap, RotateCcw, X, Check } from 'lucide-react';

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
                Flight Controls & Preferences
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

          {/* Particle Density */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span>Visual FX & Particle Density</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Battery Saver', desc: '300 particles' },
                { id: 'med', label: 'Balanced', desc: '600 particles' },
                { id: 'high', label: 'Ultra Cyber', desc: '1200 particles' },
              ].map((opt) => {
                const isActive = controlSettings.particleDensity === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => updateSetting('particleDensity', opt.id as any)}
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
