import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useAcademy, NavView, DEFAULT_KEYBINDS } from '../../context/AcademyContext';
import { Cyber3DWorld, DistrictInfo, NPCLocationInfo, CruiseTargetInfo } from './Cyber3DWorld';
import { GameTopBar } from './GameTopBar';
import { GameMinimap } from './GameMinimap';
import { GameActionBar } from './GameActionBar';
import { GameQuestTracker } from './GameQuestTracker';
import { FloatingGameWindow } from './FloatingGameWindow';
import { SoundFX } from '../../services/soundFX';
import { ANIME_SKILLS, AnimeSkillDef } from '../../data/filipinoCultureItems';
import { MonsterSpawnEngine } from '../../services/MonsterSpawnEngine';
import { MiningBlockEngine } from '../../services/MiningBlockEngine';

// Modals
import { GameTutorialModal } from './GameTutorialModal';
import { GameOptionsModal } from './GameOptionsModal';
import { NPCMentorModal } from './NPCMentorModal';
import { AvatarHangarModal } from './AvatarHangarModal';
import { CharacterCreationModal } from './CharacterCreationModal';
import { DailyQuestsModal } from './DailyQuestsModal';
import { PlayerProfileModal } from './PlayerProfileModal';
import { ProgressionFeedbackToast } from './ProgressionFeedbackToast';
import { Img2ThreejsStudio } from './Img2ThreejsStudio';
import { WalletStudioTerminalModal } from './WalletStudioTerminalModal';
import { PisoP2PChatRoom } from './PisoP2PChatRoom';
import { LiveHUDChatBox } from './LiveHUDChatBox';
import { DualVirtualJoystick } from './controls/DualVirtualJoystick';
import { MobileActionCluster } from './controls/MobileActionCluster';
import { InputDebugger } from './controls/InputDebugger';
import { ControlSettingsModal } from './controls/ControlSettingsModal';
import { PpfContactSolverStudio } from './PpfContactSolverStudio';
import { TerranianMapGeneratorStudio } from './TerranianMapGeneratorStudio';
import { PISOMetaverseEconomyStudio } from './PISOMetaverseEconomyStudio';
import { MonsterHunterStudio } from './MonsterHunterStudio';
import { PISOPvPArenaStudio } from './PISOPvPArenaStudio';
import { MiningBuildingStudio } from './MiningBuildingStudio';
import { AvatarSelectionModal } from './AvatarSelectionModal';
import { PlayerInteractionModal } from './multiplayer/PlayerInteractionModal';
import { MultiplayerNetworkEngine } from '../../services/multiplayer/MultiplayerNetworkEngine';
import { RemotePlayerState } from '../../types/multiplayer';
import { PlayerProgressionEngine } from '../../services/playerProgressionEngine';

// Content Views
import { CourseCatalog } from '../CourseCatalog';
import { Web3Lab } from '../Web3Lab';
import { DeploymentManager } from '../DeploymentManager';
import { CertificateVerifier } from '../CertificateVerifier';
import { BuilderProfile } from '../BuilderProfile';
import { ProjectDirectory } from '../ProjectDirectory';
import { PisoWorldMap3D } from '../PisoWorldMap3D';

import { ArrowRight, Bot, Navigation } from 'lucide-react';

interface CyberGameEngineProps {
  gameMode: boolean;
  onToggleGameMode: () => void;
}

export const CyberGameEngine: React.FC<CyberGameEngineProps> = ({
  gameMode,
  onToggleGameMode,
}) => {
  const {
    activeView,
    setActiveView,
    requestFaucet,
    setNotification,
    showTutorial,
    setShowTutorial,
    claimedMentorRewards,
    controlSettings,
    humanAvatar,
    avatarSkin,
    avatarMode,
    wallet,
  } = useAcademy();

  const [nearbyDistrict, setNearbyDistrict] = useState<DistrictInfo | null>(null);
  const [nearbyMentor, setNearbyMentor] = useState<NPCLocationInfo | null>(null);
  const [cruiseTarget, setCruiseTarget] = useState<CruiseTargetInfo | null>(null);

  // Active Modals
  const [activeWindow, setActiveWindow] = useState<NavView | null>(null);
  const [activeMentor, setActiveMentor] = useState<NPCLocationInfo | null>(null);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showQuests, setShowQuests] = useState<boolean>(false);
  const [showHangar, setShowHangar] = useState<boolean>(false);
  const [hangarInitialTab, setHangarInitialTab] = useState<'human' | 'pinoy' | 'drone' | 'inventory' | 'glb'>('pinoy');
  const [showWalletTerminal, setShowWalletTerminal] = useState<boolean>(false);

  useEffect(() => {
    const handleOpenGlbStudio = () => {
      setHangarInitialTab('glb');
      setShowHangar(true);
    };
    window.addEventListener('piso-open-glb-studio', handleOpenGlbStudio);
    return () => window.removeEventListener('piso-open-glb-studio', handleOpenGlbStudio);
  }, []);
  const [showMiningStudio, setShowMiningStudio] = useState<boolean>(false);
  const [showCharacterCreation, setShowCharacterCreation] = useState<boolean>(false);
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(SoundFX.isMuted);

  const [miningEngine, setMiningEngine] = useState<MiningBlockEngine | null>(null);
  const [monsterEngine, setMonsterEngine] = useState<MonsterSpawnEngine | null>(null);

  // Multiplayer States
  const [nearbyPlayer, setNearbyPlayer] = useState<{ player: RemotePlayerState; distance: number } | null>(null);
  const [showInteractionModal, setShowInteractionModal] = useState<boolean>(false);
  const [activeInteractionPlayer, setActiveInteractionPlayer] = useState<RemotePlayerState | null>(null);
  const [showAvatarSelection, setShowAvatarSelection] = useState<boolean>(false);

  // Mobile / Touch controls state (detected automatically or toggled on demand)
  const [showControlSettingsModal, setShowControlSettingsModal] = useState<boolean>(false);
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return (
      'ontouchstart' in window ||
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) ||
      window.innerWidth < 1024
    );
  });

  // Screen Minimization & Zen / Cinematic Mode
  const [isCinematicMode, setIsCinematicMode] = useState<boolean>(false);
  const [isSkillsCollapsed, setIsSkillsCollapsed] = useState<boolean>(false);
  const [isControlsHUDMinimized, setIsControlsHUDMinimized] = useState<boolean>(false);

  // Listen for custom event to open wallet studio terminal
  React.useEffect(() => {
    const handleOpenWalletEvent = () => {
      setShowWalletTerminal(true);
    };
    const handleOpenMiningEvent = () => {
      setShowMiningStudio(true);
    };
    const handleOpenAvatarOptions = () => {
      setHangarInitialTab('human');
      setShowHangar(true);
      SoundFX.playBlip();
    };
    const handleOpenInventory = () => {
      setHangarInitialTab('inventory');
      setShowHangar(true);
      SoundFX.playBlip();
    };
    const handleOpenCharacterCreation = () => {
      setShowCharacterCreation(true);
      SoundFX.playBlip();
    };
    const handleOpenProfileModal = () => {
      setShowProfileModal(true);
      SoundFX.playBlip();
    };
    const handleInteractPlayer = (e: Event) => {
      const custom = e as CustomEvent<{ player: RemotePlayerState }>;
      if (custom.detail?.player) {
        setActiveInteractionPlayer(custom.detail.player);
        setShowInteractionModal(true);
        SoundFX.playBlip();
      }
    };
    window.addEventListener('piso-open-wallet-terminal', handleOpenWalletEvent);
    window.addEventListener('piso-open-mining-studio', handleOpenMiningEvent);
    window.addEventListener('piso-open-avatar-options', handleOpenAvatarOptions);
    window.addEventListener('piso-open-inventory', handleOpenInventory);
    window.addEventListener('piso-open-character-creation', handleOpenCharacterCreation);
    window.addEventListener('piso-open-player-profile', handleOpenProfileModal);
    window.addEventListener('piso-interact-player', handleInteractPlayer);
    return () => {
      window.removeEventListener('piso-open-wallet-terminal', handleOpenWalletEvent);
      window.removeEventListener('piso-open-mining-studio', handleOpenMiningEvent);
      window.removeEventListener('piso-open-avatar-options', handleOpenAvatarOptions);
      window.removeEventListener('piso-open-inventory', handleOpenInventory);
      window.removeEventListener('piso-open-character-creation', handleOpenCharacterCreation);
      window.removeEventListener('piso-open-player-profile', handleOpenProfileModal);
      window.removeEventListener('piso-interact-player', handleInteractPlayer);
    };
  }, []);

  // Initialize and synchronize Multiplayer Mesh session
  React.useEffect(() => {
    if (gameMode) {
      const profile = PlayerProgressionEngine.getProfile();
      const localState: RemotePlayerState = {
        playerId: 'player_' + (profile.username || 'juan').toLowerCase().replace(/\s+/g, '_'),
        username: profile.username || 'JuanDev',
        walletAddress: wallet?.address || undefined,
        isGuest: !wallet?.address,
        avatarMode: avatarMode || 'human',
        avatarSkin: avatarSkin || 'panday',
        humanAvatar: humanAvatar,
        playerClass: profile.playerClass || 'builder',
        rankTier: profile.rank || 'Tuklas',
        rankTitle: profile.rank || 'Tuklas',
        level: profile.level || 1,
        digitalPower: profile.secondaryAttributes?.digitalPower || 100,
        currentZone: 'genesis',
        presence: 'online',
        animState: 'idle',
        transform: { x: 0, y: 0.05, z: 8, heading: 0, vx: 0, vy: 0, vz: 0 },
        timestamp: Date.now(),
      };
      MultiplayerNetworkEngine.instance.connect(localState);
    }
    return () => {
      MultiplayerNetworkEngine.instance.disconnect();
    };
  }, [gameMode, avatarMode, avatarSkin, humanAvatar, wallet]);

  // Cooldown state for anime skills: { [skillId]: { remaining: number; total: number } }
  const [skillCooldowns, setSkillCooldowns] = useState<Record<string, { remaining: number; total: number }>>({});
  const cooldownsRef = useRef(skillCooldowns);
  cooldownsRef.current = skillCooldowns;

  // Real-time cooldown countdown timer (ticks every 100ms)
  React.useEffect(() => {
    const timer = setInterval(() => {
      setSkillCooldowns((prev) => {
        let changed = false;
        const next: Record<string, { remaining: number; total: number }> = {};
        for (const [id, data] of Object.entries(prev)) {
          if (data.remaining > 0.05) {
            next[id] = { ...data, remaining: Math.max(0, data.remaining - 0.1) };
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  // Execute skill with cooldown check and haptics
  const executeSkill = useCallback((skillId: string) => {
    const skill = ANIME_SKILLS.find((s) => s.id === skillId);
    if (!skill) return;

    const currentCd = cooldownsRef.current[skillId];
    if (currentCd && currentCd.remaining > 0.05) {
      SoundFX.playCooldownBuzz();
      setNotification({
        message: `⏳ ${skill.name} on Cooldown! (${currentCd.remaining.toFixed(1)}s remaining)`,
        type: 'error',
      });
      return;
    }

    // Mobile haptic pulse for tactile satisfaction
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(20);
      } catch {
        // Ignore if unsupported
      }
    }

    // Trigger 3D world event
    window.dispatchEvent(new CustomEvent('piso-trigger-superpower', { detail: { powerId: skillId } }));

    // Apply damage-based cooldown
    setSkillCooldowns((prev) => ({
      ...prev,
      [skillId]: { remaining: skill.cooldown, total: skill.cooldown },
    }));

    setNotification({
      message: `${skill.icon} ${skill.name} Cast! (${skill.damage.toLocaleString()} DMG)`,
      type: 'success',
    });
  }, [setNotification]);

  // Auto Idle Attack State
  const [isAutoAttack, setIsAutoAttack] = useState(false);
  const isAutoAttackRef = useRef(isAutoAttack);
  isAutoAttackRef.current = isAutoAttack;

  const toggleAutoAttack = useCallback(() => {
    setIsAutoAttack((prev) => {
      const next = !prev;
      window.dispatchEvent(new CustomEvent('piso-toggle-auto-attack', { detail: { active: next } }));
      if (next) {
        SoundFX.playLevelUp();
        setNotification({
          message: '🤖 AUTO IDLE ATTACK ACTIVATED! Firing continuous combat rotation [Hotkey: Z]',
          type: 'success',
        });
      } else {
        SoundFX.playClick();
        setNotification({
          message: '🛑 Auto Idle Attack Stopped. Manual combat restored.',
          type: 'info',
        });
      }
      return next;
    });
  }, [setNotification]);

  // Auto Idle Attack Rotation Loop (Ticks every 1.4s when active)
  React.useEffect(() => {
    if (!isAutoAttack) return;

    const interval = setInterval(() => {
      if (!isAutoAttackRef.current) return;

      // Find all ready skills
      const readySkills = ANIME_SKILLS.filter((s) => {
        const cd = cooldownsRef.current[s.id];
        return !cd || cd.remaining <= 0.05;
      });

      if (readySkills.length === 0) return;

      // Sort by damage descending (burst priority)
      readySkills.sort((a, b) => b.damage - a.damage);

      // Cast the highest available damage skill
      const skillToCast = readySkills[0];
      executeSkill(skillToCast.id);
    }, 1400);

    return () => clearInterval(interval);
  }, [isAutoAttack, executeSkill]);

  // Anime Super Power Keyboard Hotkeys (R, T, Y, G, F, E, Q, V, B, X + Z for Auto)
  React.useEffect(() => {
    const handlePowerHotkeys = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const k = e.key.toLowerCase();
      if (k === 'h') {
        setIsCinematicMode((prev) => {
          const next = !prev;
          SoundFX.playClick();
          setNotification({
            message: next ? '👁️ ZEN MODE: Screen Overlays Minimized [Hotkey: H]' : '👁️ FULL HUD RESTORED [Hotkey: H]',
            type: 'info',
          });
          return next;
        });
        return;
      }

      const kb = controlSettings.keybinds || DEFAULT_KEYBINDS;

      // Primary Anime Skill: "E" is using a skill (or configured key)
      if (k === (kb.skillPrimary || 'e').toLowerCase()) {
        const primaryId = humanAvatar?.equippedPinoyItems?.superpower || 'kamehameha';
        executeSkill(primaryId);
        return;
      }

      if (k === (kb.autoAttack || 'z').toLowerCase()) {
        toggleAutoAttack();
        return;
      }

      if (k === 'l') {
        SoundFX.playClick();
        setActiveWindow('worldgen');
        return;
      }

      if (k === 'k') {
        SoundFX.playClick();
        setActiveWindow('economy');
        return;
      }

      if (k === 'j') {
        SoundFX.playClick();
        setActiveWindow('bounties');
        return;
      }

      if (k === 'u') {
        SoundFX.playClick();
        setActiveWindow('pvp');
        return;
      }

      // Check 1-10 skill keys
      const skillKeyMap: Record<string, string> = {
        [(kb.skill1 || '1').toLowerCase()]: 'kamehameha',
        [(kb.skill2 || '2').toLowerCase()]: 'chidori',
        [(kb.skill3 || '3').toLowerCase()]: 'tsinelas',
        [(kb.skill4 || '4').toLowerCase()]: 'gear5',
        [(kb.skill5 || '5').toLowerCase()]: 'rasengan',
        [(kb.skill6 || '6').toLowerCase()]: 'gatling',
        [(kb.skill7 || '7').toLowerCase()]: 'lightning_storm',
        [(kb.skill8 || '8').toLowerCase()]: 'cyclone_spin',
        [(kb.skill9 || '9').toLowerCase()]: 'hydro_wave',
        [(kb.skill10 || '0').toLowerCase()]: 'pun',
      };

      if (skillKeyMap[k]) {
        executeSkill(skillKeyMap[k]);
        return;
      }

      const matchSkill = ANIME_SKILLS.find((s) => s.hotkey.toLowerCase() === k);
      if (matchSkill) {
        executeSkill(matchSkill.id);
        return;
      }
    };

    window.addEventListener('keydown', handlePowerHotkeys);
    return () => window.removeEventListener('keydown', handlePowerHotkeys);
  }, [executeSkill, toggleAutoAttack, controlSettings, humanAvatar]);

  // Listen for Proof-of-Education Farming Rate Limit Warnings
  React.useEffect(() => {
    const handleRateLimit = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.reason) {
        setNotification({
          message: customEvent.detail.reason,
          type: 'error',
        });
        try {
          SoundFX.playCooldownBuzz();
        } catch {}
      }
    };

    window.addEventListener('piso-rate-limit-warning', handleRateLimit);
    return () => window.removeEventListener('piso-rate-limit-warning', handleRateLimit);
  }, [setNotification]);

  const playerPosRef = useRef<{ x: number; z: number; heading: number }>({
    x: 0,
    z: 8,
    heading: 0,
  });

  const handleDistrictSelect = useCallback((district: DistrictInfo) => {
    SoundFX.playWarp();
    if (district.toolView === 'faucet') {
      requestFaucet();
    } else {
      setActiveWindow(district.toolView);
    }
  }, [requestFaucet]);

  const handleMentorSelect = useCallback((mentor: NPCLocationInfo) => {
    SoundFX.playBlip();
    setActiveMentor(mentor);
  }, []);

  const handleOpenTool = (view: NavView) => {
    SoundFX.playClick();
    setActiveWindow(view);
  };

  const handleToggleMute = () => {
    const next = SoundFX.toggleMute();
    setIsMuted(next);
    setNotification({
      message: next ? 'Audio Muted' : 'Audio Enabled',
      type: 'info',
    });
  };

  const getWindowTitle = (v: NavView) => {
    switch (v) {
      case 'courses':
        return { title: 'Mga Kurso at Quests', subtitle: 'PISO Academy Curriculum Hub', icon: '📜' };
      case 'lab':
        return { title: 'Smart Contract Forge', subtitle: 'Solidity ^0.8.20 Coding Lab', icon: '💻' };
      case 'deploy':
        return { title: 'Deploy Launchpad', subtitle: 'PISO Chain Devnet Rig (2026001)', icon: '🚀' };
      case 'verify':
        return { title: 'Katunayan ng Pag-aari', subtitle: 'Soulbound Credential Verifier (0x...1014)', icon: '🏛️' };
      case 'profile':
        return { title: 'Builder Inventory', subtitle: 'Developer Profile, XP & Badges', icon: '🎒' };
      case 'projects':
        return { title: 'Built on PISO Directory', subtitle: 'Ecosystem Showcase & Submissions', icon: '🌐' };
      case 'img2threejs':
        return { title: 'img2threejs 3D Studio', subtitle: 'Procedural Three.js NFT & Asset Sculptor', icon: '💎' };
      case 'worldmap':
        return { title: 'PISO World Map 3D & Ecosystem Rewards', subtitle: 'DePIN 3D Global Blockchain Network (15 Hubs)', icon: '🌍' };
      case 'chat':
        return { title: 'PISO P2P MESH CHAT // GUN.JS', subtitle: 'Decentralized Peer-to-Peer Validator Broadcast Network', icon: '💬' };
      case 'ppfstudio':
        return { title: 'PPF Contact Solver Studio', subtitle: 'ZOZO Physics / ACM TOG 2024 Cubic Barrier Fabric Engine', icon: '🧪' };
      case 'worldgen':
        return { title: 'Terranian Procedural World Generator', subtitle: '3D Biomes, Buildings, Forests, Rivers & Living Fauna', icon: '🗺️' };
      case 'economy':
        return { title: 'PISO Chain 100M Farm & Forge', subtitle: 'Yield Vault, Panday Blacksmith, Babaylan Relics & Pets', icon: '₱' };
      case 'bounties':
        return { title: '70M PISO Monster Hunter Hub', subtitle: 'Giga Buwaya Bounties, Level Gating & Tax Returns to the People', icon: '🐊' };
      case 'pvp':
        return { title: 'PISO High-Stakes PvP Colosseum', subtitle: 'Equal Queue Matchmaking (±2 Levels, ±25% Net Worth) & Item Wagers', icon: '⚔️' };
      default:
        return { title: 'PISO Cyber Cockpit', subtitle: 'New Manila 2090', icon: '₱' };
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0B0F17] flex flex-col select-none">
      {/* 0. Live Progression Feedback Toast */}
      <ProgressionFeedbackToast />

      {/* 1. LovecraftUI Top Status Bar */}
      {!isCinematicMode && (
        <div className="relative z-30 animate-fade-in">
          <GameTopBar
            gameMode={gameMode}
            onToggleGameMode={onToggleGameMode}
            onOpenTutorial={() => setShowTutorial(true)}
            onOpenQuests={() => setShowQuests(true)}
            onOpenHangar={() => setShowHangar(true)}
            onOpenOptions={() => setShowOptions(true)}
            onOpenWalletTerminal={() => setShowWalletTerminal(true)}
            onOpenProfile={() => setShowProfileModal(true)}
            onOpenAvatarSelection={() => setShowAvatarSelection(true)}
          />
        </div>
      )}

      {/* 2. Three.js Persistent 3D Cyberpunk Metaverse Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Cyber3DWorld
          onProximityChange={setNearbyDistrict}
          onDistrictSelect={handleDistrictSelect}
          onMentorProximity={setNearbyMentor}
          onMentorSelect={handleMentorSelect}
          onCruiseTargetChange={setCruiseTarget}
          playerPosRef={playerPosRef}
          onMiningEngineReady={(engine) => setMiningEngine(engine)}
          onMonsterEngineReady={(engine) => setMonsterEngine(engine)}
          onNearbyPlayerProximity={setNearbyPlayer}
        />

        {/* Floating Proximity Interaction Prompt [E] */}
        {nearbyPlayer && !showInteractionModal && (
          <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-30 animate-bounce-short">
            <button
              type="button"
              onClick={() => {
                setActiveInteractionPlayer(nearbyPlayer.player);
                setShowInteractionModal(true);
                SoundFX.playBlip();
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-teal-600 to-amber-500 text-slate-950 font-mono font-black text-xs sm:text-sm flex items-center space-x-2.5 shadow-[0_0_30px_rgba(6,182,212,0.6)] border-2 border-white hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span className="text-base">💬</span>
              <span>[E] INTERACT WITH @{nearbyPlayer.player.username} ({nearbyPlayer.distance}m)</span>
            </button>
          </div>
        )}

        {/* Zen / Cinematic Mode Floating Restore Button */}
        {isCinematicMode && (
          <div className="absolute top-4 right-4 z-40 animate-fade-in">
            <button
              type="button"
              onClick={() => {
                setIsCinematicMode(false);
                SoundFX.playClick();
              }}
              className="px-4 py-2 rounded-2xl bg-[#0B0F17]/95 border-2 border-amber-400 text-amber-300 font-mono text-xs font-bold flex items-center space-x-2.5 shadow-[0_0_30px_rgba(245,158,11,0.5)] backdrop-blur-md active:scale-95 hover:scale-105 transition-all"
              title="Restore Full HUD & Controls [Hotkey: H]"
            >
              <span className="text-base animate-pulse">👁️</span>
              <span>ZEN MODE ACTIVE • RESTORE HUD [H]</span>
            </button>
          </div>
        )}

        {/* 3. Top-Right Cyber Minimap Radar */}
        {!isCinematicMode && (
          <div className="absolute top-4 right-4 z-20">
            <GameMinimap
              playerPosRef={playerPosRef}
              onSelectDistrict={handleDistrictSelect}
              cruiseTargetMentorId={cruiseTarget?.id || null}
              monsterEngine={monsterEngine}
            />
          </div>
        )}

        {/* 4. Mid-Left LovecraftUI Quest Tracker */}
        {!isCinematicMode && (
          <div className="absolute top-4 left-4 z-20 hidden sm:block">
            <GameQuestTracker
              onOpenQuest={() => handleOpenTool('lab')}
              onOpenDailyQuests={() => setShowQuests(true)}
            />
          </div>
        )}

        {/* 4B. Active Autopilot Cruise Banner (Shown while cruising to target mentor) */}
        {!isCinematicMode && cruiseTarget && !activeWindow && !activeMentor && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-fade-in">
            <div className="px-4 py-2.5 rounded-2xl bg-[#161F30]/95 border-2 border-cyan-400 shadow-[0_0_35px_rgba(6,182,212,0.35)] backdrop-blur-md flex items-center space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-xl shrink-0">
                {cruiseTarget.avatar}
              </div>
              <div className="min-w-[170px]">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-black text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/30 flex items-center space-x-1">
                    <Navigation className="w-2.5 h-2.5 inline mr-1" />
                    AUTOPILOT CRUISING
                  </span>
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {cruiseTarget.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-0.5">
                  <p className="text-[11px] text-slate-300 font-mono truncate">{cruiseTarget.title}</p>
                  <span className="text-[11px] font-mono font-bold text-amber-400 shrink-0">
                    • {cruiseTarget.distance.toFixed(1)}m away
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2 pl-3 border-l border-slate-700/80">
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('piso-cycle-next-mentor'));
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-400 text-purple-300 hover:text-white font-mono text-xs font-bold flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
                  title="Switch to next NPC Mentor [N]"
                >
                  <span>Next [N]</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('piso-cancel-autopilot'));
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-mono text-xs transition-colors"
                  title="Cancel autopilot and take manual control"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. Interactive Proximity Prompt Card (NPC Mentor or District Beacon) */}
        {!activeWindow && !activeMentor && (
          <>
            {nearbyMentor ? (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce-short">
                <div
                  onClick={() => handleMentorSelect(nearbyMentor)}
                  className="p-4 rounded-2xl bg-[#161F30]/95 border-2 border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.4)] backdrop-blur-md cursor-pointer hover:scale-105 transition-all flex items-center space-x-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-2xl">
                    {nearbyMentor.avatar}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/30 flex items-center space-x-1">
                        <Bot className="w-3 h-3 inline mr-1" />
                        PRESS [E] TO TALK
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {nearbyMentor.name}
                      </span>
                      {claimedMentorRewards.includes(nearbyMentor.id) ? (
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                          ✓ 1x Claimed
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-400/15 px-1.5 py-0.5 rounded border border-amber-400/30 animate-pulse">
                          🎁 +50 XP Ready
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">{nearbyMentor.title}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
                </div>
              </div>
            ) : nearbyDistrict ? (
              <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 animate-bounce-short">
                <div
                  onClick={() => handleDistrictSelect(nearbyDistrict)}
                  className="p-4 rounded-2xl bg-[#161F30]/95 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)] backdrop-blur-md cursor-pointer hover:scale-105 transition-all flex items-center space-x-3.5"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl">
                    {nearbyDistrict.icon}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-black text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                        PRESS [E] OR CLICK
                      </span>
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {nearbyDistrict.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5 font-mono">{nearbyDistrict.tagline}</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-amber-400 animate-pulse" />
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* 6. Live Gun.js P2P On-Screen Chatbox with 3D Avatar Sync */}
        {!isCinematicMode && !activeWindow && (
          <LiveHUDChatBox
            onOpenFullChat={() => setActiveWindow('chat')}
            hasTouchControls={showTouchControls}
          />
        )}

        {/* 6B. Cross-Platform Dual Virtual Joysticks & Mobile Action Cluster */}
        {!isCinematicMode && showTouchControls && !activeWindow && (
          <>
            <DualVirtualJoystick swapSides={controlSettings.swapJoystickSide} />
            <MobileActionCluster swapSides={controlSettings.swapJoystickSide} />
          </>
        )}

        {/* Real-Time Cross-Platform Input Pipeline Debugger */}
        <InputDebugger />

        {/* 7. On-Screen Navigation Controls Reminder, Anime Super Powers & Quick Jump Action */}
        {!isCinematicMode && (
          <div
            className={`absolute bottom-24 ${
              controlSettings.swapJoystickSide ? 'left-4 items-start' : 'right-4 items-end'
            } z-20 flex flex-col space-y-2 animate-fade-in`}
          >
            {isControlsHUDMinimized ? (
              /* One Single Button when Minimized */
              <button
                type="button"
                onClick={() => {
                  setIsControlsHUDMinimized(false);
                  SoundFX.playClick();
                }}
                className="px-3.5 py-2 rounded-2xl bg-[#0B0F17]/95 hover:bg-[#161F30] border border-cyan-500/50 hover:border-amber-400 text-cyan-300 hover:text-white font-mono text-xs font-bold flex items-center space-x-2 shadow-[0_0_25px_rgba(6,182,212,0.35)] backdrop-blur-md active:scale-95 transition-all group"
                title="Expand Controls, Super Powers & HUD"
              >
                <span className="text-base animate-pulse">⚡</span>
                <span className="tracking-wide uppercase font-black">Controls & Skills (10)</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono group-hover:bg-cyan-500/40">▲ Expand</span>
              </button>
            ) : (
              <>
                {/* 10 Anime & Filipino Super Power Action Bar with Cooldowns */}
                {isSkillsCollapsed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSkillsCollapsed(false);
                      SoundFX.playClick();
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#0B0F17]/95 border border-purple-500/50 text-purple-300 font-mono text-xs font-bold flex items-center space-x-2 shadow-[0_0_20px_rgba(168,85,247,0.3)] backdrop-blur-md active:scale-95 transition"
                    title="Restore 10 Anime Super Powers Action Bar"
                  >
                    <span>⚔️</span>
                    <span>SUPER POWERS (10)</span>
                    <span className="text-purple-400 text-[10px]">▲</span>
                  </button>
                ) : (
                  <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-[#0B0F17]/95 border border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.35)] backdrop-blur-md max-w-[calc(100vw-2rem)] sm:max-w-[95vw] overflow-x-auto touch-pan-x scrollbar-thin scrollbar-thumb-purple-500/40">
                    {/* Minimize skills button */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSkillsCollapsed(true);
                        SoundFX.playClick();
                      }}
                      className="px-1.5 py-1 rounded-lg bg-slate-900/80 hover:bg-purple-600 text-slate-400 hover:text-white border border-slate-700 text-[10px] font-bold transition mr-0.5"
                      title="Minimize Super Powers Bar"
                    >
                      _
                    </button>

                    {ANIME_SKILLS.map((skill) => {
                      const cd = skillCooldowns[skill.id];
                      const remaining = cd?.remaining || 0;
                      const isCoolingDown = remaining > 0.05;
                      const pct = cd && cd.total > 0 ? (remaining / cd.total) * 100 : 0;

                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => executeSkill(skill.id)}
                          disabled={isCoolingDown}
                          title={`${skill.name} [Hotkey: ${skill.hotkey}] — ${skill.animeOrigin} (${skill.damage.toLocaleString()} DMG, ${skill.cooldown}s CD) — ${skill.description}`}
                          className={`relative overflow-hidden group flex flex-col items-center justify-between p-1.5 min-w-[50px] sm:min-w-[62px] h-[54px] sm:h-[58px] rounded-xl border transition-all select-none ${
                            isCoolingDown
                              ? 'bg-slate-900/90 border-slate-700/60 opacity-80 cursor-not-allowed'
                              : 'bg-gradient-to-b from-[#161F30] to-[#0B0F17] hover:scale-105 active:scale-95 hover:border-amber-400'
                          }`}
                          style={{
                            borderColor: !isCoolingDown ? `${skill.color}80` : undefined,
                            boxShadow: !isCoolingDown ? `0 0 10px ${skill.color}25` : undefined,
                          }}
                        >
                          {/* Cooldown dark sweep overlay */}
                          {isCoolingDown && (
                            <div
                              className="absolute inset-x-0 bottom-0 bg-black/75 transition-all duration-100 ease-linear pointer-events-none"
                              style={{ height: `${pct}%` }}
                            />
                          )}

                          {/* Top: Icon + Hotkey badge */}
                          <div className="relative z-10 w-full flex items-center justify-between">
                            <span className="text-base sm:text-lg leading-none">{skill.icon}</span>
                            <span
                              className="px-1 py-0.5 rounded text-[9px] font-mono font-black shadow-sm"
                              style={{
                                backgroundColor: !isCoolingDown ? `${skill.color}30` : '#334155',
                                color: !isCoolingDown ? skill.color : '#94A3B8',
                              }}
                            >
                              {(() => {
                                const kb = controlSettings.keybinds || DEFAULT_KEYBINDS;
                                const idMap: Record<string, string | undefined> = {
                                  kamehameha: kb.skill1,
                                  chidori: kb.skill2,
                                  tsinelas: kb.skill3,
                                  gear5: kb.skill4,
                                  rasengan: kb.skill5,
                                  gatling: kb.skill6,
                                  lightning_storm: kb.skill7,
                                  cyclone_spin: kb.skill8,
                                  hydro_wave: kb.skill9,
                                  pun: kb.skill10,
                                };
                                return (idMap[skill.id] || skill.hotkey).toUpperCase();
                              })()}
                            </span>
                          </div>

                          {/* Center / Countdown text */}
                          <div className="relative z-10 my-auto text-center">
                            {isCoolingDown ? (
                              <span className="text-[11px] font-mono font-black text-amber-300 drop-shadow">
                                {remaining.toFixed(1)}s
                              </span>
                            ) : (
                              <span className="hidden sm:inline text-[9px] font-bold text-white tracking-tight line-clamp-1">
                                {skill.name.split(' ')[0]}
                              </span>
                            )}
                          </div>

                          {/* Bottom: Damage Badge */}
                          <div className="relative z-10 w-full text-center">
                            <span
                              className="text-[8px] sm:text-[9px] font-mono font-bold tracking-tight"
                              style={{ color: skill.color }}
                            >
                              {skill.damage >= 1000 ? `${(skill.damage / 1000).toFixed(1)}k` : skill.damage} DMG
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Action Row: Minimize All + Zen Mode + Mobile Controls + Auto Idle Attack + Jump */}
                <div className="flex items-center space-x-2">
                  {/* One-Button Minimize Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsControlsHUDMinimized(true);
                      SoundFX.playClick();
                    }}
                    title="Minimize Controls & Skills HUD into one single button"
                    className="group flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md backdrop-blur-md active:scale-95 border bg-[#0B0F17]/90 text-cyan-400 hover:text-cyan-200 border-cyan-500/40 hover:border-cyan-400"
                  >
                    <span className="text-cyan-400 font-black text-sm">─</span>
                    <span>MINIMIZE</span>
                  </button>

                  {/* Zen / Cinematic Mode Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsCinematicMode(true);
                      SoundFX.playClick();
                    }}
                    title="Zen Mode (Hotkey: H) — Minimizes all screen overlays for 100% unobstructed full-screen view"
                    className="group flex items-center space-x-1 px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md backdrop-blur-md active:scale-95 border bg-[#0B0F17]/90 text-slate-400 hover:text-amber-300 border-slate-700 hover:border-amber-400"
                  >
                    <span>👁️</span>
                    <span>ZEN</span>
                    <span className="hidden sm:inline-block px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400 border border-slate-700">
                      H
                    </span>
                  </button>

                  {/* Mobile Touch Controls Toggle Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowTouchControls((prev) => !prev);
                      SoundFX.playClick();
                    }}
                    title="Toggle Mobile Touch Controls & Dual Virtual Joysticks"
                    className={`group flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md backdrop-blur-md active:scale-95 border ${
                      showTouchControls
                        ? 'bg-cyan-500/25 text-cyan-300 border-cyan-400 shadow-[0_0_18px_rgba(6,182,212,0.4)]'
                        : 'bg-[#0B0F17]/90 text-slate-400 hover:text-white border-slate-700'
                    }`}
                  >
                    <span>📱</span>
                    <span>{showTouchControls ? 'TOUCH: ON' : 'TOUCH: OFF'}</span>
                  </button>

                  {/* Cross-Platform Controls & Gamepad Settings Modal Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowControlSettingsModal(true);
                      SoundFX.playClick();
                    }}
                    title="Open Cross-Platform Controls, Sensitivities & Gamepad Settings"
                    className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-md backdrop-blur-md active:scale-95 border bg-[#0B0F17]/90 text-cyan-400 hover:text-cyan-200 border-cyan-500/40 hover:border-cyan-300"
                  >
                    <span>🎮</span>
                    <span>CONTROLS</span>
                  </button>

                  {/* Auto Idle Attack Toggle Button */}
                  <button
                    type="button"
                    onClick={toggleAutoAttack}
                    title="Toggle Auto Idle Attack (Hotkey: Z) — Automatically cycles and casts ready skills in highest-DPS rotation"
                    className={`group flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold transition-all shadow-lg backdrop-blur-md active:scale-95 border ${
                      isAutoAttack
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-300 shadow-[0_0_25px_rgba(160,185,129,0.7)] animate-pulse'
                        : 'bg-[#0B0F17]/90 hover:bg-emerald-950/40 text-emerald-400 hover:text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    }`}
                  >
                    <span className={`text-sm ${isAutoAttack ? 'animate-spin' : ''}`}>
                      {isAutoAttack ? '⚔️' : '🤖'}
                    </span>
                    <span className="tracking-wider">
                      {isAutoAttack ? 'AUTO IDLE: ON' : 'AUTO IDLE: OFF'}
                    </span>
                    <span
                      className={`hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-black border ${
                        isAutoAttack
                          ? 'bg-black/30 text-emerald-950 border-emerald-700/50'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      }`}
                    >
                      Z
                    </span>
                  </button>

                  {/* Quick Jump Action Button (Touch & Desktop) */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                        try {
                          navigator.vibrate(15);
                        } catch {}
                      }
                      window.dispatchEvent(new CustomEvent('piso-player-jump'));
                    }}
                    title="Jump / Double Jump (Spacebar or Tap)"
                    className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 text-amber-300 hover:text-amber-200 font-mono text-xs font-bold transition shadow-[0_0_20px_rgba(245,158,11,0.2)] backdrop-blur-md"
                  >
                    <span className="flex items-center space-x-0.5 text-amber-400 font-black">
                      <span>▲</span>
                      <span className="text-[10px]">▲</span>
                    </span>
                    <span>JUMP / 2X</span>
                    <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-amber-500/30 text-[10px] text-amber-200 border border-amber-500/40">
                      SPACE
                    </span>
                  </button>
                </div>

                <div className="hidden md:flex flex-col items-end space-y-1 font-mono text-[10px] text-slate-400 bg-slate-950/70 p-2 rounded-xl border border-slate-800 backdrop-blur-sm">
                  <span>
                    <strong className="text-amber-300">👁️ [H] Zen Mode</strong> • <strong className="text-cyan-400">📱 Mobile:</strong> Left Thumb = <strong className="text-cyan-300">Joystick</strong> • 1-Finger Drag = <strong className="text-cyan-300">Orbit</strong> • 2-Finger = <strong className="text-cyan-300">Zoom</strong>
                  </span>
                  <span>
                    <strong className="text-emerald-400">[Z] Auto Attack</strong> • <strong className="text-amber-300">[R] Kamehame</strong> • <strong className="text-purple-300">[T] Chidori</strong> • <strong className="text-cyan-300">[Y] Tsinelas</strong> • <strong className="text-yellow-300">[G] Gear 5</strong> • <strong className="text-sky-300">[F] Rasengan</strong> • <strong className="text-orange-300">[E] Gatling</strong> • <strong className="text-amber-400">[Q] Storm</strong> • <strong className="text-emerald-300">[V] Cyclone</strong> • <strong className="text-cyan-400">[B] Hydro</strong> • <strong className="text-rose-300">[X] Banat</strong>
                  </span>
                  <span>Move: <strong className="text-white">WASD / Arrows / Touch Joystick</strong></span>
                  <span>Jump / Double Jump: <strong className="text-amber-400">Space [2x] / Jump Button</strong></span>
                  <span>Wallet & Farm: <strong className="text-amber-400">[K]</strong> • 70M Bounties: <strong className="text-rose-400">[J]</strong> • PvP Arena: <strong className="text-red-400">[U]</strong></span>
                  <span>Next Mentor: <strong className="text-purple-400">[N]</strong> Autopilot • Live Chat: <strong className="text-purple-400">[C]</strong></span>
                  <span>Cam Orbit: <strong className="text-cyan-400">Right-Click Drag / 1-Finger Drag</strong></span>
                  <span>Zoom: <strong className="text-cyan-400">Mouse Wheel / Pinch</strong></span>
                  <span>Interact / Next Dest: <strong className="text-amber-400">[E]</strong> / Click</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* 7. Bottom LovecraftUI Action Bar (Hotkeys 1-6 + 7, F, Q, O, H, K, P) */}
      {!isCinematicMode && (
        <div className="relative z-30 flex justify-center pb-3 pt-1 animate-fade-in">
          <GameActionBar
            activeView={activeWindow || activeView}
            onSelectView={handleOpenTool}
            onRequestFaucet={requestFaucet}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onOpenHangar={() => setShowHangar(true)}
            onOpenQuests={() => setShowQuests(true)}
            onOpenOptions={() => setShowOptions(true)}
            onOpenTutorial={() => setShowTutorial(true)}
            onOpenWalletTerminal={() => setShowWalletTerminal(true)}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        </div>
      )}

      {/* 8. Floating Game Window (LovecraftUI Draggable Cyber Window) */}
      {activeWindow && (
        <FloatingGameWindow
          title={getWindowTitle(activeWindow).title}
          subtitle={getWindowTitle(activeWindow).subtitle}
          icon={getWindowTitle(activeWindow).icon}
          isOpen={true}
          onClose={() => setActiveWindow(null)}
        >
          {activeWindow === 'courses' && <CourseCatalog />}
          {activeWindow === 'lab' && <Web3Lab />}
          {activeWindow === 'deploy' && <DeploymentManager />}
          {activeWindow === 'verify' && <CertificateVerifier />}
          {activeWindow === 'profile' && <BuilderProfile />}
          {activeWindow === 'projects' && <ProjectDirectory />}
          {activeWindow === 'img2threejs' && <Img2ThreejsStudio />}
          {activeWindow === 'worldmap' && <PisoWorldMap3D />}
          {activeWindow === 'chat' && <PisoP2PChatRoom onClose={() => setActiveWindow(null)} />}
          {activeWindow === 'ppfstudio' && <PpfContactSolverStudio onMinimize={() => setActiveWindow(null)} />}
          {activeWindow === 'worldgen' && <TerranianMapGeneratorStudio onMinimize={() => setActiveWindow(null)} />}
          {activeWindow === 'economy' && <PISOMetaverseEconomyStudio onMinimize={() => setActiveWindow(null)} />}
          {activeWindow === 'bounties' && <MonsterHunterStudio onMinimize={() => setActiveWindow(null)} playerPos={playerPosRef.current} />}
          {activeWindow === 'pvp' && <PISOPvPArenaStudio onClose={() => setActiveWindow(null)} />}
        </FloatingGameWindow>

      )}

      {/* 9. NPC Mentor Modal */}
      {activeMentor && (
        <NPCMentorModal
          mentorId={activeMentor.id}
          onClose={() => setActiveMentor(null)}
          onNavigateToMentor={(mentorId) => {
            setActiveMentor(null);
            window.dispatchEvent(
              new CustomEvent('piso-navigate-to-mentor', { detail: { mentorId } })
            );
          }}
        />
      )}

      {/* 10. Tutorial & Flight Manual Modal */}
      {showTutorial && (
        <GameTutorialModal onClose={() => setShowTutorial(false)} />
      )}

      {/* 11. Settings & Options Modal */}
      {showOptions && (
        <GameOptionsModal onClose={() => setShowOptions(false)} />
      )}

      {/* 11B. Cross-Platform Controls & Ergonomics Modal */}
      <ControlSettingsModal
        isOpen={showControlSettingsModal}
        onClose={() => setShowControlSettingsModal(false)}
        onOpenKeybindings={() => setShowOptions(true)}
      />

      {/* 12. Daily Quests Modal */}
      {showQuests && (
        <DailyQuestsModal onClose={() => setShowQuests(false)} />
      )}

      {/* 13. Drone Hangar Modal */}
      {showHangar && (
        <AvatarHangarModal initialTab={hangarInitialTab} onClose={() => setShowHangar(false)} />
      )}

      {/* 14. Interactive Wallet Studio Sandbox Terminal */}
      {showWalletTerminal && (
        <WalletStudioTerminalModal
          isOpen={showWalletTerminal}
          onClose={() => setShowWalletTerminal(false)}
        />
      )}

      {/* 15. Mining & Building Studio */}
      {showMiningStudio && (
        <MiningBuildingStudio
          onClose={() => setShowMiningStudio(false)}
          miningEngine={miningEngine}
        />
      )}

      {/* 16. Character Creation & Avatar NFT Minting Modal */}
      <CharacterCreationModal
        isOpen={showCharacterCreation}
        onClose={() => setShowCharacterCreation(false)}
      />

      {/* 17. Player Profile & RPG Progression Modal */}
      {showProfileModal && (
        <PlayerProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* 18. Avatar Selection & Archetypes Modal */}
      <AvatarSelectionModal
        isOpen={showAvatarSelection}
        onClose={() => setShowAvatarSelection(false)}
        onConfirmEnter={(name) => {
          setShowAvatarSelection(false);
          setNotification({
            message: `Mabuhay, ${name}! Naka-synchronize ang iyong Avatar sa PISO Metaverse mesh.`,
            type: 'success',
          });
        }}
      />

      {/* 19. Player Proximity Interaction Drawer */}
      <PlayerInteractionModal
        isOpen={showInteractionModal}
        targetPlayer={activeInteractionPlayer}
        onClose={() => setShowInteractionModal(false)}
      />
    </div>
  );
};
