/**
 * PlayerInteractionModal.tsx
 * Interactive Social & Study Drawer for interacting with nearby students in PISO Academy.
 * Triggered via proximity ([E] Interact) or by clicking a player in the nearby list.
 */

import React, { useState } from 'react';
import { RemotePlayerState } from '../../../types/multiplayer';
import { MultiplayerNetworkEngine } from '../../../services/multiplayer/MultiplayerNetworkEngine';
import { PlayerProgressionEngine } from '../../../services/playerProgressionEngine';
import { SoundFX } from '../../../services/soundFX';
import { getRankForLevel, PLAYER_CLASSES } from '../../../data/progressionMeta';
import {
  User,
  MessageSquare,
  Users,
  Swords,
  Heart,
  X,
  Sparkles,
  Zap,
  Shield,
  ExternalLink,
  Award,
  Send,
} from 'lucide-react';

interface PlayerInteractionModalProps {
  targetPlayer: RemotePlayerState | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChatWith?: (username: string) => void;
}

export const PlayerInteractionModal: React.FC<PlayerInteractionModalProps> = ({
  targetPlayer,
  isOpen,
  onClose,
  onOpenChatWith,
}) => {
  const [whisperText, setWhisperText] = useState('');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!isOpen || !targetPlayer) return null;

  const rank = getRankForLevel(targetPlayer.level || 1);
  const playerClass = PLAYER_CLASSES[targetPlayer.playerClass] || PLAYER_CLASSES.builder;

  const handleSendWhisper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!whisperText.trim()) return;

    MultiplayerNetworkEngine.instance.sendChatMessage(
      `[Whisper to @${targetPlayer.username}]: ${whisperText}`,
      true
    );
    SoundFX.playBlip();
    setWhisperText('');
    setActionNotice(`Bulong ipinadala kay @${targetPlayer.username}!`);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleStudyInvite = () => {
    MultiplayerNetworkEngine.instance.sendInteraction(
      targetPlayer.playerId,
      'study_invite',
      { partyBonus: '+15% Bayanihan XP' }
    );
    SoundFX.playLevelUp();
    PlayerProgressionEngine.awardAction('help_player', { target: targetPlayer.username });
    setActionNotice(`Naimbitahan si ${targetPlayer.username} sa Study Group! (+15% Bayanihan XP bonus active)`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleDuelChallenge = () => {
    MultiplayerNetworkEngine.instance.sendInteraction(
      targetPlayer.playerId,
      'duel_challenge',
      { arena: 'Solidity Forge' }
    );
    SoundFX.playLaser();
    setActionNotice(`Hamon ng Smart Contract Code Duel ipinadala kay ${targetPlayer.username}!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleAddFriend = () => {
    MultiplayerNetworkEngine.instance.sendInteraction(
      targetPlayer.playerId,
      'friend_request'
    );
    SoundFX.playSuccess();
    PlayerProgressionEngine.awardAction('help_player', { friend: targetPlayer.username });
    setActionNotice(`Bayanihan Friend request sent to ${targetPlayer.username}!`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const handleSendEmote = (emote: string, label: string) => {
    MultiplayerNetworkEngine.instance.sendChatMessage(
      `*${emote} nag-greet ng "${label}" kay @${targetPlayer.username}*`,
      true
    );
    SoundFX.playClick();
    setActionNotice(`Ipinadala ang pagbati kay ${targetPlayer.username}!`);
    setTimeout(() => setActionNotice(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0B0F17] border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.3)] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800/80 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-xl">
              🧑‍🎓
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-mono font-bold text-white">
                  {targetPlayer.username}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono font-bold">
                  🟢 NEARBY
                </span>
              </div>
              <p className="text-xs font-mono text-amber-400">
                {rank.badgeIcon} {rank.tier} (Lv.{targetPlayer.level || 1}) • {playerClass.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Action Notice banner */}
          {actionNotice && (
            <div className="p-3 rounded-xl bg-cyan-950/80 border border-cyan-500/60 text-cyan-200 text-xs font-mono animate-bounce-short">
              ✨ {actionNotice}
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Digital Power
              </span>
              <span className="text-sm font-mono font-bold text-cyan-400 flex items-center space-x-1 mt-0.5">
                <Zap className="w-3.5 h-3.5" />
                <span>{targetPlayer.digitalPower || 100} DP</span>
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                Class Ability
              </span>
              <span className="text-sm font-mono font-bold text-amber-400 flex items-center space-x-1 mt-0.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{playerClass.specialAbilityName}</span>
              </span>
            </div>
          </div>

          {/* Quick Greetings / Emotes */}
          <div>
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold mb-2 block">
              Quick Pinoy Greetings
            </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => handleSendEmote('👋', 'Mabuhay!')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 hover:text-white transition-all flex items-center justify-center space-x-1"
              >
                <span>👋</span>
                <span>Mabuhay!</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendEmote('👊', 'Tara Aral!')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 hover:text-white transition-all flex items-center justify-center space-x-1"
              >
                <span>👊</span>
                <span>Tara Aral!</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendEmote('🔥', 'Lupet!')}
                className="flex-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200 hover:text-white transition-all flex items-center justify-center space-x-1"
              >
                <span>🔥</span>
                <span>Lupet!</span>
              </button>
            </div>
          </div>

          {/* Main Interaction Actions */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleStudyInvite}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-mono font-bold text-xs hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>INVITE TO STUDY GROUP (+15% XP)</span>
            </button>

            <button
              type="button"
              onClick={handleDuelChallenge}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 text-white font-mono font-bold text-xs hover:from-rose-500 hover:to-amber-500 shadow-md shadow-rose-600/20 transition-all flex items-center justify-center space-x-2"
            >
              <Swords className="w-4 h-4" />
              <span>CHALLENGE TO CODE DUEL</span>
            </button>

            <button
              type="button"
              onClick={handleAddFriend}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs transition-all flex items-center justify-center space-x-2"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>ADD BAYANIHAN FRIEND</span>
            </button>
          </div>

          {/* Proximity Whisper Input */}
          <form onSubmit={handleSendWhisper} className="pt-2 border-t border-slate-800">
            <label className="block text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold mb-1.5">
              Direct Proximity Whisper
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={whisperText}
                onChange={(e) => setWhisperText(e.target.value)}
                placeholder={`Mag-iwan ng mensahe kay @${targetPlayer.username}...`}
                className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
