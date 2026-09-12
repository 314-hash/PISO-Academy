import React, { createContext, useContext, useState, useEffect } from 'react';
import { TRACKS, Track, Lesson } from '../data/courses';
import { CHALLENGES, Challenge } from '../data/challenges';
import { WalletService, WalletState } from '../services/walletService';
import { CertificateService, VerifiedCertificate } from '../services/certificateService';
import { ContractDeployer, DeploymentReceipt } from '../services/contractDeployer';

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
    | 'manilaHoodie';
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
  name: 'Datu Supremo (Founder)',
  skinTone: '#8D5524',
  hairStyle: 'datuLongWavy',
  hairColor: '#0B0F17',
  outfit: 'founderArmor',
  accessory: 'pisoSunCrest',
  backCrest: 'philippineSunStars',
  cape: 'founderCape',
  hasBeard: true,
  uploadedTextureUrl: '',
  uploadedFileName: '',
  aiPrompt: 'PISO Sovereign Founder — Radiant 8-ray Philippine Sun, gold-embossed ₱ chestplate, long flowing locks, royal blue & crimson cape, black nano-armor with gold filigree',
  auraColor: '#F59E0B',
  bodyType: 'athletic',
  petDrone: {
    enabled: true,
    skin: 'panday',
    auraColor: '#F59E0B',
  },
  equippedPinoyItems: {
    weapon: 'kampilan-lapulapu',
    shield: 'kaldero-lid-aegis',
    headwear: 'salakot-solar',
    towel: 'good-morning-towel',
    crown: 'datu-sun-crown',
    back: 'sarimanok-wings',
    signboard: 'jeepney-route-sign',
    amulet: 'agimat-anting',
    tabo: 'tabo-cleansing',
    allEquipped: true,
    superpower: 'kamehameha',
  },
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
  avatarMode: 'human' | 'drone';
  setAvatarMode: (mode: 'human' | 'drone') => void;
  humanAvatar: HumanAvatarConfig;
  setHumanAvatar: (cfg: HumanAvatarConfig) => void;
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

  // New Avatar & Gameplay State
  const [avatarMode, setAvatarModeState] = useState<'human' | 'drone'>(() => {
    return (localStorage.getItem('piso_avatar_mode') as 'human' | 'drone') || 'human';
  });
  const setAvatarMode = (mode: 'human' | 'drone') => {
    setAvatarModeState(mode);
    localStorage.setItem('piso_avatar_mode', mode);
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
    };
    if (saved) {
      try {
        return { ...defaults, ...JSON.parse(saved) };
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

  // Initialize burner wallet on load
  useEffect(() => {
    const burner = WalletService.getOrCreateBurnerWallet();
    WalletService.getBalance(burner.address).then((bal) => {
      setWallet({
        address: burner.address,
        balance: bal,
        type: 'burner',
        isConnected: true,
        chainId: 2026001,
      });
    });
  }, []);

  const toggleGameMode = () => setGameMode((prev) => !prev);

  const level = Math.floor(xp / 500) + 1;
  const getLevelTitle = (l: number) => {
    if (l <= 1) return 'LEVEL 1: Blockchain Explorer';
    if (l === 2) return 'LEVEL 2: Smart Contract Builder';
    if (l === 3) return 'LEVEL 3: dApp Developer';
    if (l === 4) return 'LEVEL 4: PISO Builder';
    return 'LEVEL 5: PISO Core Builder';
  };
  const levelTitle = getLevelTitle(level);

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
      setNotification({
        message: `Connected wallet: ${injected.address.slice(0, 6)}...${injected.address.slice(-4)} to PISO Chain`,
        type: 'success',
      });
    } catch (err: any) {
      setNotification({
        message: err.message || 'Failed to connect wallet.',
        type: 'error',
      });
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
        humanAvatar,
        setHumanAvatar,
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
