import React, { useState } from 'react';
import { useAcademy, NavView } from '../context/AcademyContext';
import {
  Code2,
  BookOpen,
  Award,
  Terminal,
  Rocket,
  User,
  ExternalLink,
  Droplets,
  Coins,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Gamepad2,
  Globe,
  MessageSquare
} from 'lucide-react';
import { PISO_NETWORK } from '../pisoConfig';
import { SoundFX } from '../services/soundFX';

export const Navbar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    gameMode,
    toggleGameMode,
    wallet,
    connectInjectedWallet,
    createBurnerWallet,
    requestFaucet,
    xp,
    level,
    levelTitle
  } = useAcademy();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faucetLoading, setFaucetLoading] = useState(false);

  const handleFaucet = async () => {
    setFaucetLoading(true);
    await requestFaucet();
    setFaucetLoading(false);
  };

  const navItems: { id: NavView; label: string; icon: React.ReactNode }[] = [
    { id: 'worldmap', label: '🌍 World Map & Rewards', icon: <Globe className="w-4 h-4 text-cyan-400" /> },
    { id: 'courses', label: 'Kurso (Tracks)', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'lab', label: 'Web3 Lab', icon: <Terminal className="w-4 h-4" /> },
    { id: 'deploy', label: 'Deploy Rig', icon: <Rocket className="w-4 h-4" /> },
    { id: 'verify', label: 'Katunayan', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'profile', label: 'Builder Profile', icon: <User className="w-4 h-4" /> },
    { id: 'projects', label: 'Built on PISO', icon: <Award className="w-4 h-4" /> },
    { id: 'chat', label: '💬 P2P Chat', icon: <MessageSquare className="w-4 h-4 text-purple-400" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-blue-600 to-amber-400 p-0.5 shadow-glow">
              <div className="w-full h-full bg-[#0B0F17] rounded-[10px] flex items-center justify-center">
                <span className="text-xl font-black text-amber-400 font-mono">₱</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-lg font-black tracking-tight text-white font-sans">PISO</span>
                <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">Academy</span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Filipino Builder Ecosystem</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-slate-800 text-amber-400 border border-amber-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Header Area: XP + Network + Wallet */}
          <div className="hidden sm:flex items-center space-x-3">
            {/* XP & Level Badge */}
            <div
              className="flex items-center space-x-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-lg cursor-pointer hover:border-amber-500/40 transition-colors"
              onClick={() => setActiveView('profile')}
              title={levelTitle}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
              <span className="text-xs font-bold text-amber-300 font-mono">LVL {level}</span>
              <span className="text-xs text-slate-400 font-mono">({xp} XP)</span>
            </div>

            {/* Network Badge */}
            <div className="flex items-center space-x-1.5 bg-blue-950/40 border border-blue-800/50 px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-xs font-medium text-blue-200">PISO {PISO_NETWORK.chainId}</span>
            </div>

            {/* Launch 3D Metaverse Button */}
            <button
              onClick={() => {
                SoundFX.playWarp();
                toggleGameMode();
              }}
              className="flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-glow transition-all"
              title="Launch New Manila 2090 3D Metaverse Game Mode"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>3D Metaverse</span>
            </button>

            {/* Faucet Trigger */}
            <button
              onClick={handleFaucet}
              disabled={faucetLoading}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 hover:bg-emerald-900/60 transition-all disabled:opacity-50"
              title="Request 1.0 PISO Testnet Drip"
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{faucetLoading ? 'Dripping...' : 'Faucet'}</span>
            </button>

            {/* Wallet Status / Connect Button */}
            {wallet.isConnected && wallet.address ? (
              <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 px-3 py-1 rounded-lg">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  {parseFloat(wallet.balance).toFixed(2)} ₱
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-xs font-mono text-slate-400" title={wallet.address}>
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase">
                  {wallet.type}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={connectInjectedWallet}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-sm transition-all"
                >
                  Connect Wallet
                </button>
                <button
                  onClick={createBurnerWallet}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                  title="Generate instant burner wallet"
                >
                  Burner
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0B0F17] border-b border-slate-800 px-4 pt-2 pb-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveView(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                activeView === item.id ? 'bg-slate-800 text-amber-400' : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">PISO Devnet (2026001)</span>
            <button
              onClick={handleFaucet}
              className="text-xs text-emerald-400 font-bold px-2 py-1 bg-emerald-950/40 rounded border border-emerald-700/50"
            >
              Get Faucet ₱
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
