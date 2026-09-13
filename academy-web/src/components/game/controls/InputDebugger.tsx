/**
 * PISO Academy Metaverse — Cross-Platform Game Control System
 * Real-Time Input Debugger Overlay
 */

import React, { useState, useEffect, useRef } from 'react';
import { InputManager } from '../../../controls/InputManager';
import { PlayerInput } from '../../../controls/InputTypes';
import { GamepadStateSnapshot } from '../../../controls/GamepadInput';

export const InputDebugger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [snapshot, setSnapshot] = useState<{
    input: PlayerInput;
    gamepad: GamepadStateSnapshot;
    fps: number;
  } | null>(null);

  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef(60);

  // Toggle with F3 or backtick (~)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'F3' || e.key === '`') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Update loop for debugger when open (20 Hz tick to conserve CPU)
  useEffect(() => {
    if (!isOpen) return;

    let animId: number;
    let lastTick = performance.now();

    const loop = (now: number) => {
      frameCountRef.current++;
      if (now - lastTimeRef.current >= 1000) {
        fpsRef.current = frameCountRef.current;
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      if (now - lastTick >= 50) {
        lastTick = now;
        const debugData = InputManager.instance.getDebugSnapshot();
        setSnapshot({
          input: debugData.input,
          gamepad: debugData.gamepad,
          fps: fpsRef.current,
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed top-20 right-4 z-40 px-2 py-1 rounded bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 font-mono text-[10px] font-bold backdrop-blur-sm transition-all opacity-40 hover:opacity-100"
        title="Open Input Debugger (Hotkey: F3 or `)"
      >
        🐛 INPUT DBG
      </button>
    );
  }

  const input = snapshot?.input;
  const gp = snapshot?.gamepad;

  return (
    <div className="fixed top-20 right-4 z-40 w-72 p-3.5 rounded-2xl bg-[#070B12]/95 border-2 border-cyan-500/60 shadow-[0_0_30px_rgba(6,182,212,0.3)] font-mono text-xs text-slate-200 backdrop-blur-xl animate-fade-in select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-black text-cyan-400 text-[11px] uppercase tracking-wider">
            INPUT PIPELINE DEBUG
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
            {snapshot?.fps || 60} FPS
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-white text-sm leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      {input ? (
        <div className="space-y-2">
          {/* Active Device Badge */}
          <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400">ACTIVE DEVICE:</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                input.activeDevice === 'gamepad'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : input.activeDevice === 'touch'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {input.activeDevice}
            </span>
          </div>

          {/* Movement Vector */}
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>MOVE X:</span>
              <span className="font-bold text-white font-mono">{input.moveX.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>MOVE Y:</span>
              <span className="font-bold text-white font-mono">{input.moveY.toFixed(3)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>MAGNITUDE:</span>
              <span className="font-bold text-cyan-300 font-mono">
                {(input.moveMagnitude * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Camera Look Vector */}
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>LOOK X (Yaw):</span>
              <span className="font-bold text-amber-300 font-mono">{input.lookX.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>LOOK Y (Pitch):</span>
              <span className="font-bold text-amber-300 font-mono">{input.lookY.toFixed(4)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>ZOOM DELTA:</span>
              <span className="font-bold text-white font-mono">{input.zoomDelta.toFixed(1)}</span>
            </div>
          </div>

          {/* Digital Action Triggers */}
          <div className="grid grid-cols-2 gap-1.5 text-[10px]">
            <div
              className={`p-1.5 rounded text-center font-bold border ${
                input.jump || input.jumpHeld
                  ? 'bg-amber-500/25 text-amber-300 border-amber-400'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              JUMP: {input.jump ? 'TRIGGER' : input.jumpHeld ? 'HELD' : 'OFF'}
            </div>
            <div
              className={`p-1.5 rounded text-center font-bold border ${
                input.sprint
                  ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              SPRINT: {input.sprint ? 'ON' : 'OFF'}
            </div>
            <div
              className={`p-1.5 rounded text-center font-bold border ${
                input.interact || input.interactHeld
                  ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              INTERACT: {input.interact ? 'PRESS' : input.interactHeld ? 'HELD' : 'OFF'}
            </div>
            <div
              className={`p-1.5 rounded text-center font-bold border ${
                input.mine
                  ? 'bg-purple-500/25 text-purple-300 border-purple-400'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              MINE: {input.mine ? 'ON' : 'OFF'}
            </div>
          </div>

          {/* Gamepad Section */}
          <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[10px] space-y-1">
            <div className="flex justify-between items-center text-slate-400">
              <span>GAMEPAD:</span>
              <span className={`font-bold ${gp?.connected ? 'text-emerald-400' : 'text-slate-600'}`}>
                {gp?.connected ? '🟢 CONNECTED' : '⚪ NONE'}
              </span>
            </div>
            {gp?.connected && (
              <div className="text-[9px] text-slate-400 truncate">
                {gp.id}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-3 text-slate-500">Initializing...</div>
      )}

      <div className="mt-2 text-[9px] text-slate-500 text-center">
        Toggle with [F3] or [`] key
      </div>
    </div>
  );
};
