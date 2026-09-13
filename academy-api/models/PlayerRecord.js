/**
 * models/PlayerRecord.js
 * Mongoose schema for a PISO Academy player's complete game record.
 * This is the master backup document stored in MongoDB Atlas.
 *
 * Design philosophy:
 * - One document per accountId (device-sovereign wallet ID)
 * - localStorage is the source of truth (fast, offline-first)
 * - MongoDB is the backup/restore cloud layer
 * - Records sync on login, on milestone events, and every 5 minutes
 */

const mongoose = require('mongoose');

// ─── Sub-schemas ──────────────────────────────────────────────────────────────

const PrimaryAttributesSchema = new mongoose.Schema({
  knowledge:      { type: Number, default: 10 },
  coding:         { type: Number, default: 10 },
  blockchain:     { type: Number, default: 10 },
  creativity:     { type: Number, default: 10 },
  problemSolving: { type: Number, default: 10 },
  bayanihan:      { type: Number, default: 10 },
}, { _id: false });

const PositionSchema = new mongoose.Schema({
  x:       { type: Number, default: 0 },
  y:       { type: Number, default: 2 },
  z:       { type: Number, default: 0 },
  heading: { type: Number, default: 0 },
  zone:    { type: String, default: 'genesis_plaza' },
}, { _id: false });

const WalletInfoSchema = new mongoose.Schema({
  address:       { type: String, default: null },
  walletType:    { type: String, enum: ['injected', 'burner', null], default: null },
  encryptedKey:  { type: String, default: null }, // never store plaintext private key
}, { _id: false });

const FarmingStatsSchema = new mongoose.Schema({
  totalHarvested:       { type: Number, default: 0 },
  userStakedBalance:    { type: Number, default: 0 },
  userPendingHarvest:   { type: Number, default: 0 },
  userFarmingApr:       { type: Number, default: 12.5 },
  idleEarnRatePerMinute: { type: Number, default: 0.001 },
}, { _id: false });

const ResourceInventorySchema = new mongoose.Schema({
  Lumber:        { type: Number, default: 0 },
  Earth:         { type: Number, default: 0 },
  Cobblestone:   { type: Number, default: 0 },
  IronIngot:     { type: Number, default: 0 },
  GoldIngot:     { type: Number, default: 0 },
  CrystalShard:  { type: Number, default: 0 },
  DragonScale:   { type: Number, default: 0 },
  StarFragment:  { type: Number, default: 0 },
}, { _id: false });

// ─── Main Player Record ───────────────────────────────────────────────────────

const PlayerRecordSchema = new mongoose.Schema({
  // ── Identity ────────────────────────────────────────────────────────────────
  accountId:    { type: String, required: true, unique: true, index: true },
  username:     { type: String, default: 'Bagong Bayani' },
  avatarMode:   { type: String, enum: ['drone', 'human', 'glb'], default: 'drone' },

  // ── Wallet ──────────────────────────────────────────────────────────────────
  wallet: { type: WalletInfoSchema, default: () => ({}) },

  // ── Progression ─────────────────────────────────────────────────────────────
  level:                 { type: Number, default: 1, min: 1, max: 100 },
  currentExp:            { type: Number, default: 0, min: 0 },
  expToNextLevel:        { type: Number, default: 100 },
  totalCumulativeExp:    { type: Number, default: 0 },
  rank:                  { type: String, default: 'Tuklas' },
  playerClass:           { type: String, default: 'builder' },
  unallocatedStatPoints: { type: Number, default: 0 },
  skillPoints:           { type: Number, default: 0 },
  digitalPower:          { type: Number, default: 10 },

  // ── Primary Attributes ───────────────────────────────────────────────────────
  primaryAttributes: { type: PrimaryAttributesSchema, default: () => ({}) },

  // ── RPG Combat Stats ─────────────────────────────────────────────────────────
  combatStats: {
    level:           { type: Number, default: 1 },
    currentHp:       { type: Number, default: 1000 },
    maxHp:           { type: Number, default: 1000 },
    currentExp:      { type: Number, default: 0 },
    expToNextLevel:  { type: Number, default: 100 },
    statAtk:         { type: Number, default: 0 },
    statDef:         { type: Number, default: 0 },
    statHp:          { type: Number, default: 0 },
    statCrit:        { type: Number, default: 0 },
    unallocatedPoints: { type: Number, default: 0 },
    blocksMinedTotal:  { type: Number, default: 0 },
    monstersSlain:     { type: Number, default: 0 },
    titansDefeated:    { type: Number, default: 0 },
    totalBountiesClaimedPiso: { type: Number, default: 0 },
  },

  // ── World Position ───────────────────────────────────────────────────────────
  savedPosition: { type: PositionSchema, default: () => ({}) },

  // ── Economy ─────────────────────────────────────────────────────────────────
  farmingStats: { type: FarmingStatsSchema, default: () => ({}) },
  resourceInventory: { type: ResourceInventorySchema, default: () => ({}) },

  // ── Quests ───────────────────────────────────────────────────────────────────
  questProgress: {
    type: Map,
    of: new mongoose.Schema({
      progress:  { type: Number, default: 0 },
      completed: { type: Boolean, default: false },
      claimed:   { type: Boolean, default: false },
    }, { _id: false }),
    default: () => new Map(),
  },

  // ── Achievements ─────────────────────────────────────────────────────────────
  unlockedAchievementIds: { type: [String], default: [] },

  // ── Unlocked Skills ──────────────────────────────────────────────────────────
  unlockedSkillIds: { type: [String], default: [] },

  // ── Completed Lessons ────────────────────────────────────────────────────────
  completedLessonIds: { type: [String], default: [] },

  // ── Chain Credentials ────────────────────────────────────────────────────────
  chainCredentialTiers: { type: [String], default: [] },

  // ── Timestamps ───────────────────────────────────────────────────────────────
  firstSeenAt:    { type: Date, default: Date.now },
  lastSyncedAt:   { type: Date, default: Date.now },
  lastLoginAt:    { type: Date, default: Date.now },
}, {
  timestamps: { createdAt: 'firstSeenAt', updatedAt: 'lastSyncedAt' },
  collection: 'player_records',
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
PlayerRecordSchema.index({ 'wallet.address': 1 }, { sparse: true });
PlayerRecordSchema.index({ username: 1 });
PlayerRecordSchema.index({ level: -1 });
PlayerRecordSchema.index({ lastSyncedAt: -1 });

// ─── Methods ──────────────────────────────────────────────────────────────────
/**
 * Returns a safe public view of the player (no wallet private key).
 */
PlayerRecordSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  if (obj.wallet) {
    delete obj.wallet.encryptedKey;
  }
  return obj;
};

const PlayerRecord = mongoose.model('PlayerRecord', PlayerRecordSchema);

module.exports = PlayerRecord;
