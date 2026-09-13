/**
 * progressionMeta.ts
 * Metadata definitions for Filipino Ranks, Player Classes, and Primary Attributes.
 */

import {
  FilipinoRankTier,
  FilipinoRankDef,
  PlayerClassId,
  PlayerClassDef,
  PrimaryAttributeKey,
  PrimaryAttributeMeta,
} from '../types/playerProgression';

// ==========================================
// 1. FILIPINO PROGRESSION RANKS
// ==========================================

export const FILIPINO_RANKS: FilipinoRankDef[] = [
  {
    tier: 'Tuklas',
    minLevel: 1,
    title: 'Tuklas',
    filipinoTitle: 'Tuklas (Explorer)',
    meaning: 'The beginner who discovers the metaverse and opens the doors to digital knowledge.',
    badgeIcon: '🌱',
    color: '#94A3B8', // Slate
    prestigePerk: 'Full access to Genesis Plaza, New Manila districts, and Beginner Tracks.',
  },
  {
    tier: 'Mag-aaral',
    minLevel: 5,
    title: 'Mag-aaral',
    filipinoTitle: 'Mag-aaral (Scholar)',
    meaning: 'The dedicated student diligently studying smart contract code and web3 principles.',
    badgeIcon: '📚',
    color: '#38BDF8', // Sky
    prestigePerk: '+15% XP multiplier on all course lessons and quizzes.',
  },
  {
    tier: 'Tagabuo',
    minLevel: 10,
    title: 'Tagabuo',
    filipinoTitle: 'Tagabuo (Junior Builder)',
    meaning: 'The budding developer authoring their first dApps, structures, and tests.',
    badgeIcon: '🔨',
    color: '#34D399', // Emerald
    prestigePerk: 'Access to 3D Mining & Building Studio and Level 10+ monster grounds.',
  },
  {
    tier: 'Builder',
    minLevel: 20,
    title: 'Builder',
    filipinoTitle: 'Builder (Proven Creator)',
    meaning: 'A proven creator capable of deploying verified smart contracts on PISO Devnet.',
    badgeIcon: '⚒️',
    color: '#FBBF24', // Amber
    prestigePerk: 'Permission to hunt Giga Buwaya titans and claim 70M PISO pool bounties.',
  },
  {
    tier: 'Bayani',
    minLevel: 30,
    title: 'Bayani',
    filipinoTitle: 'Bayani (Community Hero)',
    meaning: 'A leader who lifts others through mentorship, peer code reviews, and community assistance.',
    badgeIcon: '🛡️',
    color: '#A855F7', // Purple
    prestigePerk: 'Unlocks Bayanihan Party Aura (+10% stats to nearby peers) and peer tipping.',
  },
  {
    tier: 'Datu',
    minLevel: 40,
    title: 'Datu',
    filipinoTitle: 'Datu (Chieftain / Leader)',
    meaning: 'An esteemed elder and architect shaping the ecosystem roadmap and DAO decisions.',
    badgeIcon: '👑',
    color: '#F59E0B', // Golden Amber
    prestigePerk: '2x Voting Weight in Bayanihan DAO and Builder Grant Fast-Track.',
  },
  {
    tier: 'Dalubhasa',
    minLevel: 50,
    title: 'Dalubhasa',
    filipinoTitle: 'Dalubhasa (Master Expert)',
    meaning: 'A grandmaster of cryptography, EVM optimizations, and metaverse mechanics.',
    badgeIcon: '🔮',
    color: '#EC4899', // Pink
    prestigePerk: 'Custom NFT Avatar Blueprint Forge and Soulbound Grandmaster Certificate.',
  },
  {
    tier: 'Panday',
    minLevel: 75,
    title: 'Panday',
    filipinoTitle: 'Panday (Grand Architect)',
    meaning: 'A legendary master blacksmith forging the foundational protocols of the decentralized era.',
    badgeIcon: '⚡',
    color: '#EF4444', // Red
    prestigePerk: 'Zero-gas test runner allocations and honorary seat in the PISO Core Forge.',
  },
  {
    tier: 'Alamat',
    minLevel: 100,
    title: 'Alamat',
    filipinoTitle: 'Alamat (Living Legend)',
    meaning: 'The pinnacle of achievement. A mythic legend immortalized across the PISO archipelago.',
    badgeIcon: '🌟',
    color: '#FFD700', // Radiant Gold
    prestigePerk: 'Golden Alamat Monument erected in Genesis Plaza and maximum credential score.',
  },
];

export function getRankForLevel(level: number): FilipinoRankDef {
  for (let i = FILIPINO_RANKS.length - 1; i >= 0; i--) {
    if (level >= FILIPINO_RANKS[i].minLevel) {
      return FILIPINO_RANKS[i];
    }
  }
  return FILIPINO_RANKS[0];
}

// ==========================================
// 2. PLAYER CLASSES & ABILITIES
// ==========================================

export const PLAYER_CLASSES: Record<PlayerClassId, PlayerClassDef> = {
  builder: {
    id: 'builder',
    name: 'Builder',
    filipinoName: 'Tagabuo ng Sistema',
    icon: '🛠️',
    color: '#06B6D4',
    primaryStatAffinity: 'coding',
    description: 'High Coding prowess. Masters of software architecture, smart contracts, and mechanical systems.',
    specialAbilityName: 'BUILD MODE',
    specialAbilityDesc: 'Activates rapid construction mode: +40% mining speed, -30% block resource cost, and +20% contract verification speed for 60s.',
    specialAbilityCooldownSec: 120,
    passivePerkDesc: 'Coding challenges award +25% extra XP and stat points.',
  },
  chain_warrior: {
    id: 'chain_warrior',
    name: 'Chain Warrior',
    filipinoName: 'Mandirigma ng Blockchain',
    icon: '⚔️',
    color: '#F59E0B',
    primaryStatAffinity: 'blockchain',
    description: 'High Blockchain mastery. Elite warriors utilizing on-chain state to execute devastating combat strikes.',
    specialAbilityName: 'CHAIN LINK',
    specialAbilityDesc: 'Binds with PISO Chain: grants 100% Critical Strike chance and +50% PISO bounty yields on monster hits for 30s.',
    specialAbilityCooldownSec: 150,
    passivePerkDesc: 'Transactions and smart contract activities award +20% extra bounties.',
  },
  data_sage: {
    id: 'data_sage',
    name: 'Data Sage',
    filipinoName: 'Pantas ng Karunungan',
    icon: '📖',
    color: '#3B82F6',
    primaryStatAffinity: 'knowledge',
    description: 'High Knowledge mastery. Scholarly researchers capable of absorbing complex academic material with ease.',
    specialAbilityName: 'DEEP LEARN',
    specialAbilityDesc: 'Enters enlightened focus: instantly earns +150 bonus XP, resets all quiz cooldowns, and reveals optimal solutions.',
    specialAbilityCooldownSec: 180,
    passivePerkDesc: 'Lessons and quizzes grant +30% additional XP.',
  },
  creator: {
    id: 'creator',
    name: 'Creator',
    filipinoName: 'Manlilikha ng Mundo',
    icon: '🎨',
    color: '#EC4899',
    primaryStatAffinity: 'creativity',
    description: 'High Creativity prowess. Visionaries designing immersive 3D avatars, cyberpunk worlds, and digital assets.',
    specialAbilityName: 'CREATE',
    specialAbilityDesc: 'Unleashes creative burst: summons holographic aura particles, +30% movement speed, and doubles mining drop rates for 45s.',
    specialAbilityCooldownSec: 120,
    passivePerkDesc: 'Unlocks exclusive avatar cosmetic slots and shader effects.',
  },
  problem_solver: {
    id: 'problem_solver',
    name: 'Problem Solver',
    filipinoName: 'Taga-Lutas ng Misteryo',
    icon: '🧩',
    color: '#8B5CF6',
    primaryStatAffinity: 'problemSolving',
    description: 'High Problem Solving acumen. Strategic thinkers who dismantle complex bugs and solve mysterious puzzles.',
    specialAbilityName: 'ANALYZE',
    specialAbilityDesc: 'Scans target environment: exposes hidden weak points on boss titans for +75% bonus damage, and highlights secret nodes.',
    specialAbilityCooldownSec: 120,
    passivePerkDesc: 'Bypass obstacle gates and solve logic challenges with +25% bonus rewards.',
  },
  bayani: {
    id: 'bayani',
    name: 'Bayani',
    filipinoName: 'Dakilang Bayani',
    icon: '🌺',
    color: '#10B981',
    primaryStatAffinity: 'bayanihan',
    description: 'High Bayanihan mastery. Champions of community collaboration, mutual upliftment, and servant leadership.',
    specialAbilityName: 'INSPIRE',
    specialAbilityDesc: 'Emits a golden Bayanihan Aura: boosts all attributes of self and nearby players by +15% and grants instant HP recovery.',
    specialAbilityCooldownSec: 120,
    passivePerkDesc: 'Community quests and helping players award +40% bonus XP and influence.',
  },
  polymath: {
    id: 'polymath',
    name: 'Polymath',
    filipinoName: 'Soberanong Pantas',
    icon: '🌟',
    color: '#EAB308',
    primaryStatAffinity: 'balanced',
    description: 'Balanced excellence across all six disciplines. The versatile generalist who can adapt to any Web3 role.',
    specialAbilityName: 'ADAPT',
    specialAbilityDesc: 'Harmonizes all disciplines: temporarily grants the benefits of all other class special abilities simultaneously for 25s.',
    specialAbilityCooldownSec: 240,
    passivePerkDesc: 'All six primary attributes receive a passive +10% bonus.',
  },
};

// ==========================================
// 3. PRIMARY ATTRIBUTES METADATA
// ==========================================

export const PRIMARY_ATTRIBUTES_META: Record<PrimaryAttributeKey, PrimaryAttributeMeta> = {
  knowledge: {
    key: 'knowledge',
    name: 'Knowledge',
    filipinoName: 'Karunungan',
    icon: '📚',
    color: '#3B82F6', // Blue
    description: 'Represents learning, theoretical understanding, and accumulated wisdom.',
    increaseActivities: [
      'Completing course lessons in catalog',
      'Passing quizzes and module assessments',
      'Reading academy whitepapers & guides',
      'Completing educational quests',
    ],
    unlocksAndUses: [
      'Unlocks advanced course tracks & ZK modules',
      'Opens Knowledge Gates in New Manila',
      'Special dialogue options with NPC Mentors',
      'Increases Focus secondary attribute',
    ],
  },
  coding: {
    key: 'coding',
    name: 'Coding',
    filipinoName: 'Kakayahan sa Pag-code',
    icon: '💻',
    color: '#06B6D4', // Cyan
    description: 'Represents programming and smart contract engineering ability.',
    increaseActivities: [
      'Solving Solidity challenges in Web3 Lab',
      'Deploying smart contracts to PISO Devnet',
      'Debugging vulnerability challenges',
      'Building and testing projects',
    ],
    unlocksAndUses: [
      'Unlocks Developer Quests and contract labs',
      'Access to advanced technology zones',
      'Increases Energy secondary attribute',
      'Unlocks Builder Mode perks',
    ],
  },
  blockchain: {
    key: 'blockchain',
    name: 'Blockchain',
    filipinoName: 'Kadalubhasaan sa Web3',
    icon: '⛓️',
    color: '#F59E0B', // Amber
    description: 'Represents Web3 mastery, on-chain mechanics, and PISO Chain understanding.',
    increaseActivities: [
      'Executing transactions and faucet drips',
      'Interacting with PISO Chain smart accounts',
      'Verifying Soulbound Katunayan NFTs',
      'Participating in staking and validator tasks',
    ],
    unlocksAndUses: [
      'Unlocks Blockchain Vaults and Zones',
      'Validator-related quests and grants',
      'Increases Energy & Critical Strike chance',
      'Unlocks Chain Warrior abilities',
    ],
  },
  creativity: {
    key: 'creativity',
    name: 'Creativity',
    filipinoName: 'Pagkamalikhain',
    icon: '🎨',
    color: '#EC4899', // Pink
    description: 'Represents creative, artistic, 3D modeling, and world-building capability.',
    increaseActivities: [
      'Customizing avatar attire & accessories',
      'Mining and constructing blocks in 3D studio',
      'Designing procedural 3D Three.js assets',
      'Completing design challenges',
    ],
    unlocksAndUses: [
      'Creator missions and NFT quests',
      'Unlocks rare cosmetic blueprints & auras',
      'Increases Luck and Speed secondary attributes',
      'Terranian world generation tools',
    ],
  },
  problemSolving: {
    key: 'problemSolving',
    name: 'Problem Solving',
    filipinoName: 'Pagsusuri at Diskarte',
    icon: '🧩',
    color: '#8B5CF6', // Purple
    description: 'Represents analytical, algorithmic, and strategic battle intelligence.',
    increaseActivities: [
      'Debugging code challenges under pressure',
      'Navigating mazes and obstacle courses',
      'Analyzing monster weaknesses in combat',
      'Solving cryptographic puzzles',
    ],
    unlocksAndUses: [
      'Access to secret areas and hidden monoliths',
      'Boss raid missions (Giga Buwaya)',
      'Increases Stamina & Focus secondary attributes',
      'Unlocks Analyze combat ability',
    ],
  },
  bayanihan: {
    key: 'bayanihan',
    name: 'Bayanihan',
    filipinoName: 'Bayanihan at Kapwa',
    icon: '🤝',
    color: '#10B981', // Emerald
    description: 'Represents community cooperation, mutual assistance, and leadership impact.',
    increaseActivities: [
      'Helping other players in Gun.js P2P chat',
      'Sending ₱PISO tips to fellow creators',
      'Completing community and cooperative quests',
      'Assisting NPC mentors with errands',
    ],
    unlocksAndUses: [
      'DAO Governance proposals and voting weight',
      'Increases HP, Stamina, and Influence attributes',
      'Unlocks Community Blessing Auras',
      'Eligibility for Ecosystem Builder Grants',
    ],
  },
};
