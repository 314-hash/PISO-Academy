/**
 * PISO Academy Metaverse — Cross-Platform Game Control System
 * Control Settings & Ergonomics Modal
 */

import React, { useState } from 'react';
import { InputManager } from '../../../controls/InputManager';
import { ControlPreferences, ControlMode } from '../../../controls/InputTypes';
import { SoundFX } from '../../../services/soundFX';
import { X, Sliders, Smartphone, Keyboard, Gamepad2, Sparkles, RotateCcw } from 'lucide-react';

interface ControlSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKeybindings?: () => void;
}

export const ControlSettingsModal: React.FC<ControlSettingsModalProps> = ({
  isOpen,
  onClose,
  onOpenKeybindings,
}) => {
  const [prefs, setPrefs] = useState<ControlPreferences>(() =>
    InputManager.instance.getPreferences()
  );

  if (!isOpen) return null;

  const update = <K extends keyof ControlPreferences>(key: K, val: ControlPreferences[K]) => {
    SoundFX.playClick();
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    InputManager.instance.savePreferences(updated);
  };

  const handleReset = () => {
    SoundFX.playLaser();
    const defaults: ControlPreferences = {
      controlMode: 'auto',
      cameraSensitivity: 1.0,
      joystickSensitivity: 1.0,
      cameraSmoothing: 0.09,
      invertPitch: false,
      invertYaw: false,
      autoSprint: false,
      vibration: true,
      showTouchControls: 'auto',
      swapJoystickSide: false,
    };
    setPrefs(defaults);
    InputManager.instance.savePreferences(defaults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-xl bg-[#070B12] border-2 border-cyan-500/70 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0E1524]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              🎮
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-[10px] font-black text-cyan-400 uppercase tracking-widest px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-400/30">
                  INPUT SYSTEM
                </span>
                <span className="text-xs text-slate-400 font-mono">Cross-Platform</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Controls & Ergonomics Settings
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300">
          {/* 1. Control Mode Preset */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Input Mode & Device Preference</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'auto' as ControlMode, label: '✨ Auto Detect', desc: 'Adapts to screen/touch' },
                { id: 'touch' as ControlMode, label: '📱 Touch Sticks', desc: 'Dual virtual joysticks' },
                { id: 'keyboard' as ControlMode, label: '⌨️ WASD + Mouse', desc: 'Desktop keyboard' },
                { id: 'gamepad' as ControlMode, label: '🎮 Gamepad API', desc: 'Physical controller' },
              ].map((m) => {
                const isActive = prefs.controlMode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => update('controlMode', m.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_18px_rgba(6,182,212,0.35)]'
                        : 'border-slate-800 bg-[#0E1524] text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold text-xs">{m.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Sensitivity Sliders */}
          <div className="p-4 rounded-2xl bg-[#0E1524] border border-slate-800 space-y-4">
            <div className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sensitivity & Smoothing</span>
              <span className="text-[10px] text-slate-400">Real-Time Tuning</span>
            </div>

            {/* Camera Sensitivity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">Camera Look Sensitivity</span>
                <span className="font-mono font-bold text-cyan-300">
                  {prefs.cameraSensitivity.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.4"
                max="2.5"
                step="0.05"
                value={prefs.cameraSensitivity}
                onChange={(e) => update('cameraSensitivity', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Joystick Sensitivity Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">Mobile Joystick Sensitivity</span>
                <span className="font-mono font-bold text-amber-300">
                  {prefs.joystickSensitivity.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={prefs.joystickSensitivity}
                onChange={(e) => update('joystickSensitivity', parseFloat(e.target.value))}
                className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Camera Smoothing Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-semibold">Camera Orbit Smoothing</span>
                <span className="font-mono font-bold text-purple-300">
                  {Math.round(prefs.cameraSmoothing * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.25"
                step="0.01"
                value={prefs.cameraSmoothing}
                onChange={(e) => update('cameraSmoothing', parseFloat(e.target.value))}
                className="w-full accent-purple-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* 3. Toggles Grid */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => update('invertPitch', !prefs.invertPitch)}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                prefs.invertPitch
                  ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'border-slate-800 bg-[#0E1524] text-slate-400'
              }`}
            >
              <span className="text-xs font-semibold">Invert Pitch (Y)</span>
              <span
                className={`text-xs font-mono font-bold ${
                  prefs.invertPitch ? 'text-amber-400' : 'text-slate-600'
                }`}
              >
                {prefs.invertPitch ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => update('invertYaw', !prefs.invertYaw)}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                prefs.invertYaw
                  ? 'border-amber-400 bg-amber-500/20 text-white shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'border-slate-800 bg-[#0E1524] text-slate-400'
              }`}
            >
              <span className="text-xs font-semibold">Invert Yaw (X)</span>
              <span
                className={`text-xs font-mono font-bold ${
                  prefs.invertYaw ? 'text-amber-400' : 'text-slate-600'
                }`}
              >
                {prefs.invertYaw ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => update('autoSprint', !prefs.autoSprint)}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                prefs.autoSprint
                  ? 'border-cyan-400 bg-cyan-500/20 text-white shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'border-slate-800 bg-[#0E1524] text-slate-400'
              }`}
            >
              <span className="text-xs font-semibold">Auto-Sprint</span>
              <span
                className={`text-xs font-mono font-bold ${
                  prefs.autoSprint ? 'text-cyan-400' : 'text-slate-600'
                }`}
              >
                {prefs.autoSprint ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => update('vibration', !prefs.vibration)}
              className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                prefs.vibration
                  ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                  : 'border-slate-800 bg-[#0E1524] text-slate-400'
              }`}
            >
              <span className="text-xs font-semibold">Haptic Feedback</span>
              <span
                className={`text-xs font-mono font-bold ${
                  prefs.vibration ? 'text-emerald-400' : 'text-slate-600'
                }`}
              >
                {prefs.vibration ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          {/* 4. Left-Handed Southpaw Mode */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-purple-400" />
              <span>Mobile Joystick Handedness</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: false, label: '🕹️ Right-Handed (Default)', desc: 'Move on left, Look on right' },
                { id: true, label: '🕹️ Southpaw (Inverted)', desc: 'Look on left, Move on right' },
              ].map((opt) => {
                const isActive = prefs.swapJoystickSide === opt.id;
                return (
                  <button
                    key={String(opt.id)}
                    type="button"
                    onClick={() => update('swapJoystickSide', opt.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      isActive
                        ? 'border-purple-400 bg-purple-500/20 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                        : 'border-slate-800 bg-[#0E1524] text-slate-400 hover:border-slate-700'
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

        {/* Modal Footer */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#0E1524]">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center space-x-1.5 text-xs font-mono font-bold text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET DEFAULTS</span>
          </button>

          <div className="flex items-center space-x-3">
            {onOpenKeybindings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenKeybindings();
                }}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-cyan-500/20 border border-slate-700 hover:border-cyan-400 text-xs font-mono font-bold text-slate-200 hover:text-cyan-300 transition-all"
              >
                ⌨️ EDIT KEYBINDINGS
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all"
            >
              SAVE & CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
