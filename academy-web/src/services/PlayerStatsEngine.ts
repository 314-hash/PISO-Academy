/**
 * PlayerStatsEngine.ts
 * Manages player progression, level-gating, attributes (ATK, DEF, HP, CRIT),
 * and gear damage scaling for the PISO Metaverse monster hunting economy.
 */

import { PisoEconomyService } from './pisoEconomyService';
import { SoundFX } from './soundFX';
import { PlayerProgressionEngine } from './playerProgressionEngine';

export interface PlayerStats {
  level: number;
  currentExp: number;
  expToNextLevel: number;
  unallocatedPoints: number;
  statAtk: number; // Attack attribute points (+5% base skill DMG per point)
  statDef: number; // Defense attribute points (+3% damage mitigation)
  statHp: number;  // Health attribute points (+100 Max HP per point)
  statCrit: number;// Crit attribute points (+1% Crit chance per point)
  currentHp: number;
  maxHp: number;
  monstersSlain: number;
  titansDefeated: number;
  totalBountiesClaimedPiso: number;
  blocksMinedTotal: number;
  buildsCreated: number;
  totalTipsReceived: number;
}

const STORAGE_KEY = 'piso_player_stats_v1';

export class PlayerStatsEngine {
  /**
   * Deterministic EXP requirement for next level.
   * 100% aligned with smart contracts (PISOMineCraft & PISOMonsterBountyManager):
   * 100 + (lvl - 1) * 150 + ((lvl - 1) ** 2) * 20
   */
  public static calculateExpRequired(lvl: number): number {
    if (lvl <= 1) return 100;
    const n = Math.max(0, lvl - 1);
    return 100 + n * 150 + n * n * 20;
  }

  /**
   * Syncs level state from on-chain smart contracts.
   */
  static syncOnChainLevel(onChainLevel: number, onChainExp?: number) {
    if (!onChainLevel || onChainLevel < 1) return;
    const stats = this.getStats();
    if (onChainLevel > stats.level || (onChainLevel === stats.level && (onChainExp ?? 0) > stats.currentExp)) {
      stats.level = onChainLevel;
      if (typeof onChainExp === 'number') {
        stats.currentExp = onChainExp;
      }
      stats.expToNextLevel = this.calculateExpRequired(stats.level);
      this.saveStats(stats);
    }
  }

  /**
   * Retrieves player stats or initializes default level 1 rookie stats.
   */
  static getStats(): PlayerStats {
    if (typeof window === 'undefined') {
      return this.getDefaultStats();
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        // Ensure all fields exist
        return {
          level: parsed.level || 1,
          currentExp: parsed.currentExp || 0,
          expToNextLevel: parsed.expToNextLevel || this.calculateExpRequired(parsed.level || 1),
          unallocatedPoints: parsed.unallocatedPoints || 0,
          statAtk: parsed.statAtk || 5,
          statDef: parsed.statDef || 5,
          statHp: parsed.statHp || 10,
          statCrit: parsed.statCrit || 5,
          currentHp: parsed.currentHp || 1500,
          maxHp: 1000 + (parsed.statHp || 10) * 100,
          monstersSlain: parsed.monstersSlain || 0,
          titansDefeated: parsed.titansDefeated || 0,
          totalBountiesClaimedPiso: parsed.totalBountiesClaimedPiso || 0,
          blocksMinedTotal: parsed.blocksMinedTotal || 0,
          buildsCreated: parsed.buildsCreated || 0,
          totalTipsReceived: parsed.totalTipsReceived || 0,
        };
      } catch {}
    }

    const initial = this.getDefaultStats();
    this.saveStats(initial);
    return initial;
  }

  private static getDefaultStats(): PlayerStats {
    return {
      level: 1,
      currentExp: 0,
      expToNextLevel: 100,
      unallocatedPoints: 3, // Starter bonus points
      statAtk: 5,
      statDef: 5,
      statHp: 10,
      statCrit: 5,
      currentHp: 2000,
      maxHp: 2000,
      monstersSlain: 0,
      titansDefeated: 0,
      totalBountiesClaimedPiso: 0,
      blocksMinedTotal: 0,
      buildsCreated: 0,
      totalTipsReceived: 0,
    };
  }

  static saveStats(stats: PlayerStats) {
    if (typeof window === 'undefined') return;
    stats.maxHp = 1000 + stats.statHp * 100;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent('piso-player-stats-updated', { detail: stats }));
  }

  /**
   * Awards EXP from slaying monsters. Automatically triggers level ups.
   */
  static addExp(amount: number): { leveledUp: boolean; newLevel: number; levelsGained: number } {
    const stats = this.getStats();
    stats.currentExp += amount;

    // Sync cumulative global student XP
    let totalXp = 0;
    if (typeof window !== 'undefined') {
      try {
        const currentTotal = Number(localStorage.getItem('piso_student_xp')) || 0;
        totalXp = currentTotal + amount;
        localStorage.setItem('piso_student_xp', String(totalXp));
      } catch {}
    }

    let levelsGained = 0;
    while (stats.currentExp >= stats.expToNextLevel) {
      stats.currentExp -= stats.expToNextLevel;
      stats.level += 1;
      levelsGained += 1;
      stats.unallocatedPoints += 3; // +3 stat points per level
      stats.expToNextLevel = this.calculateExpRequired(stats.level);
    }

    if (levelsGained > 0) {
      stats.maxHp = 1000 + stats.statHp * 100;
      stats.currentHp = stats.maxHp; // Full heal on level up
      this.saveStats(stats);

      try {
        SoundFX.playLevelUp?.();
      } catch {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('piso-level-up', {
            detail: {
              newLevel: stats.level,
              levelsGained,
              unallocatedPoints: stats.unallocatedPoints,
            },
          })
        );
      }
    } else {
      this.saveStats(stats);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('piso-exp-gained', {
          detail: {
            amount,
            currentExp: stats.currentExp,
            expToNextLevel: stats.expToNextLevel,
            level: stats.level,
            totalXp,
          },
        })
      );
    }

    return { leveledUp: levelsGained > 0, newLevel: stats.level, levelsGained };
  }

  /**
   * Awards EXP from mining blocks.
   */
  static addMiningExp(blockType: string, expAward: number): { leveledUp: boolean; newLevel: number; levelsGained: number } {
    const stats = this.getStats();
    stats.blocksMinedTotal += 1;
    this.saveStats(stats);

    const result = this.addExp(expAward);

    try {
      PlayerProgressionEngine.awardAction('mine_block', { expAward, blockType });
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-mining-exp', { detail: { blockType, expAward } })
    );

    return result;
  }

  /**
   * Allocates an attribute point into ATK, DEF, HP, or CRIT.
   */
  static allocatePoint(stat: 'statAtk' | 'statDef' | 'statHp' | 'statCrit'): boolean {
    const stats = this.getStats();
    if (stats.unallocatedPoints <= 0) return false;

    stats.unallocatedPoints -= 1;
    stats[stat] += 1;
    if (stat === 'statHp') {
      stats.maxHp = 1000 + stats.statHp * 100;
      stats.currentHp = Math.min(stats.maxHp, stats.currentHp + 100);
    }

    this.saveStats(stats);
    try {
      SoundFX.playClick();
    } catch {}
    return true;
  }

  /**
   * Computes gear and relic bonuses from user inventory.
   * "More items = More damage taken by monsters"
   */
  static getGearBonuses(): {
    totalGearAtk: number;
    totalGearDef: number;
    totalGearBuffApr: number;
    itemCount: number;
  } {
    let totalGearAtk = 0;
    let totalGearDef = 0;
    let totalGearBuffApr = 0;
    let itemCount = 0;

    try {
      const weapons = PisoEconomyService.getWeapons();
      for (const w of weapons) {
        // Enhancement multiplier (+1 = +10%, +3 = +30%, +15 = +150%)
        const enhanceMultiplier = 1 + w.enhancementLevel * 0.1;
        totalGearAtk += Math.floor(w.attackPower * enhanceMultiplier);
        totalGearDef += Math.floor(w.defensePower * enhanceMultiplier);
        itemCount++;
      }

      const relics = PisoEconomyService.getRelics();
      for (const r of relics) {
        if (r.count > 0) {
          totalGearBuffApr += r.buffAprBps;
          // Relics also empower spiritual ATK
          totalGearAtk += r.rarity === 'Epic' ? 120 : r.rarity === 'Rare' ? 60 : 25;
          itemCount += r.count;
        }
      }
    } catch {}

    return { totalGearAtk, totalGearDef, totalGearBuffApr, itemCount };
  }

  /**
   * Calculates final output damage for a given skill base damage.
   * Scales dynamically with Level, ATK Attribute, and Equipped Gears/Relics.
   */
  static calculateDamage(skillBaseDamage: number): {
    finalDamage: number;
    isCrit: boolean;
    multiplier: number;
    gearBonusDamage: number;
  } {
    const stats = this.getStats();
    const { totalGearAtk } = this.getGearBonuses();

    // Base attribute ATK multiplier: +5% per stat point
    const statMultiplier = 1 + (stats.statAtk * 0.05);

    // Gear scaling: every 250 gear ATK adds +100% damage boost
    const gearMultiplier = 1 + (totalGearAtk / 250);

    // Level scaling: +3% per player level
    const levelMultiplier = 1 + (stats.level * 0.03);

    // Crit check
    const critChance = Math.min(75, stats.statCrit * 1.2); // Cap at 75%
    const isCrit = Math.random() * 100 < critChance;
    const critMultiplier = isCrit ? 1.85 : 1.0;

    // Digital Power scaling from learning & Web3 mastery: +0.75% dmg per Digital Power point
    let powerMultiplier = 1.0;
    try {
      const digitalPower = PlayerProgressionEngine.getProfile().secondaryAttributes.digitalPower || 10;
      powerMultiplier = 1 + (Math.max(0, digitalPower - 10) * 0.0075);
    } catch {}

    const combinedMultiplier = statMultiplier * gearMultiplier * levelMultiplier * critMultiplier * powerMultiplier;
    const finalDamage = Math.round(skillBaseDamage * combinedMultiplier);
    const gearBonusDamage = Math.round(skillBaseDamage * (gearMultiplier - 1));

    return {
      finalDamage,
      isCrit,
      multiplier: Number(combinedMultiplier.toFixed(2)),
      gearBonusDamage,
    };
  }

  /**
   * Evaluates the player's educational tier from completed course modules.
   * Connects to PISOVerificationRegistry soulbound rules.
   */
  static getEducationTierInfo(): {
    tier: number;
    tierName: string;
    completedLessonsCount: number;
    dailyTokenCap: number;
    maxKillsPer10Min: number;
    yieldMultiplier: number;
    titanHuntAllowed: boolean;
  } {
    let completedCount = 0;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('piso_completed_lessons');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            completedCount = list.length;
          }
        }
      } catch {}
    }

    if (completedCount >= 10) {
      return {
        tier: 3,
        tierName: 'Sovereign Architect',
        completedLessonsCount: completedCount,
        dailyTokenCap: 50000,
        maxKillsPer10Min: 120,
        yieldMultiplier: 2.0,
        titanHuntAllowed: true,
      };
    } else if (completedCount >= 5) {
      return {
        tier: 2,
        tierName: 'Municipal Dev (Certified)',
        completedLessonsCount: completedCount,
        dailyTokenCap: 10000,
        maxKillsPer10Min: 50,
        yieldMultiplier: 1.5,
        titanHuntAllowed: true,
      };
    } else if (completedCount >= 2) {
      return {
        tier: 1,
        tierName: 'Barangay Scholar',
        completedLessonsCount: completedCount,
        dailyTokenCap: 2500,
        maxKillsPer10Min: 25,
        yieldMultiplier: 1.25,
        titanHuntAllowed: false,
      };
    }

    return {
      tier: 0,
      tierName: 'Novice Explorer',
      completedLessonsCount: completedCount,
      dailyTokenCap: 500,
      maxKillsPer10Min: 10,
      yieldMultiplier: 1.0,
      titanHuntAllowed: false,
    };
  }

  /**
   * Retrieves current farming quota and anti-bot window status.
   */
  static getFarmingQuota(): {
    dailyHarvested: number;
    dailyCap: number;
    killsInWindow: number;
    maxKillsPer10Min: number;
    percentCapUsed: number;
    secondsUntilWindowReset: number;
  } {
    const tierInfo = this.getEducationTierInfo();
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;

    let dailyHarvested = 0;
    let killTimestamps: number[] = [];

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('piso_farm_rate_limit_v1');
        if (raw) {
          const data = JSON.parse(raw);
          if (data.dayStr === todayStr) {
            dailyHarvested = data.dailyHarvested || 0;
          }
          if (Array.isArray(data.killTimestamps)) {
            killTimestamps = data.killTimestamps.filter((ts: number) => now - ts < windowMs);
          }
        }
      } catch {}
    }

    const killsInWindow = killTimestamps.length;
    const percentCapUsed = Math.min(100, Math.round((dailyHarvested / tierInfo.dailyTokenCap) * 100));
    const oldestKill = killTimestamps[0];
    const secondsUntilWindowReset = oldestKill ? Math.max(0, Math.ceil((oldestKill + windowMs - now) / 1000)) : 0;

    return {
      dailyHarvested,
      dailyCap: tierInfo.dailyTokenCap,
      killsInWindow,
      maxKillsPer10Min: tierInfo.maxKillsPer10Min,
      percentCapUsed,
      secondsUntilWindowReset,
    };
  }

  /**
   * Level-Gating Check:
   * Low-level users are NOT allowed to attack big bounty giants until reaching min level (Lv. 20+).
   */
  static canAttackMonster(minPlayerLevel: number): {
    allowed: boolean;
    playerLevel: number;
    requiredLevel: number;
    message?: string;
  } {
    const stats = this.getStats();
    if (stats.level < minPlayerLevel) {
      return {
        allowed: false,
        playerLevel: stats.level,
        requiredLevel: minPlayerLevel,
        message: `🔒 IMMUNE: LEVEL ${minPlayerLevel}+ REQUIRED! (You are Lv. ${stats.level}). Slay smaller farm beasts (Cobras, Vultures, Komodos) to level up first!`,
      };
    }
    return {
      allowed: true,
      playerLevel: stats.level,
      requiredLevel: minPlayerLevel,
    };
  }

  /**
   * Records a slain monster and rewards $PISO from the 70M player pool,
   * subject to Education-Level Rate Limiting & Anti-Bot Quotas.
   */
  static recordMonsterKill(
    monsterName: string,
    isBoss: boolean,
    expReward: number,
    bountyPiso: number
  ) {
    const stats = this.getStats();
    stats.monstersSlain += 1;
    if (isBoss) {
      stats.titansDefeated += 1;
    }

    const tierInfo = this.getEducationTierInfo();
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;

    let dailyHarvested = 0;
    let killTimestamps: number[] = [];

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('piso_farm_rate_limit_v1');
        if (raw) {
          const data = JSON.parse(raw);
          if (data.dayStr === todayStr) {
            dailyHarvested = data.dailyHarvested || 0;
          }
          if (Array.isArray(data.killTimestamps)) {
            killTimestamps = data.killTimestamps.filter((ts: number) => now - ts < windowMs);
          }
        }
      } catch {}
    }

    // Add current kill timestamp
    killTimestamps.push(now);

    let effectiveBounty = 0;
    let rateLimitReason = '';

    // Check anti-bot 10-minute kill limit
    if (killTimestamps.length > tierInfo.maxKillsPer10Min) {
      rateLimitReason = `⚡ Anti-Bot Cooldown: Rate limit exceeded (${tierInfo.maxKillsPer10Min} kills/10m). Graduate to higher tiers to increase limit!`;
    } else if (dailyHarvested >= tierInfo.dailyTokenCap) {
      rateLimitReason = `⚠️ Daily Quota Reached: ${tierInfo.dailyTokenCap} PISO limit reached for ${tierInfo.tierName}. Complete courses to unlock up to 50,000 PISO/day!`;
    } else {
      // Calculate bounty with tier yield multiplier
      const potentialBounty = Math.round(bountyPiso * tierInfo.yieldMultiplier);
      const remainingQuota = tierInfo.dailyTokenCap - dailyHarvested;
      effectiveBounty = Math.min(potentialBounty, remainingQuota);
      dailyHarvested += effectiveBounty;
    }

    // Save updated rate limit record
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'piso_farm_rate_limit_v1',
          JSON.stringify({
            dayStr: todayStr,
            dailyHarvested,
            killTimestamps,
          })
        );
      } catch {}
    }

    stats.totalBountiesClaimedPiso += effectiveBounty;
    this.saveStats(stats);

    // Grant EXP
    this.addExp(expReward);

    try {
      PlayerProgressionEngine.awardAction(isBoss ? 'kill_boss' : 'kill_monster', {
        expReward,
        monsterName,
        isBoss,
      });
    } catch {}

    // Deposit $PISO token reward into pending harvest / wallet if quota permitted
    if (effectiveBounty > 0) {
      PisoEconomyService.recordActivityReward(
        effectiveBounty,
        isBoss ? `🏛️ Giga Buwaya Bounty Tax Return: ${monsterName}` : `⚔️ Monster Farm Bounty: ${monsterName}`
      );
    }

    // Notify user if rate limited
    if (rateLimitReason && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('piso-rate-limit-warning', {
          detail: {
            reason: rateLimitReason,
            tier: tierInfo.tier,
            tierName: tierInfo.tierName,
            dailyHarvested,
            dailyCap: tierInfo.dailyTokenCap,
          },
        })
      );
    }

    if (isBoss) {
      // Trigger Tax Return celebration
      window.dispatchEvent(
        new CustomEvent('piso-tax-return-festival', {
          detail: {
            titanName: monsterName,
            bountyPiso: effectiveBounty,
            expReward,
          },
        })
      );
    }
  }
}
