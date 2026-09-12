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
  kahoy:    { type:'kahoy',    displayName:'Kahoy',          emoji:'🪵', color:0x7c4a1a, emissive:0x000000, emissiveInt:0,    size:0.9, minLevel:1,  expReward:10,  dropItem:'Lumber',        dropEmoji:'🪵', dropMin:1, dropMax:3, rarity:30, respawnSecs:180, pricePiso:2 },
  lupa:     { type:'lupa',     displayName:'Lupa',           emoji:'🟫', color:0x6b4226, emissive:0x000000, emissiveInt:0,    size:0.9, minLevel:1,  expReward:8,   dropItem:'Earth',         dropEmoji:'🟫', dropMin:2, dropMax:4, rarity:28, respawnSecs:120, pricePiso:1 },
  bato:     { type:'bato',     displayName:'Bato',           emoji:'🪨', color:0x808080, emissive:0x000000, emissiveInt:0,    size:1.0, minLevel:6,  expReward:15,  dropItem:'Cobblestone',   dropEmoji:'🪨', dropMin:1, dropMax:2, rarity:22, respawnSecs:200, pricePiso:5 },
  bakal:    { type:'bakal',    displayName:'Bakal (Iron)',   emoji:'⚙️', color:0xb0b0b0, emissive:0x444444, emissiveInt:0.1,  size:1.0, minLevel:6,  expReward:30,  dropItem:'Iron Ingot',    dropEmoji:'⚙️', dropMin:1, dropMax:1, rarity:12, respawnSecs:300, pricePiso:15 },
  ginto:    { type:'ginto',    displayName:'Ginto (Gold)',   emoji:'🥇', color:0xffd700, emissive:0xffaa00, emissiveInt:0.3,  size:1.0, minLevel:16, expReward:60,  dropItem:'Gold Ingot',    dropEmoji:'🥇', dropMin:1, dropMax:1, rarity:6,  respawnSecs:480, pricePiso:40 },
  kristal:  { type:'kristal',  displayName:'Kristal',        emoji:'💎', color:0x00e5ff, emissive:0x00aaff, emissiveInt:0.5,  size:0.8, minLevel:16, expReward:120, dropItem:'Crystal Shard', dropEmoji:'💎', dropMin:1, dropMax:1, rarity:4,  respawnSecs:600, pricePiso:80 },
  bakunawa: { type:'bakunawa', displayName:'Bakunawa Scale', emoji:'🐉', color:0x1a0033, emissive:0x6600ff, emissiveInt:0.8,  size:1.2, minLevel:31, expReward:300, dropItem:'Dragon Scale',  dropEmoji:'🐉', dropMin:1, dropMax:1, rarity:2,  respawnSecs:900, pricePiso:200 },
  bituin:   { type:'bituin',   displayName:'Bituin Shard',   emoji:'⭐', color:0xffffff, emissive:0xffffaa, emissiveInt:1.0,  size:0.7, minLevel:31, expReward:500, dropItem:'Star Fragment', dropEmoji:'⭐', dropMin:1, dropMax:1, rarity:1,  respawnSecs:1800, pricePiso:450 },
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

// ─── Placed Block Persistence ──────────────────────────────────────────────

interface PlacedBlockRecord {
  type: BlockType;
  x: number; y: number; z: number;
  placedAt: number;
}

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

  // Ghost block for builder mode
  ghostMesh: THREE.Mesh | null = null;
  builderMode  = false;
  selectedBlockType: BlockType = 'kahoy';

  constructor(scene: THREE.Scene) {
    this.scene = scene;
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

  // ── Build a structure template ─────────────────────────────────────────────

  buildStructure(category: StructureCategory, position: THREE.Vector3): boolean {
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
    this._spawnStructureMesh(def, position);

    window.dispatchEvent(new CustomEvent('piso-structure-built', {
      detail: { category, name: def.name, emoji: def.emoji, x: position.x, z: position.z }
    }));
    return true;
  }

  private _spawnStructureMesh(def: StructureDef, pos: THREE.Vector3): void {
    const group = new THREE.Group();

    // Base platform
    const baseGeo = new THREE.BoxGeometry(def.width, 0.3, def.width);
    const baseMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.8 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.15;
    group.add(base);

    // Tower/walls
    const bodyGeo = new THREE.BoxGeometry(def.width * 0.7, def.height, def.width * 0.7);
    const bodyMat = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.6, metalness: 0.1 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.3 + def.height * 0.5;
    group.add(body);

    // Roof
    const roofGeo = new THREE.ConeGeometry(def.width * 0.5, def.height * 0.4, 8);
    const roofMat = new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.color,
      emissiveIntensity: 0.15,
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.3 + def.height + def.height * 0.2;
    group.add(roof);

    // Aura glow for special structures
    if (def.category >= 5) {
      const light = new THREE.PointLight(def.color, 1.2, def.width * 4);
      light.position.y = def.height * 0.5;
      group.add(light);
    }

    group.position.set(Math.round(pos.x), 0, Math.round(pos.z));
    group.castShadow = true;
    this.scene.add(group);
  }

  // ── Ghost block for builder mode ───────────────────────────────────────────

  updateGhostBlock(position: THREE.Vector3, canPlace: boolean): void {
    if (!this.builderMode) { this._removeGhost(); return; }

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

  private _removeGhost(): void {
    if (this.ghostMesh) {
      this.scene.remove(this.ghostMesh);
      this.ghostMesh = null;
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
    this._removeGhost();
    this.blocks = [];
    this.particleGroups = [];
  }
}
