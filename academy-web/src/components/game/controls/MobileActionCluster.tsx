/**
 * PISO Academy Metaverse — Cross-Platform Game Control System
 * Compact Mobile Action Cluster & Context-Aware Interaction Button
 */

import React, { useState, useEffect } from 'react';
import { InputManager } from '../../../controls/InputManager';
import { InteractionContextTarget } from '../../../controls/InputTypes';
import { SoundFX } from '../../../services/soundFX';

interface MobileActionClusterProps {
  onTriggerSkill?: () => void;
  className?: string;
  swapSides?: boolean;
}

export const MobileActionCluster: React.FC<MobileActionClusterProps> = ({
  onTriggerSkill,
  className = '',
  swapSides = false,
}) => {
  const [contextTarget, setContextTarget] = useState<InteractionContextTarget | null>(() =>
    InputManager.instance.getContextTarget()
  );
  const [isSprintLocked, setIsSprintLocked] = useState<boolean>(() =>
    InputManager.instance.touch.isSprintActive()
  );

  // Subscribe to context-aware proximity changes from InputManager
  useEffect(() => {
    const unsubscribe = InputManager.instance.subscribeContextChange((target) => {
      setContextTarget(target);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleJump = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    InputManager.instance.touch.triggerJump();
    window.dispatchEvent(new CustomEvent('piso-player-jump'));
  };

  const handleInteract = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    InputManager.instance.touch.triggerInteract();

    if (contextTarget) {
      if (contextTarget.type === 'mentor' && contextTarget.targetObject) {
        SoundFX.playBlip();
        window.dispatchEvent(
          new CustomEvent('piso-interact-mentor', { detail: { mentor: contextTarget.targetObject } })
        );
      } else if (contextTarget.type === 'player' && contextTarget.targetObject) {
        SoundFX.playBlip();
        window.dispatchEvent(
          new CustomEvent('piso-interact-player', { detail: { player: contextTarget.targetObject } })
        );
      } else if (contextTarget.type === 'district' && contextTarget.targetObject) {
        SoundFX.playWarp();
        window.dispatchEvent(
          new CustomEvent('piso-interact-district', { detail: { district: contextTarget.targetObject } })
        );
      } else if (contextTarget.type === 'block') {
        SoundFX.playLaser();
        InputManager.instance.touch.triggerMine();
      }
    } else {
      // Default: Trigger primary interact or cycle next option
      window.dispatchEvent(new CustomEvent('piso-cycle-next-mentor'));
    }
  };

  const handleSprintToggle = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = InputManager.instance.touch.toggleSprint();
    setIsSprintLocked(nextState);
    SoundFX.playClick();
  };

  const handlePrimaryPower = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    InputManager.instance.touch.triggerActionPrimary();
    if (onTriggerSkill) {
      onTriggerSkill();
    } else {
      window.dispatchEvent(new CustomEvent('piso-trigger-superpower', { detail: { powerId: 'kamehameha' } }));
    }
  };

  const positionClass = swapSides
    ? 'left-4 sm:left-8 items-start'
    : 'right-4 sm:right-8 items-end';

  return (
    <div
      className={`fixed bottom-64 ${positionClass} z-20 flex flex-col space-y-3 pointer-events-auto select-none touch-none ${className}`}
      style={{
        paddingRight: 'max(env(safe-area-inset-right, 0px), 12px)',
        paddingLeft: 'max(env(safe-area-inset-left, 0px), 12px)',
      }}
    >
      {/* 1. DYNAMIC CONTEXT-AWARE INTERACT BUTTON */}
      {contextTarget && (
        <button
          type="button"
          onPointerDown={handleInteract}
          className="group relative flex items-center space-x-2.5 px-4 py-3 rounded-2xl border-2 shadow-[0_0_30px_rgba(245,158,11,0.5)] backdrop-blur-xl active:scale-95 transition-all animate-bounce"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.92)',
            borderColor: contextTarget.color || '#F59E0B',
          }}
          title={contextTarget.name}
        >
          {/* Animated Halo Pulse */}
          <span
            className="absolute -inset-1 rounded-2xl opacity-40 animate-ping pointer-events-none"
            style={{ backgroundColor: contextTarget.color || '#F59E0B' }}
          />

          <span className="text-xl relative z-10">{contextTarget.icon || '💬'}</span>
          <div className="flex flex-col items-start relative z-10">
            <span
              className="text-[10px] font-mono font-black uppercase tracking-wider"
              style={{ color: contextTarget.color || '#FBBF24' }}
            >
              [E] {contextTarget.actionLabel} ({contextTarget.distance.toFixed(1)}m)
            </span>
            <span className="text-xs font-bold text-white max-w-[130px] truncate">
              {contextTarget.name}
            </span>
          </div>
        </button>
      )}

      {/* 2. COMPACT ACTION ROW: SPRINT + POWER + JUMP */}
      <div className="flex items-center space-x-2.5">
        {/* Sprint / Turbo Lock Toggle */}
        <button
          type="button"
          onPointerDown={handleSprintToggle}
          className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl border transition-all active:scale-90 shadow-md ${
            isSprintLocked
              ? 'bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 border-white shadow-[0_0_20px_rgba(6,182,212,0.6)] font-black'
              : 'bg-slate-950/80 text-cyan-400 border-cyan-500/40 hover:border-cyan-300'
          }`}
          title="Sprint / Turbo Boost Lock"
        >
          <span className="text-sm">⚡</span>
          <span className="text-[8px] font-mono font-black uppercase">
            {isSprintLocked ? 'RUN' : 'SPRINT'}
          </span>
        </button>

        {/* Primary Superpower / Mine Attack Button */}
        <button
          type="button"
          onPointerDown={handlePrimaryPower}
          className="flex flex-col items-center justify-center w-13 h-13 rounded-2xl bg-gradient-to-tr from-purple-700/80 to-purple-500/90 text-white border-2 border-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.5)] active:scale-90 transition-all"
          title="Cast Primary Superpower / Mine"
        >
          <span className="text-base">💥</span>
          <span className="text-[8px] font-mono font-black uppercase">POWER</span>
        </button>

        {/* Prominent Jump / Double-Jump Button */}
        <button
          type="button"
          onPointerDown={handleJump}
          className="flex flex-col items-center justify-center w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 border-2 border-white shadow-[0_0_30px_rgba(245,158,11,0.7)] active:scale-90 transition-all cursor-pointer"
          title="Jump / Thruster Double-Jump"
        >
          <div className="flex items-center space-x-0.5 text-slate-950 font-black leading-none text-base">
            <span>▲</span>
            <span className="text-xs">▲</span>
          </div>
          <span className="text-[9px] font-mono font-black uppercase tracking-wider mt-0.5">
            JUMP
          </span>
        </button>
      </div>
    </div>
  );
};
