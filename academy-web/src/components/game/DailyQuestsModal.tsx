import React from 'react';
import { useAcademy, DailyQuest } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import { Flame, Sparkles, Check, Clock, Award, X, ChevronRight } from 'lucide-react';

interface DailyQuestsModalProps {
  onClose: () => void;
  onNavigateToView?: (view: any) => void;
}

export const DailyQuestsModal: React.FC<DailyQuestsModalProps> = ({ onClose, onNavigateToView }) => {
  const { dailyQuests, claimDailyQuest, streakDays, xp, setActiveView } = useAcademy();

  const handleClaim = (q: DailyQuest) => {
    SoundFX.playQuestComplete();
    claimDailyQuest(q.id);
  };

  const completedCount = dailyQuests.filter((q) => q.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-[#0F172A] border-2 border-amber-400/80 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* CRT Scanline */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-25 z-10" />

        {/* Header */}
        <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#161F30]/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-xl">
              🔥
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-black text-amber-400 uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">
                  DAILY MISSIONS
                </span>
                <span className="text-xs text-slate-400 font-mono">PISO Builder Bounty</span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Pang-araw-araw na Quests at Streak
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Streak Banner */}
        <div className="relative z-20 px-6 py-3 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
            <span className="font-mono text-xs font-bold text-white">
              {streakDays}-DAY BUILDER STREAK ACTIVE
            </span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded">
              +15% XP BOOSTER
            </span>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5" />
            <span>Reset: 14h 22m</span>
          </div>
        </div>

        {/* Quests List */}
        <div className="relative z-20 flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
            <span>Kabuuang Natapos: {completedCount} / {dailyQuests.length}</span>
            <span className="text-amber-400">Total XP: {xp} XP</span>
          </div>

          {dailyQuests.map((q) => {
            const isFinished = q.completed;
            const isClaimed = q.claimed;

            return (
              <div
                key={q.id}
                className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                  isClaimed
                    ? 'bg-[#161F30]/40 border-slate-800/60 opacity-70'
                    : isFinished
                    ? 'bg-[#161F30] border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : 'bg-[#161F30] border-slate-800'
                }`}
              >
                <div className="flex items-start space-x-3.5 flex-1 pr-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                    {q.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-white text-xs">{q.title}</h4>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {q.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">{q.desc}</p>

                    {/* Progress bar */}
                    <div className="mt-2 flex items-center space-x-2 font-mono text-[10px]">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isFinished ? 'bg-amber-400' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-400">
                        {q.progress}/{q.target}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end space-y-1.5">
                  <span className="font-mono text-xs font-bold text-amber-400">+{q.xpReward} XP</span>
                  {isClaimed ? (
                    <span className="px-3 py-1 rounded-lg bg-slate-800 text-slate-500 text-[10px] font-mono font-bold uppercase">
                      Claimed
                    </span>
                  ) : isFinished ? (
                    <button
                      onClick={() => handleClaim(q)}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-mono text-xs font-bold uppercase hover:brightness-110 shadow-[0_0_15px_rgba(245,158,11,0.4)] flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Kuhanin</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-[10px] font-mono font-bold border border-blue-500/30">
                      Gawin Pa
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* World Map & Ecosystem Rewards Callout */}
        <div className="relative z-20 mx-6 mb-2 p-3 rounded-xl bg-gradient-to-r from-blue-900/40 to-cyan-900/30 border border-cyan-500/40 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <span className="text-xl">🌍</span>
            <div>
              <span className="text-xs font-bold text-white block">PISO 3D World Map & Ecosystem Rewards</span>
              <span className="text-[10px] text-cyan-300 font-mono">15 Global Blockchain Hubs, DePIN Telemetry & Badges</span>
            </div>
          </div>
          <button
            onClick={() => {
              SoundFX.playClick();
              onClose();
              if (onNavigateToView) onNavigateToView('worldmap');
              else setActiveView('worldmap');
            }}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:brightness-110 text-white font-mono text-[11px] font-bold uppercase transition-all shadow-sm"
          >
            Buksan ang World Map ↗
          </button>
        </div>

        {/* Footer */}
        <div className="relative z-20 flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-[#161F30]/90 text-xs font-mono text-slate-400">
          <span>Pindutin ang [Q] para sa Quests</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            Isara
          </button>
        </div>
      </div>
    </div>
  );
};
