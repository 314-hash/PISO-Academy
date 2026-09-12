import React, { useState } from 'react';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  Compass,
  Sliders,
  Sparkles,
  Zap,
  ShieldCheck,
  Bot,
  Terminal,
  Award,
  ChevronRight,
  X,
  Keyboard,
  Rocket,
  Flame,
} from 'lucide-react';

interface GameTutorialModalProps {
  onClose: () => void;
}

export const GameTutorialModal: React.FC<GameTutorialModalProps> = ({ onClose }) => {
  const { setShowTutorial } = useAcademy();
  const [activeTab, setActiveTab] = useState<'controls' | 'districts' | 'mentors' | 'quests' | 'hangar'>('controls');

  const handleTabChange = (tab: typeof activeTab) => {
    SoundFX.playClick();
    setActiveTab(tab);
  };

  const handleClose = () => {
    SoundFX.playClick();
    setShowTutorial(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-3xl bg-[#0F172A] border-2 border-amber-400/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Scanline effect */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-30 z-10" />

        {/* Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161F30]/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl">
              📖
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  NEW MANILA 2090
                </span>
                <span className="text-xs text-slate-400 font-mono">PISO CHAIN DEVNET (2026001)</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Builder Flight Manual & Tutorial
              </h2>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-20 flex border-b border-slate-800 bg-[#0B0F17]/80 px-6 overflow-x-auto">
          {[
            { id: 'controls', label: '1. Paglipad at Controls', icon: Keyboard },
            { id: 'districts', label: '2. Limang Distrito', icon: Compass },
            { id: 'mentors', label: '3. NPC Mentors', icon: Bot },
            { id: 'quests', label: '4. Daily Quests', icon: Flame },
            { id: 'hangar', label: '5. Drone Hangar', icon: Rocket },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 text-xs font-mono font-bold transition-all border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-amber-400 text-amber-400 bg-amber-400/10'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 font-sans">
          {activeTab === 'controls' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 flex items-start space-x-3">
                <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  Maligayang pagdating sa <strong>PISO Academy 3D Metaverse</strong>! Ikaw ay nagpipiloto ng
                  isang <em>Agila Recon Drone</em> sa ibabaw ng New Manila 2090. Gamitin ang controls sa ibaba
                  upang mag-navigate sa mga Web3 coding districts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">Movement (WASD)</span>
                  <p className="text-xs text-slate-400">
                    Pindutin ang <strong>W / A / S / D</strong> o ang <strong>Arrow Keys</strong> upang ilipad ang
                    drone sa anumang direksyon.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">Click-To-Fly Target</span>
                  <p className="text-xs text-slate-400">
                    I-click ang sahig saanman sa grid gamit ang mouse. May lilitaw na pulsing cyber beacon at kusa
                    itong liliparin ng iyong drone.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">Jump & Double Jump (Space)</span>
                  <p className="text-xs text-slate-400">
                    Pindutin ang <strong>Spacebar</strong> para lumukso pataas. Pindutin muli ang <strong>Space</strong> habang nasa ere para sa <strong>Double Jump</strong> thruster boost!
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">Turbo Boost (Shift)</span>
                  <p className="text-xs text-slate-400">
                    Pindutin ang <strong>Shift</strong> habang lumilipad para sa 2x afterburner speed boost (24 m/s).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">Camera Orbit & Zoom</span>
                  <p className="text-xs text-slate-400">
                    Gamitin ang <strong>Mouse Wheel</strong> upang mag-zoom in/out, o <strong>Right-Click Drag</strong> upang
                    paikutin ang camera 360 degrees nang maayos.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">District Interaction [E]</span>
                  <p className="text-xs text-slate-400">
                    Kapag lumapit ka sa isang monument o NPC mentor, pindutin ang <strong>[E]</strong> upang buksan
                    ang terminal o makipag-usap.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 space-y-2">
                  <span className="font-mono text-xs font-bold text-amber-400 uppercase">Action Bar Hotkeys [1]-[6]</span>
                  <p className="text-xs text-slate-400">
                    Maaari mong buksan ang anumang tool (Lab, Quests, Deployer, Verifier) sa keyboard gamit ang <strong>1 to 6</strong>,
                    o pindutin ang <strong>[F]</strong> para sa PISO Faucet!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'districts' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Ang New Manila 2090 ay nahahati sa limang pangunahing arkitektura ng PISO Chain:
              </p>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-[#161F30] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💻</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Smart Contract Forge (X: 24, Z: -8)</h4>
                      <p className="text-xs text-slate-400">
                        Interactive Scaffold-ETH 2 lab para mag-code ng ERC-20, Soulbound NFTs, at oracles.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">Lab [2]</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161F30] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🏛️</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Katunayan Temple (X: -24, Z: -8)</h4>
                      <p className="text-xs text-slate-400">
                        Public verifier para sa non-transferable Soulbound Credentials (precompile 0x...1014).
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Verify [4]</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161F30] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🚀</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Deploy Launchpad (X: 0, Z: -28)</h4>
                      <p className="text-xs text-slate-400">
                        PISO Devnet deployment terminal at real-time on-chain transaction inspector.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">Deploy [3]</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161F30] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🔮</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Babaylan AI Citadel (X: 0, Z: 26)</h4>
                      <p className="text-xs text-slate-400">
                        Sinaunang orakulo na nakaugnay sa AI precompile 0x...1009 para sa verifiable AI inference.
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded">LMS [1]</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#161F30] border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">💧</span>
                    <div>
                      <h4 className="font-bold text-white text-sm">Bayanihan Faucet Obelisk (X: 15, Z: 15)</h4>
                      <p className="text-xs text-slate-400">
                        Humingi ng 1.0 libreng ₱PISO testnet gas tuwing 60 segundo (0x...1003).
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded">Faucet [F]</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mentors' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Makipag-usap sa tatlong on-chain NPC mentors sa New Manila para sa ekspertong payo at mga lihim na misyon:
              </p>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-400 flex items-center justify-center text-2xl shrink-0">
                    ⚒️
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Master Panday (Kiko) — Smart Contract Architect</h4>
                    <span className="text-[11px] font-mono text-blue-400">Matatagpuan sa Smart Contract Forge</span>
                    <p className="text-xs text-slate-300 mt-1">
                      Nagtuturo ng EVM storage packing, reentrancy defense, at custom ERC-5192 precompile bindings.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-2xl shrink-0">
                    🔮
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Babaylan Maya — Cryptographic AI Seer</h4>
                    <span className="text-[11px] font-mono text-purple-400">Matatagpuan sa Babaylan AI Citadel</span>
                    <p className="text-xs text-slate-300 mt-1">
                      Nagtuturo tungkol sa determinism gap sa blockchain, zero-knowledge verifiable off-chain ML, at precompile 0x...1009.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#161F30] border border-slate-800 flex items-start space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shrink-0">
                    👑
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm">Kapitan Datu — DAO & Ecosystem Elder</h4>
                    <span className="text-[11px] font-mono text-amber-400">Matatagpuan sa Genesis Plaza</span>
                    <p className="text-xs text-slate-300 mt-1">
                      Puno ng Bayanihan DAO. Nagbibigay ng gabay sa quadratic funding, builder grants, at on-chain governance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quests' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 flex items-start space-x-3">
                <Flame className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Araw-araw ay may <strong>5 Daily Builder Quests</strong> na nagre-reset. Kumpletuhin ang mga ito upang
                  mapanatili ang iyong <strong>Builder Streak</strong> at kumita ng bonus XP at Katunayan Badges!
                </p>
              </div>

              <div className="space-y-2 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#161F30] flex items-center justify-between border border-slate-800">
                  <span className="text-slate-300">💧 Bayanihan Drip (Faucet claim)</span>
                  <span className="text-amber-400 font-bold">+25 XP</span>
                </div>
                <div className="p-3 rounded-lg bg-[#161F30] flex items-center justify-between border border-slate-800">
                  <span className="text-slate-300">🧙 Kausapin ang mga Mentor</span>
                  <span className="text-amber-400 font-bold">+50 XP</span>
                </div>
                <div className="p-3 rounded-lg bg-[#161F30] flex items-center justify-between border border-slate-800">
                  <span className="text-slate-300">⚒️ Panday sa Solidity (Challenge pass)</span>
                  <span className="text-amber-400 font-bold">+100 XP</span>
                </div>
                <div className="p-3 rounded-lg bg-[#161F30] flex items-center justify-between border border-slate-800">
                  <span className="text-slate-300">🛡️ Katunayan Inspector (Verify certificate)</span>
                  <span className="text-amber-400 font-bold">+50 XP</span>
                </div>
                <div className="p-3 rounded-lg bg-[#161F30] flex items-center justify-between border border-slate-800">
                  <span className="text-slate-300">📜 Pagsusulit sa Karunungan (Quiz pass)</span>
                  <span className="text-amber-400 font-bold">+75 XP</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'hangar' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Pumunta sa Hangar (Hotkey <strong>[7]</strong> o Hangar button) upang baguhin ang hitsura ng iyong Builder Drone:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#161F30] border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🛸</span>
                    <h5 className="font-bold text-white text-xs">Agila Recon Mk-1 (Default)</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Cyan & Royal Azure aerodynamic chassis. Ion plasma thruster.</p>
                </div>

                <div className="p-3 rounded-xl bg-[#161F30] border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⚒️</span>
                    <h5 className="font-bold text-amber-400 text-xs">Panday Forge Drone</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Obsidian & Molten Gold armor. +10% Lab XP bonus perk.</p>
                </div>

                <div className="p-3 rounded-xl bg-[#161F30] border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">🔮</span>
                    <h5 className="font-bold text-purple-400 text-xs">Babaylan Astral Core</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Floating Amethyst prism. Cosmic stardust exhaust trail.</p>
                </div>

                <div className="p-3 rounded-xl bg-[#161F30] border border-slate-800">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl">⚡</span>
                    <h5 className="font-bold text-yellow-400 text-xs">Bayani Cyber-Jeepney</h5>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Iconic chrome chassis with 3-stars-and-sun. +15% flight speed!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-[#161F30]/90">
          <span className="text-xs text-slate-400 font-mono">
            Pindutin ang <strong className="text-amber-400">[H]</strong> anumang oras para sa Manual
          </span>
          <button
            onClick={handleClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all flex items-center space-x-2"
          >
            <span>Handa Na Ako Magpalipad</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
