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
      totalHarvested: 14_850_200,  // Simulated circulated supply after ~3 years
      userStakedBalance: 50,       // Reasonable starting staked balance
      userPendingHarvest: 0.5,     // New player starts with tiny pending
      userFarmingApr: 12.5,        // More realistic APR (not 28.5%)
      idleEarnRatePerMinute: 0.001, // ~0.06 PISO/hr idle earn for novices
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
    this.autoSuitItem(relic.name, 'RELIC');
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
    this.autoSuitItem(newGear.name, newGear.category);
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
    this.autoSuitItem(newWeapon.name, newWeapon.category);
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
    this.autoSuitItem(relic.name, 'RELIC');
    window.dispatchEvent(new CustomEvent('piso-relic-updated', { detail: { relic } }));
  }

  /**
   * Deducts tokens forfeited in PvP duel.
   */
  static deductActivityReward(amount: number): boolean {
    return this.deductPiso(amount, 'PvP Wager / Penalty');
  }

  /**
   * Returns current spendable $PISO tokens (pending harvest + harvested wallet balance).
   */
  static getSpendablePiso(): number {
    const stats = this.getFarmingStats();
    return (stats.userPendingHarvest || 0) + (stats.totalHarvested || 0);
  }

  /**
   * Checks if player has sufficient $PISO balance to make a purchase.
   */
  static hasEnoughPiso(amount: number): boolean {
    return this.getSpendablePiso() >= amount;
  }

  /**
   * Deducts $PISO tokens for block purchases, bundles, or marketplace upgrades.
   */
  static deductPiso(amount: number, reason: string = 'Purchase'): boolean {
    const stats = this.getFarmingStats();
    const totalAvail = (stats.userPendingHarvest || 0) + (stats.totalHarvested || 0);
    if (totalAvail < amount) return false;

    if (stats.userPendingHarvest >= amount) {
      stats.userPendingHarvest -= amount;
    } else {
      const remainder = amount - stats.userPendingHarvest;
      stats.userPendingHarvest = 0;
      stats.totalHarvested = Math.max(0, stats.totalHarvested - remainder);
    }

    this.saveFarmingStats(stats);
    window.dispatchEvent(
      new CustomEvent('piso-tokens-deducted', {
        detail: { amount, reason },
      })
    );
    window.dispatchEvent(
      new CustomEvent('piso-farming-stats-updated', { detail: stats })
    );
    return true;
  }

  /**
   * Automatically suits newly bought, crafted, or earned items onto the player's 3D avatar.
   * Ensures the avatar equips it and renders whether the player is moving online or standing idle.
   */
  static autoSuitItem(itemIdOrName: string | number, category?: string): boolean {
    try {
      const stored = localStorage.getItem('piso_human_avatar');
      let avatarConfig = stored ? JSON.parse(stored) : null;
      if (!avatarConfig) {
        avatarConfig = {
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
          auraColor: '#F59E0B',
          bodyType: 'athletic',
          equippedPinoyItems: {},
        };
      }

      if (!avatarConfig.equippedPinoyItems) {
        avatarConfig.equippedPinoyItems = {};
      }

      const strId = String(itemIdOrName).toLowerCase();
      let slotEquipped = '';
      let itemName = String(itemIdOrName);

      // Weapon matching
      if (strId.includes('kampilan') || strId === '1') {
        avatarConfig.equippedPinoyItems.weapon = 'kampilan-lapulapu';
        slotEquipped = 'Kampilan Plasma Blade (Weapon)';
        itemName = 'Kampilan Plasma Blade of Mactan';
      } else if (strId.includes('tsinelas') || strId.includes('slipper') || strId === '6') {
        avatarConfig.equippedPinoyItems.weapon = 'tsinelas-common';
        slotEquipped = 'Tsinelas ni Nanay (Weapon)';
        itemName = 'Tsinelas ni Nanay';
      } else if (strId.includes('walis') || strId.includes('broom')) {
        avatarConfig.equippedPinoyItems.weapon = 'walis-tambo-whirlwind';
        slotEquipped = 'Walis Tambo (Weapon)';
        itemName = 'Walis Tambo of Whirlwind';
      } else if (strId.includes('bathala') || strId.includes('kilat') || strId.includes('scepter')) {
        avatarConfig.equippedPinoyItems.weapon = 'bathala-kilat';
        slotEquipped = 'Bathala Kilat (Weapon)';
        itemName = "Bathala's Cosmic Kilat";
      } else if (strId.includes('karaoke') || strId.includes('mic')) {
        avatarConfig.equippedPinoyItems.weapon = 'karaoke-mic-stun';
        slotEquipped = 'Karaoke Microphone (Weapon)';
        itemName = "Tito's Karaoke Mic";
      } else if (strId.includes('balisong') || strId === '2') {
        avatarConfig.equippedPinoyItems.weapon = 'kampilan-lapulapu';
        slotEquipped = 'Balisong Neon Dagger (Weapon)';
        itemName = 'Balisong Neon Dagger';
      }
      // Shield matching
      else if (strId.includes('kaldero') || strId.includes('shield') || strId === '3') {
        avatarConfig.equippedPinoyItems.shield = 'kaldero-lid-aegis';
        slotEquipped = 'Magic Kaldero Lid Aegis (Shield)';
        itemName = 'Magic Kaldero Lid Aegis';
      }
      // Headwear / Crown matching
      else if (strId.includes('salakot') || strId === '4') {
        avatarConfig.equippedPinoyItems.headwear = 'salakot-solar';
        slotEquipped = 'Salakot Solar Hat (Headwear)';
        itemName = 'Salakot of Solar Energy';
      } else if (strId.includes('crown') || strId.includes('maharlika') || strId === 'datu-sun-crown') {
        avatarConfig.equippedPinoyItems.crown = 'datu-sun-crown';
        avatarConfig.equippedPinoyItems.headwear = 'datu-sun-crown';
        slotEquipped = 'Maharlika Sun Crown (Headwear)';
        itemName = 'Super Datu 8-Ray Golden Crown';
      } else if (strId.includes('towel') || strId === '5') {
        avatarConfig.equippedPinoyItems.towel = 'good-morning-towel';
        avatarConfig.equippedPinoyItems.headwear = 'good-morning-towel';
        slotEquipped = 'Good Morning Towel (Collar/Towel)';
        itemName = 'Good Morning Towel Scarf';
      }
      // Amulet / Relic matching
      else if (strId.includes('agimat') || strId.includes('anting') || strId === 'agimat-anting') {
        avatarConfig.equippedPinoyItems.amulet = 'agimat-anting';
        slotEquipped = 'Agimat ni Nardong Dikit (Amulet)';
        itemName = 'Agimat ni Nardong Dikit';
      }
      // Tabo matching
      else if (strId.includes('tabo')) {
        avatarConfig.equippedPinoyItems.tabo = 'tabo-cleansing';
        slotEquipped = 'Tabo of Holy Cleansing (Hip)';
        itemName = 'Tabo of Holy Cleansing';
      }
      // Back items
      else if (strId.includes('sarimanok')) {
        avatarConfig.equippedPinoyItems.back = 'sarimanok-wings';
        slotEquipped = 'Sarimanok Prismatic Wings (Back)';
        itemName = 'Rainbow Prismatic Wings of Sarimanok';
      } else if (strId.includes('bakunawa')) {
        avatarConfig.equippedPinoyItems.back = 'bakunawa-wings';
        slotEquipped = 'Bakunawa Dragon Wings (Back)';
        itemName = 'Bakunawa Dragon Wings';
      } else if (strId.includes('sign') || strId.includes('jeepney')) {
        avatarConfig.equippedPinoyItems.back = 'jeepney-route-sign';
        avatarConfig.equippedPinoyItems.signboard = 'jeepney-route-sign';
        slotEquipped = 'Jeepney Route Signboard (Back)';
        itemName = 'Jeepney Signboard Shield';
      }
      // Outfit
      else if (strId.includes('barong') || strId === 'barong-cyber') {
        avatarConfig.outfit = 'barongCyber';
        slotEquipped = 'Barong Tagalog Cyber Armor (Outfit)';
        itemName = 'Barong Tagalog of Cyber Integrity';
      } else {
        // Generic weapon / gear assignment if category specified
        if (category === 'WEAPON') {
          avatarConfig.equippedPinoyItems.weapon = 'kampilan-lapulapu';
          slotEquipped = `${itemName} (Weapon)`;
        } else if (category === 'ARMOR') {
          avatarConfig.outfit = 'founderArmor';
          slotEquipped = `${itemName} (Armor)`;
        } else if (category === 'SHIELD') {
          avatarConfig.equippedPinoyItems.shield = 'kaldero-lid-aegis';
          slotEquipped = `${itemName} (Shield)`;
        } else {
          avatarConfig.equippedPinoyItems.amulet = 'agimat-anting';
          slotEquipped = `${itemName} (Amulet)`;
        }
      }

      // Persist to local storage and force humanoid mode
      localStorage.setItem('piso_human_avatar', JSON.stringify(avatarConfig));
      localStorage.setItem('piso_avatar_mode', 'human');

      // Dispatch live update events so 3D world immediately refreshes character mesh without hitch
      window.dispatchEvent(
        new CustomEvent('piso-avatar-updated', {
          detail: { humanAvatar: avatarConfig, slotEquipped, itemName },
        })
      );
      window.dispatchEvent(
        new CustomEvent('piso-item-suited', {
          detail: { slot: slotEquipped, itemName },
        })
      );
      return true;
    } catch (err) {
      console.error('Failed to auto-suit item:', err);
      return false;
    }
  }

  /**
   * Sells an inventory item for instant liquid $PISO tokens.
   */
  static sellItemForPiso(
    itemType: 'weapon' | 'relic' | 'block',
    itemId: number | string,
    count: number = 1
  ): { success: boolean; earnedPiso: number; itemName: string } {
    let earnedPiso = 0;
    let itemName = 'Item';

    if (itemType === 'weapon') {
      const weapons = this.getWeapons();
      const numId = typeof itemId === 'number' ? itemId : parseInt(itemId, 10);
      const idx = weapons.findIndex((w) => w.id === numId);
      if (idx === -1) return { success: false, earnedPiso: 0, itemName };

      const weapon = weapons[idx];
      itemName = weapon.name;
      // Price calculation based on rarity and enhancement
      const basePrices: Record<string, number> = {
        Common: 2,
        Uncommon: 5,
        Rare: 10,
        Epic: 20,
        Legendary: 40,
        Mythical: 75,
      };
      const base = basePrices[weapon.rarity] || 150;
      earnedPiso = Math.round(base * (1 + (weapon.enhancementLevel || 0) * 0.15));

      weapons.splice(idx, 1);
      localStorage.setItem(STORAGE_KEYS.WEAPONS, JSON.stringify(weapons));
      window.dispatchEvent(new CustomEvent('piso-weapon-sold', { detail: { weaponId: numId } }));
    } else if (itemType === 'relic') {
      const relics = this.getRelics();
      const numId = typeof itemId === 'number' ? itemId : parseInt(itemId, 10);
      const relic = relics.find((r) => r.id === numId);
      if (!relic || relic.count < count) return { success: false, earnedPiso: 0, itemName };

      itemName = relic.name;
      const baseRelicPrices: Record<string, number> = {
        Common: 1,
        Uncommon: 3,
        Rare: 5,
        Epic: 10,
        Legendary: 20,
      };
      const unitPrice = baseRelicPrices[relic.rarity] || 100;
      earnedPiso = unitPrice * count;

      relic.count -= count;
      localStorage.setItem(STORAGE_KEYS.RELICS, JSON.stringify(relics));
      window.dispatchEvent(new CustomEvent('piso-relic-updated', { detail: { relicId: numId, newCount: relic.count } }));
    } else if (itemType === 'block') {
      // Selling blocks: 0.1 $PISO per block (blocks are plentiful)
      const blockName = String(itemId);
      itemName = `${count}x ${blockName} Block`;
      const blockRate = 0.1; // 0.1 $PISO per block buyback
      earnedPiso = blockRate * count;
    }

    if (earnedPiso > 0) {
      this.recordActivityReward(earnedPiso, `💰 Sold ${itemName} for ${earnedPiso} $PISO`);
      window.dispatchEvent(
        new CustomEvent('piso-item-sold', {
          detail: { itemName, earnedPiso },
        })
      );
      return { success: true, earnedPiso, itemName };
    }

    return { success: false, earnedPiso: 0, itemName };
  }

  // ─── P2P AUCTION & BIDDING MARKETPLACE ───────────────────────────

  /**
   * Retrieves active P2P item auctions from decentralized market.
   */
  static getAuctions(): P2PAuctionListing[] {
    const raw = localStorage.getItem('piso_market_auctions');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }

    const defaultAuctions: P2PAuctionListing[] = [
      {
        id: 'auc-1',
        seller: '0x88b...Datu',
        itemName: 'Kampilan Plasma Saber of Mactan (+5)',
        itemCategory: 'WEAPON',
        itemIcon: '🗡️',
        rarity: 'Epic',
        startingBidPiso: 500,
        currentBidPiso: 850,
        highestBidder: '0x32A...Bayan',
        bidsCount: 6,
        buyoutPricePiso: 1500,
        expiresAt: Date.now() + 1000 * 60 * 45, // 45 mins remaining
        isUserListing: false,
      },
      {
        id: 'auc-2',
        seller: '0x4f1...Panday',
        itemName: 'Magic Kaldero Lid Aegis Shield',
        itemCategory: 'RELIC',
        itemIcon: '🛡️',
        rarity: 'Rare',
        startingBidPiso: 200,
        currentBidPiso: 320,
        highestBidder: '0x99C...Oracle',
        bidsCount: 4,
        buyoutPricePiso: 600,
        expiresAt: Date.now() + 1000 * 60 * 120, // 2 hours remaining
        isUserListing: false,
      },
      {
        id: 'auc-3',
        seller: '0x9E2...Scholar',
        itemName: 'Maharlika 8-Ray Sun Crown',
        itemCategory: 'ARMOR',
        itemIcon: '👑',
        rarity: 'Legendary',
        startingBidPiso: 1200,
        currentBidPiso: 2100,
        highestBidder: '0xFA4...TitanHunter',
        bidsCount: 11,
        buyoutPricePiso: 3800,
        expiresAt: Date.now() + 1000 * 60 * 15, // 15 mins remaining
        isUserListing: false,
      },
      {
        id: 'auc-4',
        seller: '0x22B...Builder',
        itemName: '50x Obsidian Quantum Core Blocks',
        itemCategory: 'BLOCK',
        itemIcon: '🪨',
        rarity: 'Rare',
        startingBidPiso: 350,
        currentBidPiso: 480,
        highestBidder: '0x71D...Mason',
        bidsCount: 3,
        buyoutPricePiso: 800,
        expiresAt: Date.now() + 1000 * 60 * 180, // 3 hours remaining
        isUserListing: false,
      },
    ];

    localStorage.setItem('piso_market_auctions', JSON.stringify(defaultAuctions));
    return defaultAuctions;
  }

  /**
   * Places an item up for open bidding on the decentralized P2P board.
   */
  static createAuction(
    item: {
      name: string;
      category: P2PAuctionListing['itemCategory'];
      icon: string;
      rarity: P2PAuctionListing['rarity'];
    },
    startingBidPiso: number,
    buyoutPricePiso: number,
    durationMinutes: number = 60
  ): P2PAuctionListing {
    const auctions = this.getAuctions();
    const newAuction: P2PAuctionListing = {
      id: `auc-${Date.now()}`,
      seller: 'Ikaw (Ikaw ang Seller)',
      itemName: item.name,
      itemCategory: item.category,
      itemIcon: item.icon,
      rarity: item.rarity,
      startingBidPiso,
      currentBidPiso: startingBidPiso,
      highestBidder: 'Walang Bidder Pa',
      bidsCount: 0,
      buyoutPricePiso,
      expiresAt: Date.now() + durationMinutes * 60 * 1000,
      isUserListing: true,
    };

    auctions.unshift(newAuction);
    localStorage.setItem('piso_market_auctions', JSON.stringify(auctions));
    window.dispatchEvent(new CustomEvent('piso-auction-created', { detail: newAuction }));
    return newAuction;
  }

  /**
   * Places a bid in $PISO on an active auction.
   */
  static placeBid(auctionId: string, bidAmount: number, bidderName: string = 'Ikaw (Player)'): boolean {
    if (!this.hasEnoughPiso(bidAmount)) return false;

    const auctions = this.getAuctions();
    const auc = auctions.find((a) => a.id === auctionId);
    if (!auc || bidAmount <= auc.currentBidPiso) return false;

    // Deduct bid from spendable $PISO
    const deducted = this.deductPiso(bidAmount, `🔨 Bid placed on ${auc.itemName}`);
    if (!deducted) return false;

    auc.currentBidPiso = bidAmount;
    auc.highestBidder = bidderName;
    auc.bidsCount += 1;

    // Instant buyout check
    if (auc.buyoutPricePiso && bidAmount >= auc.buyoutPricePiso) {
      auc.expiresAt = Date.now(); // Instantly finishes
    }

    localStorage.setItem('piso_market_auctions', JSON.stringify(auctions));
    window.dispatchEvent(new CustomEvent('piso-bid-placed', { detail: { auction: auc, bidAmount } }));
    return true;
  }

  /**
   * Accepts the highest bid on a player-listed item and collects the winning $PISO tokens.
   */
  static acceptAuctionBid(auctionId: string): { success: boolean; earnedPiso: number; itemName: string } {
    const auctions = this.getAuctions();
    const idx = auctions.findIndex((a) => a.id === auctionId);
    if (idx === -1) return { success: false, earnedPiso: 0, itemName: '' };

    const auc = auctions[idx];
    const earnedPiso = auc.currentBidPiso;
    const itemName = auc.itemName;

    // 1% burn fee parity with PISOMarketplace.sol
    const burnFee = Math.round(earnedPiso * 0.01);
    const netProceeds = earnedPiso - burnFee;

    this.recordActivityReward(netProceeds, `🔨 Auction Completed: Sold ${itemName} for ${netProceeds} $PISO (Burned ${burnFee} ₱ fee)`);
    auctions.splice(idx, 1);
    localStorage.setItem('piso_market_auctions', JSON.stringify(auctions));

    window.dispatchEvent(new CustomEvent('piso-auction-sold', { detail: { auctionId, earnedPiso: netProceeds } }));
    return { success: true, earnedPiso: netProceeds, itemName };
  }

  /**
   * Cancels a player listing and returns it to inventory.
   */
  static cancelAuction(auctionId: string): boolean {
    const auctions = this.getAuctions();
    const idx = auctions.findIndex((a) => a.id === auctionId);
    if (idx === -1) return false;

    auctions.splice(idx, 1);
    localStorage.setItem('piso_market_auctions', JSON.stringify(auctions));
    window.dispatchEvent(new CustomEvent('piso-auction-cancelled', { detail: { auctionId } }));
    return true;
  }
}

export interface P2PAuctionListing {
  id: string;
  seller: string;
  itemName: string;
  itemCategory: 'WEAPON' | 'ARMOR' | 'SHIELD' | 'ACCESSORY' | 'RELIC' | 'BLOCK' | 'CULTURE';
  itemIcon: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythical';
  startingBidPiso: number;
  currentBidPiso: number;
  highestBidder: string;
  bidsCount: number;
  buyoutPricePiso: number;
  expiresAt: number;
  isUserListing?: boolean;
}


