/**
 * ProgressionFeedbackToast.tsx
 * Floating RPG Feedback Toast for live stat gains, XP boosts, and skill unlocks.
 * Features smooth micro-animations, glowing Filipino Cyberpunk accents, and sound FX.
 */

import React, { useState, useEffect } from 'react';
import { StatGainEventDetail } from '../../types/playerProgression';
import { PRIMARY_ATTRIBUTES_META } from '../../data/progressionMeta';

interface ToastItem {
  id: string;
  stat: string;
  amount: number;
  source?: string;
  icon: string;
  color: string;
  label: string;
}

export const ProgressionFeedbackToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleStatGain = (e: Event) => {
      const customEvent = e as CustomEvent<StatGainEventDetail>;
      const detail = customEvent.detail;
      if (!detail) return;

      let icon = '⚡';
      let color = '#F59E0B';
      let label = detail.stat.toUpperCase();

      if (detail.stat === 'xp') {
        icon = '✨';
        color = '#F59E0B';
        label = 'XP';
      } else if (detail.stat === 'sp') {
        icon = '🌟';
        color = '#8B5CF6';
        label = 'SKILL POINT';
      } else if (detail.stat === 'digitalPower') {
        icon = '⚡';
        color = '#06B6D4';
        label = 'DIGITAL POWER';
      } else if (PRIMARY_ATTRIBUTES_META[detail.stat as keyof typeof PRIMARY_ATTRIBUTES_META]) {
        const meta = PRIMARY_ATTRIBUTES_META[detail.stat as keyof typeof PRIMARY_ATTRIBUTES_META];
        icon = meta.icon;
        color = meta.color;
        label = meta.name.toUpperCase();
      }

      const item: ToastItem = {
        id: `${Date.now()}-${Math.random()}`,
        stat: detail.stat,
        amount: detail.amount,
        source: detail.source,
        icon,
        color,
        label,
      };

      setToasts((prev) => [...prev.slice(-4), item]);

      // Remove after 3.2s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, 3200);
    };

    window.addEventListener('piso-stat-gain-toast', handleStatGain);
    return () => window.removeEventListener('piso-stat-gain-toast', handleStatGain);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 pointer-events-none flex flex-col space-y-2 select-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-[#0F172A]/95 border shadow-2xl backdrop-blur-md animate-bounce-short transition-all"
          style={{
            borderColor: `${toast.color}90`,
            boxShadow: `0 0 25px ${toast.color}40`,
          }}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
            style={{ backgroundColor: `${toast.color}20` }}
          >
            {toast.icon}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-black" style={{ color: toast.color }}>
                +{toast.amount} {toast.label}
              </span>
            </div>
            {toast.source && (
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]">
                {toast.source}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
