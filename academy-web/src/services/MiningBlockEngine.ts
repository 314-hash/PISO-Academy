import * as THREE from 'three';
import { PisoEconomyService } from './pisoEconomyService';
import { SoundFX } from './soundFX';

// ═══════════════════════════════════════════════════════════════════
//  PISO MINING BLOCK ENGINE
//  Procedurally spawns and manages mineable resource blocks in the
//  Terranian 3D world. Handles mining interaction, resource inventory,
//  block placement for buildings, and respawn timing.
// ═══════════════════════════════════════════════════════════════════

// ─── Block Type Definitions ────────────────────────────────────────────────

export type BlockType =
  | 'kahoy'     // Wood        — Lvl 1+
  | 'lupa'      // Dirt/Earth  — Lvl 1+
  | 'bato'      // Stone       — Lvl 6+
  | 'bakal'     // Iron Ore    — Lvl 6+
  | 'ginto'     // Gold Ore    — Lvl 16+
  | 'kristal'   // Crystal     — Lvl 16+
  | 'bakunawa'  // Dragon Scale— Lvl 31+
  | 'bituin';   // Star Shard  — Lvl 31+

export interface BlockDef {
  type:         BlockType;
  displayName:  string;
  emoji:        string;
  color:        number;      // THREE hex color
  emissive:     number;      // Glow color (0 = none)
  emissiveInt:  number;
  size:         number;      // World-space cube size
  minLevel:     number;      // Player level required to mine
  expReward:    number;
  dropItem:     string;
  dropEmoji:    string;
  dropMin:      number;
  dropMax:      number;
  rarity:       number;      // Spawn weight (higher = more common)
  respawnSecs:  number;
  pricePiso:    number;      // Price in $PISO token per unit
}

export const BLOCK_DEFS: Record<BlockType, BlockDef> = {
  // EXP rewards calibrated to simple standard RPG feel:
  // Common: 5-20 EXP | Intermediate: 25-40 EXP | Rare: 75-120 EXP
  kahoy:    { type:'kahoy',    displayName:'Kahoy',          emoji:'🪵', color:0x7c4a1a, emissive:0x000000, emissiveInt:0,    size:0.9, minLevel:1,  expReward:5,   dropItem:'Lumber',        dropEmoji:'🪵', dropMin:1, dropMax:3, rarity:30, respawnSecs:180, pricePiso:2 },
  lupa:     { type:'lupa',     displayName:'Lupa',           emoji:'🟫', color:0x6b4226, emissive:0x000000, emissiveInt:0,    size:0.9, minLevel:1,  expReward:4,   dropItem:'Earth',         dropEmoji:'🟫', dropMin:2, dropMax:4, rarity:28, respawnSecs:120, pricePiso:1 },
  bato:     { type:'bato',     displayName:'Bato',           emoji:'🪨', color:0x808080, emissive:0x000000, emissiveInt:0,    size:1.0, minLevel:6,  expReward:8,   dropItem:'Cobblestone',   dropEmoji:'🪨', dropMin:1, dropMax:2, rarity:22, respawnSecs:200, pricePiso:5 },
  bakal:    { type:'bakal',    displayName:'Bakal (Iron)',   emoji:'⚙️', color:0xb0b0b0, emissive:0x444444, emissiveInt:0.1,  size:1.0, minLevel:6,  expReward:15,  dropItem:'Iron Ingot',    dropEmoji:'⚙️', dropMin:1, dropMax:1, rarity:12, respawnSecs:300, pricePiso:15 },
  ginto:    { type:'ginto',    displayName:'Ginto (Gold)',   emoji:'🥇', color:0xffd700, emissive:0xffaa00, emissiveInt:0.3,  size:1.0, minLevel:16, expReward:25,  dropItem:'Gold Ingot',    dropEmoji:'🥇', dropMin:1, dropMax:1, rarity:6,  respawnSecs:480, pricePiso:40 },
  kristal:  { type:'kristal',  displayName:'Kristal',        emoji:'💎', color:0x00e5ff, emissive:0x00aaff, emissiveInt:0.5,  size:0.8, minLevel:16, expReward:40,  dropItem:'Crystal Shard', dropEmoji:'💎', dropMin:1, dropMax:1, rarity:4,  respawnSecs:600, pricePiso:80 },
  bakunawa: { type:'bakunawa', displayName:'Bakunawa Scale', emoji:'🐉', color:0x1a0033, emissive:0x6600ff, emissiveInt:0.8,  size:1.2, minLevel:31, expReward:75,  dropItem:'Dragon Scale',  dropEmoji:'🐉', dropMin:1, dropMax:1, rarity:2,  respawnSecs:900, pricePiso:200 },
  bituin:   { type:'bituin',   displayName:'Bituin Shard',   emoji:'⭐', color:0xffffff, emissive:0xffffaa, emissiveInt:1.0,  size:0.7, minLevel:31, expReward:120, dropItem:'Star Fragment', dropEmoji:'⭐', dropMin:1, dropMax:1, rarity:1,  respawnSecs:1800, pricePiso:450 },
};

// ─── Structure Recipes ─────────────────────────────────────────────────────

export type StructureCategory = 0|1|2|3|4|5|6|7;

export interface StructureDef {
  category:    StructureCategory;
  name:        string;
  emoji:       string;
  description: string;
  benefit:     string;
  recipe:      Partial<Record<string, number>>; // resource → qty
  color:       number;
  height:      number;
  width:       number;
}

export const STRUCTURE_DEFS: StructureDef[] = [
  { category:0, name:'Freeform',        emoji:'🎨', description:'Custom creative build',             benefit:'Tip target for creativity',        recipe:{}, color:0x8888ff, height:1, width:1 },
  { category:1, name:'Bahay',           emoji:'🏠', description:'Traditional Filipino house',        benefit:'+5% EXP boost zone (10m radius)',   recipe:{'Lumber':20,'Cobblestone':10}, color:0x7c4a1a, height:3, width:4 },
  { category:2, name:'Kuta',            emoji:'🏯', description:'Fortress wall section',             benefit:'Blocks monster pathing',             recipe:{'Cobblestone':30,'Iron Ingot':5}, color:0x808080, height:4, width:2 },
  { category:3, name:'Bantayan',        emoji:'🗼', description:'Watchtower',                         benefit:'+30% minimap vision radius',         recipe:{'Lumber':15,'Iron Ingot':10}, color:0xb08040, height:6, width:2 },
  { category:4, name:'Palengke',        emoji:'🏪', description:'Marketplace stall',                 benefit:'+5% $PISO trade bonus',              recipe:{'Lumber':20,'Gold Ingot':10}, color:0xffd700, height:3, width:5 },
  { category:5, name:'Simbahan',        emoji:'⛪', description:'Sacred shrine',                     benefit:'Auto-heal aura (5% HP/min)',          recipe:{'Crystal Shard':15,'Gold Ingot':10}, color:0x00e5ff, height:5, width:3 },
  { category:6, name:'Kastilyo',        emoji:'🏰', description:'Mighty castle',                     benefit:'+10% ATK aura + tipboard display',   recipe:{'Cobblestone':50,'Iron Ingot':30,'Gold Ingot':20}, color:0x888888, height:8, width:8 },
  { category:7, name:'Bakunawa Tower',  emoji:'🐉', description:'Dragon tower (max tier)',           benefit:'PvP defense zone + Dragon aura',     recipe:{'Dragon Scale':10,'Crystal Shard':20}, color:0x6600ff, height:10, width:4 },
];

// ─── Resource Inventory ────────────────────────────────────────────────────

export type ResourceInventory = Record<string, number>;

const INVENTORY_KEY = 'piso_mining_inventory_v1';
const PLACED_BLOCKS_KEY = 'piso_placed_blocks_v1';

export function loadInventory(): ResourceInventory {
  try {
    return JSON.parse(localStorage.getItem(INVENTORY_KEY) || '{}');
  } catch { return {}; }
}

export function saveInventory(inv: ResourceInventory): void {
  localStorage.setItem(INVENTORY_KEY, JSON.stringify(inv));
  window.dispatchEvent(new CustomEvent('piso-inventory-updated', { detail: inv }));
}

export function addResource(item: string, qty: number): ResourceInventory {
  const inv = loadInventory();
  inv[item] = (inv[item] || 0) + qty;
  saveInventory(inv);
  return inv;
}

export function hasResources(recipe: Partial<Record<string, number>>): boolean {
  const inv = loadInventory();
  return Object.entries(recipe).every(([item, qty]) => (inv[item] || 0) >= (qty ?? 0));
}

export function deductResources(recipe: Partial<Record<string, number>>): boolean {
  if (!hasResources(recipe)) return false;
  const inv = loadInventory();
  for (const [item, qty] of Object.entries(recipe)) {
    inv[item] = (inv[item] || 0) - (qty ?? 0);
  }
  saveInventory(inv);
  return true;
}

// ─── Block Bundles & Store ($PISO Token) ───────────────────────────────────

export interface BlockBundle {
  id: number;
  name: string;
  emoji: string;
  tagline: string;
  discountPercent: number;
  pricePiso: number;
  originalPricePiso: number;
  minLevel: number;
  items: { item: string; emoji: string; qty: number }[];
}

export const BLOCK_BUNDLES: BlockBundle[] = [
  {
    id: 0,
    name: 'Starter Bahay Bundle',
    emoji: '📦',
    tagline: 'Lumber & Earth essentials for rapid rookie homesteading',
    discountPercent: 20,
    pricePiso: 100,
    originalPricePiso: 125,
    minLevel: 1,
    items: [
      { item: 'Lumber', emoji: '🪵', qty: 25 },
      { item: 'Earth', emoji: '🟫', qty: 25 },
      { item: 'Cobblestone', emoji: '🪨', qty: 10 },
    ],
  },
  {
    id: 1,
    name: 'Fortress Mason Pack',
    emoji: '🏯',
    tagline: 'Heavy stone, forged iron, and gold ingots for military bastions',
    discountPercent: 15,
    pricePiso: 800,
    originalPricePiso: 950,
    minLevel: 6,
    items: [
      { item: 'Cobblestone', emoji: '🪨', qty: 50 },
      { item: 'Iron Ingot', emoji: '⚙️', qty: 20 },
      { item: 'Gold Ingot', emoji: '🥇', qty: 10 },
    ],
  },
  {
    id: 2,
    name: 'Mythic Architect Pack',
    emoji: '🐉',
    tagline: 'Rare Bakunawa dragon scales, crystals, and star fragments',
    discountPercent: 18,
    pricePiso: 4500,
    originalPricePiso: 5450,
    minLevel: 31,
    items: [
      { item: 'Dragon Scale', emoji: '🐉', qty: 10 },
      { item: 'Crystal Shard', emoji: '💎', qty: 15 },
      { item: 'Star Fragment', emoji: '⭐', qty: 5 },
    ],
  },
];

/**
 * Purchases individual blocks using $PISO tokens from player balance.
 */
export function buyBlocksWithPiso(
  type: BlockType,
  count: number,
  playerLevel: number
): { success: boolean; message: string; newInventory?: ResourceInventory } {
  const def = BLOCK_DEFS[type];
  if (!def) return { success: false, message: 'Invalid block type.' };
  if (count <= 0) return { success: false, message: 'Quantity must be greater than 0.' };

  if (playerLevel < def.minLevel) {
    return {
      success: false,
      message: `⛔ Level ${def.minLevel}+ required to purchase ${def.displayName}!`,
    };
  }

  const totalCost = def.pricePiso * count;
  if (!PisoEconomyService.hasEnoughPiso(totalCost)) {
    const current = PisoEconomyService.getSpendablePiso();
    return {
      success: false,
      message: `⚠️ Insufficient $PISO tokens! Required: ${totalCost} ₱PISO, you have: ${current.toFixed(1)} ₱PISO.`,
    };
  }

  const deducted = PisoEconomyService.deductPiso(
    totalCost,
    `Purchased ${count}x ${def.displayName} blocks`
  );
  if (!deducted) {
    return { success: false, message: 'Transaction could not be completed.' };
  }

  const updatedInv = addResource(def.dropItem, count);
  try {
    SoundFX.playCoins?.();
  } catch {}

  window.dispatchEvent(
    new CustomEvent('piso-blocks-purchased', {
      detail: {
        blockType: type,
        displayName: def.displayName,
        item: def.dropItem,
        count,
        totalCost,
        newInventory: updatedInv,
      },
    })
  );

  return {
    success: true,
    message: `🎉 Successfully purchased ${count}x ${def.emoji} ${def.displayName} for ${totalCost} ₱PISO!`,
    newInventory: updatedInv,
  };
}

/**
 * Purchases a discounted pre-packaged builder bundle using $PISO tokens.
 */
export function buyBundleWithPiso(
  bundleId: number,
  playerLevel: number
): { success: boolean; message: string; newInventory?: ResourceInventory } {
  const bundle = BLOCK_BUNDLES.find((b) => b.id === bundleId);
  if (!bundle) return { success: false, message: 'Invalid bundle ID.' };

  if (playerLevel < bundle.minLevel) {
    return {
      success: false,
      message: `⛔ Level ${bundle.minLevel}+ required to unlock the ${bundle.name}!`,
    };
  }

  if (!PisoEconomyService.hasEnoughPiso(bundle.pricePiso)) {
    const current = PisoEconomyService.getSpendablePiso();
    return {
      success: false,
      message: `⚠️ Insufficient $PISO tokens! Required: ${bundle.pricePiso} ₱PISO, you have: ${current.toFixed(1)} ₱PISO.`,
    };
  }

  const deducted = PisoEconomyService.deductPiso(
    bundle.pricePiso,
    `Purchased ${bundle.name}`
  );
  if (!deducted) {
    return { success: false, message: 'Transaction could not be completed.' };
  }

  let lastInv: ResourceInventory = loadInventory();
  for (const item of bundle.items) {
    lastInv = addResource(item.item, item.qty);
  }

  try {
    SoundFX.playLevelUp?.();
  } catch {}

  window.dispatchEvent(
    new CustomEvent('piso-bundle-purchased', {
      detail: {
        bundleId,
        bundleName: bundle.name,
        pricePiso: bundle.pricePiso,
        items: bundle.items,
        newInventory: lastInv,
      },
    })
  );

  return {
    success: true,
    message: `🎉 Acquired ${bundle.emoji} ${bundle.name} for ${bundle.pricePiso} ₱PISO! All materials added to inventory.`,
    newInventory: lastInv,
  };
}

/**
 * Automatically purchases exactly what materials are missing for a building recipe.
 */
export function buyMissingRecipeMaterialsWithPiso(
  recipe: Partial<Record<string, number>>
): { success: boolean; totalCost: number; message: string; itemsPurchased?: { item: string; qty: number }[] } {
  const inv = loadInventory();
  let totalCost = 0;
  const missingItems: { item: string; blockType: BlockType; def: BlockDef; needed: number }[] = [];

  for (const [item, requiredQty] of Object.entries(recipe)) {
    const currentQty = inv[item] || 0;
    const diff = (requiredQty || 0) - currentQty;
    if (diff > 0) {
      const def = Object.values(BLOCK_DEFS).find((d) => d.dropItem === item);
      if (!def) continue;
      missingItems.push({ item, blockType: def.type, def, needed: diff });
      totalCost += def.pricePiso * diff;
    }
  }

  if (missingItems.length === 0) {
    return { success: true, totalCost: 0, message: 'You already have all required materials!' };
  }

  if (!PisoEconomyService.hasEnoughPiso(totalCost)) {
    const current = PisoEconomyService.getSpendablePiso();
    return {
      success: false,
      totalCost,
      message: `⚠️ Need ${totalCost} ₱PISO to auto-buy missing materials, but you only have ${current.toFixed(1)} ₱PISO.`,
    };
  }

  const deducted = PisoEconomyService.deductPiso(
    totalCost,
    `Auto-bought missing materials for building`
  );
  if (!deducted) {
    return { success: false, totalCost, message: 'Transaction could not be completed.' };
  }

  for (const missing of missingItems) {
    addResource(missing.item, missing.needed);
  }

  try {
    SoundFX.playCoins?.();
  } catch {}

  const purchasedSummary = missingItems.map((m) => `${m.needed}x ${m.item}`).join(', ');

  return {
    success: true,
    totalCost,
    itemsPurchased: missingItems.map((m) => ({ item: m.item, qty: m.needed })),
    message: `🎉 Successfully bought missing materials (${purchasedSummary}) for ${totalCost} ₱PISO!`,
  };
}

// ─── Placed Block & Structure Persistence ──────────────────────────────────

interface PlacedBlockRecord {
  type: BlockType;
  x: number; y: number; z: number;
  placedAt: number;
}

export type StructureStyleTheme = 'narra' | 'bamboo' | 'cyber_neon' | 'kuta_stone';

export interface StructureModifications {
  rotationY: number; // In radians (0, Math.PI/2, Math.PI, 3*Math.PI/2)
  scale: number;     // 0.8x to 1.5x
  styleTheme: StructureStyleTheme;
  customName?: string;
}

export interface PlacedStructureRecord {
  id: string;
  category: StructureCategory;
  name: string;
  position: { x: number; y: number; z: number };
  rotationY: number;
  scale: number;
  styleTheme: StructureStyleTheme;
  customName?: string;
  placedAt: number;
}

const PLACED_STRUCTURES_KEY = 'piso_placed_structures_v2';

export function loadPlacedBlocks(): PlacedBlockRecord[] {
  try {
    return JSON.parse(localStorage.getItem(PLACED_BLOCKS_KEY) || '[]');
  } catch { return []; }
}

export function savePlacedBlock(type: BlockType, x: number, y: number, z: number): void {
  const blocks = loadPlacedBlocks();
  blocks.push({ type, x, y, z, placedAt: Date.now() });
  localStorage.setItem(PLACED_BLOCKS_KEY, JSON.stringify(blocks));
}

export function loadPlacedStructures(): PlacedStructureRecord[] {
  try {
    return JSON.parse(localStorage.getItem(PLACED_STRUCTURES_KEY) || '[]');
  } catch { return []; }
}

export function savePlacedStructure(record: PlacedStructureRecord): void {
  const structures = loadPlacedStructures();
  structures.push(record);
  localStorage.setItem(PLACED_STRUCTURES_KEY, JSON.stringify(structures));
  window.dispatchEvent(new CustomEvent('piso-structures-updated', { detail: structures }));
}

export function dismantlePlacedStructure(id: string): { success: boolean; refundedMaterials: Partial<Record<string, number>> } {
  let structures = loadPlacedStructures();
  const target = structures.find((s) => s.id === id);
  if (!target) return { success: false, refundedMaterials: {} };

  const def = STRUCTURE_DEFS[target.category];
  const refunded: Partial<Record<string, number>> = {};
  if (def && def.recipe) {
    // Salvage refund: 70% of recipe materials returned to player inventory
    for (const [item, qty] of Object.entries(def.recipe)) {
      if (qty) {
        const refundQty = Math.max(1, Math.floor(qty * 0.7));
        addResource(item, refundQty);
        refunded[item] = refundQty;
      }
    }
  }

  structures = structures.filter((s) => s.id !== id);
  localStorage.setItem(PLACED_STRUCTURES_KEY, JSON.stringify(structures));
  window.dispatchEvent(new CustomEvent('piso-structures-updated', { detail: structures }));
  return { success: true, refundedMaterials: refunded };
}

// ─── Mining Block Engine ───────────────────────────────────────────────────

export interface WorldBlock {
  mesh:        THREE.Mesh;
  type:        BlockType;
  def:         BlockDef;
  worldX:      number;
  worldZ:      number;
  minedAt:     number;    // 0 = present; timestamp = awaiting respawn
  id:          string;
}

export class MiningBlockEngine {
  private scene:  THREE.Scene;
  private blocks: WorldBlock[] = [];
  private particleGroups: THREE.Group[] = [];

  // Builder mode & placement settings
  builderMode = false;
  placementMode: 'block' | 'structure' = 'block';
  selectedBlockType: BlockType = 'kahoy';
  selectedStructureCategory: StructureCategory = 1; // Default 1 (Bahay)

  // Real 3D Structure Modifications
  structureModifications: StructureModifications = {
    rotationY: 0,
    scale: 1.0,
    styleTheme: 'narra',
    customName: '',
  };

  // Placed structures registry
  placedStructureGroups: Map<string, THREE.Group> = new Map();

  // Ghost placement preview
  ghostMesh: THREE.Mesh | null = null;
  ghostStructureGroup: THREE.Group | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.restorePlacedStructures();
  }

  // ── Spawn resource blocks across the world ────────────────────────────────

  spawnWorldBlocks(seed: number = 42, worldRadius: number = 165): void {
    const rng = (n: number) => {
      let x = Math.sin(n * 127.1 + seed) * 43758.5453;
      return x - Math.floor(x);
    };

    // Build a weighted pool from rarity
    const pool: BlockType[] = [];
    for (const [type, def] of Object.entries(BLOCK_DEFS) as [BlockType, BlockDef][]) {
      for (let i = 0; i < def.rarity; i++) pool.push(type);
    }

    const totalBlocks = 420; // Dense world
    for (let i = 0; i < totalBlocks; i++) {
      const angle  = rng(i * 3)    * Math.PI * 2;
      const radius = rng(i * 5 + 1) * worldRadius;
      const x      = Math.cos(angle) * radius;
      const z      = Math.sin(angle) * radius;

      const poolIdx = Math.floor(rng(i * 7 + 3) * pool.length);
      const type    = pool[poolIdx];
      const def     = BLOCK_DEFS[type];

      // Rarer blocks spawn further from centre
      const rarityGate = (1 - def.rarity / 30) * worldRadius * 0.5;
      if (def.minLevel > 1 && radius < rarityGate) continue;

      this.spawnBlock(type, x, 0, z, i.toString());
    }

    // Restore previously player-placed blocks
    const placed = loadPlacedBlocks();
    for (const pb of placed) {
      this.spawnBlock(pb.type, pb.x, pb.y, pb.z, `placed_${pb.placedAt}`, true);
    }
  }

  private spawnBlock(
    type: BlockType, x: number, y: number, z: number,
    id: string, isPlayerPlaced = false
  ): WorldBlock {
    const def = BLOCK_DEFS[type];
    const geo = new THREE.BoxGeometry(def.size, def.size, def.size);
    const mat = new THREE.MeshStandardMaterial({
      color:           def.color,
      emissive:        def.emissive,
      emissiveIntensity: def.emissiveInt,
      roughness:       isPlayerPlaced ? 0.4 : 0.75,
      metalness:       type === 'bakal' || type === 'ginto' ? 0.8 : 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + def.size * 0.5, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { blockId: id, blockType: type, isMineable: true };

    // Slight random rotation for natural look
    if (!isPlayerPlaced) {
      mesh.rotation.y = Math.sin(parseFloat(id) || 0) * 0.3;
    }

    this.scene.add(mesh);
    const block: WorldBlock = { mesh, type, def, worldX: x, worldZ: z, minedAt: 0, id };
    this.blocks.push(block);
    return block;
  }

  /**
   * Finds the nearest unmined block within maxDistance, prioritizing blocks the player can mine.
   */
  getNearestAvailableBlock(
    playerPos: THREE.Vector3,
    maxDistance: number = 250,
    playerLevel: number = 99
  ): WorldBlock | null {
    let nearest: WorldBlock | null = null;
    let nearestDist = maxDistance;

    // 1. Try to find nearest block meeting player level requirement
    for (const b of this.blocks) {
      if (b.minedAt !== 0) continue;
      if (playerLevel < b.def.minLevel) continue;
      const dist = playerPos.distanceTo(b.mesh.position);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = b;
      }
    }

    // 2. Fallback to any nearest unmined block if none matched
    if (!nearest) {
      for (const b of this.blocks) {
        if (b.minedAt !== 0) continue;
        const dist = playerPos.distanceTo(b.mesh.position);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = b;
        }
      }
    }

    return nearest;
  }

  /**
   * Attempts to mine the nearest visible block within `reach` units.
   * Returns the mined block info or null if nothing reachable.
   */
  mineNearestBlock(
    playerPos: THREE.Vector3,
    playerLevel: number,
    reach: number = 3.5
  ): { block: WorldBlock; drops: { item: string; qty: number }; exp: number } | null {
    let nearest: WorldBlock | null = null;
    let nearestDist = Infinity;

    for (const b of this.blocks) {
      if (b.minedAt !== 0) continue; // Already mined, awaiting respawn
      const dist = playerPos.distanceTo(b.mesh.position);
      if (dist < reach && dist < nearestDist) {
        nearestDist = dist;
        nearest = b;
      }
    }

    if (!nearest) return null;

    // Level gate check
    if (playerLevel < nearest.def.minLevel) {
      window.dispatchEvent(new CustomEvent('piso-mining-blocked', {
        detail: {
          message: `⛔ Lvl ${nearest.def.minLevel} required to mine ${nearest.def.emoji} ${nearest.def.displayName}`,
          blockType: nearest.type,
        }
      }));
      return null;
    }

    // Play break particles
    this._playBreakFX(nearest.mesh.position, nearest.def.color);

    // Remove from scene (respawn later)
    this.scene.remove(nearest.mesh);
    nearest.minedAt = Date.now();

    // Roll drops
    const dropQty = nearest.def.dropMin +
      Math.floor(Math.random() * (nearest.def.dropMax - nearest.def.dropMin + 1));

    const drops = { item: nearest.def.dropItem, qty: dropQty };
    addResource(nearest.def.dropItem, dropQty);

    window.dispatchEvent(new CustomEvent('piso-block-mined', {
      detail: {
        blockType: nearest.type,
        def: nearest.def,
        drops,
        exp: nearest.def.expReward,
        worldX: nearest.worldX,
        worldZ: nearest.worldZ,
      }
    }));

    return { block: nearest, drops, exp: nearest.def.expReward };
  }

  // ── Place a player block ───────────────────────────────────────────────────

  /**
   * Places a block from player inventory at the given position.
   * Deducts the resource from inventory.
   */
  placeBlock(type: BlockType, position: THREE.Vector3): boolean {
    const def = BLOCK_DEFS[type];
    const resource = def.dropItem;

    const inv = loadInventory();
    if ((inv[resource] || 0) < 1) {
      window.dispatchEvent(new CustomEvent('piso-build-error', {
        detail: { message: `No ${def.emoji} ${resource} in inventory!` }
      }));
      return false;
    }

    // Deduct
    inv[resource] -= 1;
    saveInventory(inv);

    // Snap to grid
    const gx = Math.round(position.x);
    const gz = Math.round(position.z);
    const gy = Math.round(position.y);

    this.spawnBlock(type, gx, gy, gz, `player_${Date.now()}`, true);
    savePlacedBlock(type, gx, gy, gz);

    window.dispatchEvent(new CustomEvent('piso-block-placed', { detail: { type, x: gx, y: gy, z: gz } }));
    return true;
  }

  // ── Modification Helpers ──────────────────────────────────────────────────

  rotateStructure(step: number = Math.PI / 2): number {
    this.structureModifications.rotationY = (this.structureModifications.rotationY + step) % (Math.PI * 2);
    this._refreshGhostPreview();
    return this.structureModifications.rotationY;
  }

  cycleTheme(): StructureStyleTheme {
    const themes: StructureStyleTheme[] = ['narra', 'bamboo', 'cyber_neon', 'kuta_stone'];
    const idx = themes.indexOf(this.structureModifications.styleTheme);
    this.structureModifications.styleTheme = themes[(idx + 1) % themes.length];
    this._refreshGhostPreview();
    return this.structureModifications.styleTheme;
  }

  cycleScale(): number {
    const scales = [0.8, 1.0, 1.3];
    const idx = scales.findIndex((s) => Math.abs(s - this.structureModifications.scale) < 0.05);
    this.structureModifications.scale = scales[(idx + 1) % scales.length];
    this._refreshGhostPreview();
    return this.structureModifications.scale;
  }

  setModifications(mods: Partial<StructureModifications>): void {
    this.structureModifications = { ...this.structureModifications, ...mods };
    this._refreshGhostPreview();
  }

  private _refreshGhostPreview(): void {
    if (this.ghostStructureGroup) {
      this.scene.remove(this.ghostStructureGroup);
      this.ghostStructureGroup = null;
    }
  }

  // ── Build a structure template with modifications ──────────────────────────

  buildStructure(
    category: StructureCategory,
    position: THREE.Vector3,
    modifications?: Partial<StructureModifications>
  ): boolean {
    const def = STRUCTURE_DEFS[category];
    if (!hasResources(def.recipe)) {
      const missing = Object.entries(def.recipe)
        .filter(([item, qty]) => (loadInventory()[item] || 0) < (qty ?? 0))
        .map(([item, qty]) => `${qty}× ${item}`)
        .join(', ');
      window.dispatchEvent(new CustomEvent('piso-build-error', {
        detail: { message: `Missing resources: ${missing}` }
      }));
      return false;
    }

    deductResources(def.recipe);

    const mods: StructureModifications = {
      rotationY: modifications?.rotationY ?? this.structureModifications.rotationY,
      scale: modifications?.scale ?? this.structureModifications.scale,
      styleTheme: modifications?.styleTheme ?? this.structureModifications.styleTheme,
      customName: modifications?.customName ?? this.structureModifications.customName,
    };

    const structureId = `struct_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    this._spawnStructureMesh(def, position, mods, structureId);

    const record: PlacedStructureRecord = {
      id: structureId,
      category,
      name: def.name,
      position: { x: Math.round(position.x), y: 0, z: Math.round(position.z) },
      rotationY: mods.rotationY,
      scale: mods.scale,
      styleTheme: mods.styleTheme,
      customName: mods.customName,
      placedAt: Date.now(),
    };
    savePlacedStructure(record);

    try {
      SoundFX.playLevelUp?.();
    } catch {}

    window.dispatchEvent(new CustomEvent('piso-structure-built', {
      detail: {
        id: structureId,
        category,
        name: def.name,
        emoji: def.emoji,
        x: position.x,
        z: position.z,
        modifications: mods,
      }
    }));
    return true;
  }

  restorePlacedStructures(): void {
    const list = loadPlacedStructures();
    for (const item of list) {
      const def = STRUCTURE_DEFS[item.category];
      if (!def) continue;
      const pos = new THREE.Vector3(item.position.x, item.position.y || 0, item.position.z);
      const mods: StructureModifications = {
        rotationY: item.rotationY || 0,
        scale: item.scale || 1.0,
        styleTheme: item.styleTheme || 'narra',
        customName: item.customName || '',
      };
      this._spawnStructureMesh(def, pos, mods, item.id);
    }
  }

  dismantleStructure(id: string): boolean {
    const res = dismantlePlacedStructure(id);
    if (res.success) {
      const grp = this.placedStructureGroups.get(id);
      if (grp) {
        this.scene.remove(grp);
        this.placedStructureGroups.delete(id);
      }
      try {
        SoundFX.playLaser?.();
      } catch {}
      return true;
    }
    return false;
  }

  // ── Procedural 3D Architectural Generator ──────────────────────────────────

  private _getThemeColors(theme: StructureStyleTheme, fallbackColor: number) {
    switch (theme) {
      case 'bamboo':
        return {
          primary: 0x4D7C0F,   // Green bamboo stalks
          secondary: 0xCA8A04, // Dried bamboo slats / thatch
          accent: 0x84CC16,    // Emerald vibrant vine
          emissive: 0x000000,
          emissiveInt: 0,
          isNeon: false,
          label: 'BAMBOO CANE',
        };
      case 'cyber_neon':
        return {
          primary: 0x0F172A,   // Matte obsidian carbon
          secondary: 0x06B6D4, // Electric cyan trim
          accent: 0xF59E0B,    // Cyber amber
          emissive: 0x06B6D4,
          emissiveInt: 0.65,
          isNeon: true,
          label: 'CYBER NEON',
        };
      case 'kuta_stone':
        return {
          primary: 0x475569,   // Intramuros volcanic adobe blocks
          secondary: 0x1E293B, // Weathered iron strapping
          accent: 0xEA580C,    // Torch fire amber
          emissive: 0xEA580C,
          emissiveInt: 0.25,
          isNeon: false,
          label: 'INTRAMUROS STONE',
        };
      case 'narra':
      default:
        return {
          primary: 0x7C4A1A,   // Deep Philippine Narra hardwood
          secondary: 0xB47935, // Golden sawali weave
          accent: 0xF59E0B,    // Straw fibers
          emissive: 0x000000,
          emissiveInt: 0,
          isNeon: false,
          label: 'NARRA TIMBER',
        };
    }
  }

  private _createBillboardLabel(title: string, subtitle: string, colorHex: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.Sprite();

    ctx.fillStyle = 'rgba(11, 15, 23, 0.90)';
    ctx.strokeStyle = colorHex;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(10, 10, 492, 110, 20);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colorHex;
    ctx.beginPath();
    ctx.roundRect(30, 10, 452, 5, 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(title, 256, 62);

    ctx.fillStyle = colorHex;
    ctx.font = 'bold 20px monospace';
    ctx.fillText(subtitle, 256, 98);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(4.5, 1.15, 1);
    return sprite;
  }

  private _spawnStructureMesh(
    def: StructureDef,
    pos: THREE.Vector3,
    mods?: Partial<StructureModifications>,
    id?: string,
    isGhost: boolean = false
  ): THREE.Group {
    const group = new THREE.Group();
    const theme = mods?.styleTheme || this.structureModifications.styleTheme || 'narra';
    const tCol = this._getThemeColors(theme, def.color);
    const opacity = isGhost ? 0.5 : 1.0;
    const transparent = isGhost;

    const primMat = new THREE.MeshStandardMaterial({
      color: tCol.primary,
      roughness: tCol.isNeon ? 0.3 : 0.75,
      metalness: tCol.isNeon ? 0.4 : 0.1,
      transparent,
      opacity,
      emissive: tCol.isNeon ? tCol.emissive : 0x000000,
      emissiveIntensity: tCol.isNeon ? 0.2 : 0,
    });

    const secMat = new THREE.MeshStandardMaterial({
      color: tCol.secondary,
      roughness: 0.6,
      metalness: 0.2,
      transparent,
      opacity,
      emissive: tCol.emissive,
      emissiveIntensity: tCol.emissiveInt,
    });

    const accentMat = new THREE.MeshStandardMaterial({
      color: tCol.accent,
      roughness: 0.4,
      metalness: 0.3,
      transparent,
      opacity,
      emissive: tCol.accent,
      emissiveIntensity: 0.3,
    });

    const w = def.width;
    const h = def.height;

    // ─────────────────────────────────────────────────────────────────────────
    // Category 1: Traditional Bahay Kubo (Stilts, Sawali walls, Gabled Nipa Roof)
    // ─────────────────────────────────────────────────────────────────────────
    if (def.category === 1) {
      // 4 Corner Stilts (Haligi)
      const stiltGeo = new THREE.CylinderGeometry(0.12, 0.14, 1.0, 8);
      const stiltOffsets = [
        [-w * 0.38, -w * 0.38],
        [w * 0.38, -w * 0.38],
        [-w * 0.38, w * 0.38],
        [w * 0.38, w * 0.38],
      ];
      stiltOffsets.forEach(([ox, oz]) => {
        const stilt = new THREE.Mesh(stiltGeo, primMat);
        stilt.position.set(ox, 0.5, oz);
        group.add(stilt);
      });

      // Raised Living Floor (Sahig)
      const deckGeo = new THREE.BoxGeometry(w, 0.15, w);
      const deck = new THREE.Mesh(deckGeo, secMat);
      deck.position.y = 1.05;
      group.add(deck);

      // 4 Woven Bamboo / Sawali Walls with open window frames
      const wallH = h * 0.55;
      const wallGeo = new THREE.BoxGeometry(w * 0.85, wallH, w * 0.85);
      const walls = new THREE.Mesh(wallGeo, primMat);
      walls.position.y = 1.05 + wallH * 0.5;
      group.add(walls);

      // Window Cutout accents (Glowing interior)
      const winGeo = new THREE.BoxGeometry(w * 0.88, wallH * 0.4, w * 0.3);
      const win = new THREE.Mesh(winGeo, accentMat);
      win.position.y = 1.05 + wallH * 0.55;
      group.add(win);

      // Traditional Hip Thatch Roof (Bubong Nipa) with eaves
      const eavesGeo = new THREE.BoxGeometry(w * 1.15, 0.12, w * 1.15);
      const eaves = new THREE.Mesh(eavesGeo, secMat);
      eaves.position.y = 1.05 + wallH + 0.06;
      group.add(eaves);

      // Peaked 4-sided pitched roof
      const roofGeo = new THREE.ConeGeometry(w * 0.85, h * 0.65, 4);
      const roof = new THREE.Mesh(roofGeo, secMat);
      roof.rotation.y = Math.PI / 4; // Square orientation
      roof.position.y = 1.05 + wallH + h * 0.325;
      group.add(roof);

      // Ridge pole on peak
      const ridgeGeo = new THREE.CylinderGeometry(0.08, 0.08, w * 0.7, 6);
      const ridge = new THREE.Mesh(ridgeGeo, accentMat);
      ridge.rotation.z = Math.PI / 2;
      ridge.position.y = 1.05 + wallH + h * 0.65;
      group.add(ridge);

      // 3-step Bamboo entrance stairs (Hagdan)
      for (let s = 0; s < 3; s++) {
        const stepGeo = new THREE.BoxGeometry(0.8, 0.08, 0.25);
        const step = new THREE.Mesh(stepGeo, secMat);
        step.position.set(0, 0.25 + s * 0.28, w * 0.45 + (3 - s) * 0.22);
        group.add(step);
      }

      // Hanging Cyber Solar Lantern under front eave
      const lanternGeo = new THREE.SphereGeometry(0.18, 8, 8);
      const lantern = new THREE.Mesh(lanternGeo, accentMat);
      lantern.position.set(0, 1.05 + wallH - 0.1, w * 0.52);
      group.add(lantern);

      if (!isGhost) {
        const lanternLight = new THREE.PointLight(tCol.accent, 1.6, 7);
        lanternLight.position.set(0, 1.05 + wallH - 0.1, w * 0.52);
        group.add(lanternLight);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Category 2: Kuta (Intramuros Fortress Wall & Bastion Section)
    // ─────────────────────────────────────────────────────────────────────────
    else if (def.category === 2) {
      // Heavy Stone Base Rampart
      const baseGeo = new THREE.BoxGeometry(w * 1.1, h * 0.65, w * 0.75);
      const base = new THREE.Mesh(baseGeo, primMat);
      base.position.y = (h * 0.65) * 0.5;
      group.add(base);

      // Parapet Walkway
      const walkwayGeo = new THREE.BoxGeometry(w * 1.15, 0.2, w * 0.85);
      const walkway = new THREE.Mesh(walkwayGeo, secMat);
      walkway.position.y = h * 0.65 + 0.1;
      group.add(walkway);

      // 4 Defensive Battlements (Crenels & Merlons)
      const merlonW = w * 0.22;
      const merlonH = 0.65;
      for (let i = 0; i < 4; i++) {
        const mGeo = new THREE.BoxGeometry(merlonW, merlonH, 0.25);
        const merlon = new THREE.Mesh(mGeo, primMat);
        merlon.position.set(-w * 0.45 + i * (w * 0.3), h * 0.65 + 0.2 + merlonH * 0.5, w * 0.38);
        group.add(merlon);
      }

      // Arched Fortcullis Entry Frame
      const archGeo = new THREE.BoxGeometry(w * 0.4, h * 0.5, w * 0.8);
      const arch = new THREE.Mesh(archGeo, secMat);
      arch.position.y = (h * 0.5) * 0.5;
      group.add(arch);

      // Dual Fire Braziers on left and right parapets
      [-w * 0.5, w * 0.5].forEach((bx) => {
        const potGeo = new THREE.CylinderGeometry(0.2, 0.12, 0.3, 8);
        const pot = new THREE.Mesh(potGeo, secMat);
        pot.position.set(bx, h * 0.65 + 0.35, 0);
        group.add(pot);

        const flameGeo = new THREE.SphereGeometry(0.14, 6, 6);
        const flame = new THREE.Mesh(flameGeo, accentMat);
        flame.position.set(bx, h * 0.65 + 0.55, 0);
        group.add(flame);

        if (!isGhost) {
          const torch = new THREE.PointLight(0xEA580C, 1.8, 9);
          torch.position.set(bx, h * 0.65 + 0.6, 0);
          group.add(torch);
        }
      });
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Category 3: Bantayan (Filipino Coastal Watchtower)
    // ─────────────────────────────────────────────────────────────────────────
    else if (def.category === 3) {
      // 4 Tall Tapered Cantilever Posts
      const postGeo = new THREE.CylinderGeometry(0.12, 0.22, h * 0.8, 8);
      const postOffsets = [
        [-w * 0.4, -w * 0.4],
        [w * 0.4, -w * 0.4],
        [-w * 0.4, w * 0.4],
        [w * 0.4, w * 0.4],
      ];
      postOffsets.forEach(([ox, oz]) => {
        const post = new THREE.Mesh(postGeo, primMat);
        post.position.set(ox * 0.75, (h * 0.8) * 0.5, oz * 0.75);
        group.add(post);
      });

      // 3 Tiers of Horizontal & Diagonal Cross Bracing
      for (let t = 1; t <= 3; t++) {
        const braceY = (h * 0.8) * (t / 3.5);
        const braceRing = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.08, w * 0.75), secMat);
        braceRing.position.y = braceY;
        group.add(braceRing);
      }

      // Upper Crow's Nest Observation Deck
      const deckY = h * 0.8;
      const deckGeo = new THREE.BoxGeometry(w * 1.15, 0.2, w * 1.15);
      const deck = new THREE.Mesh(deckGeo, secMat);
      deck.position.y = deckY;
      group.add(deck);

      // Observation Balustrade / Railing
      const railGeo = new THREE.BoxGeometry(w * 1.1, 0.5, w * 1.1);
      const rail = new THREE.Mesh(railGeo, accentMat);
      rail.position.y = deckY + 0.35;
      group.add(rail);

      // Gazebo Canopy Roof
      const roofGeo = new THREE.ConeGeometry(w * 0.85, h * 0.28, 4);
      const roof = new THREE.Mesh(roofGeo, secMat);
      roof.rotation.y = Math.PI / 4;
      roof.position.y = deckY + 0.85 + (h * 0.28) * 0.5;
      group.add(roof);

      // Revolving High-Lumen Watch Beacon Light at Apex
      const beaconGeo = new THREE.DodecahedronGeometry(0.25, 0);
      const beacon = new THREE.Mesh(beaconGeo, accentMat);
      beacon.position.y = deckY + 0.85 + h * 0.28 + 0.2;
      group.add(beacon);

      if (!isGhost) {
        const beaconLight = new THREE.PointLight(tCol.accent, 2.4, 25);
        beaconLight.position.set(0, beacon.position.y, 0);
        group.add(beaconLight);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Category 4: Palengke (Wet & Dry Marketplace Stall)
    // ─────────────────────────────────────────────────────────────────────────
    else if (def.category === 4) {
      // Base Platform
      const baseGeo = new THREE.BoxGeometry(w, 0.2, w * 0.8);
      const base = new THREE.Mesh(baseGeo, secMat);
      base.position.y = 0.1;
      group.add(base);

      // U-Shaped Trading Counters
      const counterH = 0.85;
      const counterFront = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, counterH, 0.5), primMat);
      counterFront.position.set(0, counterH * 0.5, w * 0.15);
      group.add(counterFront);

      // 4 Canopy Awning Support Poles
      const poleGeo = new THREE.CylinderGeometry(0.06, 0.06, h * 0.8, 6);
      [
        [-w * 0.42, -w * 0.3],
        [w * 0.42, -w * 0.3],
        [-w * 0.42, w * 0.3],
        [w * 0.42, w * 0.3],
      ].forEach(([px, pz]) => {
        const pole = new THREE.Mesh(poleGeo, secMat);
        pole.position.set(px, (h * 0.8) * 0.5, pz);
        group.add(pole);
      });

      // Angled Striped Awning Canopy (Slanted forward)
      const canopyGeo = new THREE.BoxGeometry(w * 1.05, 0.08, w * 0.75);
      const canopy = new THREE.Mesh(canopyGeo, accentMat);
      canopy.position.set(0, h * 0.8, 0);
      canopy.rotation.x = 0.2; // 12-deg slope
      group.add(canopy);

      // Stacked Produce / Cargo Crates
      const crateGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
      const crate1 = new THREE.Mesh(crateGeo, secMat);
      crate1.position.set(-w * 0.32, 0.28, -w * 0.15);
      group.add(crate1);

      const crate2 = new THREE.Mesh(crateGeo, secMat);
      crate2.position.set(-w * 0.32, 0.83, -w * 0.15);
      crate2.rotation.y = 0.3;
      group.add(crate2);

      // Marquee Signboard: "₱ PISO MART"
      const signGeo = new THREE.BoxGeometry(w * 0.6, 0.35, 0.1);
      const sign = new THREE.Mesh(signGeo, accentMat);
      sign.position.set(0, h * 0.78, w * 0.35);
      group.add(sign);
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Category 5: Simbahan (Baroque Sacred Shrine)
    // ─────────────────────────────────────────────────────────────────────────
    else if (def.category === 5) {
      // 2-Tier Stepped Octagonal Dais
      const step1 = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.65, w * 0.75, 0.25, 8), primMat);
      step1.position.y = 0.125;
      group.add(step1);

      const step2 = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.5, w * 0.58, 0.25, 8), secMat);
      step2.position.y = 0.375;
      group.add(step2);

      // 4 Classical Baroque Columns
      const colGeo = new THREE.CylinderGeometry(0.16, 0.2, h * 0.65, 12);
      [
        [-w * 0.3, -w * 0.3],
        [w * 0.3, -w * 0.3],
        [-w * 0.3, w * 0.3],
        [w * 0.3, w * 0.3],
      ].forEach(([cx, cz]) => {
        const col = new THREE.Mesh(colGeo, secMat);
        col.position.set(cx, 0.5 + (h * 0.65) * 0.5, cz);
        group.add(col);
      });

      // Arched Domed Cupola
      const domeGeo = new THREE.SphereGeometry(w * 0.45, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
      const dome = new THREE.Mesh(domeGeo, secMat);
      dome.position.y = 0.5 + h * 0.65;
      group.add(dome);

      // Sacred Cross / Star Finial
      const finial = new THREE.Mesh(new THREE.OctahedronGeometry(0.25, 0), accentMat);
      finial.position.y = 0.5 + h * 0.65 + w * 0.45 + 0.2;
      group.add(finial);

      // Center Altar with Levitating Luminescent Crystal Relic
      const altar = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 0.7, 8), primMat);
      altar.position.y = 0.5 + 0.35;
      group.add(altar);

      const relic = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), accentMat);
      relic.position.y = 0.5 + 1.25;
      group.add(relic);

      if (!isGhost) {
        const healLight = new THREE.PointLight(0x00E5FF, 2.5, 16);
        healLight.position.set(0, 0.5 + 1.3, 0);
        group.add(healLight);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Category 6: Kastilyo (Mighty Datu Castle Keep)
    // ─────────────────────────────────────────────────────────────────────────
    else if (def.category === 6) {
      // 4 Round Bastion Towers at Corners
      const towerGeo = new THREE.CylinderGeometry(w * 0.18, w * 0.22, h * 0.85, 16);
      const towerOffsets = [
        [-w * 0.36, -w * 0.36],
        [w * 0.36, -w * 0.36],
        [-w * 0.36, w * 0.36],
        [w * 0.36, w * 0.36],
      ];
      towerOffsets.forEach(([tx, tz]) => {
        const tower = new THREE.Mesh(towerGeo, primMat);
        tower.position.set(tx, (h * 0.85) * 0.5, tz);
        group.add(tower);

        // Crenelated Turret Crown
        const crown = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.22, w * 0.18, 0.4, 8), secMat);
        crown.position.set(tx, h * 0.85 + 0.2, tz);
        group.add(crown);
      });

      // High Central Keep Tower
      const keepH = h;
      const keepGeo = new THREE.BoxGeometry(w * 0.55, keepH, w * 0.55);
      const keep = new THREE.Mesh(keepGeo, primMat);
      keep.position.y = keepH * 0.5;
      group.add(keep);

      // Connecting Curtain Walls
      const wallH = h * 0.65;
      const wallX = new THREE.Mesh(new THREE.BoxGeometry(w * 0.72, wallH, w * 0.15), secMat);
      wallX.position.set(0, wallH * 0.5, -w * 0.36);
      group.add(wallX);

      const wallZ = new THREE.Mesh(new THREE.BoxGeometry(w * 0.15, wallH, w * 0.72), secMat);
      wallZ.position.set(-w * 0.36, wallH * 0.5, 0);
      group.add(wallZ);

      // Tall Flagpole with PISO Academy Guild Flag
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.5, 6), secMat);
      pole.position.set(0, keepH + 1.25, 0);
      group.add(pole);

      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.04), accentMat);
      flag.position.set(0.4, keepH + 2.0, 0);
      group.add(flag);

      if (!isGhost) {
        const castleLight = new THREE.PointLight(tCol.accent, 2.0, 20);
        castleLight.position.set(0, keepH * 0.5, 0);
        group.add(castleLight);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Category 7: Bakunawa Tower (Dragon Spire & Celestial Beacon)
    // ─────────────────────────────────────────────────────────────────────────
    else if (def.category === 7) {
      // Coiled Serpentine Spire
      const tiers = 6;
      for (let i = 0; i < tiers; i++) {
        const tierH = h / tiers;
        const radius = (w * 0.45) * (1 - i / (tiers + 1));
        const tierMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.75, radius, tierH, 8),
          primMat
        );
        tierMesh.position.y = i * tierH + tierH * 0.5;
        tierMesh.rotation.y = (i * Math.PI) / 3;
        group.add(tierMesh);
      }

      // 3 Floating Concentric Runic Rings
      [0.35, 0.65, 0.9].forEach((frac, rIdx) => {
        const ringY = h * frac;
        const ringGeo = new THREE.TorusGeometry(w * (0.5 - frac * 0.25), 0.06, 6, 24);
        const ring = new THREE.Mesh(ringGeo, accentMat);
        ring.rotation.x = Math.PI / 2;
        ring.rotation.y = rIdx * 0.4;
        ring.position.y = ringY;
        group.add(ring);
      });

      // Draconic Horned Beacon at Summit
      const eyeGeo = new THREE.OctahedronGeometry(0.55, 0);
      const eye = new THREE.Mesh(eyeGeo, accentMat);
      eye.position.y = h + 0.5;
      group.add(eye);

      if (!isGhost) {
        const dragonLight = new THREE.PointLight(0xA855F7, 3.0, 30);
        dragonLight.position.set(0, h + 0.6, 0);
        group.add(dragonLight);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────
    // Category 0: Freeform Custom Builder Pavilion
    // ─────────────────────────────────────────────────────────────────────────
    else {
      const base = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, w), primMat);
      base.position.y = 0.15;
      group.add(base);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, h, 8), secMat);
      pillar.position.y = 0.3 + h * 0.5;
      group.add(pillar);

      const top = new THREE.Mesh(new THREE.DodecahedronGeometry(0.6, 0), accentMat);
      top.position.y = 0.3 + h + 0.6;
      group.add(top);
    }

    // Floating 3D Billboard Nameplate above apex (If not ghost)
    if (!isGhost) {
      const displayName = mods?.customName?.trim() ? mods.customName.trim() : `${def.emoji} ${def.name}`;
      const subtitle = `${tCol.label} • ${def.benefit.split('(')[0]}`;
      const label = this._createBillboardLabel(
        displayName,
        subtitle,
        `#${tCol.accent.toString(16).padStart(6, '0')}`
      );
      label.position.y = h + 1.4;
      group.add(label);
    }

    // Apply Transformation Modifications
    const rotY = mods?.rotationY ?? this.structureModifications.rotationY ?? 0;
    const scl = mods?.scale ?? this.structureModifications.scale ?? 1.0;
    group.rotation.y = rotY;
    group.scale.setScalar(scl);
    group.position.set(Math.round(pos.x), 0, Math.round(pos.z));
    group.castShadow = true;

    if (!isGhost && id) {
      this.placedStructureGroups.set(id, group);
    }

    this.scene.add(group);
    return group;
  }

  // ── Ghost block / structure for builder mode ───────────────────────────────

  updateGhostBlock(position: THREE.Vector3, canPlace: boolean): void {
    if (!this.builderMode) {
      this._removeGhost();
      return;
    }

    if (this.placementMode === 'structure') {
      // Structure Ghost Preview
      if (this.ghostMesh) {
        this.scene.remove(this.ghostMesh);
        this.ghostMesh = null;
      }

      if (!this.ghostStructureGroup) {
        const def = STRUCTURE_DEFS[this.selectedStructureCategory];
        this.ghostStructureGroup = this._spawnStructureMesh(
          def,
          position,
          this.structureModifications,
          undefined,
          true
        );
      }

      this.ghostStructureGroup.position.set(
        Math.round(position.x),
        0,
        Math.round(position.z)
      );
      this.ghostStructureGroup.rotation.y = this.structureModifications.rotationY;
      this.ghostStructureGroup.scale.setScalar(this.structureModifications.scale);
    } else {
      // Single Block Ghost Preview
      if (this.ghostStructureGroup) {
        this.scene.remove(this.ghostStructureGroup);
        this.ghostStructureGroup = null;
      }

      if (!this.ghostMesh) {
        const def = BLOCK_DEFS[this.selectedBlockType];
        const geo = new THREE.BoxGeometry(def.size, def.size, def.size);
        const mat = new THREE.MeshStandardMaterial({
          color: def.color,
          opacity: 0.45,
          transparent: true,
          wireframe: false,
        });
        this.ghostMesh = new THREE.Mesh(geo, mat);
        this.scene.add(this.ghostMesh);
      }

      (this.ghostMesh.material as THREE.MeshStandardMaterial).color.set(
        canPlace ? BLOCK_DEFS[this.selectedBlockType].color : 0xff3333
      );
      this.ghostMesh.position.set(
        Math.round(position.x),
        Math.round(position.y) + BLOCK_DEFS[this.selectedBlockType].size * 0.5,
        Math.round(position.z)
      );
    }
  }

  private _removeGhost(): void {
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
    }
    if (this.ghostStructureGroup) {
      this.scene.remove(this.ghostStructureGroup);
      this.ghostStructureGroup = null;
    }
  }

  // ── Block respawn ticker ───────────────────────────────────────────────────

  update(delta: number): void {
    const now = Date.now();

    for (const b of this.blocks) {
      if (b.minedAt === 0) continue;
      const elapsed = (now - b.minedAt) / 1000;
      if (elapsed >= b.def.respawnSecs) {
        // Respawn
        b.mesh.position.set(b.worldX, b.def.size * 0.5, b.worldZ);
        this.scene.add(b.mesh);
        b.minedAt = 0;
      }
    }

    // Animate particle FX
    for (let i = this.particleGroups.length - 1; i >= 0; i--) {
      const pg = this.particleGroups[i];
      pg.userData.life -= delta;
      if (pg.userData.life <= 0) {
        this.scene.remove(pg);
        this.particleGroups.splice(i, 1);
      } else {
        pg.children.forEach((p) => {
          (p as THREE.Mesh).position.addScaledVector(
            (p as any).userData.vel, delta
          );
          ((p as THREE.Mesh).material as THREE.Material).opacity = pg.userData.life;
        });
      }
    }
  }

  // ── Break particles ───────────────────────────────────────────────────────

  private _playBreakFX(pos: THREE.Vector3, color: number): void {
    const group = new THREE.Group();
    group.userData.life = 0.7;

    for (let i = 0; i < 12; i++) {
      const geo = new THREE.BoxGeometry(0.12, 0.12, 0.12);
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
      const p   = new THREE.Mesh(geo, mat);
      p.position.copy(pos);
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        Math.random() * 5 + 1,
        (Math.random() - 0.5) * 4
      );
      (p as any).userData = { vel };
      group.add(p);
    }

    this.scene.add(group);
    this.particleGroups.push(group);
  }

  // ── Nearest block info (for HUD) ──────────────────────────────────────────

  getNearestBlock(playerPos: THREE.Vector3, reach = 4): WorldBlock | null {
    let nearest: WorldBlock | null = null;
    let nearestDist = Infinity;
    for (const b of this.blocks) {
      if (b.minedAt !== 0) continue;
      const d = playerPos.distanceTo(b.mesh.position);
      if (d < reach && d < nearestDist) { nearestDist = d; nearest = b; }
    }
    return nearest;
  }

  getBlocks(): WorldBlock[] { return this.blocks; }

  dispose(): void {
    for (const b of this.blocks) this.scene.remove(b.mesh);
    for (const pg of this.particleGroups) this.scene.remove(pg);
    for (const [_, grp] of this.placedStructureGroups) this.scene.remove(grp);
    this.placedStructureGroups.clear();
    this._removeGhost();
    this.blocks = [];
    this.particleGroups = [];
  }
}
