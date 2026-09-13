/**
 * WorldBestiaryRegistry.ts
 * Multi-World Monster & Biome Registry for PISO Metaverse.
 *
 * Allows developers and players to register new monsters across different worlds
 * (Cyber Manila, Banaue Highlands, Tubbataha Ocean Abyss, Mayon Caldera, Bathala Ether)
 * with customized drop tables, elemental affinities, and level tiers.
 */

import { ElementalCategory } from './ElementalCombatEngine';

export interface WorldRegion {
  id: string;
  name: string;
  tagalogName: string;
  description: string;
  themeColor: string;
  skyColor: string;
  groundColor: string;
  fogDensity: number;
  unlockedByDefault: boolean;
  minPlayerLevel: number;
  recommendedGearTier: string;
}

export interface WorldMonsterDefinition {
  id: string;
  name: string;
  tagalogName?: string;
  worldId: string;
  type: string;
  level: number;
  minPlayerLevel: number;
  maxHp: number;
  atk: number;
  def: number;
  bountyPiso: number;
  expReward: number;
  isBoss: boolean;
  elementalAffinities: Array<'fire' | 'water' | 'earth' | 'lightning' | 'spirit'>;
  favoredCategory: ElementalCategory;
  lore: string;
}

export const CANONICAL_WORLDS: WorldRegion[] = [
  {
    id: 'world_cyber_manila',
    name: 'Cyber City Manila',
    tagalogName: 'Lungsod ng Cyber Maynila',
    description: 'High-density neon metropolis with skyscrapers, elevated expressways, and corrupt Giga Buwaya corporate titans.',
    themeColor: '#06B6D4',
    skyColor: '#070B14',
    groundColor: '#0F172A',
    fogDensity: 0.003,
    unlockedByDefault: true,
    minPlayerLevel: 1,
    recommendedGearTier: 'Common - Rare',
  },
  {
    id: 'world_banaue_highlands',
    name: 'Banaue Sky Terraces',
    tagalogName: 'Hagdan-Hagdang Palayan ng Banaue',
    description: 'Ancient emerald terrace steps floating in cloud mist, guarded by Highland Cobras and Sky Vultures.',
    themeColor: '#10B981',
    skyColor: '#0B201A',
    groundColor: '#064E3B',
    fogDensity: 0.006,
    unlockedByDefault: true,
    minPlayerLevel: 5,
    recommendedGearTier: 'Uncommon - Epic',
  },
  {
    id: 'world_tubbataha_abyss',
    name: 'Tubbataha Oceanic Abyss',
    tagalogName: 'Kailaliman ng Tubbataha Reef',
    description: 'Sunken bioluminescent reef trenches inhabited by Sea Komodos and Bakunawa Leviathans.',
    themeColor: '#3B82F6',
    skyColor: '#021226',
    groundColor: '#0C2D48',
    fogDensity: 0.008,
    unlockedByDefault: false,
    minPlayerLevel: 15,
    recommendedGearTier: 'Rare - Epic',
  },
  {
    id: 'world_mayon_volcanic',
    name: 'Mayon Obsidian Caldera',
    tagalogName: 'Bulkang Mayon Caldera',
    description: 'Symmetric stratovolcano with molten lava channels, pyroclastic ash storms, and Magma Golems.',
    themeColor: '#F97316',
    skyColor: '#1F0D05',
    groundColor: '#431407',
    fogDensity: 0.005,
    unlockedByDefault: false,
    minPlayerLevel: 25,
    recommendedGearTier: 'Epic - Legendary',
  },
  {
    id: 'world_bathala_ether',
    name: 'Bathala Celestial Ether',
    tagalogName: 'Kalangitan ni Bathala',
    description: 'Floating golden islands above the stratosphere where ancient deities and sacred Sarimanok roost.',
    themeColor: '#F59E0B',
    skyColor: '#1C1605',
    groundColor: '#78350F',
    fogDensity: 0.002,
    unlockedByDefault: false,
    minPlayerLevel: 40,
    recommendedGearTier: 'Mythical / +15 Masterwork',
  },
];

export const INITIAL_MONSTERS: WorldMonsterDefinition[] = [
  // --- Cyber City Manila Monsters ---
  {
    id: 'croc_titan_1',
    name: 'Giga Buwaya Titan (Corrupt Senador)',
    tagalogName: 'Giga Buwayang Buwaya ng Korupsyon',
    worldId: 'world_cyber_manila',
    type: 'croc_titan',
    level: 35,
    minPlayerLevel: 20,
    maxHp: 45000,
    atk: 950,
    def: 220,
    bountyPiso: 75,
    expReward: 1500,
    isBoss: true,
    elementalAffinities: ['earth', 'fire'],
    favoredCategory: 'shard',
    lore: 'Corrupt reptilian bureaucratic oligarch that steals taxes from hardworking Filipino citizens. Slaying returns taxes as bounties.',
  },
  {
    id: 'hyena_farm_1',
    name: 'Cyber Hyena (Fixer)',
    tagalogName: 'Aso ng Tondo',
    worldId: 'world_cyber_manila',
    type: 'hyena',
    level: 3,
    minPlayerLevel: 1,
    maxHp: 2200,
    atk: 140,
    def: 30,
    bountyPiso: 1,
    expReward: 30,
    isBoss: false,
    elementalAffinities: ['lightning'],
    favoredCategory: 'textile',
    lore: 'Fast cybernetic scavengers roaming alleyways looking for discarded power cells.',
  },

  // --- Banaue Highlands Monsters ---
  {
    id: 'snake_farm_1',
    name: 'Highland Cobra (Ulap Serpent)',
    tagalogName: 'Cobrang Tagabundok',
    worldId: 'world_banaue_highlands',
    type: 'snake',
    level: 6,
    minPlayerLevel: 1,
    maxHp: 3100,
    atk: 190,
    def: 45,
    bountyPiso: 2,
    expReward: 80,
    isBoss: false,
    elementalAffinities: ['earth', 'water'],
    favoredCategory: 'liquid',
    lore: 'Venomous mountain serpents that guard ancestral rice terraces.',
  },
  {
    id: 'vulture_farm_1',
    name: 'Sky Vulture (Lawin ng Cordillera)',
    tagalogName: 'Lawin ng Hilaga',
    worldId: 'world_banaue_highlands',
    type: 'vulture',
    level: 10,
    minPlayerLevel: 2,
    maxHp: 4500,
    atk: 280,
    def: 60,
    bountyPiso: 3,
    expReward: 100,
    isBoss: false,
    elementalAffinities: ['spirit', 'lightning'],
    favoredCategory: 'food',
    lore: 'Sharp-eyed raptors circling the terraces, swooping down with razor talons.',
  },

  // --- Canyon & Archipelago Monsters ---
  {
    id: 'komodo_farm_1',
    name: 'Canyon Komodo (Bayawak ng Batangas)',
    tagalogName: 'Bayawak ng Bangin',
    worldId: 'world_cyber_manila',
    type: 'komodo',
    level: 15,
    minPlayerLevel: 5,
    maxHp: 6800,
    atk: 390,
    def: 90,
    bountyPiso: 5,
    expReward: 200,
    isBoss: false,
    elementalAffinities: ['earth'],
    favoredCategory: 'shard',
    lore: 'Armored monitors inhabiting dry arroyos with bacteria-infused venom jaws.',
  },
];

export class WorldBestiaryRegistry {
  private static worlds: Map<string, WorldRegion> = new Map(
    CANONICAL_WORLDS.map((w) => [w.id, w])
  );

  private static monsters: Map<string, WorldMonsterDefinition> = new Map(
    INITIAL_MONSTERS.map((m) => [m.id, m])
  );

  /**
   * Retrieves all available worlds in the multiverse.
   */
  static getAllWorlds(): WorldRegion[] {
    return Array.from(this.worlds.values());
  }

  /**
   * Gets specific world by ID.
   */
  static getWorld(worldId: string): WorldRegion | undefined {
    return this.worlds.get(worldId);
  }

  /**
   * Registers a new world into the engine.
   */
  static registerWorld(world: WorldRegion): void {
    this.worlds.set(world.id, world);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('piso-world-registered', { detail: { world } }));
    }
  }

  /**
   * Registers a new monster definition for any world.
   * "ill add some monsters in the future for diffrent world"
   */
  static registerMonster(monster: WorldMonsterDefinition): void {
    this.monsters.set(monster.id, monster);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('piso-monster-registered', { detail: { monster } }));
    }
  }

  /**
   * Retrieves all monsters belonging to a specific world.
   */
  static getMonstersForWorld(worldId: string): WorldMonsterDefinition[] {
    return Array.from(this.monsters.values()).filter((m) => m.worldId === worldId);
  }

  /**
   * Retrieves all registered monsters across all worlds.
   */
  static getAllMonsters(): WorldMonsterDefinition[] {
    return Array.from(this.monsters.values());
  }
}
