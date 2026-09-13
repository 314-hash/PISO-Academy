/**
 * playerProgressionEngine.ts
 * Master progression engine for PISO Academy.
 * Handles primary attributes, secondary stats, Filipino ranks, classes,
 * skill trees, multi-category quests, achievements, and persistent storage.
 */

import {
  PrimaryAttributes,
  PrimaryAttributeKey,
  SecondaryAttributes,
  FilipinoRankTier,
  PlayerClassId,
  PlayerProfileState,
  QuestDef,
  AchievementDef,
  StatGainEventDetail,
} from '../types/playerProgression';
import { FILIPINO_RANKS, getRankForLevel, PLAYER_CLASSES } from '../data/progressionMeta';
import { SKILL_TREE_NODES } from '../data/skillTreeData';
import { MASTER_QUESTS } from '../data/questsData';
import { MASTER_ACHIEVEMENTS } from '../data/achievementsData';
import { SoundFX } from './soundFX';
import { PisoEconomyService } from './pisoEconomyService';

const STORAGE_KEY_V2 = 'piso_player_profile_v2';
const LEGACY_STATS_KEY = 'piso_player_stats_v1';

export class PlayerProgressionEngine {
  /**
   * Deterministic EXP requirement for next level.
   * Simple standard RPG curve — easy to understand:
   *   Level 1  →  100 XP
   *   Level 5  →  550 XP
   *   Level 10 →  1,900 XP
   *   Level 20 →  5,200 XP
   *   Level 50 →  25,000 XP
   *   Level 100→  100,000 XP
   */
  public static calculateExpRequired(lvl: number): number {
    if (lvl <= 1) return 100;
    return Math.round(100 * Math.pow(lvl, 1.4));
  }

  /**
   * Calculates the Digital Power score using the balanced formula:
   * Digital Power = Knowledge * 0.20 + Coding * 0.20 + Blockchain * 0.20
   *               + Creativity * 0.15 + Problem Solving * 0.15 + Bayanihan * 0.10
   */
  public static calculateDigitalPower(
    primary: PrimaryAttributes,
    level: number,
    bonus: number = 0
  ): number {
    const raw =
      primary.knowledge * 0.2 +
      primary.coding * 0.2 +
      primary.blockchain * 0.2 +
      primary.creativity * 0.15 +
      primary.problemSolving * 0.15 +
      primary.bayanihan * 0.1;

    // Scale smoothly with level so baseline Lv. 1 begins around 10-15 and scales naturally to 100+
    const levelBonus = (level - 1) * 2;
    return Math.max(10, Math.round(raw + levelBonus + bonus));
  }

  /**
   * Calculates all secondary RPG attributes dynamically from primary attributes and level.
   */
  public static calculateSecondaryAttributes(
    primary: PrimaryAttributes,
    level: number,
    unlockedSkillIds: string[] = [],
    statHpBonus: number = 10
  ): SecondaryAttributes {
    const rankDef = getRankForLevel(level);
    const rankIdx = FILIPINO_RANKS.findIndex((r) => r.tier === rankDef.tier);

    // Calculate skill bonuses from unlocked nodes
    let bonusHp = 0;
    let bonusEnergy = 0;
    let bonusStamina = 0;
    let bonusSpeed = 0;
    let bonusFocus = 0;
    let bonusLuck = 0;
    let bonusInfluence = 0;
    let bonusDigitalPower = 0;

    for (const skillId of unlockedSkillIds) {
      const node = SKILL_TREE_NODES.find((s) => s.id === skillId);
      if (node?.secondaryBonus) {
        bonusHp += node.secondaryBonus.maxHp || node.secondaryBonus.hp || 0;
        bonusEnergy += node.secondaryBonus.maxEnergy || node.secondaryBonus.energy || 0;
        bonusStamina += node.secondaryBonus.maxStamina || node.secondaryBonus.stamina || 0;
        bonusSpeed += node.secondaryBonus.speed || 0;
        bonusFocus += node.secondaryBonus.focus || 0;
        bonusLuck += node.secondaryBonus.luck || 0;
        bonusInfluence += node.secondaryBonus.influence || 0;
        bonusDigitalPower += node.secondaryBonus.digitalPower || 0;
      }
    }

    const maxHp = 1000 + primary.bayanihan * 20 + level * 50 + statHpBonus * 100 + bonusHp;
    const maxEnergy = 100 + primary.coding * 8 + primary.blockchain * 8 + level * 5 + bonusEnergy;
    const maxStamina = 100 + primary.problemSolving * 6 + primary.knowledge * 4 + level * 5 + bonusStamina;
    const speed = Number(
      (1.0 + Math.min(0.5, primary.creativity * 0.005 + level * 0.002) + bonusSpeed).toFixed(2)
    );
    const focus = Math.round(10 + primary.knowledge * 1.5 + primary.problemSolving * 1.2 + bonusFocus);
    const luck = Math.round(5 + primary.creativity * 1.0 + primary.bayanihan * 0.8 + bonusLuck);
    const influence = Math.round(
      10 + primary.bayanihan * 2.0 + level * 3 + rankIdx * 15 + bonusInfluence
    );
    const digitalPower = this.calculateDigitalPower(primary, level, bonusDigitalPower);

    return {
      hp: maxHp,
      maxHp,
      energy: maxEnergy,
      maxEnergy,
      stamina: maxStamina,
      maxStamina,
      speed,
      focus,
      luck,
      influence,
      digitalPower,
    };
  }

  /**
   * Evaluates the recommended player class based on the highest primary stat affinity.
   */
  public static evaluateClassAffinity(primary: PrimaryAttributes): PlayerClassId {
    const stats: { id: PlayerClassId; val: number }[] = [
      { id: 'builder', val: primary.coding },
      { id: 'chain_warrior', val: primary.blockchain },
      { id: 'data_sage', val: primary.knowledge },
      { id: 'creator', val: primary.creativity },
      { id: 'problem_solver', val: primary.problemSolving },
      { id: 'bayani', val: primary.bayanihan },
    ];

    stats.sort((a, b) => b.val - a.val);
    const highest = stats[0];
    const lowest = stats[stats.length - 1];

    // If stats are all close (difference <= 4), recommend Polymath
    if (highest.val - lowest.val <= 4 && highest.val >= 15) {
      return 'polymath';
    }

    return highest.id;
  }

  /**
   * Initializes default player profile or restores from persistent storage.
   */
  public static getProfile(): PlayerProfileState {
    if (typeof window === 'undefined') {
      return this.getDefaultProfile();
    }

    const raw = localStorage.getItem(STORAGE_KEY_V2);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 2) {
          // Merge with master quests and achievements in case new ones were added
          const mergedQuests = MASTER_QUESTS.map((mq) => {
            const existing = parsed.activeQuests?.find((q: QuestDef) => q.id === mq.id);
            return existing ? { ...mq, ...existing } : mq;
          });

          const mergedAchievements = MASTER_ACHIEVEMENTS.map((ma) => {
            const existing = parsed.achievements?.find((a: AchievementDef) => a.id === ma.id);
            return existing ? { ...ma, ...existing } : ma;
          });

          const level = parsed.level || 1;
          const rankDef = getRankForLevel(level);

          const secondary = this.calculateSecondaryAttributes(
            parsed.primaryAttributes,
            level,
            parsed.unlockedSkillIds || [],
            parsed.statHpBonus || 10
          );

          return {
            ...parsed,
            usernameChangeUsed: parsed.usernameChangeUsed ?? false,
            createdAt: parsed.createdAt ?? Date.now(),
            lastLoginAt: parsed.lastLoginAt ?? Date.now(),
            rank: rankDef.tier,
            secondaryAttributes: secondary,
            activeQuests: mergedQuests,
            achievements: mergedAchievements,
          };
        }
      } catch (e) {
        console.warn('Failed to parse piso_player_profile_v2', e);
      }
    }

    // Migrate from legacy v1 or create new
    return this.migrateFromLegacyOrInit();
  }

  /**
   * Migrates existing legacy stats (e.g. piso_player_stats_v1, piso_student_xp, etc.)
   * into the comprehensive v2 profile.
   */
  private static migrateFromLegacyOrInit(): PlayerProfileState {
    let level = 1;
    let currentExp = 0;
    let totalCumulativeExp = 350;
    let legacyCompletedLessonsCount = 1;
    let legacyPassedChallengesCount = 0;
    let monstersSlain = 0;
    let buildsCreated = 0;

    if (typeof window !== 'undefined') {
      try {
        const xpRaw = localStorage.getItem('piso_student_xp');
        if (xpRaw) totalCumulativeExp = Number(xpRaw) || 350;

        const lessonsRaw = localStorage.getItem('piso_completed_lessons');
        if (lessonsRaw) {
          const arr = JSON.parse(lessonsRaw);
          if (Array.isArray(arr)) legacyCompletedLessonsCount = arr.length;
        }

        const chalRaw = localStorage.getItem('piso_passed_challenges');
        if (chalRaw) {
          const arr = JSON.parse(chalRaw);
          if (Array.isArray(arr)) legacyPassedChallengesCount = arr.length;
        }

        const legacyStatsRaw = localStorage.getItem(LEGACY_STATS_KEY);
        if (legacyStatsRaw) {
          const lStats = JSON.parse(legacyStatsRaw);
          if (lStats.level) level = lStats.level;
          if (lStats.currentExp) currentExp = lStats.currentExp;
          if (lStats.monstersSlain) monstersSlain = lStats.monstersSlain;
          if (lStats.buildsCreated) buildsCreated = lStats.buildsCreated;
        }
      } catch {}
    }

    // Allocate initial baseline primary attributes scaled by existing progress
    const primaryAttributes: PrimaryAttributes = {
      knowledge: 10 + legacyCompletedLessonsCount * 3,
      coding: 10 + legacyPassedChallengesCount * 4 + buildsCreated * 2,
      blockchain: 10 + Math.min(15, Math.floor(level * 1.5)),
      creativity: 10 + buildsCreated * 3,
      problemSolving: 10 + monstersSlain * 2 + legacyPassedChallengesCount * 2,
      bayanihan: 12 + Math.min(10, Math.floor(level * 1.2)),
    };

    const expToNextLevel = this.calculateExpRequired(level);
    const rankDef = getRankForLevel(level);
    const initialClass = this.evaluateClassAffinity(primaryAttributes);
    const secondaryAttributes = this.calculateSecondaryAttributes(primaryAttributes, level, []);

    const profile: PlayerProfileState = {
      version: 2,
      username: 'Janus',
      level,
      rank: rankDef.tier,
      playerClass: initialClass,
      currentExp,
      expToNextLevel,
      totalCumulativeExp,
      unallocatedStatPoints: Math.max(3, level * 2),
      skillPoints: Math.max(2, Math.floor(level / 2)),
      primaryAttributes,
      secondaryAttributes,
      unlockedSkillIds: ['tech_syntax_apprentice'],
      activeQuests: MASTER_QUESTS,
      achievements: MASTER_ACHIEVEMENTS,
      discoveredLocations: ['genesis_plaza', 'forge'],
      bayanihanHelpCount: 3,
      lastDailyReset: new Date().toISOString().slice(0, 10),
      classAbilityLastUsed: 0,
      statsAllocatedTotal: 0,
      usernameChangeUsed: false,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };

    this.saveProfile(profile);
    return profile;
  }

  private static getDefaultProfile(): PlayerProfileState {
    const primaryAttributes: PrimaryAttributes = {
      knowledge: 10,
      coding: 10,
      blockchain: 10,
      creativity: 10,
      problemSolving: 10,
      bayanihan: 10,
    };
    const secondaryAttributes = this.calculateSecondaryAttributes(primaryAttributes, 1, []);

    return {
      version: 2,
      username: 'Janus',
      level: 1,
      rank: 'Tuklas',
      playerClass: 'builder',
      currentExp: 0,
      expToNextLevel: 100,
      totalCumulativeExp: 0,
      unallocatedStatPoints: 3,
      skillPoints: 1,
      primaryAttributes,
      secondaryAttributes,
      unlockedSkillIds: ['tech_syntax_apprentice'],
      activeQuests: MASTER_QUESTS,
      achievements: MASTER_ACHIEVEMENTS,
      discoveredLocations: ['genesis_plaza'],
      bayanihanHelpCount: 0,
      lastDailyReset: new Date().toISOString().slice(0, 10),
      classAbilityLastUsed: 0,
      statsAllocatedTotal: 0,
      usernameChangeUsed: false,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
    };
  }

  /**
   * Saves player profile to localStorage, syncs legacy keys for compatibility,
   * and fires window CustomEvents.
   */
  public static saveProfile(profile: PlayerProfileState) {
    if (typeof window === 'undefined') return;

    // Recalculate secondary attributes and rank
    profile.rank = getRankForLevel(profile.level).tier;
    profile.secondaryAttributes = this.calculateSecondaryAttributes(
      profile.primaryAttributes,
      profile.level,
      profile.unlockedSkillIds
    );

    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(profile));
    localStorage.setItem('piso_student_xp', String(profile.totalCumulativeExp));

    // Sync legacy piso_player_stats_v1 key so existing combat/mining code remains 100% functional
    try {
      const legacyRaw = localStorage.getItem(LEGACY_STATS_KEY);
      const legacy = legacyRaw ? JSON.parse(legacyRaw) : {};
      const updatedLegacy = {
        ...legacy,
        level: profile.level,
        currentExp: profile.currentExp,
        expToNextLevel: profile.expToNextLevel,
        unallocatedPoints: profile.unallocatedStatPoints,
        currentHp: profile.secondaryAttributes.hp,
        maxHp: profile.secondaryAttributes.maxHp,
      };
      localStorage.setItem(LEGACY_STATS_KEY, JSON.stringify(updatedLegacy));
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-player-profile-updated', { detail: { profile } })
    );
  }

  /**
   * Strictly enforces that a username can ONLY be changed ONCE per account.
   */
  public static changeUsername(newUsername: string): { success: boolean; message: string } {
    const profile = this.getProfile();

    if (profile.usernameChangeUsed) {
      return {
        success: false,
        message: '🔒 Hindi na maaaring palitan ang username. Isang beses lamang ito pinapayagan kada account.',
      };
    }

    const trimmed = newUsername.trim();
    if (trimmed.length < 3 || trimmed.length > 20) {
      return {
        success: false,
        message: 'Ang username ay dapat nasa pagitan ng 3 hanggang 20 character.',
      };
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return {
        success: false,
        message: 'Maaari lamang maglaman ng mga titik, numero, gitling (-), at underscore (_).',
      };
    }

    const reserved = ['admin', 'administrator', 'system', 'piso', 'root', 'gm', 'moderator', 'support', 'staff', 'null', 'undefined', 'bot'];
    if (reserved.includes(trimmed.toLowerCase())) {
      return {
        success: false,
        message: 'Ang username na ito ay nakareserba sa system. Pumili ng ibang pangalan.',
      };
    }

    const oldName = profile.username;
    profile.username = trimmed;
    profile.usernameChangeUsed = true;
    profile.usernameChangedAt = Date.now();

    this.saveProfile(profile);

    // Record Security Event via custom event to avoid circular dependencies
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('piso-username-changed', {
          detail: { oldUsername: oldName, newUsername: trimmed, timestamp: Date.now() },
        })
      );
    }

    return {
      success: true,
      message: `✨ Matagumpay na napalitan ang iyong username sa "${trimmed}"! Permanenteng nakakandado na ito.`,
    };
  }

  public static savePlayerPosition(pos: { x: number; y: number; z: number; heading?: number; zone?: string }) {
    const profile = this.getProfile();
    profile.savedPosition = pos;
    this.saveProfile(profile);
  }

  public static savePlayerControls(controls: any) {
    const profile = this.getProfile();
    profile.savedControls = controls;
    this.saveProfile(profile);
  }

  /**
   * Allocates an available attribute point into one of the 6 primary attributes.
   */
  public static allocateAttributePoint(attribute: PrimaryAttributeKey): boolean {
    const profile = this.getProfile();
    if (profile.unallocatedStatPoints <= 0) return false;

    profile.unallocatedStatPoints -= 1;
    profile.primaryAttributes[attribute] += 1;
    profile.statsAllocatedTotal = (profile.statsAllocatedTotal || 0) + 1;

    this.saveProfile(profile);

    try {
      SoundFX.playClick();
    } catch {}

    this.emitStatGainToast(attribute, 1, 'Stat Point Allocation');
    this.checkAchievements(profile);

    return true;
  }

  /**
   * Changes or switches player class.
   */
  public static setPlayerClass(classId: PlayerClassId): boolean {
    const profile = this.getProfile();
    if (profile.playerClass === classId) return true;

    profile.playerClass = classId;
    this.saveProfile(profile);

    try {
      SoundFX.playSuccess();
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-player-class-changed', { detail: { playerClass: classId } })
    );
    return true;
  }

  /**
   * Sets or updates player display username.
   */
  public static setPlayerUsername(username: string): boolean {
    const profile = this.getProfile();
    profile.username = username;
    this.saveProfile(profile);
    return true;
  }

  /**
   * Activates the player's class special ability.
   */
  public static activateClassAbility(): {
    success: boolean;
    message: string;
    cooldownRemaining?: number;
  } {
    const profile = this.getProfile();
    const classDef = PLAYER_CLASSES[profile.playerClass] || PLAYER_CLASSES.builder;
    const now = Date.now();
    const cdMs = classDef.specialAbilityCooldownSec * 1000;
    const timeSinceLast = now - (profile.classAbilityLastUsed || 0);

    if (timeSinceLast < cdMs) {
      const remainingSec = Math.ceil((cdMs - timeSinceLast) / 1000);
      try {
        SoundFX.playCooldownBuzz();
      } catch {}
      return {
        success: false,
        message: `⏳ ${classDef.specialAbilityName} on Cooldown (${remainingSec}s remaining)`,
        cooldownRemaining: remainingSec,
      };
    }

    profile.classAbilityLastUsed = now;
    this.saveProfile(profile);

    try {
      SoundFX.playLaser();
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-class-ability-activated', {
        detail: {
          classId: profile.playerClass,
          abilityName: classDef.specialAbilityName,
        },
      })
    );

    return {
      success: true,
      message: `⚡ ${classDef.specialAbilityName} Activated! ${classDef.specialAbilityDesc}`,
    };
  }

  /**
   * Unlocks a skill node in the skill tree by spending Skill Points (SP).
   */
  public static unlockSkill(skillId: string): { success: boolean; message: string } {
    const profile = this.getProfile();
    const node = SKILL_TREE_NODES.find((s) => s.id === skillId);

    if (!node) return { success: false, message: 'Skill not found' };
    if (profile.unlockedSkillIds.includes(skillId)) {
      return { success: false, message: 'Skill already unlocked' };
    }
    if (profile.skillPoints < node.spCost) {
      return {
        success: false,
        message: `Not enough Skill Points. Requires ${node.spCost} SP (You have ${profile.skillPoints} SP).`,
      };
    }
    if (profile.level < node.requiredLevel) {
      return {
        success: false,
        message: `Level requirement not met. Requires Level ${node.requiredLevel}.`,
      };
    }

    // Check prerequisites
    for (const prereqId of node.prerequisites) {
      if (!profile.unlockedSkillIds.includes(prereqId)) {
        const reqNode = SKILL_TREE_NODES.find((s) => s.id === prereqId);
        return {
          success: false,
          message: `Missing prerequisite: ${reqNode?.name || prereqId}.`,
        };
      }
    }

    // Spend SP and unlock
    profile.skillPoints -= node.spCost;
    profile.unlockedSkillIds.push(skillId);

    // Apply immediate attribute bonuses if present
    if (node.attributeBonus) {
      for (const [k, v] of Object.entries(node.attributeBonus)) {
        const key = k as PrimaryAttributeKey;
        if (typeof v === 'number') {
          profile.primaryAttributes[key] += v;
          this.emitStatGainToast(key, v, node.name);
        }
      }
    }

    this.saveProfile(profile);

    try {
      SoundFX.playSuccess();
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-skill-unlocked', { detail: { skill: node, profile } })
    );

    this.checkAchievements(profile);

    return {
      success: true,
      message: `🎉 Skill Unlocked: ${node.name}! ${node.specialPerk || ''}`,
    };
  }

  /**
   * Awards general EXP and checks for level-ups.
   */
  public static addExp(amount: number, source: string = 'General'): {
    leveledUp: boolean;
    newLevel: number;
    levelsGained: number;
  } {
    const profile = this.getProfile();
    profile.currentExp += amount;
    profile.totalCumulativeExp += amount;

    let levelsGained = 0;
    while (profile.currentExp >= profile.expToNextLevel) {
      profile.currentExp -= profile.expToNextLevel;
      profile.level += 1;
      levelsGained += 1;
      profile.unallocatedStatPoints += 3; // +3 stat points per level
      profile.skillPoints += 1;           // +1 skill point per level
      profile.expToNextLevel = this.calculateExpRequired(profile.level);
    }

    if (levelsGained > 0) {
      profile.rank = getRankForLevel(profile.level).tier;
      this.saveProfile(profile);

      try {
        SoundFX.playLevelUp();
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('piso-level-up', {
            detail: {
              newLevel: profile.level,
              levelsGained,
              rank: profile.rank,
              unallocatedPoints: profile.unallocatedStatPoints,
              skillPoints: profile.skillPoints,
            },
          })
        );
      }
    } else {
      this.saveProfile(profile);
    }

    this.emitStatGainToast('xp', amount, source);
    this.checkAchievements(profile);

    return {
      leveledUp: levelsGained > 0,
      newLevel: profile.level,
      levelsGained,
    };
  }

  /**
   * Action-oriented XP & Attribute Awarder.
   * Centralizes progression gains from all gameplay activities.
   */
  public static awardAction(
    action:
      | 'complete_lesson'
      | 'pass_quiz'
      | 'complete_challenge'
      | 'deploy_contract'
      | 'mine_block'
      | 'kill_monster'
      | 'kill_boss'
      | 'help_player'
      | 'discover_location'
      | 'build_project'
      | 'community_tip',
    detail?: any
  ) {
    const profile = this.getProfile();

    switch (action) {
      case 'complete_lesson':
        profile.primaryAttributes.knowledge += 2;
        this.emitStatGainToast('knowledge', 2, 'Lesson Completed');
        this.recordQuestProgress('acad_first_lesson', 1);
        this.addExp(75, 'Lesson Complete');
        break;

      case 'pass_quiz':
        profile.primaryAttributes.knowledge += 3;
        profile.primaryAttributes.problemSolving += 1;
        this.emitStatGainToast('knowledge', 3, 'Quiz Mastered');
        this.emitStatGainToast('problemSolving', 1, 'Quiz Mastered');
        this.recordQuestProgress('acad_quiz_ace', 1);
        this.addExp(50, 'Quiz Passed');
        break;

      case 'complete_challenge':
        profile.primaryAttributes.coding += 4;
        profile.primaryAttributes.problemSolving += 2;
        this.emitStatGainToast('coding', 4, 'Solidity Challenge');
        this.emitStatGainToast('problemSolving', 2, 'Solidity Challenge');
        this.recordQuestProgress('dev_first_compile', 1);
        this.recordQuestProgress('dev_pass_reentrancy', 1);
        this.addExp(150, 'Challenge Solved');
        break;

      case 'deploy_contract':
        profile.primaryAttributes.blockchain += 5;
        profile.primaryAttributes.coding += 3;
        this.emitStatGainToast('blockchain', 5, 'Contract Deployed');
        this.recordQuestProgress('dev_deploy_contract_live', 1);
        this.addExp(250, 'PISO Devnet Deploy');
        break;

      case 'mine_block':
        profile.primaryAttributes.creativity += 1;
        this.recordQuestProgress('daily_mine_three_blocks', 1);
        this.addExp(detail?.expAward || 25, 'Ore Mined');
        break;

      case 'kill_monster':
        profile.primaryAttributes.problemSolving += 1;
        this.recordQuestProgress('daily_slay_three_creatures', 1);
        this.recordQuestProgress('main_sovereign_defense', 1);
        this.addExp(detail?.expReward || 40, 'Beast Defeated');
        break;

      case 'kill_boss':
        profile.primaryAttributes.problemSolving += 8;
        profile.primaryAttributes.bayanihan += 5;
        profile.primaryAttributes.coding += 3;
        this.emitStatGainToast('problemSolving', 8, 'Titan Slayed');
        this.emitStatGainToast('bayanihan', 5, 'Titan Slayed');
        this.recordQuestProgress('boss_giga_buwaya_slayer', 1);
        this.addExp(detail?.expReward || 500, 'Giga Buwaya Boss');
        break;

      case 'help_player':
        profile.primaryAttributes.bayanihan += 4;
        profile.bayanihanHelpCount = (profile.bayanihanHelpCount || 0) + 1;
        this.emitStatGainToast('bayanihan', 4, 'Peer Assisted');
        this.recordQuestProgress('com_chat_first_message', 1);
        this.addExp(50, 'Bayanihan Assist');
        break;

      case 'discover_location':
        if (detail?.locationId && !profile.discoveredLocations.includes(detail.locationId)) {
          profile.discoveredLocations.push(detail.locationId);
          profile.primaryAttributes.creativity += 2;
          profile.primaryAttributes.problemSolving += 2;
          this.emitStatGainToast('creativity', 2, 'New District Discovered');
          this.recordQuestProgress('exp_visit_five_districts', 1);
          this.addExp(100, 'District Discovered');
        }
        break;

      case 'build_project':
        profile.primaryAttributes.coding += 4;
        profile.primaryAttributes.creativity += 4;
        this.emitStatGainToast('coding', 4, 'Structure Built');
        this.emitStatGainToast('creativity', 4, 'Structure Built');
        this.addExp(200, 'Creative Build');
        break;

      case 'community_tip':
        profile.primaryAttributes.bayanihan += 8;
        this.emitStatGainToast('bayanihan', 8, 'Bayanihan Tip Sent');
        this.recordQuestProgress('com_send_peer_tip', 1);
        this.addExp(250, 'Peer Tip Gift');
        break;
    }

    this.saveProfile(profile);
    this.checkAchievements(profile);
  }

  /**
   * Records progress on a quest by ID.
   */
  public static recordQuestProgress(questId: string, amount: number = 1) {
    const profile = this.getProfile();
    let updated = false;

    profile.activeQuests = profile.activeQuests.map((q) => {
      if (q.id === questId && !q.completed) {
        const nextProg = Math.min(q.target, q.progress + amount);
        const isNowCompleted = nextProg >= q.target;
        updated = true;
        if (isNowCompleted) {
          try {
            SoundFX.playSuccess();
          } catch {}
          window.dispatchEvent(
            new CustomEvent('piso-quest-ready-to-claim', { detail: { quest: q } })
          );
        }
        return {
          ...q,
          progress: nextProg,
          completed: isNowCompleted,
        };
      }
      return q;
    });

    if (updated) {
      this.saveProfile(profile);
    }
  }

  /**
   * Claims rewards for a completed quest.
   */
  public static claimQuestReward(questId: string): {
    success: boolean;
    xpGained: number;
    spGained: number;
    message: string;
  } {
    const profile = this.getProfile();
    const quest = profile.activeQuests.find((q) => q.id === questId);

    if (!quest) return { success: false, xpGained: 0, spGained: 0, message: 'Quest not found' };
    if (!quest.completed) return { success: false, xpGained: 0, spGained: 0, message: 'Quest not completed yet' };
    if (quest.claimed) return { success: false, xpGained: 0, spGained: 0, message: 'Quest already claimed' };

    quest.claimed = true;

    // Grant XP
    this.addExp(quest.xpReward, `Quest: ${quest.title}`);

    // Grant SP if any
    const spReward = quest.spReward || 0;
    if (spReward > 0) {
      profile.skillPoints += spReward;
      this.emitStatGainToast('sp', spReward, quest.title);
    }

    // Grant Stat Rewards if any
    if (quest.statRewards) {
      for (const [k, v] of Object.entries(quest.statRewards)) {
        const key = k as PrimaryAttributeKey;
        if (typeof v === 'number') {
          profile.primaryAttributes[key] += v;
          this.emitStatGainToast(key, v, quest.title);
        }
      }
    }

    // Grant PISO Token Reward if any
    if (quest.pisoReward && quest.pisoReward > 0) {
      PisoEconomyService.recordActivityReward(quest.pisoReward, `Quest: ${quest.title}`);
    }

    this.saveProfile(profile);

    try {
      SoundFX.playQuestComplete();
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-quest-claimed', { detail: { quest } })
    );

    return {
      success: true,
      xpGained: quest.xpReward,
      spGained: spReward,
      message: `🎉 Quest Claimed: "${quest.title}"! +${quest.xpReward} XP${spReward > 0 ? ` +${spReward} SP` : ''}!`,
    };
  }

  /**
   * Evaluates and updates achievements against the player profile.
   */
  public static checkAchievements(profile: PlayerProfileState) {
    let unlockedAny = false;

    profile.achievements = profile.achievements.map((ach) => {
      if (ach.unlocked) return ach;

      let currentVal = 0;
      switch (ach.id) {
        case 'ach_first_step':
        case 'ach_scholar_five':
        case 'ach_academic_legend':
          currentVal = Math.floor((profile.primaryAttributes.knowledge - 10) / 2);
          break;
        case 'ach_first_build':
        case 'ach_smart_contractor':
        case 'ach_ten_builds':
          currentVal = Math.floor((profile.primaryAttributes.coding - 10) / 2);
          break;
        case 'ach_chain_walker':
        case 'ach_crypto_pioneer':
        case 'ach_soulbound_verified':
          currentVal = Math.floor((profile.primaryAttributes.blockchain - 10) / 2);
          break;
        case 'ach_explorer_five':
        case 'ach_explorer_ten':
          currentVal = profile.discoveredLocations?.length || 0;
          break;
        case 'ach_peer_helper':
        case 'ach_bayanihan_twenty_five':
          currentVal = profile.bayanihanHelpCount || 0;
          break;
        case 'ach_first_beast':
        case 'ach_titan_slayer':
          currentVal = Math.floor((profile.primaryAttributes.problemSolving - 10) / 2);
          break;
        case 'ach_datu_rank':
          currentVal = profile.level;
          break;
        case 'ach_alamat_legend':
          currentVal = profile.level;
          break;
      }

      ach.progress = Math.max(ach.progress, currentVal);

      if (ach.progress >= ach.target && !ach.unlocked) {
        ach.unlocked = true;
        ach.unlockedTimestamp = Date.now();
        unlockedAny = true;

        // Award rewards
        this.addExp(ach.xpReward, `Achievement: ${ach.title}`);
        if (ach.spReward) profile.skillPoints += ach.spReward;

        if (ach.statRewards) {
          for (const [k, v] of Object.entries(ach.statRewards)) {
            const key = k as PrimaryAttributeKey;
            if (typeof v === 'number') {
              profile.primaryAttributes[key] += v;
            }
          }
        }

        try {
          SoundFX.playLevelUp();
        } catch {}

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('piso-achievement-unlocked', { detail: { achievement: ach } })
          );
        }
      }

      return ach;
    });

    if (unlockedAny) {
      this.saveProfile(profile);
    }
  }

  /**
   * Fires a custom event for live gameplay feedback toasts.
   */
  private static emitStatGainToast(
    stat: PrimaryAttributeKey | 'digitalPower' | 'sp' | 'xp',
    amount: number,
    source?: string
  ) {
    if (typeof window === 'undefined') return;
    const detail: StatGainEventDetail = { stat, amount, source };
    window.dispatchEvent(new CustomEvent('piso-stat-gain-toast', { detail }));
  }
}
