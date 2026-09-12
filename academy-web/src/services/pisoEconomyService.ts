import { ethers } from 'ethers';
import { PISO_NETWORK, getPisoProvider } from '../pisoConfig';
import { WalletService } from './walletService';

export const PISO_ECONOMY_ADDRESSES = {
  PISOToken: '0x0000000000000000000000000000000000002001',
  PISOFarmingVault: '0x0000000000000000000000000000000000002002',
  PISOItemsRelics: '0x0000000000000000000000000000000000002003',
  PISOWeaponsGears: '0x0000000000000000000000000000000000002004',
  PISOPetsCompanions: '0x0000000000000000000000000000000000002005',
} as const;

export interface OnChainRelic {
  id: number;
  name: string;
  count: number;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
  craftingCostPiso: number;
  buffAprBps: number;
  icon: string;
  description: string;
}

export interface OnChainWeaponGear {
  id: number;
  name: string;
  category: 'WEAPON' | 'ARMOR' | 'SHIELD' | 'ACCESSORY';
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
  attackPower: number;
  defensePower: number;
  enhancementLevel: number; // +0 up to +15
  durability: number;
  icon: string;
}

export interface OnChainPet {
  id: number;
  name: string;
  species: 'RECON_DRONE' | 'PHILIPPINE_AGILA' | 'CYBER_CARABAO' | 'TARSIER_SCOUT' | 'SARIMANOK_CELESTIAL';
  speciesTitle: string;
  level: number;
  xp: number;
  stamina: number; // 0..100
  happiness: number; // 0..100
  buffAprBps: number;
  icon: string;
  isActive: boolean;
}

export interface FarmingStats {
  totalFarmSupply: number; // 100,000,000
  totalHarvested: number;
  userStakedBalance: number;
  userPendingHarvest: number;
  userFarmingApr: number; // e.g. 24.5%
  idleEarnRatePerMinute: number;
}

const STORAGE_KEYS = {
  FARM_STATE: 'piso_economy_farm_state',
  RELICS: 'piso_economy_relics',
  WEAPONS: 'piso_economy_weapons',
  PETS: 'piso_economy_pets',
  ACTIVE_PET: 'piso_economy_active_pet_id',
};

export class PisoEconomyService {
  /**
   * Returns live farming metrics from the 100M pool.
   */
  static getFarmingStats(): FarmingStats {
    const raw = localStorage.getItem(STORAGE_KEYS.FARM_STATE);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    const defaultState: FarmingStats = {
      totalFarmSupply: 100_000_000,
      totalHarvested: 14_850_200,
      userStakedBalance: 500,
      userPendingHarvest: 125.4,
      userFarmingApr: 28.5,
      idleEarnRatePerMinute: 1.5,
    };
    this.saveFarmingStats(defaultState);
    return defaultState;
  }

  static saveFarmingStats(stats: FarmingStats) {
    localStorage.setItem(STORAGE_KEYS.FARM_STATE, JSON.stringify(stats));
  }

  /**
   * Harvests earned rewards from the 100M pool into the player's wallet.
   */
  static harvestRewards(): number {
    const stats = this.getFarmingStats();
    const amount = stats.userPendingHarvest;
    if (amount <= 0) return 0;

    stats.totalHarvested += amount;
    stats.userPendingHarvest = 0;
    this.saveFarmingStats(stats);

    // Broadcast live event for HUD balance updates
    window.dispatchEvent(
      new CustomEvent('piso-harvest-success', { detail: { harvestedAmount: amount } })
    );
    return amount;
  }

  /**
   * Records proof-of-gameplay activity rewards (quests, mining, sparring).
   */
  static recordActivityReward(earnedAmount: number, reason: string): number {
    const stats = this.getFarmingStats();
    stats.userPendingHarvest += earnedAmount;
    this.saveFarmingStats(stats);

    window.dispatchEvent(
      new CustomEvent('piso-activity-earned', { detail: { earnedAmount, reason } })
    );
    return stats.userPendingHarvest;
  }

  /**
   * Cultural Relics catalog (ERC-1155).
   */
  static getRelics(): OnChainRelic[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RELICS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    const defaultRelics: OnChainRelic[] = [
      {
        id: 1,
        name: 'Agimat ni Nardong Dikit',
        count: 1,
        rarity: 'Epic',
        craftingCostPiso: 250,
        buffAprBps: 1500,
        icon: '🧿',
        description: '+25% Ki regeneration & +15% Farming APR boost.',
      },
      {
        id: 2,
        name: 'Tabo of Holy Cleansing',
        count: 1,
        rarity: 'Rare',
        craftingCostPiso: 100,
        buffAprBps: 800,
        icon: '🪣',
        description: 'Empowers Tabo Hydro Surge tidal wave and clears negative debuffs.',
      },
      {
        id: 3,
        name: 'Magic Kaldero Lid Aegis',
        count: 1,
        rarity: 'Epic',
        craftingCostPiso: 200,
        buffAprBps: 1200,
        icon: '🛡️',
        description: '+40% Shield Defense and projectile deflection ring.',
      },
      {
        id: 4,
        name: 'Salakot Solar Hat',
        count: 1,
        rarity: 'Uncommon',
        craftingCostPiso: 75,
        buffAprBps: 500,
        icon: '👒',
        description: 'Absorbs solar energy to reduce skill cooldowns by 10%.',
      },
      {
        id: 5,
        name: 'Good Morning Towel',
        count: 2,
        rarity: 'Common',
        craftingCostPiso: 25,
        buffAprBps: 250,
        icon: '🧣',
        description: '+10 Stamina recovery and collar drape.',
      },
      {
        id: 6,
        name: 'Tsinelas ni Nanay',
        count: 1,
        rarity: 'Rare',
        craftingCostPiso: 120,
        buffAprBps: 750,
        icon: '🩴',
        description: 'Homing aerodynamic discipline slipper (650 Base Damage).',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.RELICS, JSON.stringify(defaultRelics));
    return defaultRelics;
  }

  static craftRelic(id: number): boolean {
    const relics = this.getRelics();
    const relic = relics.find((r) => r.id === id);
    if (!relic) return false;

    relic.count += 1;
    localStorage.setItem(STORAGE_KEYS.RELICS, JSON.stringify(relics));
    return true;
  }

  /**
   * Weapons & Armor Gears catalog (ERC-721).
   */
  static getWeapons(): OnChainWeaponGear[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WEAPONS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    const defaultWeapons: OnChainWeaponGear[] = [
      {
        id: 1,
        name: 'Kampilan Plasma Saber',
        category: 'WEAPON',
        rarity: 'Epic',
        attackPower: 450,
        defensePower: 40,
        enhancementLevel: 3, // +3
        durability: 100,
        icon: '🗡️',
      },
      {
        id: 2,
        name: 'Balisong Neon Dagger',
        category: 'WEAPON',
        rarity: 'Rare',
        attackPower: 280,
        defensePower: 20,
        enhancementLevel: 1, // +1
        durability: 100,
        icon: '🔪',
      },
      {
        id: 3,
        name: 'Barong Cyber Armor',
        category: 'ARMOR',
        rarity: 'Epic',
        attackPower: 25,
        defensePower: 380,
        enhancementLevel: 2, // +2
        durability: 100,
        icon: '🥋',
      },
      {
        id: 4,
        name: 'Maharlika 8-Ray Sun Crown',
        category: 'ACCESSORY',
        rarity: 'Legendary',
        attackPower: 120,
        defensePower: 150,
        enhancementLevel: 5, // +5
        durability: 100,
        icon: '👑',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.WEAPONS, JSON.stringify(defaultWeapons));
    return defaultWeapons;
  }

  /**
   * Upgrades weapon enhancement level from +0 up to +15.
   */
  static upgradeWeapon(id: number): OnChainWeaponGear | null {
    const weapons = this.getWeapons();
    const weapon = weapons.find((w) => w.id === id);
    if (!weapon || weapon.enhancementLevel >= 15) return null;

    weapon.enhancementLevel += 1;
    weapon.attackPower = Math.round(weapon.attackPower * 1.15);
    weapon.defensePower = Math.round(weapon.defensePower * 1.15);

    localStorage.setItem(STORAGE_KEYS.WEAPONS, JSON.stringify(weapons));
    return weapon;
  }

  static forgeWeapon(name: string, category: OnChainWeaponGear['category'], rarity: OnChainWeaponGear['rarity']): OnChainWeaponGear {
    const weapons = this.getWeapons();
    const newId = weapons.length + 1;
    const baseAtk = category === 'WEAPON' ? 200 : 30;
    const baseDef = category === 'ARMOR' ? 180 : 20;

    const newGear: OnChainWeaponGear = {
      id: newId,
      name,
      category,
      rarity,
      attackPower: baseAtk,
      defensePower: baseDef,
      enhancementLevel: 0,
      durability: 100,
      icon: category === 'WEAPON' ? '⚔️' : category === 'ARMOR' ? '🛡️' : '👑',
    };

    weapons.push(newGear);
    localStorage.setItem(STORAGE_KEYS.WEAPONS, JSON.stringify(weapons));
    return newGear;
  }

  /**
   * On-Chain NFT Pets & Companions catalog (ERC-721).
   */
  static getPets(): OnChainPet[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PETS);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }

    const defaultPets: OnChainPet[] = [
      {
        id: 1,
        name: 'Agila Sentinel',
        species: 'PHILIPPINE_AGILA',
        speciesTitle: 'Philippine Eagle Hatchling',
        level: 3,
        xp: 340,
        stamina: 85,
        happiness: 95,
        buffAprBps: 2500, // +25%
        icon: '🦅',
        isActive: true,
      },
      {
        id: 2,
        name: 'Aero Recon Drone',
        species: 'RECON_DRONE',
        speciesTitle: 'Autonomous Recon Drone',
        level: 2,
        xp: 180,
        stamina: 100,
        happiness: 90,
        buffAprBps: 1500, // +15%
        icon: '🛰️',
        isActive: false,
      },
      {
        id: 3,
        name: 'Tamaraw Guardian',
        species: 'CYBER_CARABAO',
        speciesTitle: 'Cyber Carabao Calf',
        level: 1,
        xp: 40,
        stamina: 70,
        happiness: 80,
        buffAprBps: 2000, // +20%
        icon: '🐃',
        isActive: false,
      },
      {
        id: 4,
        name: 'Sarimanok Diwata',
        species: 'SARIMANOK_CELESTIAL',
        speciesTitle: 'Mythical Rainbow Sarimanok',
        level: 4,
        xp: 920,
        stamina: 100,
        happiness: 100,
        buffAprBps: 5000, // +50% Farm Boost!
        icon: '🦚',
        isActive: false,
      },
    ];
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(defaultPets));
    return defaultPets;
  }

  static setActivePet(petId: number) {
    const pets = this.getPets();
    pets.forEach((p) => {
      p.isActive = p.id === petId;
    });
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PET, petId.toString());

    window.dispatchEvent(
      new CustomEvent('piso-pet-changed', { detail: { petId } })
    );
  }

  static feedPet(petId: number): boolean {
    const pets = this.getPets();
    const pet = pets.find((p) => p.id === petId);
    if (!pet) return false;

    pet.stamina = 100;
    pet.happiness = 100;
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));
    return true;
  }

  static trainPet(petId: number): boolean {
    const pets = this.getPets();
    const pet = pets.find((p) => p.id === petId);
    if (!pet || pet.stamina < 20) return false;

    pet.stamina -= 20;
    pet.xp += 100;
    if (pet.xp >= pet.level * 250) {
      pet.level += 1;
      pet.buffAprBps += 250; // +2.5% boost
    }
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));
    return true;
  }

  static hatchPet(species: OnChainPet['species'], name: string): OnChainPet {
    const pets = this.getPets();
    const newId = pets.length + 1;
    let icon = '🐾';
    let speciesTitle = 'Metaverse Companion';
    let buffBps = 1500;

    if (species === 'PHILIPPINE_AGILA') {
      icon = '🦅';
      speciesTitle = 'Philippine Eagle Hatchling';
      buffBps = 2500;
    } else if (species === 'CYBER_CARABAO') {
      icon = '🐃';
      speciesTitle = 'Cyber Carabao Calf';
      buffBps = 2000;
    } else if (species === 'SARIMANOK_CELESTIAL') {
      icon = '🦚';
      speciesTitle = 'Mythical Rainbow Sarimanok';
      buffBps = 5000;
    } else if (species === 'TARSIER_SCOUT') {
      icon = '🐒';
      speciesTitle = 'Bohol Tarsier Scout';
      buffBps = 1800;
    }

    const newPet: OnChainPet = {
      id: newId,
      name,
      species,
      speciesTitle,
      level: 1,
      xp: 0,
      stamina: 100,
      happiness: 100,
      buffAprBps: buffBps,
      icon,
      isActive: false,
    };

    pets.push(newPet);
    localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(pets));
    return newPet;
  }

  /**
   * Removes a weapon forfeited in PvP Arena.
   */
  static removeWeapon(id: number): boolean {
    const weapons = this.getWeapons();
    const idx = weapons.findIndex((w) => w.id === id);
    if (idx === -1) return false;
    weapons.splice(idx, 1);
    localStorage.setItem(STORAGE_KEYS.WEAPONS, JSON.stringify(weapons));
    window.dispatchEvent(new CustomEvent('piso-weapon-forfeited', { detail: { weaponId: id } }));
    return true;
  }

  /**
   * Awards an opponent's forfeited weapon spoils won in PvP Arena.
   */
  static addWeapon(weapon: OnChainWeaponGear): void {
    const weapons = this.getWeapons();
    // Re-index ID if duplicate
    const maxId = weapons.reduce((max, w) => Math.max(max, w.id), 0);
    const newWeapon = { ...weapon, id: maxId + 1 };
    weapons.push(newWeapon);
    localStorage.setItem(STORAGE_KEYS.WEAPONS, JSON.stringify(weapons));
    window.dispatchEvent(new CustomEvent('piso-weapon-won', { detail: { weapon: newWeapon } }));
  }

  /**
   * Adjusts relic count (decreases when forfeited, increases when won).
   */
  static adjustRelicCount(id: number, delta: number): boolean {
    const relics = this.getRelics();
    const relic = relics.find((r) => r.id === id);
    if (!relic) return false;
    relic.count = Math.max(0, relic.count + delta);
    localStorage.setItem(STORAGE_KEYS.RELICS, JSON.stringify(relics));
    window.dispatchEvent(new CustomEvent('piso-relic-updated', { detail: { relicId: id, newCount: relic.count } }));
    return true;
  }

  /**
   * Awards a new relic from PvP spoils.
   */
  static addRelic(relic: OnChainRelic): void {
    const relics = this.getRelics();
    const existing = relics.find((r) => r.name === relic.name);
    if (existing) {
      existing.count += relic.count || 1;
    } else {
      const maxId = relics.reduce((max, r) => Math.max(max, r.id), 0);
      relics.push({ ...relic, id: maxId + 1 });
    }
    localStorage.setItem(STORAGE_KEYS.RELICS, JSON.stringify(relics));
    window.dispatchEvent(new CustomEvent('piso-relic-updated', { detail: { relic } }));
  }

  /**
   * Deducts tokens forfeited in PvP duel.
   */
  static deductActivityReward(amount: number): boolean {
    const stats = this.getFarmingStats();
    if (stats.userPendingHarvest < amount) {
      if (stats.totalHarvested < amount) return false;
      stats.totalHarvested -= amount;
    } else {
      stats.userPendingHarvest -= amount;
    }
    this.saveFarmingStats(stats);
    window.dispatchEvent(new CustomEvent('piso-tokens-deducted', { detail: { amount } }));
    return true;
  }
}

