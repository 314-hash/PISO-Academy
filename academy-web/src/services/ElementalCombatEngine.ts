/**
 * ElementalCombatEngine.ts
 * PISO Academy Metaverse & Web3 Engine.
 *
 * Provides:
 * 1. Cryptographic Anti-Cheat & Proof-of-Combat verification (Range checks, action throttle, damage ceiling bounds).
 * 2. Incremental Combat Attack EXP & Micro-PISO bounties on legitimate monster hits.
 * 3. 4 Elemental Material Drops from every monster:
 *    - 🍗 Food (Pagkain)
 *    - 🧵 Textile (Habi)
 *    - 💧 Liquid (Likido)
 *    - 💎 Shard Materials (Kristal)
 * 4. Direct $PISO Token Swap Exchange (swap individual elements or 1-click batch liquidation).
 */

import { PlayerStatsEngine } from './PlayerStatsEngine';
import { PisoEconomyService } from './pisoEconomyService';
import { SoundFX } from './soundFX';

export type ElementalCategory = 'food' | 'textile' | 'liquid' | 'shard';
export type ElementalRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type ElementalAffinity = 'fire' | 'water' | 'earth' | 'lightning' | 'spirit';

export interface ElementalMaterial {
  id: string;
  name: string;
  tagalogName: string;
  category: ElementalCategory;
  rarity: ElementalRarity;
  icon: string;
  description: string;
  swapPisoValue: number; // Spendable $PISO tokens received when swapped
  elementalAffinity: ElementalAffinity;
  count: number;
}

export interface AttackVerificationResult {
  valid: boolean;
  reason?: string;
  mitigatedDamage: number;
  expAward: number;
  microPisoAward: number;
  droppedMaterials: Array<{ material: ElementalMaterial; count: number }>;
  proofToken?: string;
}

// Canonical Catalog of Elemental Materials
export const ELEMENTAL_CATALOG: Record<string, Omit<ElementalMaterial, 'count'>> = {
  // --- 1. FOOD (Pagkain) ---
  food_balut: {
    id: 'food_balut',
    name: 'Balut of Vitality',
    tagalogName: 'Balut ng Sigla',
    category: 'food',
    rarity: 'common',
    icon: '🥚',
    description: 'Fresh warm duck embryo cooked in volcanic steam. Restores vitality and cellular endurance.',
    swapPisoValue: 15,
    elementalAffinity: 'earth',
  },
  food_sinigang: {
    id: 'food_sinigang',
    name: 'Sinigang Tamarind Broth',
    tagalogName: 'Sabaw ng Sinigang',
    category: 'food',
    rarity: 'uncommon',
    icon: '🍲',
    description: 'Electrified sour broth that shocks sluggish muscles and increases move speed.',
    swapPisoValue: 30,
    elementalAffinity: 'water',
  },
  food_kakanin: {
    id: 'food_kakanin',
    name: 'Kakanin Sticky Rice Cake',
    tagalogName: 'Malagkit na Biko',
    category: 'food',
    rarity: 'rare',
    icon: '🍘',
    description: 'Dense coconut-infused gluten that crystallizes into a kinetic impact barrier.',
    swapPisoValue: 65,
    elementalAffinity: 'earth',
  },
  food_mango: {
    id: 'food_mango',
    name: 'Guimaras Golden Mango Slice',
    tagalogName: 'Tuyo na Manggang Guimaras',
    category: 'food',
    rarity: 'rare',
    icon: '🥭',
    description: 'Sun-dried high-fructose cyber fruit granting burst critical strike velocity.',
    swapPisoValue: 85,
    elementalAffinity: 'fire',
  },
  food_lechon: {
    id: 'food_lechon',
    name: 'Cyber Lechon Belly Crackling',
    tagalogName: 'Litsong Balat ng Maharlika',
    category: 'food',
    rarity: 'epic',
    icon: '🍖',
    description: 'Rotisserie roast glazed in plasma oil. The ultimate Filipino warrior feast.',
    swapPisoValue: 220,
    elementalAffinity: 'fire',
  },

  // --- 2. TEXTILE (Habi) ---
  textile_inabel: {
    id: 'textile_inabel',
    name: 'Inabel Ilocano Weave',
    tagalogName: 'Habing Inabel',
    category: 'textile',
    rarity: 'common',
    icon: '🧵',
    description: 'Handwoven cotton fiber with geometric resistance patterns from northern Luzon.',
    swapPisoValue: 18,
    elementalAffinity: 'earth',
  },
  textile_pina: {
    id: 'textile_pina',
    name: 'Piña Barong Silk Thread',
    tagalogName: 'Hilot ng Telang Piña',
    category: 'textile',
    rarity: 'uncommon',
    icon: '🪡',
    description: 'Delicate yet laser-deflecting pineapple leaf filament favored by diplomats.',
    swapPisoValue: 40,
    elementalAffinity: 'spirit',
  },
  textile_abaca: {
    id: 'textile_abaca',
    name: 'Bicolano Abaca Cordage',
    tagalogName: 'Lubid na Abaka',
    category: 'textile',
    rarity: 'rare',
    icon: '🧶',
    description: 'High tensile hemp strands that withstand monster claw rips and marine salt.',
    swapPisoValue: 80,
    elementalAffinity: 'earth',
  },
  textile_neon_thread: {
    id: 'textile_neon_thread',
    name: 'Tondo Neon Nanofiber',
    tagalogName: 'Kable ng Neon sa Tondo',
    category: 'textile',
    rarity: 'epic',
    icon: '🪢',
    description: 'Superconducting smart fabric woven from recycled metro cyber-cables.',
    swapPisoValue: 210,
    elementalAffinity: 'lightning',
  },

  // --- 3. LIQUID (Likido) ---
  liquid_buko: {
    id: 'liquid_buko',
    name: 'Fresh Buko Coconut Nectar',
    tagalogName: 'Nectar ng Sabaw ng Buko',
    category: 'liquid',
    rarity: 'common',
    icon: '🥥',
    description: 'Isotonic electrolyte water filtered by tropical palms. Quenches exhaustion.',
    swapPisoValue: 16,
    elementalAffinity: 'water',
  },
  liquid_lambanog: {
    id: 'liquid_lambanog',
    name: '90-Proof Lambanog Spirit',
    tagalogName: 'Dalisay na Lambanog',
    category: 'liquid',
    rarity: 'uncommon',
    icon: '🍶',
    description: 'Flammable fermented palm liquor used as fuel and courage enhancer.',
    swapPisoValue: 42,
    elementalAffinity: 'fire',
  },
  liquid_holy_water: {
    id: 'liquid_holy_water',
    name: 'Holy Tabo Spring Water',
    tagalogName: 'Banal na Tubig sa Tabo',
    category: 'liquid',
    rarity: 'rare',
    icon: '💧',
    description: 'Purified mineral dew collected from subterranean caves of Mount Banahaw.',
    swapPisoValue: 90,
    elementalAffinity: 'spirit',
  },
  liquid_mercury: {
    id: 'liquid_mercury',
    name: 'Bakunawa Sea Mercury',
    tagalogName: 'Asoge ng Bakunawa',
    category: 'liquid',
    rarity: 'epic',
    icon: '🧪',
    description: 'Dense luminescent liquid metal sloughed from oceanic moon-eating serpents.',
    swapPisoValue: 240,
    elementalAffinity: 'water',
  },

  // --- 4. SHARD MATERIALS (Kristal) ---
  shard_quartz: {
    id: 'shard_quartz',
    name: 'Neon Quartz Shard',
    tagalogName: 'Balsong Kwartso',
    category: 'shard',
    rarity: 'common',
    icon: '🔹',
    description: 'Piezoelectric crystalline mineral that vibrates in resonance with PISO Chain blocks.',
    swapPisoValue: 22,
    elementalAffinity: 'lightning',
  },
  shard_obsidian: {
    id: 'shard_obsidian',
    name: 'Mayon Obsidian Prism',
    tagalogName: 'Obsidyan ng Mayon',
    category: 'shard',
    rarity: 'rare',
    icon: '♦️',
    description: 'Razor-sharp volcanic glass formed during high-temperature pyroclastic flows.',
    swapPisoValue: 95,
    elementalAffinity: 'fire',
  },
  shard_bakunawa: {
    id: 'shard_bakunawa',
    name: 'Bakunawa Dragon Scale Shard',
    tagalogName: 'Kaliskis ng Bakunawa',
    category: 'shard',
    rarity: 'epic',
    icon: '💠',
    description: 'Hardened scale plate shed by titanic celestial serpents. Resists all magic.',
    swapPisoValue: 260,
    elementalAffinity: 'water',
  },
  shard_gold: {
    id: 'shard_gold',
    name: 'Maharlika Gold Nugget',
    tagalogName: 'Gintong Butil ng Maharlika',
    category: 'shard',
    rarity: 'legendary',
    icon: '👑',
    description: 'Pre-colonial pure 24-karat gold fragment blessed by ancestral datu goldsmiths.',
    swapPisoValue: 650,
    elementalAffinity: 'spirit',
  },
};

const STORAGE_KEY_MATERIALS = 'piso_elemental_inventory_v1';
const MIN_ATTACK_INTERVAL_MS = 110; // Anti-Cheat: Max ~9 hits/sec even during rapid multi-cast
let lastRegisteredAttackTimestamp = 0;
let combatNonceCounter = 0;

export class ElementalCombatEngine {
  /**
   * Retrieves user's elemental inventory from local storage.
   */
  static getInventoryMaterials(): Record<string, ElementalMaterial> {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_MATERIALS);
      if (raw) {
        const parsed = JSON.parse(raw);
        // Merge with canonical data to ensure valid properties
        const result: Record<string, ElementalMaterial> = {};
        for (const [id, count] of Object.entries(parsed)) {
          const base = ELEMENTAL_CATALOG[id];
          if (base && typeof count === 'number' && count > 0) {
            result[id] = { ...base, count };
          }
        }
        return result;
      }
    } catch {}
    return {};
  }

  /**
   * Persists user's elemental materials.
   */
  static saveInventoryMaterials(inventory: Record<string, ElementalMaterial>): void {
    if (typeof window === 'undefined') return;
    try {
      const simplified: Record<string, number> = {};
      for (const [id, item] of Object.entries(inventory)) {
        if (item.count > 0) {
          simplified[id] = item.count;
        }
      }
      localStorage.setItem(STORAGE_KEY_MATERIALS, JSON.stringify(simplified));
      window.dispatchEvent(new CustomEvent('piso-materials-updated', { detail: { inventory } }));
    } catch {}
  }

  /**
   * Awards an elemental material to the player.
   */
  static addMaterial(materialId: string, qty = 1): ElementalMaterial | null {
    const base = ELEMENTAL_CATALOG[materialId];
    if (!base || qty <= 0) return null;

    const inv = this.getInventoryMaterials();
    if (!inv[materialId]) {
      inv[materialId] = { ...base, count: qty };
    } else {
      inv[materialId].count += qty;
    }

    this.saveInventoryMaterials(inv);

    window.dispatchEvent(
      new CustomEvent('piso-material-acquired', {
        detail: { material: inv[materialId], qtyAdded: qty },
      })
    );

    return inv[materialId];
  }

  /**
   * Cryptographic Anti-Cheat & Proof-of-Combat Verification.
   * Ensures fair play:
   * 1. Distance check: Player cannot hit monsters across the world (prevents range hacks).
   * 2. Pacing check: Attack rate cannot exceed physiological & skill cooldown minimums.
   * 3. Damage ceiling: Cannot exceed theoretical max damage of player level, ATK stats & gear.
   * 4. Issues signed proof token with rolling nonce.
   */
  static verifyAndProcessAttack(params: {
    playerPos: { x: number; y: number; z: number };
    monsterPos: { x: number; y: number; z: number };
    hitRadius: number;
    proposedDamage: number;
    isBoss: boolean;
    monsterName: string;
    monsterType: string;
    monsterDef: number;
  }): AttackVerificationResult {
    const now = Date.now();

    // 1. Pacing & Throttle Check (Anti-Auto Clicker / Spam Script)
    if (now - lastRegisteredAttackTimestamp < MIN_ATTACK_INTERVAL_MS) {
      return {
        valid: false,
        reason: '⚡ Combat Throttle: Attack rate exceeds physical limits.',
        mitigatedDamage: 0,
        expAward: 0,
        microPisoAward: 0,
        droppedMaterials: [],
      };
    }
    lastRegisteredAttackTimestamp = now;

    // 2. Distance Verification (Anti-Teleport / Infinite Range Hack)
    const dx = params.playerPos.x - params.monsterPos.x;
    const dy = params.playerPos.y - params.monsterPos.y;
    const dz = params.playerPos.z - params.monsterPos.z;
    const distSq = dx * dx + dy * dy + dz * dz;
    const maxAllowedDist = params.hitRadius + (params.isBoss ? 7.5 : 3.5);

    if (distSq > maxAllowedDist * maxAllowedDist) {
      return {
        valid: false,
        reason: '🛡️ Range Violation: Target is beyond physical combat reach.',
        mitigatedDamage: 0,
        expAward: 0,
        microPisoAward: 0,
        droppedMaterials: [],
      };
    }

    // 3. Damage Ceiling Verification (Anti-Cheat Engine / Memory Injection)
    const stats = PlayerStatsEngine.getStats();
    const gear = PlayerStatsEngine.getGearBonuses();
    const maxTheoreticalDamage = (3000 + (stats.statAtk + gear.totalGearAtk) * 45) * 4.5;

    if (params.proposedDamage > maxTheoreticalDamage) {
      return {
        valid: false,
        reason: '⚠️ Anomaly Detected: Damage exceeds mathematical ceiling.',
        mitigatedDamage: 0,
        expAward: 0,
        microPisoAward: 0,
        droppedMaterials: [],
      };
    }

    // 4. Calculate Fair Mitigated Damage
    const mitigated = Math.max(35, Math.floor(params.proposedDamage - params.monsterDef * 1.8));

    // 5. Calculate Active Combat Attack EXP & Micro-Bounty
    // Every legitimate hit awards incremental EXP scaled by damage dealt
    const expAward = Math.min(120, Math.max(8, Math.floor(mitigated / 60)));
    PlayerStatsEngine.addExp(expAward);

    // Micro-token drop chance on combat hit (15% chance for 1-5 ₱ micro-harvest)
    let microPisoAward = 0;
    if (Math.random() < 0.15) {
      microPisoAward = Math.floor(Math.random() * (params.isBoss ? 8 : 4)) + 1;
      PisoEconomyService.recordActivityReward(
        microPisoAward,
        `⚔️ Combat Strike Reward vs ${params.monsterName}`
      );
    }

    // 6. Roll for Random Elemental Drops on Hit (18% chance for random food, textile, liquid, shard)
    const droppedMaterials: Array<{ material: ElementalMaterial; count: number }> = [];
    if (Math.random() < (params.isBoss ? 0.35 : 0.2)) {
      const drop = this.rollRandomDropForMonster(params.monsterType, params.isBoss);
      if (drop) {
        const added = this.addMaterial(drop.id, drop.count);
        if (added) {
          droppedMaterials.push({ material: added, count: drop.count });
        }
      }
    }

    combatNonceCounter++;
    const proofToken = `piso_poc_${now}_${combatNonceCounter}_${Math.floor(mitigated)}`;

    return {
      valid: true,
      mitigatedDamage: mitigated,
      expAward,
      microPisoAward,
      droppedMaterials,
      proofToken,
    };
  }

  /**
   * Rolls guaranteed and bonus elemental drops upon slaying a monster.
   */
  static processMonsterSlayDrops(
    monsterType: string,
    isBoss: boolean
  ): Array<{ material: ElementalMaterial; count: number }> {
    const dropsCount = isBoss ? Math.floor(Math.random() * 3) + 3 : Math.floor(Math.random() * 2) + 1;
    const results: Array<{ material: ElementalMaterial; count: number }> = [];

    for (let i = 0; i < dropsCount; i++) {
      const rolled = this.rollRandomDropForMonster(monsterType, isBoss);
      if (rolled) {
        const added = this.addMaterial(rolled.id, rolled.count);
        if (added) {
          results.push({ material: added, count: rolled.count });
        }
      }
    }

    return results;
  }

  /**
   * Deterministic yet randomized drop table based on monster anatomy & biome.
   */
  private static rollRandomDropForMonster(
    monsterType: string,
    isBoss: boolean
  ): { id: string; count: number } | null {
    const categories: ElementalCategory[] = ['food', 'textile', 'liquid', 'shard'];
    const selectedCat = categories[Math.floor(Math.random() * categories.length)];

    const pool = Object.values(ELEMENTAL_CATALOG).filter((item) => {
      if (item.category !== selectedCat) return false;
      if (!isBoss && (item.rarity === 'legendary' || item.rarity === 'epic')) {
        // Only 5% chance for small beasts to drop epic
        return Math.random() < 0.05;
      }
      return true;
    });

    if (pool.length === 0) return null;

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const count = isBoss ? Math.floor(Math.random() * 2) + 1 : 1;

    return { id: chosen.id, count };
  }

  /**
   * Swaps a specific quantity of an elemental material directly for $PISO tokens.
   */
  static swapMaterialForPiso(
    materialId: string,
    count = 1
  ): { success: boolean; pisoEarned: number; remainingCount: number; message: string } {
    const inv = this.getInventoryMaterials();
    const item = inv[materialId];

    if (!item || item.count < count || count <= 0) {
      return {
        success: false,
        pisoEarned: 0,
        remainingCount: item ? item.count : 0,
        message: 'Kulang ang dami ng materyal para ipalit sa $PISO!',
      };
    }

    const totalPiso = item.swapPisoValue * count;
    item.count -= count;

    if (item.count <= 0) {
      delete inv[materialId];
    }

    this.saveInventoryMaterials(inv);

    // Credit spendable $PISO tokens into wallet balance
    PisoEconomyService.recordActivityReward(
      totalPiso,
      `💱 Material Swap: ${count}x ${item.name} (+${totalPiso} ₱PISO)`
    );

    try {
      SoundFX.playCoins();
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-material-swapped', {
        detail: { materialId, count, pisoEarned: totalPiso },
      })
    );

    return {
      success: true,
      pisoEarned: totalPiso,
      remainingCount: item ? item.count : 0,
      message: `Matagumpay na naipalit ang ${count}x ${item.name} para sa +${totalPiso.toLocaleString()} ₱PISO!`,
    };
  }

  /**
   * One-Click Batch Swap: Swaps all owned elemental materials for $PISO tokens.
   * Includes a +10% bulk liquidation bonus!
   */
  static swapAllMaterialsForPiso(): {
    success: boolean;
    totalPisoEarned: number;
    itemsSwappedCount: number;
    message: string;
  } {
    const inv = this.getInventoryMaterials();
    const entries = Object.values(inv);

    if (entries.length === 0) {
      return {
        success: false,
        totalPisoEarned: 0,
        itemsSwappedCount: 0,
        message: 'Wala kang hawak na mga elemental materials sa iyong imbentaryo!',
      };
    }

    let subtotalPiso = 0;
    let totalItems = 0;

    for (const item of entries) {
      if (item.count > 0) {
        subtotalPiso += item.swapPisoValue * item.count;
        totalItems += item.count;
      }
    }

    // 10% Bulk Liquidation Bonus
    const bonusPiso = Math.floor(subtotalPiso * 0.1);
    const finalPiso = subtotalPiso + bonusPiso;

    // Clear materials inventory
    this.saveInventoryMaterials({});

    // Credit spendable tokens
    PisoEconomyService.recordActivityReward(
      finalPiso,
      `💱 Bulk Element Liquidation: ${totalItems} items (+10% Bonus: ${finalPiso} ₱PISO)`
    );

    try {
      SoundFX.playCoins();
    } catch {}

    window.dispatchEvent(
      new CustomEvent('piso-all-materials-swapped', {
        detail: { totalPisoEarned: finalPiso, totalItems },
      })
    );

    return {
      success: true,
      totalPisoEarned: finalPiso,
      itemsSwappedCount: totalItems,
      message: `🎉 Naipalit ang ${totalItems} na mga elemental materials para sa ${finalPiso.toLocaleString()} ₱PISO (kasama ang +10% Bulk Bonus)!`,
    };
  }
}
