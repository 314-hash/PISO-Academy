import React, { useState } from 'react';
import { useAcademy, DEFAULT_HUMAN_AVATAR } from '../context/AcademyContext';
import { SoundFX } from '../services/soundFX';
import {
  User,
  Award,
  ExternalLink,
  Github,
  Coins,
  Shield,
  Layers,
  CheckCircle2,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { PISO_NETWORK } from '../pisoConfig';

export const BuilderProfile: React.FC = () => {
  const {
    wallet,
    xp,
    level,
    levelTitle,
    certificates,
    deployments,
    completedLessons,
    passedChallenges,
    setActiveView,
    humanAvatar,
  } = useAcademy();

  const [githubHandle, setGithubHandle] = useState('janus-builder');
  const [copied, setCopied] = useState(false);

  // Progress to next level (500 XP per level)
  const currentLevelBaseXp = (level - 1) * 500;
  const nextLevelXp = level * 500;
  const progressInLevel = xp - currentLevelBaseXp;
  const progressPercent = Math.min(Math.round((progressInLevel / 500) * 100), 100);

  const displayAddress = wallet.address || '0x1821F246a27287a2187E1D634B8883030fA14731';

  const handleCopyProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#161F30] via-slate-900 to-[#161F30] border border-slate-700/80 shadow-glow relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          {/* Avatar & Identifiers */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-blue-600 to-amber-500 p-0.5 shadow-glow">
              <div className="w-full h-full bg-[#0B0F17] rounded-[14px] flex flex-col items-center justify-center text-3xl">
                {(humanAvatar?.gender || DEFAULT_HUMAN_AVATAR.gender) === 'female' ? '👩‍💻' : (humanAvatar?.gender || DEFAULT_HUMAN_AVATAR.gender) === 'android' ? '🤖' : '👨‍💻'}
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white">{humanAvatar?.name || DEFAULT_HUMAN_AVATAR.name}</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  {(humanAvatar?.outfit || DEFAULT_HUMAN_AVATAR.outfit) === 'barongCyber'
                    ? 'Barong Cyber'
                    : (humanAvatar?.outfit || DEFAULT_HUMAN_AVATAR.outfit) === 'katipunanTech'
                    ? 'Katipunan Tech'
                    : (humanAvatar?.outfit || DEFAULT_HUMAN_AVATAR.outfit) === 'babaylanRobes'
                    ? 'Babaylan Shroud'
                    : 'PISO Builder'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 mt-1 flex items-center space-x-2">
                <span>{displayAddress.slice(0, 10)}...{displayAddress.slice(-8)}</span>
                <span className="text-slate-600">|</span>
                <span className="text-emerald-400 font-bold">{parseFloat(wallet.balance).toFixed(2)} ₱</span>
              </p>
              {/* GitHub Link */}
              <div className="flex items-center space-x-2 mt-2">
                <a
                  href={`https://github.com/${githubHandle}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>github.com/{githubHandle}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Action Buttons: Customize Avatar & Share Profile */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                SoundFX.playClick();
                window.dispatchEvent(new KeyboardEvent('keydown', { key: '7' }));
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 transition-all shadow-sm"
              title="Buksan ang Avatar Hangar Suite (Hotkey: 7)"
            >
              <span>👤</span>
              <span>I-customize Avatar</span>
            </button>
            <button
              onClick={handleCopyProfile}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Na-kopya ang Link!' : 'Ibahagi ang Profile'}</span>
            </button>
          </div>
        </div>

        {/* Gamification Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-300 font-mono">{levelTitle}</span>
              <span className="font-mono text-slate-400">{xp} / {nextLevelXp} XP</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-amber-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Mga Araling Natapos:</span>
            <span className="text-sm font-black text-white font-mono">{completedLessons.length}</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Pinasang Hamon:</span>
            <span className="text-sm font-black text-emerald-400 font-mono">{passedChallenges.length}</span>
          </div>
        </div>
      </div>

      {/* Main Profile Grid: Soulbound Badges & Deployed Contracts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: On-Chain Soulbound Katunayan Badges */}
        <div className="p-6 rounded-2xl bg-[#161F30] border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Mga Katunayan ng Pag-aari (Soulbound)</span>
            </h2>
            <button
              onClick={() => setActiveView('verify')}
              className="text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              I-verify
            </button>
          </div>

          {certificates.length === 0 ? (
            <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              Wala ka pang nakukuhang on-chain soulbound badge. Tapusin ang mga aralin sa kurso para makuha ito!
            </div>
          ) : (
            <div className="space-y-3">
              {certificates.map((cert) => (
                <div
                  key={cert.tokenId}
                  onClick={() => setActiveView('verify')}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-white">{cert.customTitle}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {cert.tier}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">
                      Token #{cert.tokenId} • {new Date(cert.issueTimestamp * 1000).toLocaleDateString()}
                    </p>
                  </div>
                  <Shield className="w-5 h-5 text-amber-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Deployed Contracts on PISO Chain */}
        <div className="p-6 rounded-2xl bg-[#161F30] border border-slate-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Mga Kontratang Na-deploy sa PISO Chain</span>
            </h2>
            <button
              onClick={() => setActiveView('deploy')}
              className="text-xs font-bold text-blue-400 hover:text-blue-300"
            >
              Mag-deploy
            </button>
          </div>

          {deployments.length === 0 ? (
            <div className="p-8 text-center text-slate-500 rounded-xl bg-slate-900/50 border border-slate-800 text-xs">
              Wala ka pang na-deploy na kontrata. Buksan ang Web3 Lab o Deploy Rig para mag-deploy sa PISO Chain Devnet!
            </div>
          ) : (
            <div className="space-y-3">
              {deployments.map((d, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{d.contractName}</span>
                    <span className="text-[10px] font-mono text-slate-400">Block #{d.blockNumber}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
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
    </div>
  );
};
