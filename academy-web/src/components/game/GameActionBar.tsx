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
  MessageSquare,
  Coins,
  Skull,
  Swords,
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
  onOpenProfile?: () => void;
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
  onOpenProfile,
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const actions: {
    key: string;
    num: string;
    label: string;
    onClick: () => void;
    isActive: boolean;
    icon: React.ReactNode;
  }[] = [
    { key: 'alt1', num: 'Alt+1', label: 'Quests', onClick: () => onSelectView('courses'), isActive: activeView === 'courses', icon: <BookOpen className="w-5 h-5" /> },
    { key: 'alt2', num: 'Alt+2', label: 'Code Lab', onClick: () => onSelectView('lab'), isActive: activeView === 'lab', icon: <Terminal className="w-5 h-5" /> },
    { key: 'alt3', num: 'Alt+3', label: 'Deploy Rig', onClick: () => onSelectView('deploy'), isActive: activeView === 'deploy', icon: <Rocket className="w-5 h-5" /> },
    { key: 'alt4', num: 'Alt+4', label: 'Katunayan', onClick: () => onSelectView('verify'), isActive: activeView === 'verify', icon: <ShieldCheck className="w-5 h-5" /> },
    { key: 'alt5', num: 'Alt+5', label: 'Profile', onClick: () => { if (onOpenProfile) onOpenProfile(); else onSelectView('profile'); }, isActive: activeView === 'profile', icon: <User className="w-5 h-5 text-amber-400" /> },
    { key: 'alt6', num: 'Alt+6', label: 'Directory', onClick: () => onSelectView('projects'), isActive: activeView === 'projects', icon: <Award className="w-5 h-5" /> },
    { key: 'alt7', num: 'Alt+7', label: 'Avatar', onClick: () => onOpenHangar?.(), isActive: false, icon: <User className="w-5 h-5 text-cyan-400" /> },
    { key: 'alt8', num: 'Alt+8', label: 'img23D', onClick: () => onSelectView('img2threejs'), isActive: activeView === 'img2threejs', icon: <Box className="w-5 h-5" /> },
    { key: 'alt9', num: 'Alt+9', label: 'World Map', onClick: () => onSelectView('worldmap'), isActive: activeView === 'worldmap', icon: <Globe className="w-5 h-5 text-cyan-400" /> },
    { key: 'alt10', num: 'Alt+10', label: '70M Bounties', onClick: () => onSelectView('bounties'), isActive: activeView === 'bounties', icon: <Skull className="w-5 h-5 text-rose-400" /> },
    { key: 'l', num: 'L', label: 'World Gen', onClick: () => onSelectView('worldgen'), isActive: activeView === 'worldgen', icon: <Globe className="w-5 h-5 text-emerald-400" /> },
    { key: 'k', num: 'K', label: '₱ Farm & Forge', onClick: () => onSelectView('economy'), isActive: activeView === 'economy', icon: <Coins className="w-5 h-5 text-amber-400" /> },
    { key: 'u', num: 'U', label: 'PvP Arena', onClick: () => onSelectView('pvp'), isActive: activeView === 'pvp', icon: <Swords className="w-5 h-5 text-red-400" /> },
    { key: 'c', num: 'C', label: 'P2P Chat', onClick: () => onSelectView('chat'), isActive: activeView === 'chat', icon: <MessageSquare className="w-5 h-5 text-purple-400" /> },
  ];

  // Hotkey listener: Alt+1 to Alt+10 for bottom dock, plus F, M, Q, O, H, P, L, K, J, U, C
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Handle Alt + 1 through Alt + 10 (0 on number row)
      if (e.altKey) {
        let altIdx = -1;
        if (e.key >= '1' && e.key <= '9') {
          altIdx = parseInt(e.key) - 1;
        } else if (e.key === '0') {
          altIdx = 9; // Alt+10 mapped to 0 key
        }
        if (altIdx >= 0 && altIdx < 10 && altIdx < actions.length) {
          e.preventDefault();
          SoundFX.playClick();
          actions[altIdx].onClick();
          return;
        }
      }

      // Non-alt single hotkeys (F, M, Q, O, H, etc.)
      if (e.key.toLowerCase() === 'f' && !e.altKey && !e.ctrlKey) {
        SoundFX.playLaser();
        onRequestFaucet();
      } else if (e.key.toLowerCase() === 'm' && !e.altKey && !e.ctrlKey) {
        onToggleMute();
      } else if (e.key.toLowerCase() === 'q' && !e.altKey && !e.ctrlKey && onOpenQuests) {
        SoundFX.playClick();
        onOpenQuests();
      } else if (e.key.toLowerCase() === 'o' && !e.altKey && !e.ctrlKey && onOpenOptions) {
        SoundFX.playClick();
        onOpenOptions();
      } else if (e.key.toLowerCase() === 'h' && !e.altKey && !e.ctrlKey && onOpenTutorial) {
        SoundFX.playClick();
        onOpenTutorial();
      } else if (e.key.toLowerCase() === 'c' && !e.altKey && !e.ctrlKey) {
        SoundFX.playClick();
        onSelectView('chat');
      } else if (e.key.toLowerCase() === 'u' && !e.altKey && !e.ctrlKey) {
        SoundFX.playClick();
        onSelectView('pvp');
      } else if (e.key.toLowerCase() === 'l' && !e.altKey && !e.ctrlKey) {
        SoundFX.playClick();
        onSelectView('worldgen');
      } else if (e.key.toLowerCase() === 'k' && !e.altKey && !e.ctrlKey) {
        SoundFX.playClick();
        onSelectView('economy');
      } else if (e.key.toLowerCase() === 'j' && !e.altKey && !e.ctrlKey) {
        SoundFX.playClick();
        onSelectView('bounties');
      } else if (e.key.toLowerCase() === 'p' && !e.altKey && !e.ctrlKey) {
        SoundFX.playClick();
        if (onOpenProfile) onOpenProfile();
        else onSelectView('profile');
      } else if ((e.ctrlKey || e.altKey) && e.key.toLowerCase() === 'w' && onOpenWalletTerminal) {
        SoundFX.playClick();
        onOpenWalletTerminal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, onRequestFaucet, onToggleMute, onOpenQuests, onOpenOptions, onOpenTutorial, onOpenWalletTerminal, onOpenProfile]);

  if (isCollapsed) {
    return (
      <div className="flex justify-center animate-fade-in">
        <button
          type="button"
          onClick={() => {
            setIsCollapsed(false);
            SoundFX.playClick();
          }}
          className="px-4 py-1.5 rounded-t-2xl bg-[#0B0F17]/90 hover:bg-[#161F30] border-x border-t border-cyan-500/50 text-cyan-300 font-mono text-xs font-bold flex items-center space-x-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] backdrop-blur-md active:scale-95"
          title="Restore Bottom App Dock"
        >
          <span>▲ APPS DOCK</span>
          <span className="text-[10px] text-slate-400 font-mono">[Alt+1 to Alt+10]</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 p-2 rounded-2xl bg-[#0B0F17]/90 border border-slate-700/80 shadow-[0_0_30px_rgba(0,0,0,0.8)] backdrop-blur-md animate-fade-in">
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
            <span className="absolute top-0.5 left-1 font-mono text-[8px] font-black text-amber-400/90 tracking-tighter">
              {act.num}
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

      {/* Minimize Dock Button */}
      <button
        type="button"
        onClick={() => {
          setIsCollapsed(true);
          SoundFX.playClick();
        }}
        title="Minimize Apps Dock (Clear Bottom Screen)"
        className="w-7 h-14 sm:w-7 sm:h-16 rounded-xl bg-slate-900/80 hover:bg-cyan-500 text-slate-400 hover:text-slate-950 border border-slate-700 flex items-center justify-center text-xs font-bold transition-all"
      >
        ▼
      </button>
    </div>
  );
};
