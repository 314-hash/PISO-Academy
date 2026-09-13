/**
 * routes/players.js
 * Express router for all PISO Academy player record endpoints.
 *
 * Endpoints:
 *   POST   /api/players/sync        — Upsert full player record from frontend
 *   GET    /api/players/:accountId  — Restore player record to frontend
 *   GET    /api/players/:accountId/snapshot — Minimal snapshot (level, username)
 *   GET    /api/leaderboard         — Top 50 players by level (public)
 *   DELETE /api/players/:accountId  — Player-initiated account deletion (GDPR)
 */

const express = require('express');
const router  = express.Router();
const PlayerRecord = require('../models/PlayerRecord');

// ─── Middleware: Lightweight API key auth ─────────────────────────────────────
// Frontend sends the API secret as a Bearer token so random third parties can't
// write junk records into the DB. Replace with JWT for production multi-user auth.
function requireAuth(req, res, next) {
  const secret = process.env.API_SECRET || '';
  if (!secret) return next(); // If no secret configured, skip auth (dev mode)

  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (token !== secret) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API secret' });
  }
  next();
}

// ─── POST /api/players/sync ───────────────────────────────────────────────────
/**
 * Upserts a full player record.
 * Called by the frontend on login, level-up, quest completion, and every 5 min.
 *
 * Body: PlayerSyncPayload (see academy-web/src/services/mongoSyncService.ts)
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const {
      accountId,
      username,
      avatarMode,
      wallet,
      level,
      currentExp,
      expToNextLevel,
      totalCumulativeExp,
      rank,
      playerClass,
      unallocatedStatPoints,
      skillPoints,
      digitalPower,
      primaryAttributes,
      combatStats,
      savedPosition,
      farmingStats,
      resourceInventory,
      questProgress,
      unlockedAchievementIds,
      unlockedSkillIds,
      completedLessonIds,
      chainCredentialTiers,
    } = req.body;

    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }

    // Build update payload (only include defined fields from request)
    const updatePayload = {
      lastSyncedAt: new Date(),
      lastLoginAt: new Date(),
    };

    if (username !== undefined)           updatePayload.username = username;
    if (avatarMode !== undefined)         updatePayload.avatarMode = avatarMode;
    if (level !== undefined)              updatePayload.level = Math.max(1, Math.min(100, level));
    if (currentExp !== undefined)         updatePayload.currentExp = currentExp;
    if (expToNextLevel !== undefined)     updatePayload.expToNextLevel = expToNextLevel;
    if (totalCumulativeExp !== undefined) updatePayload.totalCumulativeExp = totalCumulativeExp;
    if (rank !== undefined)               updatePayload.rank = rank;
    if (playerClass !== undefined)        updatePayload.playerClass = playerClass;
    if (unallocatedStatPoints !== undefined) updatePayload.unallocatedStatPoints = unallocatedStatPoints;
    if (skillPoints !== undefined)        updatePayload.skillPoints = skillPoints;
    if (digitalPower !== undefined)       updatePayload.digitalPower = digitalPower;
    if (primaryAttributes !== undefined)  updatePayload.primaryAttributes = primaryAttributes;
    if (combatStats !== undefined)        updatePayload.combatStats = combatStats;
    if (savedPosition !== undefined)      updatePayload.savedPosition = savedPosition;
    if (farmingStats !== undefined)       updatePayload.farmingStats = farmingStats;
    if (resourceInventory !== undefined)  updatePayload.resourceInventory = resourceInventory;
    if (unlockedAchievementIds !== undefined) updatePayload.unlockedAchievementIds = unlockedAchievementIds;
    if (unlockedSkillIds !== undefined)   updatePayload.unlockedSkillIds = unlockedSkillIds;
    if (completedLessonIds !== undefined) updatePayload.completedLessonIds = completedLessonIds;
    if (chainCredentialTiers !== undefined) updatePayload.chainCredentialTiers = chainCredentialTiers;

    // Wallet: store address and type, NEVER the private key
    if (wallet && wallet.address) {
      updatePayload['wallet.address']    = wallet.address;
      updatePayload['wallet.walletType'] = wallet.walletType || 'burner';
    }

    // Quest progress: merge map without overwriting uncovered quests
    if (questProgress && typeof questProgress === 'object') {
      const questKeys = Object.keys(questProgress);
      for (const qid of questKeys) {
        updatePayload[`questProgress.${qid}`] = questProgress[qid];
      }
    }

    const record = await PlayerRecord.findOneAndUpdate(
      { accountId },
      { $set: updatePayload },
      {
        new: true,           // Return the updated document
        upsert: true,        // Create if not exists
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );

    console.log(`[Sync] ✅ ${accountId} → Lv.${record.level} (${record.username})`);

    return res.status(200).json({
      success: true,
      accountId: record.accountId,
      level: record.level,
      username: record.username,
      lastSyncedAt: record.lastSyncedAt,
      message: 'Player record synced to MongoDB successfully',
    });
  } catch (err) {
    console.error('[Sync] ❌ Error:', err.message);
    return res.status(500).json({ error: 'Sync failed', details: err.message });
  }
});

// ─── GET /api/players/:accountId ─────────────────────────────────────────────
/**
 * Retrieves the full player record for session restore.
 * Called on page load to rehydrate localStorage from cloud backup.
 */
router.get('/:accountId', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const record = await PlayerRecord.findOne({ accountId });

    if (!record) {
      return res.status(404).json({ error: 'Player record not found', accountId });
    }

    return res.status(200).json(record.toPublicJSON());
  } catch (err) {
    console.error('[Restore] ❌ Error:', err.message);
    return res.status(500).json({ error: 'Restore failed', details: err.message });
  }
});

// ─── GET /api/players/:accountId/snapshot ────────────────────────────────────
/**
 * Returns a minimal public snapshot (no sensitive data).
 * Used for peer HUD display, minimap labels, etc.
 */
router.get('/:accountId/snapshot', async (req, res) => {
  try {
    const { accountId } = req.params;
    const record = await PlayerRecord.findOne(
      { accountId },
      { accountId: 1, username: 1, level: 1, rank: 1, avatarMode: 1, digitalPower: 1 }
    );

    if (!record) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json({
      accountId: record.accountId,
      username:  record.username,
      level:     record.level,
      rank:      record.rank,
      avatarMode: record.avatarMode,
      digitalPower: record.digitalPower,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/players/leaderboard ────────────────────────────────────────────
/**
 * Public leaderboard — top 50 players by level, then by total cumulative EXP.
 * No auth required (public data only).
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 100);
    const leaders = await PlayerRecord
      .find({}, { accountId: 1, username: 1, level: 1, rank: 1, totalCumulativeExp: 1, digitalPower: 1 })
      .sort({ level: -1, totalCumulativeExp: -1 })
      .limit(limit);

    return res.status(200).json({
      leaderboard: leaders.map((p, i) => ({
        rank: i + 1,
        accountId: p.accountId,
        username: p.username,
        level: p.level,
        rankTitle: p.rank,
        digitalPower: p.digitalPower,
        totalExp: p.totalCumulativeExp,
      })),
      total: leaders.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/players/:accountId ──────────────────────────────────────────
/**
 * Player-initiated account deletion (GDPR right to erasure).
 * Requires the accountId to match AND a valid API secret.
 */
router.delete('/:accountId', requireAuth, async (req, res) => {
  try {
    const { accountId } = req.params;
    const result = await PlayerRecord.deleteOne({ accountId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Player record not found' });
    }

    console.log(`[Delete] 🗑️ Deleted record: ${accountId}`);
    return res.status(200).json({ success: true, message: 'Player record permanently deleted' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
