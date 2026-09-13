import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRACKS, Track, Lesson } from '../data/courses';
import { CHALLENGES, Challenge } from '../data/challenges';
import { WalletService, WalletState } from '../services/walletService';
import { CertificateService, VerifiedCertificate } from '../services/certificateService';
import { ContractDeployer, DeploymentReceipt } from '../services/contractDeployer';
import { PlayerStatsEngine } from '../services/PlayerStatsEngine';
import { PlayerProgressionEngine } from '../services/playerProgressionEngine';
import { GlbAvatarMetadata } from '../services/GlbAvatarService';
import { AccountSessionService, SecurityNotification } from '../services/AccountSessionService';
import { SaveStateEngine, SaveStatus } from '../services/SaveStateEngine';

export type NavView = 'home' | 'courses' | 'lab' | 'deploy' | 'verify' | 'profile' | 'projects' | 'img2threejs' | 'worldmap' | 'chat' | 'ppfstudio' | 'worldgen' | 'economy' | 'bounties' | 'pvp';

export type AvatarSkinId = 'agila' | 'panday' | 'babaylan' | 'jeepney' | 'sentinel';

export interface PetDroneConfig {
  enabled: boolean;
  skin: AvatarSkinId;
  auraColor: string;
}

export interface HumanAvatarConfig {
  gender: 'male' | 'female' | 'android';
  name: string;
  skinTone: string;
  hairStyle:
    | 'datuLongWavy'
    | 'mariaClaraBun'
    | 'diwataLocks'
    | 'neonBangs'
    | 'urdujaPonytail'
    | 'cyberBob'
    | 'spaceBuns'
    | 'topknot'
    | 'braids'
    | 'cyberFade'
    | 'undercut';
  hairColor: string;
  outfit:
    | 'founderArmor'
    | 'mariaClaraCyber'
    | 'urdujaArmor'
    | 'babaylanOracle'
    | 'pandayBlacksmith'
    | 'bayanihanGuardian'
    | 'barongCyber'
    | 'katipunanTech'
    | 'babaylanRobes'
    | 'manilaHoodie'
    | 'plainTshirt'
    | 'none'
    | 'default';
  accessory:
    | 'pisoSunCrest'
    | 'sampaguitaPin'
    | 'diwataCrown'
    | 'baybayinTattoo'
    | 'cyberVisor'
    | 'pisoPendant'
    | 'holoMask'
    | 'none';
  backCrest?: 'philippineSunStars' | 'cyberRings' | 'wingsOfKatunayan' | 'none';
  cape?: 'founderCape' | 'energyCape' | 'shadowCape' | 'none';
  hasBeard?: boolean;
  uploadedTextureUrl?: string;
  uploadedFileName?: string;
  aiPrompt?: string;
  auraColor?: string;
  bodyType?: 'athletic' | 'cybernetic' | 'slim';
  customGlbId?: string;
  customGlbName?: string;
  petDrone?: PetDroneConfig;
  equippedPinoyItems?: {
    weapon?: string;
    shield?: string;
    headwear?: string;
    towel?: string;
    crown?: string;
    outfit?: string;
    back?: string;
    signboard?: string;
    amulet?: string;
    tabo?: string;
    allEquipped?: boolean;
    superpower?: string;
  };
}

export const DEFAULT_HUMAN_AVATAR: HumanAvatarConfig = {
  gender: 'male',
  name: 'Bagong Mandirigma',
  skinTone: '#8D5524',
  hairStyle: 'cyberFade',
  hairColor: '#0B0F17',
  outfit: 'plainTshirt',
  accessory: 'none',
  backCrest: 'none',
  cape: 'none',
  hasBeard: false,
  uploadedTextureUrl: '',
  uploadedFileName: '',
  aiPrompt: 'PISO Default Explorer — Clean white plain t-shirt, casual denim shorts, neutral starter adventurer without costume',
  auraColor: '#06B6D4',
  bodyType: 'athletic',
  petDrone: {
    enabled: false,
    skin: 'panday',
    auraColor: '#06B6D4',
  },
  equippedPinoyItems: {
    weapon: '',
    shield: '',
    headwear: '',
    towel: '',
    crown: '',
    back: '',
    signboard: '',
    amulet: '',
    tabo: '',
    allEquipped: false,
    superpower: 'kamehameha',
  },
};

export interface AvatarNftData {
  tokenId: number;
  contractAddress: string;
  name: string;
  dnaHash: string;
  gender: 'male' | 'female';
  level: number;
  ownerAddress: string;
  mintTimestamp: number;
  isMinted: boolean;
  isDefaultCostume: boolean;
  isGuest?: boolean;
}

export const DEFAULT_AVATAR_NFT: AvatarNftData = {
  tokenId: 1,
  contractAddress: '0x3140000000000000000000000000000000000077',
  name: 'Bagong Mandirigma',
  dnaHash: 'piso_dna_starter_001',
  gender: 'male',
  level: 1,
  ownerAddress: '0x0000000000000000000000000000000000000000',
  mintTimestamp: Date.now(),
  isMinted: true,
  isDefaultCostume: true,
};

export function safeHexColor(hex: string | undefined | null, fallback: number): number {
  if (!hex || typeof hex !== 'string') return fallback;
  const clean = hex.replace('#', '').trim();
  const num = parseInt(clean, 16);
  return isNaN(num) ? fallback : num;
}

export interface DailyQuest {
  id: string;
  title: string;
  desc: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  xpReward: number;
  icon: string;
  category: string;
}

export interface KeybindConfig {
  forward: string;
  backward: string;
  left: string;
  right: string;
  jump: string;
  sprint: string;
  interact: string;
  mine: string;
  skillPrimary: string;
  skill1: string;
  skill2: string;
  skill3: string;
  skill4: string;
  skill5: string;
  skill6: string;
  skill7: string;
  skill8: string;
  skill9: string;
  skill10: string;
  autoAttack: string;
  builderMode: string;
  miningStudio: string;
  avatarOptions: string;
  inventory: string;
}

export const DEFAULT_KEYBINDS: KeybindConfig = {
  forward: 'w',
  backward: 's',
  left: 'a',
  right: 'd',
  jump: ' ',
  sprint: 'shift',
  interact: 'b', // NPC Talk & Interact is letter B
  mine: 'q',
  skillPrimary: 'e', // Primary Skill hotkey
  skill1: '1',
  skill2: '2',
  skill3: '3',
  skill4: '4',
  skill5: '5',
  skill6: '6',
  skill7: '7',
  skill8: '8',
  skill9: '9',
  skill10: '0', // 10th skill mapped to '0' on number row
  autoAttack: 'z',
  builderMode: 'v',
  miningStudio: 'm',
  avatarOptions: 'n',
  inventory: 'i',
};

export interface ControlSettings {
  cameraMode: 'isometric' | 'follow' | 'topdown';
  flightSpeed: 'normal' | 'turbo';
  zoom: number;
  soundVolume: number;
  particleDensity: 'low' | 'med' | 'high';
  controlScheme: 'camera_relative' | 'world_axis';
  invertPitch: boolean;
  invertYaw: boolean;
  swapJoystickSide: boolean;
  autoTargetLock: boolean;
  performanceTier: 'low' | 'balanced' | 'ultra';
  keybinds: KeybindConfig;
  cameraSensitivity?: number;
  joystickSensitivity?: number;
  cameraSmoothing?: number;
  controlMode?: 'auto' | 'touch' | 'keyboard' | 'gamepad';
}

interface AcademyContextType {
  activeView: NavView;
  setActiveView: (view: NavView) => void;
  gameMode: boolean;
  setGameMode: (mode: boolean) => void;
  toggleGameMode: () => void;
  tracks: Track[];
  selectedTrack: Track;
  setSelectedTrack: (track: Track) => void;
  selectedLesson: Lesson | null;
  setSelectedLesson: (lesson: Lesson | null) => void;
  challenges: Challenge[];
  activeChallenge: Challenge;
  setActiveChallenge: (challenge: Challenge) => void;
  wallet: WalletState;
  connectInjectedWallet: () => Promise<void>;
  connectExistingWallet: (input: string) => Promise<{ address: string; balance: string }>;
  isConnectWalletModalOpen: boolean;
  openConnectWalletModal: () => void;
  closeConnectWalletModal: () => void;
  createBurnerWallet: () => void;
  disconnectWallet: () => void;
  requestFaucet: () => Promise<void>;
  refreshWalletBalance: () => Promise<void>;
  setCustomBurnerKey: (privateKey: string) => Promise<void>;
  xp: number;
  level: number;
  levelTitle: string;
  completedLessons: string[];
  passedChallenges: string[];
  completeCurrentLesson: (lessonId: string) => void;
  recordChallengePass: (challengeId: string, xpEarned: number) => void;
  certificates: VerifiedCertificate[];
  claimCertificateForTrack: (track: Track) => Promise<VerifiedCertificate>;
  deployments: DeploymentReceipt[];
  refreshDeployments: () => void;
  notification: { message: string; type: 'success' | 'info' | 'error' } | null;
  setNotification: (notif: { message: string; type: 'success' | 'info' | 'error' } | null) => void;

  // New Game-Fi additions
  avatarSkin: AvatarSkinId;
  setAvatarSkin: (skin: AvatarSkinId) => void;
  avatarMode: 'human' | 'drone' | 'custom_glb';
  setAvatarMode: (mode: 'human' | 'drone' | 'custom_glb') => void;
  customGlbAvatar: GlbAvatarMetadata | null;
  setCustomGlbAvatar: (meta: GlbAvatarMetadata | null) => void;
  equipGlbAvatar: (meta: GlbAvatarMetadata) => void;
  humanAvatar: HumanAvatarConfig;
  setHumanAvatar: (cfg: HumanAvatarConfig) => void;
  avatarNft: AvatarNftData;
  setAvatarNft: (nft: AvatarNftData | ((prev: AvatarNftData) => AvatarNftData)) => void;
  mintOrBindAvatarNft: (name: string, gender: 'male' | 'female', dnaHash: string, walletAddress?: string) => AvatarNftData;
  dailyQuests: DailyQuest[];
  claimDailyQuest: (questId: string) => void;
  recordQuestProgress: (questId: string, amount?: number) => void;
  metMentors: string[];
  recordTalkToMentor: (mentorId: string) => void;
  claimedMentorRewards: string[];
  claimMentorReward: (mentorId: string, xpReward?: number) => boolean;
  claimedEcosystemRewards: string[];
  claimEcosystemReward: (nodeId: string, xpReward: number, badgeName: string) => boolean;
  streakDays: number;
  showTutorial: boolean;
  setShowTutorial: (show: boolean) => void;
  controlSettings: ControlSettings;
  setControlSettings: React.Dispatch<React.SetStateAction<ControlSettings>>;
  accountId: string | null;
  securityNotifications: SecurityNotification[];
  unreadSecurityCount: number;
  markSecurityNotificationsRead: () => void;
  saveStatus: SaveStatus;
}

const INITIAL_DAILY_QUESTS: DailyQuest[] = [
  {
    id: 'wallet-studio-quest',
    title: '👑 Sovereign Wallet Pioneer',
    desc: 'Simulan sa PISO Wallet Studio (Mainnet) — gumawa o mag-import ng Web3 keypair',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    xpReward: 500,
    icon: '🔑',
    category: 'Gateway',
  },
  {
    id: 'faucet-drip',
    title: 'Bayanihan Drip',
    desc: 'Humingi ng 1.0 ₱PISO mula sa Bayanihan Faucet Obelisk (0x...1003)',
    target: 1,
    progress: 1,
    completed: true,
    claimed: false,
    xpReward: 25,
    icon: '💧',
    category: 'Faucet',
  },
  {
    id: 'talk-mentor',
    title: 'Kausapin ang mga Mentor',
    desc: 'Makipag-usap kay Master Panday, Babaylan Maya, o Kapitan Datu sa 3D New Manila',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    xpReward: 50,
    icon: '🧙',
    category: 'Lore',
  },
  {
    id: 'smart-forge',
    title: 'Panday sa Solidity',
    desc: 'Subukan at ipasa ang anumang coding challenge sa Smart Contract Forge',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    xpReward: 100,
    icon: '⚒️',
    category: 'Lab',
  },
  {
    id: 'cert-verify',
    title: 'Katunayan Inspector',
    desc: 'Mag-verify ng anumang Soulbound Katunayan Certificate (0x...1014) sa Temple',
    target: 1,
    progress: 0,
    completed: false,
    claimed: false,
    xpReward: 50,
    icon: '🛡️',
    category: 'Credentials',
  },
  {
    id: 'quiz-master',
    title: 'Pagsusulit sa Karunungan',
    desc: 'Magsagot at magpasa ng pagsusulit sa anumang aralin sa Kurso',
    target: 1,
    progress: 1,
    completed: true,
    claimed: false,
    xpReward: 75,
    icon: '📜',
    category: 'Academy',
  },
];

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<NavView>('home');
  const [gameMode, setGameMode] = useState<boolean>(true); // Default to 3D Game Metaverse!

  const [tracks] = useState<Track[]>(TRACKS);
  const [selectedTrack, setSelectedTrack] = useState<Track>(TRACKS[0]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(TRACKS[0].modules[0].lessons[0]);
  const [challenges] = useState<Challenge[]>(CHALLENGES);
  const [activeChallenge, setActiveChallenge] = useState<Challenge>(CHALLENGES[0]);

  // Wallet
  const [wallet, setWallet] = useState<WalletState>({
    address: null,
    balance: '0.0',
    type: null,
    isConnected: false,
    chainId: null,
  });

  // Gamification & Progress
  const [xp, setXp] = useState<number>(() => {
    return Number(localStorage.getItem('piso_student_xp')) || 350;
  });
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    const saved = localStorage.getItem('piso_completed_lessons');
    return saved ? JSON.parse(saved) : ['les-1-1-1'];
  });
  const [passedChallenges, setPassedChallenges] = useState<string[]>(() => {
    const saved = localStorage.getItem('piso_passed_challenges');
    return saved ? JSON.parse(saved) : [];
  });
  const [certificates, setCertificates] = useState<VerifiedCertificate[]>(() => {
    return CertificateService.getStoredCertificates();
  });
  const [deployments, setDeployments] = useState<DeploymentReceipt[]>(() => {
    return ContractDeployer.getDeployments();
  });
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Account & Session & Save Status
  const [accountId, setAccountId] = useState<string | null>(() => AccountSessionService.get().getStoredAccountId());
  const [securityNotifications, setSecurityNotifications] = useState<SecurityNotification[]>(() =>
    AccountSessionService.get().getNotifications()
  );
  const [saveStatus, setSaveStatus] = useState<SaveStatus>(() => SaveStateEngine.get().getStatus());

  const markSecurityNotificationsRead = () => {
    AccountSessionService.get().markAllAsRead();
    setSecurityNotifications(AccountSessionService.get().getNotifications());
  };

  useEffect(() => {
    const handleSecNotif = () => setSecurityNotifications(AccountSessionService.get().getNotifications());
    const handleSaveStatus = (e: any) => {
      if (e.detail?.status) setSaveStatus(e.detail.status);
    };
    window.addEventListener('piso-security-notification', handleSecNotif);
    window.addEventListener('piso-security-notifications-read', handleSecNotif);
    window.addEventListener('piso-save-status-changed', handleSaveStatus);
    return () => {
      window.removeEventListener('piso-security-notification', handleSecNotif);
      window.removeEventListener('piso-security-notifications-read', handleSecNotif);
      window.removeEventListener('piso-save-status-changed', handleSaveStatus);
    };
  }, []);

  // New Avatar & Gameplay State
  const [avatarMode, setAvatarModeState] = useState<'human' | 'drone' | 'custom_glb'>(() => {
    return (localStorage.getItem('piso_avatar_mode') as 'human' | 'drone' | 'custom_glb') || 'human';
  });
  const setAvatarMode = (mode: 'human' | 'drone' | 'custom_glb') => {
    setAvatarModeState(mode);
    localStorage.setItem('piso_avatar_mode', mode);
  };

  const [customGlbAvatar, setCustomGlbAvatarState] = useState<GlbAvatarMetadata | null>(() => {
    try {
      const raw = localStorage.getItem('active_custom_glb_avatar_meta');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const setCustomGlbAvatar = (meta: GlbAvatarMetadata | null) => {
    setCustomGlbAvatarState(meta);
    if (meta) {
      localStorage.setItem('active_custom_glb_avatar_meta', JSON.stringify(meta));
    } else {
      localStorage.removeItem('active_custom_glb_avatar_meta');
    }
  };

  const equipGlbAvatar = (meta: GlbAvatarMetadata) => {
    setCustomGlbAvatar(meta);
    setAvatarMode('custom_glb');
    window.dispatchEvent(new CustomEvent('piso-glb-avatar-updated', { detail: { metadata: meta } }));
  };

  const [avatarSkin, setAvatarSkinState] = useState<AvatarSkinId>(() => {
    return (localStorage.getItem('piso_avatar_skin') as AvatarSkinId) || 'agila';
  });
  const setAvatarSkin = (skin: AvatarSkinId) => {
    setAvatarSkinState(skin);
    localStorage.setItem('piso_avatar_skin', skin);
  };

  const [humanAvatar, setHumanAvatarState] = useState<HumanAvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('piso_human_avatar');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...DEFAULT_HUMAN_AVATAR,
            ...parsed,
            petDrone: { ...DEFAULT_HUMAN_AVATAR.petDrone!, ...(parsed.petDrone || {}) },
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse piso_human_avatar', e);
    }
    return DEFAULT_HUMAN_AVATAR;
  });
  const setHumanAvatar = (cfg: HumanAvatarConfig) => {
    const merged: HumanAvatarConfig = {
      ...DEFAULT_HUMAN_AVATAR,
      ...cfg,
      petDrone: { ...DEFAULT_HUMAN_AVATAR.petDrone!, ...(cfg.petDrone || {}) },
    };
    setHumanAvatarState(merged);
    localStorage.setItem('piso_human_avatar', JSON.stringify(merged));
  };

  const [avatarNft, setAvatarNftState] = useState<AvatarNftData>(() => {
    try {
      const saved = localStorage.getItem('piso_avatar_nft_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return DEFAULT_AVATAR_NFT;
  });

  const setAvatarNft = (updater: AvatarNftData | ((prev: AvatarNftData) => AvatarNftData)) => {
    setAvatarNftState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      localStorage.setItem('piso_avatar_nft_v1', JSON.stringify(next));
      window.dispatchEvent(new CustomEvent('piso-avatar-nft-updated', { detail: { nft: next } }));
      return next;
    });
  };

  const mintOrBindAvatarNft = (
    name: string,
    gender: 'male' | 'female',
    dnaHash: string,
    walletAddress?: string
  ): AvatarNftData => {
    const owner = walletAddress || wallet.address || '0x0000000000000000000000000000000000000000';
    const newNft: AvatarNftData = {
      tokenId: Math.floor(Date.now() / 1000),
      contractAddress: '0x3140000000000000000000000000000000000077',
      name: name || 'Bagong Mandirigma',
      dnaHash: dnaHash || `piso_dna_${Date.now()}`,
      gender,
      level: 1,
      ownerAddress: owner,
      mintTimestamp: Date.now(),
      isMinted: true,
      isDefaultCostume: true,
    };
    setAvatarNft(newNft);
    window.dispatchEvent(new CustomEvent('piso-avatar-nft-minted', { detail: { nft: newNft } }));
    return newNft;
  };

  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>(() => {
    const saved = localStorage.getItem('piso_daily_quests');
    return saved ? JSON.parse(saved) : INITIAL_DAILY_QUESTS;
  });

  const [metMentors, setMetMentors] = useState<string[]>(() => {
    const saved = localStorage.getItem('piso_met_mentors');
    return saved ? JSON.parse(saved) : [];
  });

  const [claimedMentorRewards, setClaimedMentorRewards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('piso_claimed_mentor_rewards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [claimedEcosystemRewards, setClaimedEcosystemRewards] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('piso_claimed_ecosystem_rewards');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [streakDays] = useState<number>(3);

  const [showTutorial, setShowTutorialState] = useState<boolean>(() => {
    return !localStorage.getItem('piso_tutorial_viewed');
  });
  const setShowTutorial = (show: boolean) => {
    setShowTutorialState(show);
    if (!show) {
      localStorage.setItem('piso_tutorial_viewed', 'true');
    }
  };

  const [controlSettings, setControlSettings] = useState<ControlSettings>(() => {
    const saved = localStorage.getItem('piso_control_settings');
    const defaults: ControlSettings = {
      cameraMode: 'isometric',
      flightSpeed: 'normal',
      zoom: 18,
      soundVolume: 80,
      particleDensity: 'high',
      controlScheme: 'camera_relative',
      invertPitch: false,
      invertYaw: false,
      swapJoystickSide: false,
      autoTargetLock: true,
      performanceTier: 'balanced',
      keybinds: DEFAULT_KEYBINDS,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaults,
          ...parsed,
          keybinds: { ...DEFAULT_KEYBINDS, ...(parsed.keybinds || {}) },
        };
      } catch {}
    }
    return defaults;
  });

  const recordQuestProgress = (questId: string, amount: number = 1) => {
    setDailyQuests((prev) => {
      const updated = prev.map((q) => {
        if (q.id === questId) {
          const nextProg = Math.min(q.target, q.progress + amount);
          return {
            ...q,
            progress: nextProg,
            completed: nextProg >= q.target,
          };
        }
        return q;
      });
      localStorage.setItem('piso_daily_quests', JSON.stringify(updated));
      return updated;
    });
  };

  const claimDailyQuest = (questId: string) => {
    setDailyQuests((prev) => {
      const quest = prev.find((q) => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;

      const updated = prev.map((q) => (q.id === questId ? { ...q, claimed: true } : q));
      localStorage.setItem('piso_daily_quests', JSON.stringify(updated));

      const newXp = xp + quest.xpReward;
      setXp(newXp);
      localStorage.setItem('piso_student_xp', String(newXp));

      setNotification({
        message: `🎉 Quest Claimed: "${quest.title}"! +${quest.xpReward} XP!`,
        type: 'success',
      });
      return updated;
    });
  };

  const recordTalkToMentor = (mentorId: string) => {
    if (!metMentors.includes(mentorId)) {
      const updated = [...metMentors, mentorId];
      setMetMentors(updated);
      localStorage.setItem('piso_met_mentors', JSON.stringify(updated));
      recordQuestProgress('talk-mentor', 1);
      setNotification({
        message: `🧙 Met mentor! You can now consult them anytime.`,
        type: 'info',
      });
    }
  };

  const claimMentorReward = (mentorId: string, xpReward: number = 50): boolean => {
    if (claimedMentorRewards.includes(mentorId)) {
      setNotification({
        message: `ℹ️ Nakuha mo na ang 1-time basbas ng mentor na ito (+${xpReward} XP). Isang beses lamang kada mentor!`,
        type: 'info',
      });
      return false;
    }

    const updated = [...claimedMentorRewards, mentorId];
    setClaimedMentorRewards(updated);
    localStorage.setItem('piso_claimed_mentor_rewards', JSON.stringify(updated));

    const newXp = xp + xpReward;
    setXp(newXp);
    localStorage.setItem('piso_student_xp', String(newXp));

    recordQuestProgress('talk-mentor', 1);

    try {
      PlayerProgressionEngine.awardAction('help_player', { mentorId });
      PlayerProgressionEngine.recordQuestProgress('com_mentor_trio', 1);
    } catch {}

    setNotification({
      message: `🎉 Natanggap ang 1-Time Mentor Blessing! +${xpReward} XP mula sa Mentor!`,
      type: 'success',
    });
    return true;
  };

  const claimEcosystemReward = (nodeId: string, xpReward: number, badgeName: string): boolean => {
    if (claimedEcosystemRewards.includes(nodeId)) {
      setNotification({
        message: `ℹ️ Nakuha mo na ang on-chain reward para sa "${badgeName}".`,
        type: 'info',
      });
      return false;
    }

    const updated = [...claimedEcosystemRewards, nodeId];
    setClaimedEcosystemRewards(updated);
    localStorage.setItem('piso_claimed_ecosystem_rewards', JSON.stringify(updated));

    const newXp = xp + xpReward;
    setXp(newXp);
    localStorage.setItem('piso_student_xp', String(newXp));

    if (nodeId === 'wallet-studio') {
      recordQuestProgress('wallet-studio-quest', 1);
    }

    setNotification({
      message: `🎉 Natanggap ang Ecosystem Milestone: "${badgeName}"! +${xpReward} XP!`,
      type: 'success',
    });
    return true;
  };

  // Seamless Session & Wallet Auto-Restoration on Startup
  useEffect(() => {
    AccountSessionService.get().initializeSession().then(({ session, walletState }) => {
      setAccountId(session.accountId);
      setWallet(walletState);
    });
  }, []);

  const toggleGameMode = () => setGameMode((prev) => !prev);

  const [playerStatsLevel, setPlayerStatsLevel] = useState<number>(() => {
    try {
      return PlayerStatsEngine.getStats().level;
    } catch {
      return 1;
    }
  });

  // Sync EXP & Level Up Events with Monster Farming, Mining, and Quests
  useEffect(() => {
    const handleExpGained = (e: any) => {
      const detail = e.detail;
      if (detail && typeof detail.totalXp === 'number') {
        setXp(detail.totalXp);
      } else if (detail && typeof detail.amount === 'number') {
        setXp((prev) => prev + detail.amount);
      }
      if (detail && typeof detail.level === 'number') {
        setPlayerStatsLevel(detail.level);
      }
    };

    const handleStatsUpdated = (e: any) => {
      if (e.detail && typeof e.detail.level === 'number') {
        setPlayerStatsLevel(e.detail.level);
      }
    };

    const handleLevelUp = (e: any) => {
      if (e.detail && typeof e.detail.newLevel === 'number') {
        setPlayerStatsLevel(e.detail.newLevel);
        setNotification({
          message: `🎉 LEVEL UP! Narating mo ang Level ${e.detail.newLevel}! (+${(e.detail.levelsGained || 1) * 3} Stat Points)`,
          type: 'success',
        });
      }
    };

    window.addEventListener('piso-exp-gained', handleExpGained);
    window.addEventListener('piso-player-stats-updated', handleStatsUpdated);
    window.addEventListener('piso-level-up', handleLevelUp);
    return () => {
      window.removeEventListener('piso-exp-gained', handleExpGained);
      window.removeEventListener('piso-player-stats-updated', handleStatsUpdated);
      window.removeEventListener('piso-level-up', handleLevelUp);
    };
  }, []);

  const level = Math.max(playerStatsLevel, Math.floor(xp / 500) + 1);
  const getLevelTitle = (l: number) => {
    if (l <= 1) return 'LEVEL 1: Blockchain Explorer';
    if (l <= 4) return `LEVEL ${l}: Smart Contract Builder`;
    if (l <= 9) return `LEVEL ${l}: dApp Developer`;
    if (l <= 14) return `LEVEL ${l}: PISO Hunter & Builder`;
    if (l <= 19) return `LEVEL ${l}: Titan Slayer`;
    return `LEVEL ${l}: Sovereign PISO Architect`;
  };
  const levelTitle = getLevelTitle(level);

  const [isConnectWalletModalOpen, setIsConnectWalletModalOpen] = useState(false);
  const openConnectWalletModal = () => setIsConnectWalletModalOpen(true);
  const closeConnectWalletModal = () => setIsConnectWalletModalOpen(false);

  const connectInjectedWallet = async () => {
    try {
      const injected = await WalletService.connectInjected();
      setWallet({
        address: injected.address,
        balance: injected.balance,
        type: 'injected',
        isConnected: true,
        chainId: injected.chainId,
      });
      AccountSessionService.get().recordWalletChange(injected.address, 'injected');
      setNotification({
        message: `Connected wallet: ${injected.address.slice(0, 6)}...${injected.address.slice(-4)} to PISO Chain`,
        type: 'success',
      });
      setAvatarNft((prev) => ({ ...prev, ownerAddress: injected.address }));
      closeConnectWalletModal();
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to connect wallet.',
        type: 'error',
      });
    }
  };

  const connectExistingWallet = async (input: string): Promise<{ address: string; balance: string }> => {
    try {
      const imported = WalletService.connectExistingWallet(input);
      const bal = await WalletService.getBalance(imported.address);
      setWallet({
        address: imported.address,
        balance: bal,
        type: 'burner',
        isConnected: true,
        chainId: 2026001,
      });
      AccountSessionService.get().recordWalletChange(imported.address, 'burner');
      setAvatarNft((prev) => ({ ...prev, ownerAddress: imported.address }));
      recordQuestProgress('wallet-studio-quest', 1);
      setNotification({
        message: `Existing wallet connected: ${imported.address.slice(0, 6)}...${imported.address.slice(-4)} (${parseFloat(bal).toFixed(2)} ₱PISO)`,
        type: 'success',
      });
      closeConnectWalletModal();
      return { address: imported.address, balance: bal };
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to connect existing wallet.',
        type: 'error',
      });
      throw err;
    }
  };

  const createBurnerWallet = () => {
    const burner = WalletService.getOrCreateBurnerWallet();
    setWallet({
      address: burner.address,
      balance: '1.0',
      type: 'burner',
      isConnected: true,
      chainId: 2026001,
    });
    setNotification({
      message: 'Created non-custodial disposable dev wallet on PISO Chain Devnet.',
      type: 'info',
    });
  };

  const disconnectWallet = () => {
    setWallet({
      address: null,
      balance: '0.0',
      type: null,
      isConnected: false,
      chainId: null,
    });
  };

  const requestFaucet = async () => {
    if (!wallet.address) return;
    try {
      const res = await WalletService.requestFaucetDrip(wallet.address);
      const newBal = (parseFloat(wallet.balance) + 1.0).toFixed(2);
      setWallet((prev) => ({ ...prev, balance: newBal }));
      recordQuestProgress('faucet-drip', 1);
      setNotification({
        message: `Drip success! 1.0 PISO credited. Tx: ${res.txHash.slice(0, 10)}...`,
        type: 'success',
      });
    } catch {
      setNotification({
        message: 'Faucet cooldown active. Please try again later.',
        type: 'error',
      });
    }
  };

  const refreshWalletBalance = async () => {
    if (wallet.address) {
      try {
        const bal = await WalletService.getBalance(wallet.address);
        setWallet((prev) => ({ ...prev, balance: bal }));
      } catch (e) {
        console.warn('Failed to refresh balance', e);
      }
    }
  };

  const setCustomBurnerKey = async (privateKey: string) => {
    try {
      const active = WalletService.setActiveBurnerWallet(privateKey);
      const bal = await WalletService.getBalance(active.address);
      setWallet({
        address: active.address,
        balance: bal,
        type: 'burner',
        isConnected: true,
        chainId: 2026001,
      });
      recordQuestProgress('wallet-studio-quest', 1);
      setNotification({
        message: `Active session wallet updated: ${active.address.slice(0, 6)}...${active.address.slice(-4)}`,
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to switch burner wallet.',
        type: 'error',
      });
    }
  };

  const completeCurrentLesson = (lessonId: string) => {
    if (!completedLessons.includes(lessonId)) {
      const updated = [...completedLessons, lessonId];
      setCompletedLessons(updated);
      localStorage.setItem('piso_completed_lessons', JSON.stringify(updated));

      const newXp = xp + 100;
      setXp(newXp);
      localStorage.setItem('piso_student_xp', String(newXp));
      recordQuestProgress('quiz-master', 1);

      try {
        PlayerProgressionEngine.awardAction('complete_lesson', { lessonId });
      } catch {}

      setNotification({
        message: 'Lesson completed! +100 XP gained!',
        type: 'success',
      });
    }
  };

  const recordChallengePass = (challengeId: string, xpEarned: number) => {
    if (!passedChallenges.includes(challengeId)) {
      const updated = [...passedChallenges, challengeId];
      setPassedChallenges(updated);
      localStorage.setItem('piso_passed_challenges', JSON.stringify(updated));

      const newXp = xp + xpEarned;
      setXp(newXp);
      localStorage.setItem('piso_student_xp', String(newXp));
      recordQuestProgress('smart-forge', 1);

      try {
        PlayerProgressionEngine.awardAction('complete_challenge', { challengeId, xpEarned });
      } catch {}

      setNotification({
        message: `Mabuhay! Challenge Passed! +${xpEarned} XP awarded!`,
        type: 'success',
      });
    }
  };

  const claimCertificateForTrack = async (track: Track): Promise<VerifiedCertificate> => {
    const recipient = wallet.address || '0x1821F246a27287a2187E1D634B8883030fA14731';
    const cert = await CertificateService.awardCertificate(recipient, track.certificateTier, track.title);
    setCertificates((prev) => [cert, ...prev]);

    const newXp = xp + track.xpReward;
    setXp(newXp);
    localStorage.setItem('piso_student_xp', String(newXp));
    recordQuestProgress('cert-verify', 1);

    try {
      PlayerProgressionEngine.awardAction('deploy_contract', { track });
    } catch {}

    setNotification({
      message: `Katunayan Certificate #${cert.tokenId} issued on PISO Chain! +${track.xpReward} XP!`,
      type: 'success',
    });

    return cert;
  };

  const refreshDeployments = () => {
    setDeployments(ContractDeployer.getDeployments());
  };

  return (
    <AcademyContext.Provider
      value={{
        activeView,
        setActiveView,
        gameMode,
        setGameMode,
        toggleGameMode,
        tracks,
        selectedTrack,
        setSelectedTrack,
        selectedLesson,
        setSelectedLesson,
        challenges,
        activeChallenge,
        setActiveChallenge,
        wallet,
        connectInjectedWallet,
        connectExistingWallet,
        isConnectWalletModalOpen,
        openConnectWalletModal,
        closeConnectWalletModal,
        createBurnerWallet,
        disconnectWallet,
        requestFaucet,
        refreshWalletBalance,
        setCustomBurnerKey,
        xp,
        level,
        levelTitle,
        completedLessons,
        passedChallenges,
        completeCurrentLesson,
        recordChallengePass,
        certificates,
        claimCertificateForTrack,
        deployments,
        refreshDeployments,
        notification,
        setNotification,
        avatarSkin,
        setAvatarSkin,
        avatarMode,
        setAvatarMode,
        customGlbAvatar,
        setCustomGlbAvatar,
        equipGlbAvatar,
        humanAvatar,
        setHumanAvatar,
        avatarNft,
        setAvatarNft,
        mintOrBindAvatarNft,
        dailyQuests,
        claimDailyQuest,
        recordQuestProgress,
        metMentors,
        recordTalkToMentor,
        claimedMentorRewards,
        claimMentorReward,
        claimedEcosystemRewards,
        claimEcosystemReward,
        streakDays,
        showTutorial,
        setShowTutorial,
        controlSettings,
        setControlSettings,
        accountId,
        securityNotifications,
        unreadSecurityCount: securityNotifications.filter((n) => !n.read).length,
        markSecurityNotificationsRead,
        saveStatus,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (!context) throw new Error('useAcademy must be used within AcademyProvider');
  return context;
};
