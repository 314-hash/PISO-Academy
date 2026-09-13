/**
 * AvatarSelectionModal.tsx
 * High-converting, interactive Avatar Selection & Identity Configuration Modal
 * for PISO Academy Metaverse.
 * 
 * Follows the 60-30-10 Filipino Cyberpunk Design System:
 * 60% Dominant: #0B0F17 (Deep Void Slate)
 * 30% Secondary: #1E293B (Cyber Slate Panels & Cards)
 * 10% Accent: #F59E0B / #06B6D4 (Sun Gold & Neon Cyan)
 */

import React, { useState } from 'react';
import { useAcademy, HumanAvatarConfig, AvatarSkinId } from '../../context/AcademyContext';
import { PlayerProgressionEngine } from '../../services/playerProgressionEngine';
import { PLAYER_CLASSES } from '../../data/progressionMeta';
import { PlayerClassId } from '../../types/playerProgression';
import { SoundFX } from '../../services/soundFX';
import {
  Sparkles,
  Shield,
  Zap,
  Check,
  User,
  Crown,
  Bot,
  Flame,
  ArrowRight,
  X,
  Palette,
} from 'lucide-react';

interface AvatarArchetype {
  id: string;
  name: string;
  filipinoTitle: string;
  icon: string;
  skinId: AvatarSkinId;
  defaultClass: PlayerClassId;
  description: string;
  config: Partial<HumanAvatarConfig>;
}

const ARCHETYPES: AvatarArchetype[] = [
  {
    id: 'explorer',
    name: 'Student Explorer',
    filipinoTitle: 'Mag-aaral ng Bayan',
    icon: '🌱',
    skinId: 'panday',
    defaultClass: 'polymath',
    description: 'Fresh recruit ready to discover Web3 basics, blockchain consensus, and smart contract fundamentals.',
    config: {
      outfit: 'plainTshirt',
      skinTone: '#C68642',
      hairColor: '#0B0F17',
      auraColor: '#10B981',
      hairStyle: 'cyberFade',
    },
  },
  {
    id: 'builder',
    name: 'Solidity Builder',
    filipinoTitle: 'Tagabuo ng Kontrata',
    icon: '💻',
    skinId: 'panday',
    defaultClass: 'builder',
    description: 'Focused software engineer specializing in EVM opcode optimization, Foundry testing, and clean architecture.',
    config: {
      outfit: 'pandayBlacksmith',
      skinTone: '#8D5524',
      hairColor: '#1E293B',
      auraColor: '#06B6D4',
      hairStyle: 'undercut',
    },
  },
  {
    id: 'warrior',
    name: 'Chain Warrior',
    filipinoTitle: 'Mandirigma ng Kadena',
    icon: '⚔️',
    skinId: 'sentinel',
    defaultClass: 'chain_warrior',
    description: 'Battle-hardened auditor defending protocols against reentrancy, MEV front-runners, and exploit wraiths.',
    config: {
      outfit: 'urdujaArmor',
      skinTone: '#E0AC69',
      hairColor: '#0F172A',
      auraColor: '#EF4444',
      hairStyle: 'urdujaPonytail',
    },
  },
  {
    id: 'datu',
    name: 'Datu Sovereign',
    filipinoTitle: 'Gintong Pinuno',
    icon: '👑',
    skinId: 'panday',
    defaultClass: 'bayani',
    description: 'Ecosystem visionary equipped with ceremonial gold armor, inspiring DAO consensus and community growth.',
    config: {
      outfit: 'founderArmor',
      skinTone: '#8D5524',
      hairColor: '#0B0F17',
      auraColor: '#F59E0B',
      hairStyle: 'datuLongWavy',
    },
  },
  {
    id: 'babaylan',
    name: 'Babaylan AI',
    filipinoTitle: 'Paham ng Karunungan',
    icon: '🔮',
    skinId: 'babaylan',
    defaultClass: 'data_sage',
    description: 'Mystic researcher uniting zero-knowledge cryptography with autonomous AI agent network oracles.',
    config: {
      outfit: 'babaylanOracle',
      skinTone: '#F1C27D',
      hairColor: '#3B0764',
      auraColor: '#A855F7',
      hairStyle: 'diwataLocks',
    },
  },
  {
    id: 'cyborg',
    name: 'Web3 Cyborg',
    filipinoTitle: 'Siyentipiko ng DePIN',
    icon: '🤖',
    skinId: 'sentinel',
    defaultClass: 'creator',
    description: 'Hardware node runner bridging physical infrastructure with decentralized PISO Chain validation.',
    config: {
      outfit: 'bayanihanGuardian',
      skinTone: '#94A3B8',
      hairColor: '#0284C7',
      auraColor: '#38BDF8',
      hairStyle: 'topknot',
    },
  },
];

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmEnter: (chosenUsername: string) => void;
}

export const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({
  isOpen,
  onClose,
  onConfirmEnter,
}) => {
  const { humanAvatar, setHumanAvatar, setAvatarSkin, setAvatarMode } = useAcademy();
  const profile = PlayerProgressionEngine.getProfile();

  const [selectedArchId, setSelectedArchId] = useState<string>('builder');
  const [username, setUsername] = useState<string>(() => {
    return profile?.username || localStorage.getItem('piso_player_alias') || 'JuanDev';
  });
  const [selectedClass, setSelectedClass] = useState<PlayerClassId>(profile?.playerClass || 'builder');
  const [gender, setGender] = useState<'male' | 'female'>(humanAvatar?.gender === 'female' ? 'female' : 'male');
  const [auraColor, setAuraColor] = useState<string>(humanAvatar?.auraColor || '#06B6D4');

  if (!isOpen) return null;

  const currentArchetype = ARCHETYPES.find((a) => a.id === selectedArchId) || ARCHETYPES[1];

  const handleSelectArchetype = (arch: AvatarArchetype) => {
    setSelectedArchId(arch.id);
    setSelectedClass(arch.defaultClass);
    if (arch.config.auraColor) setAuraColor(arch.config.auraColor);
    SoundFX.playBlip();
  };

  const handleConfirm = () => {
    SoundFX.playLevelUp();

    const cleanName = username.trim() || 'JuanDev';
    localStorage.setItem('piso_player_alias', cleanName);
    PlayerProgressionEngine.setPlayerUsername(cleanName);
    PlayerProgressionEngine.setPlayerClass(selectedClass);

    // Apply avatar configuration
    setAvatarMode('human');
    setAvatarSkin(currentArchetype.skinId);
    setHumanAvatar({
      ...humanAvatar,
      ...currentArchetype.config,
      gender,
      auraColor,
    });

    onConfirmEnter(cleanName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#0B0F17] border-2 border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-xl">
              🧑‍🚀
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-emerald-400 tracking-wider">
                CHOOSE YOUR METAVERSE AVATAR
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                PISO Academy Blockchain Metaverse • Multi-Student World
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* 1. Username & Identity Bar */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-auto flex-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-1.5">
                Display Name (Screen Nametag)
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={18}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="JuanDev"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 shadow-inner"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-500">
                  {username.length}/18
                </span>
              </div>
            </div>

            {/* Gender Toggle */}
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                Model Rig
              </label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-700 p-1">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    gender === 'male'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  🧑 Masculine
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    gender === 'female'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  👩 Feminine
                </button>
              </div>
            </div>
          </div>

          {/* 2. Archetype Grid Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Select Character Archetype</span>
              </h3>
              <span className="text-[11px] font-mono text-amber-400">
                Extensible 3D Rig • Fully Animated
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ARCHETYPES.map((arch) => {
                const isSelected = selectedArchId === arch.id;
                return (
                  <div
                    key={arch.id}
                    onClick={() => handleSelectArchetype(arch)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-400 shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl">{arch.icon}</div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-mono font-black flex items-center space-x-1">
                            <Check className="w-3 h-3" />
                            <span>CHOSEN</span>
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-mono font-bold text-white mb-0.5">{arch.name}</h4>
                      <p className="text-[11px] font-mono text-amber-400/90 mb-2">{arch.filipinoTitle}</p>
                      <p className="text-xs font-mono text-slate-400 leading-relaxed">
                        {arch.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Affinity: {PLAYER_CLASSES[arch.defaultClass]?.primaryStatAffinity.toUpperCase()}</span>
                      <span className="text-cyan-400 font-bold">{PLAYER_CLASSES[arch.defaultClass]?.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Class & Aura Color Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Class Selector */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-xs font-mono uppercase tracking-wider text-amber-400 font-bold mb-2">
                Specialization / Class Ability
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value as PlayerClassId)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                {Object.values(PLAYER_CLASSES).map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.specialAbilityName})
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-mono text-slate-400 mt-2">
                {PLAYER_CLASSES[selectedClass]?.specialAbilityDesc}
              </p>
            </div>

            {/* Aura Energy Color */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
              <label className="block text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold mb-2 flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5" />
                <span>3D Aura & Ground Ring Glow</span>
              </label>
              <div className="flex items-center space-x-3">
                {['#06B6D4', '#F59E0B', '#10B981', '#A855F7', '#EF4444', '#3B82F6'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setAuraColor(col)}
                    style={{ backgroundColor: col }}
                    className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                      auraColor === col ? 'scale-110 border-white shadow-md' : 'border-transparent opacity-75 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-2">
                Radiates around your feet and pet companion drone.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer / Action Bar */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-400">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Multiplayer mesh synchronizes with all active browser tabs & peers.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-5 py-2.5 rounded-xl border border-slate-700 text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-1/2 sm:w-auto px-7 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-amber-500 text-slate-950 text-xs font-mono font-black tracking-wider uppercase shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-amber-400 hover:scale-105 active:scale-95 transition-all flex items-center justify-center space-x-2"
            >
              <span>ENTER METAVERSE</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
