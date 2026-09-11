import React, { useEffect } from 'react';
import { NavView } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  BookOpen,
  Terminal,
  Rocket,
  ShieldCheck,
  User,
  Award,
  Droplets,
  Volume2,
  VolumeX,
  Box,
  Globe,
  Key,
} from 'lucide-react';

interface GameActionBarProps {
  activeView: NavView;
  onSelectView: (view: NavView) => void;
  onRequestFaucet: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenHangar?: () => void;
  onOpenQuests?: () => void;
  onOpenOptions?: () => void;
  onOpenTutorial?: () => void;
  onOpenWalletTerminal?: () => void;
}

export const GameActionBar: React.FC<GameActionBarProps> = ({
  activeView,
  onSelectView,
  onRequestFaucet,
  isMuted,
  onToggleMute,
  onOpenHangar,
  onOpenQuests,
  onOpenOptions,
  onOpenTutorial,
  onOpenWalletTerminal,
}) => {
  const actions: {
    key: string;
    num: string;
    label: string;
    onClick: () => void;
    isActive: boolean;
    icon: React.ReactNode;
  }[] = [
    { key: '1', num: '1', label: 'Quests', onClick: () => onSelectView('courses'), isActive: activeView === 'courses', icon: <BookOpen className="w-5 h-5" /> },
    { key: '2', num: '2', label: 'Code Lab', onClick: () => onSelectView('lab'), isActive: activeView === 'lab', icon: <Terminal className="w-5 h-5" /> },
    { key: '3', num: '3', label: 'Deploy Rig', onClick: () => onSelectView('deploy'), isActive: activeView === 'deploy', icon: <Rocket className="w-5 h-5" /> },
    { key: '4', num: '4', label: 'Katunayan', onClick: () => onSelectView('verify'), isActive: activeView === 'verify', icon: <ShieldCheck className="w-5 h-5" /> },
    { key: '5', num: '5', label: 'Inventory', onClick: () => onSelectView('profile'), isActive: activeView === 'profile', icon: <User className="w-5 h-5" /> },
    { key: '6', num: '6', label: 'Directory', onClick: () => onSelectView('projects'), isActive: activeView === 'projects', icon: <Award className="w-5 h-5" /> },
    { key: '7', num: '7', label: 'Avatar', onClick: () => onOpenHangar?.(), isActive: false, icon: <User className="w-5 h-5 text-amber-400" /> },
    { key: '8', num: '8', label: 'img23D', onClick: () => onSelectView('img2threejs'), isActive: activeView === 'img2threejs', icon: <Box className="w-5 h-5" /> },
    { key: '9', num: '9', label: 'World Map', onClick: () => onSelectView('worldmap'), isActive: activeView === 'worldmap', icon: <Globe className="w-5 h-5 text-cyan-400" /> },
  ];

  // Hotkey listener (1-8, F, M, Q, O, H)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= actions.length) {
        SoundFX.playClick();
        actions[num - 1].onClick();
      } else if (e.key.toLowerCase() === 'f') {
        SoundFX.playLaser();
        onRequestFaucet();
      } else if (e.key.toLowerCase() === 'm') {
        onToggleMute();
      } else if (e.key.toLowerCase() === 'q' && onOpenQuests) {
        SoundFX.playClick();
        onOpenQuests();
      } else if (e.key.toLowerCase() === 'o' && onOpenOptions) {
        SoundFX.playClick();
        onOpenOptions();
      } else if (e.key.toLowerCase() === 'h' && onOpenTutorial) {
        SoundFX.playClick();
        onOpenTutorial();
      } else if ((e.key.toLowerCase() === 'k' || (e.key.toLowerCase() === 'w' && (e.ctrlKey || e.altKey))) && onOpenWalletTerminal) {
        SoundFX.playClick();
        onOpenWalletTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, onRequestFaucet, onToggleMute, onOpenQuests, onOpenOptions, onOpenTutorial, onOpenWalletTerminal]);

  return (
    <div className="flex items-center space-x-2 p-2 rounded-2xl bg-[#0B0F17]/90 border border-slate-700/80 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md">
      {/* 1-8 Action Buttons */}
      {actions.map((act) => {
        return (
          <button
            key={act.key}
            onClick={() => {
              SoundFX.playClick();
              act.onClick();
            }}
            className={`relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl flex flex-col items-center justify-center transition-all group ${
              act.isActive
                ? 'bg-gradient-to-b from-amber-500/30 to-blue-600/30 border-2 border-amber-400 text-white shadow-glow'
                : 'bg-slate-900/80 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white'
            }`}
          >
            {/* Hotkey Number Badge */}
            <span className="absolute top-1 left-1.5 font-mono text-[9px] font-black text-amber-400 opacity-90">
              [{act.num}]
            </span>

            <div className="mt-2">{act.icon}</div>
            <span className="text-[9px] font-bold mt-0.5 tracking-tight">{act.label}</span>
          </button>
        );
      })}

      <div className="w-[1px] h-10 bg-slate-800" />

      {/* Wallet Studio Quick-Terminal Button */}
      {onOpenWalletTerminal && (
        <button
          onClick={() => {
            SoundFX.playClick();
            onOpenWalletTerminal();
          }}
          title="PISO Wallet Studio Terminal (Hotkey: K or W)"
          className="relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-amber-950/40 border border-amber-500/60 hover:border-amber-400 text-amber-400 hover:text-amber-300 flex flex-col items-center justify-center transition-all shadow-sm"
        >
          <span className="absolute top-1 left-1.5 font-mono text-[9px] font-black text-amber-400">
            [K]
          </span>
          <Key className="w-5 h-5 mt-2" />
          <span className="text-[9px] font-bold mt-0.5">Wallet</span>
        </button>
      )}

      {/* Faucet Hotkey Button */}
      <button
        onClick={() => {
          SoundFX.playLaser();
          onRequestFaucet();
        }}
        title="Request 1.0 PISO Testnet Drip (Hotkey: F)"
        className="relative w-12 h-14 sm:w-14 sm:h-16 rounded-xl bg-emerald-950/50 border border-emerald-600/60 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 flex flex-col items-center justify-center transition-all shadow-sm"
      >
        <span className="absolute top-1 left-1.5 font-mono text-[9px] font-black text-emerald-400">
          [F]
        </span>
        <Droplets className="w-5 h-5 mt-2" />
        <span className="text-[9px] font-bold mt-0.5">Faucet</span>
      </button>

      {/* Audio Mute Button */}
      <button
        onClick={onToggleMute}
        title="Toggle Audio Effects (Hotkey: M)"
        className="w-10 h-14 sm:w-10 sm:h-16 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
      </button>
    </div>
  );
};
