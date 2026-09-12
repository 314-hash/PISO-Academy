import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface MobileMoveVector {
  x: number; // -1 to 1 (left to right)
  z: number; // -1 to 1 (forward to back, where -1 is forward)
  intensity: number; // 0 to 1
  active: boolean;
}

interface VirtualTouchJoystickProps {
  onMove?: (vec: MobileMoveVector) => void;
  className?: string;
}

export const VirtualTouchJoystick: React.FC<VirtualTouchJoystickProps> = ({
  onMove,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchPos, setTouchPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);
  const activePointerIdRef = useRef<number | null>(null);

  const radius = 56; // Max thumb knob travel radius in px

  const emitMove = useCallback(
    (dx: number, dy: number, active: boolean) => {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const intensity = Math.min(1, dist / radius);
      const normalizedX = dist > 0 ? dx / radius : 0;
      const normalizedZ = dist > 0 ? dy / radius : 0; // dy is positive downwards (backward), negative upwards (forward)

      const payload: MobileMoveVector = {
        x: normalizedX,
        z: normalizedZ,
        intensity,
        active,
      };

      onMove?.(payload);
      window.dispatchEvent(new CustomEvent('piso-mobile-move', { detail: payload }));
    },
    [onMove, radius]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (activePointerIdRef.current !== null) return;
    activePointerIdRef.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    setIsActive(true);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(10);
      } catch {
        // Ignore haptics failure if unsupported
      }
    }

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const targetX = Math.cos(angle) * clampedDist;
    const targetY = Math.sin(angle) * clampedDist;

    setTouchPos({ x: targetX, y: targetY });
    emitMove(targetX, targetY, true);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isActive || activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const clampedDist = Math.min(dist, radius);
    const angle = Math.atan2(dy, dx);

    const targetX = Math.cos(angle) * clampedDist;
    const targetY = Math.sin(angle) * clampedDist;

    setTouchPos({ x: targetX, y: targetY });
    emitMove(targetX, targetY, true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (activePointerIdRef.current !== e.pointerId) return;
    e.preventDefault();
    e.stopPropagation();

    activePointerIdRef.current = null;
    setIsActive(false);
    setTouchPos({ x: 0, y: 0 });
    emitMove(0, 0, false);
  };

  useEffect(() => {
    // Reset on window blur or unmount
    return () => {
      window.dispatchEvent(
        new CustomEvent('piso-mobile-move', {
          detail: { x: 0, z: 0, intensity: 0, active: false },
        })
      );
    };
  }, []);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={{ touchAction: 'none' }}
      className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full select-none flex items-center justify-center backdrop-blur-md transition-all ${className} ${
        isActive
          ? 'bg-cyan-950/40 border-2 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.45)]'
          : 'bg-[#0B0F17]/85 border-2 border-slate-700/60 shadow-[0_0_15px_rgba(0,0,0,0.5)]'
      }`}
    >
      {/* Outer directional arrows */}
      <div className="absolute inset-2 rounded-full border border-dashed border-white/10 pointer-events-none flex items-center justify-center">
        <span className="absolute top-1 text-[9px] font-mono font-bold text-slate-400">▲</span>
        <span className="absolute bottom-1 text-[9px] font-mono font-bold text-slate-400">▼</span>
        <span className="absolute left-1 text-[9px] font-mono font-bold text-slate-400">◀</span>
        <span className="absolute right-1 text-[9px] font-mono font-bold text-slate-400">▶</span>
      </div>

      {/* Center crosshair */}
      <div className="w-2 h-2 rounded-full bg-white/20 pointer-events-none" />

      {/* Dynamic Thumb Knob */}
      <div
        className={`absolute w-12 h-12 rounded-full shadow-lg pointer-events-none flex items-center justify-center transition-transform duration-75 ${
          isActive
            ? 'bg-gradient-to-tr from-cyan-500 to-amber-400 border-2 border-white scale-110 shadow-[0_0_20px_rgba(6,182,212,0.7)]'
            : 'bg-gradient-to-tr from-slate-700 to-slate-800 border border-slate-600'
        }`}
        style={{
          transform: `translate3d(${touchPos.x}px, ${touchPos.y}px, 0)`,
        }}
      >
        <div className="w-4 h-4 rounded-full bg-white/40" />
      </div>

      {/* Touch Pill Label */}
      <span className="absolute -bottom-5 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 drop-shadow">
        {isActive ? '🕹️ MOVING' : '🕹️ D-PAD'}
      </span>
    </div>
  );
};
