/**
 * playerProgression.ts
 * Core types and data contracts for the PISO Academy Player Stats & Progression System.
 * Connects Web3 education, RPG mechanics, skill trees, quests, and Filipino cultural ranks.
 */

// ==========================================
// 1. PRIMARY ATTRIBUTES (The 6 Pillars)
// ==========================================

export interface PrimaryAttributes {
  knowledge: number;       // Accumulated learning from lessons, quizzes, academy reading
  coding: number;          // Programming, smart contracts, developer challenges
  blockchain: number;      // Web3 mastery, transactions, PISO Chain activities
  creativity: number;      // Building, designing, 3D world creation, NFT assets
  problemSolving: number;  // Analytical thinking, puzzles, debugging, boss strategy
  bayanihan: number;       // Community cooperation, peer assistance, leadership
}

export type PrimaryAttributeKey = keyof PrimaryAttributes;

export interface PrimaryAttributeMeta {
  key: PrimaryAttributeKey;
  name: string;
  filipinoName: string;
  icon: string;
  color: string;
  description: string;
  increaseActivities: string[];
  unlocksAndUses: string[];
}

// ==========================================
// 2. SECONDARY RPG STATS
// ==========================================

export interface SecondaryAttributes {
  hp: number;              // Current / Max Player Health
  maxHp: number;
  energy: number;          // Energy for superpowers & high-frequency contract execution
  maxEnergy: number;
  stamina: number;         // Stamina for sprinting, parkour, climbing, and mining
  maxStamina: number;
  speed: number;           // Movement speed multiplier (e.g. 1.0x - 1.5x)
  focus: number;           // Learning & coding speed multiplier
  luck: number;            // Discovery chance for secret nodes, rare loot & drops
  influence: number;       // Academy reputation & Bayanihan DAO voting weighting
  digitalPower: number;    // Overall capability score (normalized player-friendly score)
}

// ==========================================
// 3. FILIPINO PROGRESSION RANKS
// ==========================================

export type FilipinoRankTier =
  | 'Tuklas'       // Level 1: Explorer / Discoverer
  | 'Mag-aaral'   // Level 5: Scholar / Student
  | 'Tagabuo'     // Level 10: Apprentice Builder
  | 'Builder'     // Level 20: Full Creator / Developer
  | 'Bayani'      // Level 30: Community Champion
  | 'Datu'        // Level 40: Chieftain / Ecosystem Leader
  | 'Dalubhasa'   // Level 50: Grand Master / Expert
  | 'Panday'      // Level 75: Master Blacksmith / Architect
  | 'Alamat';     // Level 100: Legend

export interface FilipinoRankDef {
  tier: FilipinoRankTier;
  minLevel: number;
  title: string;
  filipinoTitle: string;
  meaning: string;
  badgeIcon: string;
  color: string;
  prestigePerk: string;
}

// ==========================================
// 4. PLAYER CLASSES & SPECIAL ABILITIES
// ==========================================

export type PlayerClassId =
  | 'builder'
  | 'chain_warrior'
  | 'data_sage'
  | 'creator'
  | 'problem_solver'
  | 'bayani'
  | 'polymath';

export interface PlayerClassDef {
  id: PlayerClassId;
  name: string;
  filipinoName: string;
  icon: string;
  color: string;
  primaryStatAffinity: PrimaryAttributeKey | 'balanced';
  description: string;
  specialAbilityName: string;
  specialAbilityDesc: string;
  specialAbilityCooldownSec: number;
  passivePerkDesc: string;
}

// ==========================================
// 5. VISUAL SKILL TREE
// ==========================================

export type SkillTreeBranch =
  | 'technology'
  | 'creative'
  | 'entrepreneur'
  | 'community'
  | 'player';

export interface SkillNodeDef {
  id: string;
  branch: SkillTreeBranch;
  tier: 1 | 2 | 3 | 4;
  name: string;
  filipinoName: string;
  icon: string;
  description: string;
  spCost: number;
  requiredLevel: number;
  prerequisites: string[]; // Skill IDs required before unlocking
  attributeBonus?: Partial<PrimaryAttributes>;
  secondaryBonus?: Partial<SecondaryAttributes>;
  specialPerk?: string;
  xPos: number; // 0-100% within branch canvas
  yPos: number; // 0-100%
}

// ==========================================
// 6. MULTI-CATEGORY QUEST ENGINE
// ==========================================

export type QuestCategory =
  | 'main'
  | 'academy'
  | 'developer'
  | 'exploration'
  | 'community'
  | 'daily'
  | 'secret'
  | 'boss';

export interface QuestObjective {
  id: string;
  desc: string;
  target: number;
  current: number;
  isCompleted: boolean;
}

export interface QuestDef {
  id: string;
  category: QuestCategory;
  title: string;
  filipinoTitle?: string;
  description: string;
  icon: string;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
  requiredRank?: FilipinoRankTier;
  requiredLevel?: number;
  xpReward: number;
  spReward?: number;
  pisoReward?: number;
  statRewards?: Partial<PrimaryAttributes>;
  objectives?: QuestObjective[];
  chainCredentialTier?: string; // If eligible for Soulbound verification
}

// ==========================================
// 7. ACHIEVEMENTS & ON-CHAIN CREDENTIALS
// ==========================================

export type AchievementRarity = 'Common' | 'Rare' | 'Epic' | 'Legendary' | 'Alamat';

export interface AchievementDef {
  id: string;
  title: string;
  filipinoTitle: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: 'learning' | 'coding' | 'web3' | 'exploration' | 'community' | 'combat' | 'milestone';
  target: number;
  progress: number;
  unlocked: boolean;
  unlockedTimestamp?: number;
  xpReward: number;
  spReward?: number;
  statRewards?: Partial<PrimaryAttributes>;
  onChainSoulboundAvailable?: boolean;
  soulboundTokenId?: number;
}

// ==========================================
// 8. COMPLETE PLAYER PROFILE RECORD
// ==========================================

export interface PlayerProfileState {
  version: number;
  username: string;
  level: number;
  rank: FilipinoRankTier;
  playerClass: PlayerClassId;
  currentExp: number;
  expToNextLevel: number;
  totalCumulativeExp: number;
  unallocatedStatPoints: number;
  skillPoints: number;
  primaryAttributes: PrimaryAttributes;
  secondaryAttributes: SecondaryAttributes;
  unlockedSkillIds: string[];
  activeQuests: QuestDef[];
  achievements: AchievementDef[];
  discoveredLocations: string[];
  bayanihanHelpCount: number;
  lastDailyReset: string;
  classAbilityLastUsed: number;
  statsAllocatedTotal: number;
}

export type StatGainEventDetail = {
  stat: PrimaryAttributeKey | 'digitalPower' | 'sp' | 'xp';
  amount: number;
  source?: string;
};
