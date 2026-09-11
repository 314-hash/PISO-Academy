import React from 'react';
import { useAcademy } from '../context/AcademyContext';
import {
  Rocket,
  Code2,
  ShieldCheck,
  Zap,
  ArrowRight,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { PISO_NETWORK } from '../pisoConfig';

export const Hero: React.FC = () => {
  const { setActiveView, setSelectedTrack, tracks } = useAcademy();

  return (
    <div className="relative overflow-hidden pt-8 pb-16">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-blue-600/15 via-amber-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Banner Pill */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-xs font-semibold text-amber-300 shadow-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            <span>PISO Chain Devnet Live: Chain ID {PISO_NETWORK.chainId}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-mono">3.0s Block Time</span>
          </div>
        </div>

        {/* Hero Title & Pitch */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Matuto. Mag-Code.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-blue-400">
              Maging PISO Builder.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed">
            The open-source Filipino Web3 developer academy. Build real smart contracts, solve automated challenges, deploy directly to PISO Chain, and earn permanent on-chain Soulbound credentials.
          </p>

          {/* CTAs */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => setActiveView('courses')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-glow flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <Rocket className="w-4 h-4" />
              <span>Simulan ang Kurso (Start Learning)</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveView('lab')}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold text-sm bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700/80 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5"
            >
              <Terminal className="w-4 h-4 text-blue-400" />
              <span>Buksan ang Web3 Lab (Coding Lab)</span>
            </button>
          </div>
        </div>

        {/* The 6-Step Builder Journey Bar */}
        <div className="mt-12 p-4 sm:p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            The PISO Builder Lifecycle
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { step: '1. LEARN', label: 'EVM & Theory', icon: <Layers className="w-4 h-4 text-blue-400" /> },
              { step: '2. CODE', label: 'Solidity ^0.8.20', icon: <Code2 className="w-4 h-4 text-amber-400" /> },
              { step: '3. BUILD', label: 'Starter Templates', icon: <Cpu className="w-4 h-4 text-emerald-400" /> },
              { step: '4. TEST', label: 'Automated Tests', icon: <CheckCircle2 className="w-4 h-4 text-purple-400" /> },
              { step: '5. DEPLOY', label: 'PISO Chain Devnet', icon: <Zap className="w-4 h-4 text-amber-300" /> },
              { step: '6. VERIFY', label: 'Katunayan Badges', icon: <ShieldCheck className="w-4 h-4 text-blue-300" /> },
            ].map((s, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 flex flex-col items-center text-center transition-all"
              >
                <div className="p-2 rounded-lg bg-slate-900 mb-2">{s.icon}</div>
                <span className="text-xs font-black text-slate-200 font-mono">{s.step}</span>
                <span className="text-[11px] text-slate-400 mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Paths Quick Grid */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">Mga Learning Paths</h2>
              <p className="text-xs sm:text-sm text-slate-400">Pumili ng iyong landas mula baguhan hanggang Master Architect</p>
            </div>
            <button
              onClick={() => setActiveView('courses')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1"
            >
              <span>Lahat ng Kurso</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tracks.map((track) => (
              <div
                key={track.id}
                onClick={() => {
                  setSelectedTrack(track);
                  setActiveView('courses');
                }}
                className="p-5 rounded-2xl bg-[#161F30] border border-slate-700/60 hover:border-amber-500/50 cursor-pointer transition-all duration-300 group hover:-translate-y-1 hover:shadow-glow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {track.level}
                    </span>
                    <span className="text-xs font-bold font-mono text-amber-400">+{track.xpReward} XP</span>
                  </div>
                  <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                    {track.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {track.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>{track.estimatedHours} oras</span>
                  <span className="font-mono text-blue-400 flex items-center space-x-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Aralin</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
