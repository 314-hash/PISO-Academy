/**
 * PlayerProfileModal.tsx
 * Complete RPG-style Player Profile & Progression Interface for PISO Academy.
 * Adheres to the 60-30-10 Filipino Cyberpunk aesthetic with deep interactive mechanics:
 * Overview & Attributes, Visual Skill Tree, Quest Journal, Trophy Achievements, and Battle/Builder Records.
 * Supports both modal dialog mode and inline full-page mode.
 */

import React, { useState, useEffect } from 'react';
import { useAcademy, DEFAULT_HUMAN_AVATAR } from '../../context/AcademyContext';
import { PlayerProgressionEngine } from '../../services/playerProgressionEngine';
import {
  PlayerProfileState,
  PrimaryAttributeKey,
  SkillTreeBranch,
  QuestCategory,
  PlayerClassId,
} from '../../types/playerProgression';
import {
  PRIMARY_ATTRIBUTES_META,
  FILIPINO_RANKS,
  PLAYER_CLASSES,
  getRankForLevel,
} from '../../data/progressionMeta';
import { SKILL_BRANCH_META, SKILL_TREE_NODES } from '../../data/skillTreeData';
import { SoundFX } from '../../services/soundFX';
import {
  Shield,
  Zap,
  Award,
  BookOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  Lock,
  Coins,
  X,
  Plus,
  ExternalLink,
  Crown,
  Heart,
  Activity,
  Gauge,
  Check,
  Share2,
  Github,
  Eye,
  EyeOff,
  Copy,
} from 'lucide-react';
import { PISO_NETWORK } from '../../pisoConfig';
import { WalletService } from '../../services/walletService';

import { AccountSessionService, SecurityNotification } from '../../services/AccountSessionService';
import { ShieldCheck, ShieldAlert, Key, Clock, UserCheck, Bell, Trash2, Edit3 } from 'lucide-react';

export interface PlayerProfileModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialTab?: 'overview' | 'skills' | 'quests' | 'achievements' | 'records' | 'contracts' | 'security';
  isInline?: boolean;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen = true,
  onClose,
  initialTab = 'overview',
  isInline = false,
}) => {
  const { wallet, humanAvatar, setNotification, certificates, deployments, setActiveView } = useAcademy();
  const [profile, setProfile] = useState<PlayerProfileState>(() => PlayerProgressionEngine.getProfile());
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'quests' | 'achievements' | 'records' | 'contracts' | 'security'>(initialTab);

  // Skill Tree Branch Filter
  const [selectedBranch, setSelectedBranch] = useState<SkillTreeBranch>('technology');

  // Quest Category Filter
  const [selectedQuestCategory, setSelectedQuestCategory] = useState<QuestCategory | 'all'>('all');

  // Achievement Category Filter
  const [selectedAchFilter, setSelectedAchFilter] = useState<string>('all');

  const [copied, setCopied] = useState(false);
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsernameInput, setNewUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [usernameSuccess, setUsernameSuccess] = useState('');
  const [securityNotifs, setSecurityNotifs] = useState<SecurityNotification[]>(() =>
    AccountSessionService.get().getNotifications()
  );

  // Sovereign Device Wallet & Secure Key Reveal state
  const [showPrivKey, setShowPrivKey] = useState(false);
  const [privKeyTimer, setPrivKeyTimer] = useState(0);
  const [copiedPrivKey, setCopiedPrivKey] = useState(false);
  const [copiedDeviceAddr, setCopiedDeviceAddr] = useState(false);

  useEffect(() => {
    let interval: any;
    if (showPrivKey && privKeyTimer > 0) {
      interval = setInterval(() => {
        setPrivKeyTimer((prev) => {
          if (prev <= 1) {
            setShowPrivKey(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showPrivKey, privKeyTimer]);

  // Reload profile state when modal opens or profile changes
  const refreshProfile = () => {
    setProfile(PlayerProgressionEngine.getProfile());
    setSecurityNotifs(AccountSessionService.get().getNotifications());
  };

  const handleUpdateUsername = () => {
    setUsernameError('');
    setUsernameSuccess('');
    const res = PlayerProgressionEngine.changeUsername(newUsernameInput);
    if (res.success) {
      setUsernameSuccess(res.message);
      SoundFX.playLevelUp();
      refreshProfile();
      setTimeout(() => {
        setIsEditingUsername(false);
        setUsernameSuccess('');
      }, 2000);
    } else {
      setUsernameError(res.message);
      SoundFX.playLaser();
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshProfile();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleProfileUpdate = () => refreshProfile();
    const handleLevelUp = () => refreshProfile();
    const handleQuestUpdate = () => refreshProfile();

    window.addEventListener('piso-player-profile-updated', handleProfileUpdate);
    window.addEventListener('piso-level-up', handleLevelUp);
    window.addEventListener('piso-quest-claimed', handleQuestUpdate);

    return () => {
      window.removeEventListener('piso-player-profile-updated', handleProfileUpdate);
      window.removeEventListener('piso-level-up', handleLevelUp);
      window.removeEventListener('piso-quest-claimed', handleQuestUpdate);
    };
  }, []);

  if (!isOpen && !isInline) return null;

  const currentRank = getRankForLevel(profile.level);
  const currentClass = PLAYER_CLASSES[profile.playerClass] || PLAYER_CLASSES.builder;
  const displayAddress = wallet.address || '0x1821F246a27287a2187E1D634B8883030fA14731';

  // XP calculation
  const expProgressPercent = Math.min(
    100,
    Math.round((profile.currentExp / profile.expToNextLevel) * 100)
  );

  // Allocate Stat Point
  const handleAllocateStat = (key: PrimaryAttributeKey) => {
    if (profile.unallocatedStatPoints <= 0) return;
    const success = PlayerProgressionEngine.allocateAttributePoint(key);
    if (success) {
      refreshProfile();
    }
  };

  // Unlock Skill
  const handleUnlockSkill = (skillId: string) => {
    const result = PlayerProgressionEngine.unlockSkill(skillId);
    setNotification({
      message: result.message,
      type: result.success ? 'success' : 'error',
    });
    if (result.success) {
      refreshProfile();
    }
  };

  // Switch Class
  const handleSwitchClass = (classId: PlayerClassId) => {
    PlayerProgressionEngine.setPlayerClass(classId);
    refreshProfile();
    setNotification({
      message: `Bihasang Mandirigma: Nagpalit ng Propesyon patungong "${PLAYER_CLASSES[classId]?.name}"!`,
      type: 'success',
    });
  };

  // Trigger Class Ability
  const handleTriggerClassAbility = () => {
    const res = PlayerProgressionEngine.activateClassAbility();
    setNotification({
      message: res.message,
      type: res.success ? 'success' : 'error',
    });
    if (res.success) {
      refreshProfile();
    }
  };

  // Claim Quest
  const handleClaimQuest = (questId: string) => {
    const res = PlayerProgressionEngine.claimQuestReward(questId);
    setNotification({
      message: res.message,
      type: res.success ? 'success' : 'error',
    });
    if (res.success) {
      refreshProfile();
    }
  };

  const handleCopyProfile = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Filtered Quests
  const displayedQuests =
    selectedQuestCategory === 'all'
      ? profile.activeQuests
      : profile.activeQuests.filter((q) => q.category === selectedQuestCategory);

  // Filtered Achievements
  const displayedAchievements =
    selectedAchFilter === 'all'
      ? profile.achievements
      : profile.achievements.filter((a) => a.category === selectedAchFilter);

  const innerContent = (
    <div className={`relative w-full ${isInline ? 'max-w-6xl mx-auto' : 'max-w-5xl'} bg-[#0F172A] border-2 border-amber-400/80 rounded-3xl shadow-[0_0_60px_rgba(245,158,11,0.3)] overflow-hidden flex flex-col ${isInline ? 'min-h-[85vh]' : 'max-h-[92vh]'}`}>
      {/* CRT Scanline */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-20 z-10" />

      {/* 1. TOP BANNER */}
      <div className="relative z-20 px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-[#161F30] via-[#0F172A] to-[#161F30] flex flex-wrap items-center justify-between gap-4">
        {/* Avatar Preview & Identifiers */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-blue-600 to-amber-500 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.4)] shrink-0">
            <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex items-center justify-center text-3xl">
              {(humanAvatar?.gender || DEFAULT_HUMAN_AVATAR.gender) === 'female'
                ? '👩‍💻'
                : (humanAvatar?.gender || DEFAULT_HUMAN_AVATAR.gender) === 'android'
                ? '🤖'
                : '👨‍💻'}
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-black text-white font-sans tracking-tight">
                {profile.username}
              </h1>
              {profile.usernameChangeUsed ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800/80 text-slate-400 border border-slate-700 flex items-center space-x-1" title="Ang username ay permanenteng nakakandado.">
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Kandado</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setNewUsernameInput(profile.username);
                    setIsEditingUsername(true);
                    setUsernameError('');
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 hover:bg-cyan-500/30 flex items-center space-x-1 transition-colors"
                  title="Maaari mo lamang palitan ang iyong username nang 1 beses!"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>1 Palit Naiwan</span>
                </button>
              )}
              {/* Filipino Rank Pill */}
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border flex items-center space-x-1 shadow-sm uppercase tracking-wider"
                style={{
                  backgroundColor: `${currentRank.color}20`,
                  borderColor: `${currentRank.color}60`,
                  color: currentRank.color,
                }}
                title={currentRank.meaning}
              >
                <span>{currentRank.badgeIcon}</span>
                <span>{currentRank.tier}</span>
              </span>

              {/* Class Badge */}
              <span
                className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black border flex items-center space-x-1 shadow-sm uppercase tracking-wider"
                style={{
                  backgroundColor: `${currentClass.color}20`,
                  borderColor: `${currentClass.color}60`,
                  color: currentClass.color,
                }}
                title={currentClass.description}
              >
                <span>{currentClass.icon}</span>
                <span>{currentClass.name}</span>
              </span>
            </div>

            {/* XP Progression Bar & Level */}
            <div className="flex flex-wrap items-center gap-3 mt-1.5 font-mono text-xs">
              <div className="flex items-center space-x-1 font-black text-amber-400">
                <span>LVL {profile.level}</span>
              </div>
              <div className="w-32 sm:w-48 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 transition-all duration-300"
                  style={{ width: `${expProgressPercent}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400">
                {profile.currentExp.toLocaleString()} / {profile.expToNextLevel.toLocaleString()} XP
              </span>
            </div>
          </div>
        </div>

        {/* Right Header: Digital Power & PISO Balance */}
        <div className="flex items-center space-x-3">
          {/* Digital Power Badge */}
          <div className="flex items-center space-x-2 px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-cyan-500/20 border border-amber-400/50 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <div>
              <div className="text-[9px] font-mono text-slate-400 uppercase tracking-tight">DIGITAL POWER</div>
              <div className="text-sm font-mono font-black text-amber-300 leading-none">
                {profile.secondaryAttributes.digitalPower}
              </div>
            </div>
          </div>

          {/* PISO Balance */}
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <Coins className="w-4 h-4 text-amber-400" />
            <div>
              <div className="text-[9px] font-mono text-slate-400">₱ PISO GAS</div>
              <div className="text-xs font-mono font-bold text-emerald-400 leading-none">
                {parseFloat(wallet.balance).toFixed(2)} ₱
              </div>
            </div>
          </div>

          {isInline && (
            <button
              onClick={handleCopyProfile}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-mono text-xs flex items-center space-x-1.5 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Na-kopya!' : 'Ibahagi'}</span>
            </button>
          )}

          {!isInline && onClose && (
            <button
              onClick={() => {
                SoundFX.playClick();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. NAVIGATION TAB BAR */}
      <div className="relative z-20 px-6 py-2.5 bg-[#161F30]/90 border-b border-slate-800 flex items-center space-x-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => {
            SoundFX.playClick();
            setActiveTab('overview');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'overview'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Overview & Stats</span>
        </button>

        <button
          onClick={() => {
            SoundFX.playClick();
            setActiveTab('skills');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'skills'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Skill Tree ({profile.skillPoints} SP)</span>
        </button>

        <button
          onClick={() => {
            SoundFX.playClick();
            setActiveTab('quests');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'quests'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>
            Quest Journal (
            {profile.activeQuests.filter((q) => q.completed && !q.claimed).length > 0 ? (
              <span className="text-amber-300 animate-pulse font-black">
                +{profile.activeQuests.filter((q) => q.completed && !q.claimed).length} Claim
              </span>
            ) : (
              profile.activeQuests.filter((q) => q.completed).length
            )}
            )
          </span>
        </button>

        <button
          onClick={() => {
            SoundFX.playClick();
            setActiveTab('achievements');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'achievements'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Achievements ({profile.achievements.filter((a) => a.unlocked).length})</span>
        </button>

        <button
          onClick={() => {
            SoundFX.playClick();
            setActiveTab('contracts');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'contracts'
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-glow font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Katunayan & Devnet</span>
        </button>

        <button
          onClick={() => {
            SoundFX.playClick();
            setActiveTab('security');
          }}
          className={`px-4 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-2 transition-all shrink-0 ${
            activeTab === 'security'
              ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-glow font-black'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Seguridad & Account</span>
        </button>
      </div>

      {/* 3. TAB CONTENTS */}
      <div className="relative z-20 flex-1 overflow-y-auto p-4 sm:p-6">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & STATS */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Row 1: Digital Power Card & Class Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Digital Power Showcase */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161F30] via-slate-900 to-[#161F30] border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>DIGITAL POWER METRIC</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Balanced Formula
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline space-x-3">
                    <span className="text-4xl sm:text-5xl font-mono font-black text-white drop-shadow-[0_0_20px_rgba(245,158,11,0.4)]">
                      {profile.secondaryAttributes.digitalPower}
                    </span>
                    <span className="text-xs font-mono text-slate-400">/ 100+ Rating</span>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-mono leading-relaxed">
                    Ang pangkalahatang kapangyarihan ng iyong karakter bilang digital creator sa PISO Academy.
                  </p>
                </div>

                {/* Formula Breakdown Indicator */}
                <div className="mt-4 pt-3 border-t border-slate-800 font-mono text-[10px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Knowledge & Code (40%)</span>
                    <span className="text-cyan-400 font-bold">
                      {Math.round((profile.primaryAttributes.knowledge + profile.primaryAttributes.coding) * 0.2)} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Blockchain & Creative (35%)</span>
                    <span className="text-amber-400 font-bold">
                      {Math.round(profile.primaryAttributes.blockchain * 0.2 + profile.primaryAttributes.creativity * 0.15)} pts
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Problem Solving & Bayanihan (25%)</span>
                    <span className="text-emerald-400 font-bold">
                      {Math.round(profile.primaryAttributes.problemSolving * 0.15 + profile.primaryAttributes.bayanihan * 0.1)} pts
                    </span>
                  </div>
                </div>
              </div>

              {/* Player Class & Active Ability Card */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-[#161F30] border border-slate-700/80 shadow-md flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{currentClass.icon}</span>
                      <div>
                        <h3 className="text-base font-bold text-white tracking-wide">
                          {currentClass.name} • {currentClass.filipinoName}
                        </h3>
                        <span className="text-[11px] font-mono text-amber-400">
                          Primary Affinity: {currentClass.primaryStatAffinity.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Class Switcher */}
                    <select
                      value={profile.playerClass}
                      onChange={(e) => handleSwitchClass(e.target.value as PlayerClassId)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400 cursor-pointer"
                    >
                      {Object.values(PLAYER_CLASSES).map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} ({cls.primaryStatAffinity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <p className="text-xs text-slate-300 mt-2 font-mono">{currentClass.description}</p>

                  {/* Passive Perk */}
                  <div className="mt-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start space-x-2 text-xs">
                    <span className="text-amber-400">✨</span>
                    <div>
                      <strong className="text-amber-300 font-mono">Passive Perk: </strong>
                      <span className="text-slate-300">{currentClass.passivePerkDesc}</span>
                    </div>
                  </div>
                </div>

                {/* Active Special Ability Trigger */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-white flex items-center space-x-1.5 font-mono">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Special Ability: {currentClass.specialAbilityName}</span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{currentClass.specialAbilityDesc}</p>
                  </div>

                  <button
                    onClick={handleTriggerClassAbility}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-mono text-xs font-black uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>I-activate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Primary Attributes (6 Core Pillars) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    PRIMARY ATTRIBUTES (6 PILLARS)
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">Pangunahing Kasanayan</span>
                </div>

                {/* Unallocated Stat Points indicator */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-slate-400">Available Stat Points:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-mono text-xs font-black border ${
                      profile.unallocatedStatPoints > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {profile.unallocatedStatPoints} PTS
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(Object.keys(PRIMARY_ATTRIBUTES_META) as PrimaryAttributeKey[]).map((key) => {
                  const meta = PRIMARY_ATTRIBUTES_META[key];
                  const val = profile.primaryAttributes[key];
                  const canAllocate = profile.unallocatedStatPoints > 0;

                  return (
                    <div
                      key={key}
                      className="p-4 rounded-2xl bg-[#161F30] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2 group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                            style={{ backgroundColor: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
                          >
                            {meta.icon}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                              {meta.name}
                            </h4>
                            <span className="text-[10px] font-mono text-slate-400">{meta.filipinoName}</span>
                          </div>
                        </div>

                        {/* Allocation Button & Stat Value */}
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-lg font-black text-white">{val}</span>
                          {canAllocate && (
                            <button
                              onClick={() => handleAllocateStat(key)}
                              title={`Allocate +1 into ${meta.name}`}
                              className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-90 text-slate-950 flex items-center justify-center font-bold text-base shadow-sm transition-all"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 font-mono line-clamp-2 leading-relaxed">
                        {meta.description}
                      </p>

                      {/* Unlocks / Highlights */}
                      <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 line-clamp-1">
                        <span className="text-amber-400">Pampataas: </span>
                        {meta.increaseActivities[0]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 3: Secondary RPG Attributes Bar */}
            <div className="p-4 rounded-2xl bg-[#161F30] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  SECONDARY RPG ATTRIBUTES (DERIVED STATS)
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  Awtomatikong kinakalkula mula sa Primary Attributes & Level
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 font-mono text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-rose-400 flex items-center space-x-1 font-bold">
                    <Heart className="w-3 h-3 text-rose-400" />
                    <span>MAX HP</span>
                  </span>
                  <div className="text-sm font-black text-white">{profile.secondaryAttributes.maxHp}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-cyan-400 flex items-center space-x-1 font-bold">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>ENERGY</span>
                  </span>
                  <div className="text-sm font-black text-white">{profile.secondaryAttributes.maxEnergy}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-amber-400 flex items-center space-x-1 font-bold">
                    <Activity className="w-3 h-3 text-amber-400" />
                    <span>STAMINA</span>
                  </span>
                  <div className="text-sm font-black text-white">{profile.secondaryAttributes.maxStamina}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-emerald-400 flex items-center space-x-1 font-bold">
                    <Gauge className="w-3 h-3 text-emerald-400" />
                    <span>SPEED</span>
                  </span>
                  <div className="text-sm font-black text-white">{profile.secondaryAttributes.speed}x</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-blue-400 flex items-center space-x-1 font-bold">
                    <BookOpen className="w-3 h-3 text-blue-400" />
                    <span>FOCUS</span>
                  </span>
                  <div className="text-sm font-black text-white">{profile.secondaryAttributes.focus}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-purple-400 flex items-center space-x-1 font-bold">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>LUCK</span>
                  </span>
                  <div className="text-sm font-black text-white">{profile.secondaryAttributes.luck}</div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                  <span className="text-[10px] text-yellow-400 flex items-center space-x-1 font-bold">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    <span>INFLUENCE</span>
                  </span>
                  <div className="text-sm font-black text-white">{profile.secondaryAttributes.influence}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: VISUAL SKILL TREE */}
        {/* ========================================================= */}
        {activeTab === 'skills' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                {(Object.keys(SKILL_BRANCH_META) as SkillTreeBranch[]).map((branchKey) => {
                  const bMeta = SKILL_BRANCH_META[branchKey];
                  const isSelected = selectedBranch === branchKey;

                  return (
                    <button
                      key={branchKey}
                      onClick={() => {
                        SoundFX.playClick();
                        setSelectedBranch(branchKey);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
                        isSelected
                          ? 'bg-slate-800 text-white border border-amber-400 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <span>{bMeta.icon}</span>
                      <span>{bMeta.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* SP Count */}
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/50 shadow-sm">
                <span className="text-base">🌟</span>
                <span className="font-mono text-xs font-black text-purple-300">
                  {profile.skillPoints} SKILL POINTS (SP)
                </span>
              </div>
            </div>

            {/* Active Branch Description */}
            <div
              className="p-3.5 rounded-2xl border flex items-center space-x-3"
              style={{
                backgroundColor: `${SKILL_BRANCH_META[selectedBranch].color}10`,
                borderColor: `${SKILL_BRANCH_META[selectedBranch].color}40`,
              }}
            >
              <span className="text-2xl">{SKILL_BRANCH_META[selectedBranch].icon}</span>
              <div>
                <h4 className="text-xs font-bold text-white font-mono">
                  {SKILL_BRANCH_META[selectedBranch].name} ({SKILL_BRANCH_META[selectedBranch].filipinoName})
                </h4>
                <p className="text-xs text-slate-300 font-mono mt-0.5">
                  {SKILL_BRANCH_META[selectedBranch].description}
                </p>
              </div>
            </div>

            {/* Visual Nodes by Tier */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((tierNum) => {
                const nodesInTier = SKILL_TREE_NODES.filter(
                  (node) => node.branch === selectedBranch && node.tier === tierNum
                );

                return (
                  <div key={tierNum} className="space-y-3">
                    <div className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-center font-mono text-xs font-bold text-slate-400">
                      TIER {tierNum}
                    </div>

                    <div className="space-y-3">
                      {nodesInTier.map((node) => {
                        const isUnlocked = profile.unlockedSkillIds.includes(node.id);
                        const canAfford = profile.skillPoints >= node.spCost;
                        const meetsLevel = profile.level >= node.requiredLevel;
                        const meetsPrereqs = node.prerequisites.every((pId) =>
                          profile.unlockedSkillIds.includes(pId)
                        );
                        const isAvailable = !isUnlocked && canAfford && meetsLevel && meetsPrereqs;

                        return (
                          <div
                            key={node.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                              isUnlocked
                                ? 'bg-[#161F30] border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                                : isAvailable
                                ? 'bg-[#161F30] border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                                : 'bg-slate-900/60 border-slate-800/80 opacity-60'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-2.5">
                                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                                    {node.icon}
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-bold text-white leading-tight">{node.name}</h5>
                                    <span className="text-[10px] font-mono text-slate-400">{node.filipinoName}</span>
                                  </div>
                                </div>

                                {isUnlocked ? (
                                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-500/40">
                                    {node.spCost} SP
                                  </span>
                                )}
                              </div>

                              <p className="text-[11px] text-slate-300 font-mono mt-2 leading-relaxed">
                                {node.description}
                              </p>

                              {node.specialPerk && (
                                <div className="mt-2 text-[10px] font-mono text-amber-300 bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20">
                                  {node.specialPerk}
                                </div>
                              )}
                            </div>

                            {/* Unlock Action or Status */}
                            <div className="pt-2 border-t border-slate-800">
                              {isUnlocked ? (
                                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                                  <span>✓ UNLOCKED</span>
                                </span>
                              ) : isAvailable ? (
                                <button
                                  onClick={() => handleUnlockSkill(node.id)}
                                  className="w-full py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-mono text-xs font-bold uppercase transition-all shadow-md active:scale-95"
                                >
                                  I-unlock ({node.spCost} SP)
                                </button>
                              ) : (
                                <div className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  <span>
                                    {!meetsLevel
                                      ? `Req Lv. ${node.requiredLevel}`
                                      : !meetsPrereqs
                                      ? 'Prereq locked'
                                      : `Kulang sa SP (${node.spCost} SP)`}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: QUEST JOURNAL */}
        {/* ========================================================= */}
        {activeTab === 'quests' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'Lahat (All)' },
                { id: 'main', label: 'Main Story' },
                { id: 'academy', label: 'Academy' },
                { id: 'developer', label: 'Developer' },
                { id: 'exploration', label: 'Exploration' },
                { id: 'community', label: 'Bayanihan' },
                { id: 'daily', label: 'Daily' },
                { id: 'secret', label: 'Secret' },
                { id: 'boss', label: 'Boss Raid' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedQuestCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                    selectedQuestCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {displayedQuests.map((quest) => {
                const isReadyToClaim = quest.completed && !quest.claimed;
                const isClaimed = quest.claimed;

                return (
                  <div
                    key={quest.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                      isClaimed
                        ? 'bg-slate-900/60 border-slate-800/60 opacity-60'
                        : isReadyToClaim
                        ? 'bg-[#161F30] border-amber-400/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'bg-[#161F30] border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl shrink-0">
                            {quest.icon}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white leading-tight">{quest.title}</h5>
                            <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-slate-800 text-amber-400">
                              {quest.category}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-mono font-bold text-amber-400">+{quest.xpReward} XP</div>
                          {quest.spReward && (
                            <div className="text-[10px] font-mono text-purple-400">+{quest.spReward} SP</div>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-300 font-mono mt-2 leading-relaxed">
                        {quest.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mt-3 space-y-1 font-mono text-[10px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Katayuan ng Misyon:</span>
                          <span className="text-white">
                            {quest.progress} / {quest.target}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              quest.completed ? 'bg-emerald-400' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, (quest.progress / quest.target) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Claim Button or Status */}
                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      {quest.chainCredentialTier && (
                        <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                          🛡️ {quest.chainCredentialTier}
                        </span>
                      )}

                      {isClaimed ? (
                        <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                          ✓ NAKUHA NA
                        </span>
                      ) : isReadyToClaim ? (
                        <button
                          onClick={() => handleClaimQuest(quest.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-mono text-xs font-black uppercase tracking-wider shadow-glow active:scale-95 flex items-center space-x-1 ml-auto"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Kuhanin ang Gantimpala</span>
                        </button>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 ml-auto">Kasalukuyang Ginagawa</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ACHIEVEMENTS */}
        {/* ========================================================= */}
        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-none">
              {[
                { id: 'all', label: 'Lahat' },
                { id: 'learning', label: 'Karunungan' },
                { id: 'coding', label: 'Pag-code' },
                { id: 'web3', label: 'Blockchain' },
                { id: 'exploration', label: 'Pagtuklas' },
                { id: 'community', label: 'Bayanihan' },
                { id: 'combat', label: 'Labanan' },
                { id: 'milestone', label: 'Milestones' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedAchFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                    selectedAchFilter === f.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {displayedAchievements.map((ach) => {
                const rarityBorder =
                  ach.rarity === 'Alamat'
                    ? 'border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                    : ach.rarity === 'Legendary'
                    ? 'border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                    : ach.rarity === 'Epic'
                    ? 'border-blue-400'
                    : 'border-slate-800';

                return (
                  <div
                    key={ach.id}
                    className={`p-4 rounded-2xl bg-[#161F30] border transition-all flex flex-col justify-between space-y-3 ${rarityBorder} ${
                      !ach.unlocked ? 'opacity-70' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl shrink-0">
                            {ach.icon}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white">{ach.title}</h5>
                            <span className="text-[10px] font-mono text-slate-400">{ach.filipinoTitle}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                            ach.rarity === 'Alamat'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                              : ach.rarity === 'Legendary'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-400'
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                          }`}
                        >
                          {ach.rarity}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-300 font-mono mt-2 leading-relaxed">
                        {ach.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-1 text-amber-400 font-bold">
                        <span>+{ach.xpReward} XP</span>
                        {ach.spReward && <span className="text-purple-400">+{ach.spReward} SP</span>}
                      </div>

                      {ach.unlocked ? (
                        <div className="flex items-center space-x-1 text-emerald-400 font-bold text-[10px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>NAKAMIT NA</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {ach.progress}/{ach.target}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CONTRACTS & KATUNAYAN */}
        {/* ========================================================= */}
        {activeTab === 'contracts' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-[#161F30] border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2 font-mono">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Mga Katunayan ng Pag-aari (Soulbound)</span>
                </h2>
                <button
                  onClick={() => setActiveView?.('verify')}
                  className="text-xs font-bold text-amber-400 hover:text-amber-300 font-mono"
                >
                  I-verify
                </button>
              </div>

              {certificates.length === 0 ? (
                <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono">
                  Wala ka pang nakukuhang on-chain soulbound badge. Tapusin ang mga aralin sa kurso para makuha ito!
                </div>
              ) : (
                <div className="space-y-3">
                  {certificates.map((cert) => (
                    <div
                      key={cert.tokenId}
                      onClick={() => setActiveView?.('verify')}
                      className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div className="space-y-1 font-mono">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{cert.customTitle}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {cert.tier}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Token #{cert.tokenId} • {new Date(cert.issueTimestamp * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <Shield className="w-5 h-5 text-amber-400" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-[#161F30] border border-slate-700/60 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center space-x-2 font-mono">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Mga Kontratang Na-deploy sa PISO Chain</span>
                </h2>
                <button
                  onClick={() => setActiveView?.('deploy')}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 font-mono"
                >
                  Mag-deploy
                </button>
              </div>

              {deployments.length === 0 ? (
                <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/50 border border-slate-800 text-xs font-mono">
                  Wala ka pang na-deploy na kontrata. Buksan ang Web3 Lab o Deploy Rig para mag-deploy sa PISO Chain Devnet!
                </div>
              ) : (
                <div className="space-y-3">
                  {deployments.map((d, i) => (
                    <div key={i} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{d.contractName}</span>
                        <span className="text-[10px] text-slate-400">Block #{d.blockNumber}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-amber-400 truncate max-w-[200px]">{d.contractAddress}</span>
                        <a
                          href={PISO_NETWORK.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                        >
                          <span>Explorer</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: ACCOUNT SECURITY & NOTIFICATIONS */}
        {/* ========================================================= */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fade-in font-mono text-sm">
            {/* 1. Account Status Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#161F30]/90 border border-cyan-500/30">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Account Status</span>
                </div>
                <div className="text-sm font-bold text-white mt-1 flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Aktibo & Beripikado</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1 truncate">
                  ID: {profile.accountId || 'acc_genesis_juan'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#161F30]/90 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Naka-konektang Wallet</span>
                </div>
                <div className="text-sm font-bold text-amber-300 mt-1 truncate">
                  {wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : 'Walang Naka-link'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Uri: {wallet.type === 'injected' ? 'MetaMask' : 'PISO Dev Keypair'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#161F30]/90 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" />
                  <span>Huling Login / Sesyon</span>
                </div>
                <div className="text-sm font-bold text-blue-300 mt-1">
                  {profile.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleTimeString() : 'Kasalukuyan'}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Local Sovereign Browser
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#161F30]/90 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Lock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Username Policy</span>
                </div>
                <div className="text-sm font-bold mt-1">
                  {profile.usernameChangeUsed ? (
                    <span className="text-rose-400">🔒 Kandado</span>
                  ) : (
                    <span className="text-emerald-400">1 Palit Naiwan</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  {profile.usernameChangeUsed ? 'Nagamit na ang 1 palit' : 'Maaari pang baguhin'}
                </div>
              </div>
            </div>

            {/* 2. Sovereign Device Wallet & Secure Private Key Revealer */}
            {(() => {
              const devWallet = WalletService.getDeviceWallet();
              const storedKey = WalletService.getStoredBurnerKey() || devWallet.privateKey;
              return (
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#161F30]/95 via-[#0F172A] to-[#161F30]/90 border border-amber-500/30 space-y-4 shadow-xl shadow-black/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black">
                        🔑
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span>Sovereign Device Wallet & Susi</span>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono">
                            Permanent (Per-Device)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Isang permanenteng non-custodial wallet kada browser. Hindi na kailanman muling mag-iiba.
                        </div>
                      </div>
                    </div>

                    <a
                      href={`${PISO_NETWORK.explorerUrl}/address/${devWallet.address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 transition-colors self-start sm:self-auto"
                    >
                      <span>PISO Explorer</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Device Address Display */}
                  <div className="p-3.5 rounded-xl bg-[#0B0F17] border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-mono text-slate-400">Address ng Device:</div>
                      <div className="font-mono text-xs text-amber-300 font-bold truncate mt-0.5 select-all">
                        {devWallet.address}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(devWallet.address);
                        setCopiedDeviceAddr(true);
                        setTimeout(() => setCopiedDeviceAddr(false), 2000);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5 transition-colors shrink-0"
                    >
                      {copiedDeviceAddr ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedDeviceAddr ? 'Na-kopya!' : 'Kopyahin'}</span>
                    </button>
                  </div>

                  {/* Private Key Reveal Section */}
                  <div className="p-3.5 rounded-xl bg-black/40 border border-slate-800/90 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1.5">
                        <Key className="w-3 h-3 text-amber-400" />
                        <span>Sovereign Private Key (Raw Hex)</span>
                      </div>
                      {showPrivKey && privKeyTimer > 0 && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
                          Awtomatikong itatago sa loob ng {privKeyTimer}s
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        readOnly
                        value={
                          showPrivKey
                            ? storedKey
                            : '••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••'
                        }
                        className={`flex-1 px-3 py-2 rounded-xl bg-[#0B0F17] border text-xs font-mono focus:outline-none transition-colors select-all ${
                          showPrivKey
                            ? 'border-amber-500/60 text-amber-300 bg-amber-950/10'
                            : 'border-slate-800 text-slate-500'
                        }`}
                      />
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (!showPrivKey) {
                              setShowPrivKey(true);
                              setPrivKeyTimer(30);
                            } else {
                              setShowPrivKey(false);
                              setPrivKeyTimer(0);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shrink-0 ${
                            showPrivKey
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 hover:bg-amber-500/30'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {showPrivKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          <span>{showPrivKey ? 'Itago' : 'Ipakita'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={!showPrivKey}
                          onClick={() => {
                            if (!storedKey) return;
                            navigator.clipboard.writeText(storedKey);
                            setCopiedPrivKey(true);
                            setTimeout(() => setCopiedPrivKey(false), 2500);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold font-mono flex items-center space-x-1.5 transition-all shrink-0 ${
                            showPrivKey
                              ? copiedPrivKey
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                          }`}
                        >
                          {copiedPrivKey ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPrivKey ? 'Na-kopya!' : 'Kopyahin'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Security Warning */}
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 flex items-start space-x-2 text-[11px] text-rose-300 leading-relaxed">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Babala sa Seguridad:</strong> Huwag kailanman ibahagi ang iyong Private Key kahit kanino! Sinumang may access dito ay maaaring ilipat ang lahat ng iyong mga token, NFT, at smart contracts.
                      </span>
                    </div>

                    {/* Quick Import Guide */}
                    <div className="text-[11px] text-slate-400 space-y-1 bg-[#0B0F17]/60 p-3 rounded-lg border border-slate-800/80">
                      <div className="font-bold text-slate-200">Paano i-import sa MetaMask / Rabby / Bitget:</div>
                      <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[10px] font-mono">
                        <li>I-click ang <strong>"Ipakita"</strong> at <strong>"Kopyahin"</strong> sa itaas.</li>
                        <li>Buksan ang MetaMask / Rabby Wallet &rarr; Profile &rarr; <em>Import Account</em>.</li>
                        <li>I-paste ang Private Key at magkonekta sa PISO Chain (Chain ID: 202600101).</li>
                      </ol>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Username Management Card */}
            <div className="p-5 rounded-2xl bg-[#161F30]/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Pamamahala ng Username (Isang Beses Lamang)
                  </span>
                </div>
                {profile.usernameChangeUsed && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center space-x-1">
                    <Lock className="w-3 h-3" />
                    <span>Permanenteng Nakakandado</span>
                  </span>
                )}
              </div>

              <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] text-slate-400">Kasalukuyang Username:</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">{profile.username}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {profile.usernameChangeUsed
                      ? `Pinalitan noong: ${profile.usernameChangedAt ? new Date(profile.usernameChangedAt).toLocaleDateString() : 'N/A'}`
                      : 'Maaari mo lamang palitan ang iyong username nang ISANG BESES kada account.'}
                  </div>
                </div>

                {!profile.usernameChangeUsed && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewUsernameInput(profile.username);
                      setIsEditingUsername(true);
                      setUsernameError('');
                    }}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] shrink-0"
                  >
                    ✏️ Palitan ang Username
                  </button>
                )}
              </div>

              {/* Inline Edit Form */}
              {isEditingUsername && !profile.usernameChangeUsed && (
                <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/50 space-y-3 animate-fade-in">
                  <div className="text-xs text-amber-300 font-bold flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Babala: Isang beses lamang ito maaaring palitan!</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newUsernameInput}
                      onChange={(e) => setNewUsernameInput(e.target.value)}
                      placeholder="Bagong username (3-20 characters)..."
                      className="flex-1 px-3 py-2 rounded-xl bg-[#0B0F17] border border-slate-700 text-white text-xs font-mono focus:border-cyan-400 focus:outline-none"
                    />
                    <div className="flex space-x-2">
                      <button
                        type="button"
                        onClick={handleUpdateUsername}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                      >
                        I-kumpirma
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingUsername(false)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                      >
                        Kanselahin
                      </button>
                    </div>
                  </div>
                  {usernameError && <div className="text-xs text-rose-400 font-bold">{usernameError}</div>}
                  {usernameSuccess && <div className="text-xs text-emerald-400 font-bold">{usernameSuccess}</div>}
                </div>
              )}
            </div>

            {/* 3. Security Event Log & Notifications Center */}
            <div className="p-5 rounded-2xl bg-[#161F30]/80 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Persistent Security & Account Event Log ({securityNotifs.length})
                  </span>
                </div>
                {securityNotifs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      AccountSessionService.get().clearNotifications();
                      setSecurityNotifs([]);
                    }}
                    className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>I-clear ang Log</span>
                  </button>
                )}
              </div>

              {securityNotifs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 rounded-xl bg-[#0B0F17]/50 border border-slate-800 text-xs">
                  Walang naitalang mga alerto sa seguridad. Ligtas ang iyong account!
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {securityNotifs.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-[#0B0F17] border border-slate-800/80 flex items-start space-x-3 text-xs"
                    >
                      <span className="text-base mt-0.5">
                        {item.type === 'new_login' || item.type === 'session_restored'
                          ? '🔐'
                          : item.type === 'wallet_connected'
                          ? '🔗'
                          : item.type === 'wallet_changed'
                          ? '⚠️'
                          : item.type === 'username_changed'
                          ? '👤'
                          : '🛡️'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-white truncate">{item.title}</span>
                          <span className="text-[10px] text-slate-500 shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">{item.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Privacy & Non-Custodial Assurance Banner */}
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center space-x-3 text-xs text-emerald-300">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold">Seguridad ng PISO Sovereign: </span>
                <span>
                  Hindi kailanman inilalantad o iniimbak ng PISO Academy ang iyong private keys o seed phrases sa plaintext sa server o console. Ang iyong wallet credentials ay nananatiling kontrolado mo.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (isInline) {
    return innerContent;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      {innerContent}
    </div>
  );
};
