import React, { useState } from 'react';
import { SoundFX } from '../../services/soundFX';
import { X, Minus, Maximize2, Minimize2 } from 'lucide-react';

interface FloatingGameWindowProps {
  title: string;
  subtitle?: string;
  icon?: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const FloatingGameWindow: React.FC<FloatingGameWindowProps> = ({
  title,
  subtitle,
  icon,
  isOpen,
  onClose,
  children,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen) return null;

  return (
    <div
      className={`fixed z-40 transition-all duration-300 flex flex-col ${
        isFullscreen
          ? 'inset-2 sm:inset-4'
          : 'inset-x-2 sm:inset-x-8 md:inset-x-16 top-16 bottom-20 max-w-6xl mx-auto'
      }`}
    >
      {/* Window Chassis */}
      <div className="w-full h-full rounded-3xl bg-[#0B0F17]/95 border-2 border-slate-700/80 shadow-[0_0_50px_rgba(0,0,0,0.9)] backdrop-blur-xl flex flex-col overflow-hidden relative">
        {/* Subtle Cyber Scanlines & Glow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-amber-500/5 pointer-events-none -z-10" />

        {/* Title Bar (LovecraftUI Retro Window Header) */}
        <div className="px-4 py-3 bg-[#161F30] border-b border-slate-800 flex items-center justify-between select-none">
          {/* Title & Icon */}
          <div className="flex items-center space-x-3">
            {icon && <span className="text-lg">{icon}</span>}
            <div>
              <h3 className="text-sm font-black text-white tracking-tight flex items-center space-x-2">
                <span>{title}</span>
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  SYSTEM ACTIVE
                </span>
              </h3>
              {subtitle && <p className="text-[11px] text-slate-400 font-mono">{subtitle}</p>}
            </div>
          </div>

          {/* Window Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                SoundFX.playClick();
                setIsFullscreen(!isFullscreen);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullscreen ? 'Restore Window' : 'Maximize Window'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={() => {
                SoundFX.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
              title="Close Window (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Window Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};
