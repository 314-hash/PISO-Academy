/**
 * PISO Academy Metaverse — Cross-Platform Game Control System
 * Dual Virtual Joysticks: Left Move + Right Camera Look
 * Zero-dependency, pure PointerEvent multitouch isolation
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { InputManager } from '../../../controls/InputManager';

interface DualVirtualJoystickProps {
  swapSides?: boolean;
  className?: string;
}

export const DualVirtualJoystick: React.FC<DualVirtualJoystickProps> = ({
  swapSides = false,
  className = '',
}) => {
  // Left Joystick (Movement)
  const leftBaseRef = useRef<HTMLDivElement>(null);
  const [leftThumb, setLeftThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [leftActive, setLeftActive] = useState(false);
  const leftPointerId = useRef<number | null>(null);

  // Right Joystick (Camera Orbit Look)
  const rightBaseRef = useRef<HTMLDivElement>(null);
  const [rightThumb, setRightThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rightActive, setRightActive] = useState(false);
  const rightPointerId = useRef<number | null>(null);
  const prevRightPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const radius = 52; // Max thumb travel radius in px
  const deadzone = 0.1; // 10% radial deadzone

  // --- Left Joystick (Move) Handlers ---
  const handleLeftPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (leftPointerId.current !== null) return;
    leftPointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setLeftActive(true);
    InputManager.instance.touch.vibrate(12);

    if (!leftBaseRef.current) return;
    const rect = leftBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const tx = Math.cos(angle) * clampedDist;
    const ty = Math.sin(angle) * clampedDist;

    setLeftThumb({ x: tx, y: ty });

    // Normalized coordinates (-1 to 1; forward is dy < 0)
    const normDist = clampedDist / radius;
    if (normDist > deadzone) {
      const normX = tx / radius;
      const normY = -(ty / radius); // Invert Y so up is forward (+1)
      InputManager.instance.touch.setMoveInput(normX, normY, normDist, true);
    } else {
      InputManager.instance.touch.setMoveInput(0, 0, 0, true);
    }
  }, [radius, deadzone]);

  const handleLeftPointerMove = useCallback((e: React.PointerEvent) => {
    if (!leftActive || leftPointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    if (!leftBaseRef.current) return;
    const rect = leftBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const tx = Math.cos(angle) * clampedDist;
    const ty = Math.sin(angle) * clampedDist;

    setLeftThumb({ x: tx, y: ty });

    const normDist = clampedDist / radius;
    if (normDist > deadzone) {
      const normX = tx / radius;
      const normY = -(ty / radius);
      InputManager.instance.touch.setMoveInput(normX, normY, normDist, true);
    } else {
      InputManager.instance.touch.setMoveInput(0, 0, 0, true);
    }
  }, [leftActive, radius, deadzone]);

  const handleLeftPointerUp = useCallback((e: React.PointerEvent) => {
    if (leftPointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    leftPointerId.current = null;
    setLeftActive(false);
    setLeftThumb({ x: 0, y: 0 });
    InputManager.instance.touch.setMoveInput(0, 0, 0, false);
  }, []);

  // --- Right Joystick (Look) Handlers ---
  const handleRightPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (rightPointerId.current !== null) return;
    rightPointerId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setRightActive(true);
    prevRightPos.current = { x: e.clientX, y: e.clientY };

    if (!rightBaseRef.current) return;
    const rect = rightBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    setRightThumb({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });
  }, [radius]);

  const handleRightPointerMove = useCallback((e: React.PointerEvent) => {
    if (!rightActive || rightPointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.clientX - prevRightPos.current.x;
    const deltaY = e.clientY - prevRightPos.current.y;
    prevRightPos.current = { x: e.clientX, y: e.clientY };

    // Emit look delta to InputManager
    InputManager.instance.touch.setLookDelta(deltaX, deltaY, true);

    if (!rightBaseRef.current) return;
    const rect = rightBaseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.hypot(dx, dy);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    setRightThumb({
      x: Math.cos(angle) * clampedDist,
      y: Math.sin(angle) * clampedDist,
    });
  }, [rightActive, radius]);

  const handleRightPointerUp = useCallback((e: React.PointerEvent) => {
    if (rightPointerId.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    rightPointerId.current = null;
    setRightActive(false);
    setRightThumb({ x: 0, y: 0 });
    InputManager.instance.touch.setLookDelta(0, 0, false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      InputManager.instance.touch.setMoveInput(0, 0, 0, false);
      InputManager.instance.touch.setLookDelta(0, 0, false);
    };
  }, []);

  const movePositionClass = swapSides
    ? 'right-4 sm:right-8'
    : 'left-4 sm:left-8';

  const lookPositionClass = swapSides
    ? 'left-4 sm:left-8'
    : 'right-4 sm:right-8';

  return (
    <div
      className={`fixed inset-x-0 bottom-0 pointer-events-none select-none z-20 ${className}`}
      style={{
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 16px)',
        paddingRight: 'max(env(safe-area-inset-right, 0px), 16px)',
      }}
    >
      {/* 1. LEFT / MOVEMENT JOYSTICK */}
      <div
        className={`fixed bottom-24 ${movePositionClass} pointer-events-auto select-none touch-none`}
      >
        <div
          ref={leftBaseRef}
          onPointerDown={handleLeftPointerDown}
          onPointerMove={handleLeftPointerMove}
          onPointerUp={handleLeftPointerUp}
          onPointerCancel={handleLeftPointerUp}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all ${
            leftActive
              ? 'bg-slate-950/75 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.45)]'
              : 'bg-slate-950/50 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,0,0,0.6)]'
          } backdrop-blur-md cursor-grab active:cursor-grabbing`}
        >
          {/* Outer Compass Cardinal Markings */}
          <div className="absolute inset-2 rounded-full border border-dashed border-cyan-500/20 pointer-events-none flex items-center justify-center">
            <span className="absolute top-1 text-[9px] font-mono font-bold text-cyan-400/60">▲ FWD</span>
            <span className="absolute bottom-1 text-[9px] font-mono font-bold text-cyan-400/60">▼ REV</span>
            <span className="absolute left-1 text-[9px] font-mono font-bold text-cyan-400/60">◀ L</span>
            <span className="absolute right-1 text-[9px] font-mono font-bold text-cyan-400/60">R ▶</span>
          </div>

          {/* Center Crosshair Ring */}
          <div className="w-10 h-10 rounded-full border border-cyan-400/30 pointer-events-none flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/50" />
          </div>

          {/* Dynamic Thumb Knob */}
          <div
            className={`absolute w-16 h-16 rounded-full flex flex-col items-center justify-center transition-transform duration-75 pointer-events-none ${
              leftActive
                ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 border-2 border-white shadow-[0_0_20px_rgba(6,182,212,0.8)] scale-105'
                : 'bg-slate-900/90 border-2 border-cyan-500/60 text-cyan-400 shadow-md'
            }`}
            style={{
              transform: `translate(${leftThumb.x}px, ${leftThumb.y}px)`,
            }}
          >
            <span className="text-base font-black">🕹️</span>
            <span className="text-[8px] font-mono font-black uppercase tracking-wider">
              {leftActive ? 'MOVE' : 'WALK'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. RIGHT / CAMERA LOOK JOYSTICK */}
      <div
        className={`fixed bottom-24 ${lookPositionClass} pointer-events-auto select-none touch-none`}
      >
        <div
          ref={rightBaseRef}
          onPointerDown={handleRightPointerDown}
          onPointerMove={handleRightPointerMove}
          onPointerUp={handleRightPointerUp}
          onPointerCancel={handleRightPointerUp}
          className={`relative w-36 h-36 rounded-full flex items-center justify-center transition-all ${
            rightActive
              ? 'bg-slate-950/75 border-2 border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.45)]'
              : 'bg-slate-950/50 border border-amber-500/30 shadow-[0_0_20px_rgba(0,0,0,0.6)]'
          } backdrop-blur-md cursor-grab active:cursor-grabbing`}
        >
          {/* Camera Orbit Ring Reticle */}
          <div className="absolute inset-2 rounded-full border border-dashed border-amber-500/25 pointer-events-none flex items-center justify-center">
            <span className="absolute top-1 text-[9px] font-mono font-bold text-amber-400/70">UP</span>
            <span className="absolute bottom-1 text-[9px] font-mono font-bold text-amber-400/70">DOWN</span>
            <span className="absolute left-1 text-[9px] font-mono font-bold text-amber-400/70">ORBIT</span>
            <span className="absolute right-1 text-[9px] font-mono font-bold text-amber-400/70">ORBIT</span>
          </div>

          {/* Center Target Marker */}
          <div className="w-10 h-10 rounded-full border border-amber-400/30 pointer-events-none flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400/60" />
          </div>

          {/* Dynamic Look Knob */}
          <div
            className={`absolute w-16 h-16 rounded-full flex flex-col items-center justify-center transition-transform duration-75 pointer-events-none ${
              rightActive
                ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-2 border-white shadow-[0_0_20px_rgba(245,158,11,0.8)] scale-105'
                : 'bg-slate-900/90 border-2 border-amber-500/60 text-amber-400 shadow-md'
            }`}
            style={{
              transform: `translate(${rightThumb.x}px, ${rightThumb.y}px)`,
            }}
          >
            <span className="text-base font-black">👁️</span>
            <span className="text-[8px] font-mono font-black uppercase tracking-wider">
              {rightActive ? 'LOOK' : 'CAM'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
