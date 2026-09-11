import React, { useState } from 'react';
import { useAcademy } from '../../context/AcademyContext';
import { SoundFX } from '../../services/soundFX';
import {
  ChevronRight,
  ChevronDown,
  Compass,
  CheckCircle2,
  Circle,
  Zap,
  Terminal,
  Flame,
  Sparkles,
} from 'lucide-react';

interface GameQuestTrackerProps {
  onOpenQuest: () => void;
  onOpenDailyQuests?: () => void;
}

export const GameQuestTracker: React.FC<GameQuestTrackerProps> = ({ onOpenQuest, onOpenDailyQuests }) => {
  const { activeChallenge, passedChallenges, dailyQuests, streakDays } = useAcademy();
  const [collapsed, setCollapsed] = useState(false);

  const isChallengePassed = passedChallenges.includes(activeChallenge.id);
  const completedDaily = dailyQuests.filter((q) => q.completed).length;

  return (
    <div className="w-68 rounded-2xl bg-[#0B0F17]/85 border border-slate-700/80 shadow-2xl backdrop-blur-md overflow-hidden select-none">
      {/* Header */}
      <div
        onClick={() => setCollapsed(!collapsed)}
        className="px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-800/80 transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Active Quest & Daily
          </span>
        </div>
        <button className="text-slate-400 hover:text-white">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Body */}
      {!collapsed && (
        <div className="p-3.5 space-y-3">
          {/* Daily Streak Indicator */}
          <div
            onClick={onOpenDailyQuests}
            className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all"
          >
            <div className="flex items-center space-x-1.5 text-[11px] font-mono font-bold text-amber-300">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>{streakDays}-DAY STREAK</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {completedDaily}/{dailyQuests.length} Quests
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase font-mono">
              Hamon: {activeChallenge.category}
            </span>
            <h4 className="text-xs font-bold text-white mt-0.5 leading-snug line-clamp-2">
              {activeChallenge.title}
            </h4>
          </div>

          {/* Objectives */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center space-x-2 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Suriin ang Solidity Code</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              {isChallengePassed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              )}
              <span>Ipasa ang mga Test Assertions</span>
            </div>

            <div className="flex items-center space-x-2 text-slate-300">
              <Circle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>I-deploy sa PISO Devnet</span>
            </div>
          </div>

          {/* Reward & Open Button */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center space-x-1 font-mono text-[10px] font-bold text-amber-300">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>+{activeChallenge.xpReward} XP</span>
            </div>

            <div className="flex items-center space-x-1.5">
              {onOpenDailyQuests && (
                <button
                  onClick={() => {
                    SoundFX.playClick();
                    onOpenDailyQuests();
                  }}
                  className="px-2 py-1 rounded-lg text-[10px] font-mono text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
                >
                  Quests [Q]
                </button>
              )}
              <button
                onClick={() => {
                  SoundFX.playClick();
                  onOpenQuest();
                }}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-600/80 hover:bg-blue-500 text-white flex items-center space-x-1 shadow-sm transition-all"
              >
                <Terminal className="w-3 h-3" />
                <span>Lab [2]</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
