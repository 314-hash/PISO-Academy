import React, { useState, useEffect } from 'react';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  Flame,
  Zap,
  Coins,
  Radio,
  Monitor,
  Gamepad2,
  Shield,
  Layers,
  Award,
  Settings,
  Rocket,
  Key,
  Wallet,
  Bell,
} from 'lucide-react';
import { PISO_NETWORK } from '../../pisoConfig';
import { getRankForLevel } from '../../data/progressionMeta';
import { PlayerProgressionEngine } from '../../services/playerProgressionEngine';
import { MultiplayerNetworkEngine } from '../../services/multiplayer/MultiplayerNetworkEngine';

interface GameTopBarProps {
  gameMode: boolean;
  onToggleGameMode: () => void;
  onOpenTutorial?: () => void;
  onOpenQuests?: () => void;
  onOpenHangar?: () => void;
  onOpenOptions?: () => void;
  onOpenWalletTerminal?: () => void;
  onOpenProfile?: () => void;
  onOpenAvatarSelection?: () => void;
}

export const GameTopBar: React.FC<GameTopBarProps> = ({
  gameMode,
  onToggleGameMode,
  onOpenTutorial,
  onOpenQuests,
  onOpenHangar,
  onOpenOptions,
  onOpenWalletTerminal,
  onOpenProfile,
  onOpenAvatarSelection,
}) => {
  const { wallet, xp, level, levelTitle, connectInjectedWallet, openConnectWalletModal, avatarMode, humanAvatar, saveStatus, unreadSecurityCount } = useAcademy();

  const [currentBlock, setCurrentBlock] = useState(125490);
  const [pulseActive, setPulseActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number>(1);

  const currentRank = getRankForLevel(level);
  let digitalPower = 15;
  try {
    digitalPower = PlayerProgressionEngine.getProfile().secondaryAttributes.digitalPower;
  } catch {}

  // 3-second block heartbeat simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBlock((prev) => prev + 1);
      setPulseActive(true);
      setTimeout(() => setPulseActive(false), 800);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Sync multiplayer connected students count
  useEffect(() => {
    const updateCount = () => {
      setOnlineCount(MultiplayerNetworkEngine.instance.getConnectedPeerCount() + 1);
    };
    updateCount();
    MultiplayerNetworkEngine.instance.on('onPlayerJoin', updateCount);
    MultiplayerNetworkEngine.instance.on('onPlayerLeave', updateCount);
    const countInterval = setInterval(updateCount, 2500);
    return () => {
      MultiplayerNetworkEngine.instance.off('onPlayerJoin', updateCount);
      MultiplayerNetworkEngine.instance.off('onPlayerLeave', updateCount);
      clearInterval(countInterval);
    };
  }, []);

  const gasHpPercent = Math.min(100, Math.max(15, parseFloat(wallet.balance) * 10));

  // Collapsed Top Pull Tab Chip
  if (isCollapsed) {
    return (
      <div className="fixed top-0 left-1/2 -translate-x-1/2 z-40 animate-fade-in">
        <button
          type="button"
          onClick={() => {
            setIsCollapsed(false);
            SoundFX.playClick();
          }}
          className="px-3.5 py-1 rounded-b-2xl bg-[#0B0F17]/90 hover:bg-[#161F30] border-x border-b border-amber-500/50 text-amber-300 font-mono text-xs font-bold flex items-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] backdrop-blur-md active:scale-95"
          title="Restore Top Status Bar"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>₱ PISO ACADEMY 2090</span>
          <span className="text-[10px] text-slate-400">▼</span>
        </button>
      </div>
    );
  }

  return (
    <header className="p-3 bg-[#0B0F17]/90 border-b border-slate-800/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 select-none animate-fade-in">
      {/* Brand & Devnet Status */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-blue-600 to-amber-500 p-0.5 shadow-glow flex items-center justify-center">
          <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
            <span className="font-mono font-black text-amber-400 text-lg">₱</span>
          </div>
        </div>

        <div>
          <div className="flex items-center space-x-2">
            <span className="text-sm font-black text-white font-sans tracking-tight">PISO ACADEMY 2090</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
              Cyber-Bayanihan
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
            <div className="flex items-center space-x-1">
              <span className={`w-2 h-2 rounded-full ${pulseActive ? 'bg-amber-400 scale-125' : 'bg-emerald-400'} transition-all`} />
              <span>Block #{currentBlock.toLocaleString()}</span>
            </div>
            <span>•</span>
            <span className="text-slate-500">Clique 3.0s</span>
            <span>•</span>
            <span className="text-blue-400">Chain: {PISO_NETWORK.chainId}</span>
          </div>
        </div>
      </div>

      {/* Center: HP (Gas / PISO) & Mana Bars (LovecraftUI RPG Gauge) */}
      <div className="hidden md:flex items-center space-x-6">
        {/* HP: Gas / PISO Balance */}
        <div
          onClick={() => {
            if (onOpenWalletTerminal) {
              SoundFX.playClick();
              onOpenWalletTerminal();
            }
          }}
          className={`space-y-1 w-36 ${onOpenWalletTerminal ? 'cursor-pointer group' : ''}`}
          title="Buksan ang PISO Wallet Studio Terminal [W]"
        >
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-emerald-400 flex items-center space-x-1 group-hover:text-amber-300 transition-colors">
              <Coins className="w-3 h-3 text-amber-400" />
              <span>GAS (₱ PISO)</span>
            </span>
            <span className="text-white group-hover:text-amber-400 transition-colors">{parseFloat(wallet.balance).toFixed(2)} ₱</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden group-hover:border-amber-500/50 transition-colors">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-300"
              style={{ width: `${gasHpPercent}%` }}
            />
          </div>
        </div>

        {/* Mana: Devnet TPS / Bandwidth */}
        <div className="space-y-1 w-36">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-blue-400 flex items-center space-x-1">
              <Zap className="w-3 h-3 text-blue-400" />
              <span>RPC LATENCY</span>
            </span>
            <span className="text-white">28 ms</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 w-[85%]" />
          </div>
        </div>
      </div>

      {/* Right: XP Rank + Dual-Mode Switcher */}
      <div className="flex items-center space-x-3">
        {/* Live Multiplayer Online Students Pill */}
        <button
          type="button"
          onClick={() => {
            SoundFX.playClick();
            onOpenAvatarSelection?.();
          }}
          title="Multiplayer Peer Status & Choose Avatar"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 transition-all shadow-sm group"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>👥 {onlineCount} ONLINE</span>
        </button>

        {/* XP Rank & Filipino Title Badge */}
        <button
          type="button"
          onClick={() => {
            SoundFX.playClick();
            onOpenProfile?.();
          }}
          title="Buksan ang Player Profile & Progression [Hotkey: P]"
          className="hidden sm:flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400/80 transition-all cursor-pointer group shadow-sm"
        >
          <Award className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
          <div className="text-right">
            <div className="text-[10px] font-mono font-bold text-amber-300 flex items-center space-x-1 justify-end">
              <span>LVL {level}</span>
              <span className="text-[9px] px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {currentRank.tier}
              </span>
            </div>
            <div className="text-[9px] font-mono text-slate-400 flex items-center space-x-1 justify-end">
              <span className="text-cyan-400 font-bold">{digitalPower} DP</span>
              <span>•</span>
              <span>{xp} XP</span>
            </div>
          </div>
        </button>

        {/* Quick Menu Buttons: Tutorial, Quests, Hangar, Options */}
        <div className="flex items-center space-x-1.5">
          {onOpenTutorial && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onOpenTutorial();
              }}
              title="Manual & Tutorial (Hotkey: H)"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-mono font-bold flex items-center space-x-1 transition-all"
            >
              <span>📖</span>
              <span className="hidden xl:inline">Manual</span>
            </button>
          )}

          {onOpenQuests && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onOpenQuests();
              }}
              title="Daily Quests (Hotkey: Q)"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-mono font-bold flex items-center space-x-1 transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden xl:inline">Quests</span>
            </button>
          )}

          {onOpenHangar && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onOpenHangar();
              }}
              title="Builder Avatar Suite & Skins (Hotkey: 7)"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <span>{avatarMode === 'human' ? '👤' : '🛸'}</span>
              <span className="hidden sm:inline">{avatarMode === 'human' ? 'Avatar' : 'Drone'}</span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1 rounded border border-amber-400/30">7</span>
            </button>
          )}

          {/* Save Status Indicator */}
          <div
            className={`hidden lg:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold border transition-all ${
              saveStatus === 'saved'
                ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400'
                : saveStatus === 'saving'
                ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300 animate-pulse'
                : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
            }`}
            title={saveStatus === 'saved' ? 'Lahat ng progreso ay naka-save.' : saveStatus === 'saving' ? 'Kasalukuyang nagse-save...' : 'Offline — naka-queue ang mga pagbabago'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'saved'
                  ? 'bg-emerald-400'
                  : saveStatus === 'saving'
                  ? 'bg-cyan-400 animate-ping'
                  : 'bg-amber-400'
              }`}
            />
            <span>{saveStatus === 'saved' ? '● Saved' : saveStatus === 'saving' ? '⟳ Saving...' : '⚠ Offline'}</span>
          </div>

          {onOpenProfile && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onOpenProfile();
              }}
              title="Player Profile & RPG Progression (Hotkey: P)"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm group"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Profile</span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1 rounded border border-amber-400/30">P</span>
            </button>
          )}

          {/* Security & Notification Bell */}
          {onOpenProfile && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onOpenProfile();
              }}
              title={`Account Security & Notifications (${unreadSecurityCount} hindi pa nabasa)`}
              className="relative p-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-300 hover:text-cyan-300 transition-colors shadow-sm"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {unreadSecurityCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadSecurityCount}
                </span>
              )}
            </button>
          )}

          {onOpenWalletTerminal && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onOpenWalletTerminal();
              }}
              title="PISO Wallet Studio Terminal (Hotkey: W)"
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-amber-400 text-slate-300 hover:text-amber-300 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all shadow-sm group"
            >
              <Wallet className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">Wallet</span>
              <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1 rounded border border-amber-400/30">W</span>
            </button>
          )}

          {onOpenOptions && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onOpenOptions();
              }}
              title="Settings & Controls (Hotkey: O)"
              className="p-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-slate-400 hover:text-cyan-300 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Mode Toggle Button: 3D Game Mode <-> 2D Workbench */}
        <button
          onClick={() => {
            SoundFX.playWarp();
            onToggleGameMode();
          }}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
            gameMode
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 border-amber-400 shadow-glow'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
          }`}
        >
          {gameMode ? <Gamepad2 className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          <span>{gameMode ? '3D Game' : 'Workbench'}</span>
        </button>

        {/* Wallet Address Pill */}
        {wallet.isConnected && wallet.address ? (
          <button
            type="button"
            onClick={() => {
              if (onOpenWalletTerminal) {
                SoundFX.playClick();
                onOpenWalletTerminal();
              } else {
                openConnectWalletModal();
              }
            }}
            title="Buksan ang Wallet Studio Terminal [W]"
            className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-400 text-[11px] font-mono text-slate-300 hover:text-amber-300 transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={openConnectWalletModal}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-md transition-all active:scale-95"
          >
            Connect
          </button>
        )}

        {/* Collapse Top Bar Button */}
        <button
          type="button"
          onClick={() => {
            setIsCollapsed(true);
            SoundFX.playClick();
          }}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-amber-500 text-slate-400 hover:text-slate-950 border border-slate-700 transition"
          title="Minimize Top Bar (Unobstruct Top Screen)"
        >
          ▲
        </button>
      </div>
    </header>
  );
};
