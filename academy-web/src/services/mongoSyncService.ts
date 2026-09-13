/**
 * mongoSyncService.ts
 * Frontend client that syncs PISO Academy player records to MongoDB Atlas
 * via the academy-api Express server.
 *
 * Architecture:
 *   localStorage (source of truth, instant, offline-first)
 *       ↓  sync on login / milestone / every 5 minutes
 *   academy-api (Express + Mongoose, port 4000)
 *       ↓  upserts
 *   MongoDB Atlas (cloud backup, restore-on-any-device)
 *
 * Rules:
 * - NEVER syncs private keys (only wallet address + type)
 * - Fails silently (never blocks gameplay if API is unreachable)
 * - Debounces position updates (merged into next 5-min heartbeat)
 * - Immediate sync on: login, level-up, quest claim, username change
 */

import { PlayerProgressionEngine } from './playerProgressionEngine';

// ─── Config ───────────────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_MONGO_API_URL || 'http://localhost:4000';
const API_SECRET = import.meta.env.VITE_MONGO_API_SECRET || '';
const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ────────────────────────────────────────────────────────────────────
export interface PlayerSyncPayload {
  accountId: string;
  username?: string;
  avatarMode?: string;
  wallet?: { address: string | null; walletType: 'injected' | 'burner' | null };
  level?: number;
  currentExp?: number;
  expToNextLevel?: number;
  totalCumulativeExp?: number;
  rank?: string;
  playerClass?: string;
  unallocatedStatPoints?: number;
  skillPoints?: number;
  digitalPower?: number;
  primaryAttributes?: Record<string, number>;
  combatStats?: Record<string, number>;
  savedPosition?: { x: number; y: number; z: number; heading?: number; zone?: string };
  farmingStats?: Record<string, number>;
  resourceInventory?: Record<string, number>;
  questProgress?: Record<string, { progress: number; completed: boolean; claimed: boolean }>;
  unlockedAchievementIds?: string[];
  unlockedSkillIds?: string[];
  completedLessonIds?: string[];
  chainCredentialTiers?: string[];
}

export interface SyncResult {
  success: boolean;
  error?: string;
  lastSyncedAt?: string;
  offlineQueued?: boolean;
}

// ─── Offline Queue ────────────────────────────────────────────────────────────
const OFFLINE_QUEUE_KEY = 'piso_mongo_offline_queue_v1';

function loadOfflineQueue(): PlayerSyncPayload[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: PlayerSyncPayload[]) {
  try {
    // Keep only the latest 3 queued payloads to avoid localStorage bloat
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-3)));
  } catch {/* ignore */}
}

// ─── MongoSyncService ─────────────────────────────────────────────────────────
export class MongoSyncService {
  private static instance: MongoSyncService | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private lastSyncedAt: Date | null = null;
  private isSyncing = false;
  private currentAccountId: string | null = null;

  public static get(): MongoSyncService {
    if (!MongoSyncService.instance) {
      MongoSyncService.instance = new MongoSyncService();
    }
    return MongoSyncService.instance;
  }

  private constructor() {
    // Flush offline queue when network recovers
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.flushOfflineQueue());
    }
  }

  // ─── Init ────────────────────────────────────────────────────────────────────
  /**
   * Call this once on login. Starts the 5-minute heartbeat sync.
   */
  public async init(accountId: string): Promise<void> {
    this.currentAccountId = accountId;

    // 1. Try to restore from MongoDB on first load
    await this.restoreFromCloud(accountId);

    // 2. Immediately sync current localStorage state up to cloud
    await this.syncNow('login');

    // 3. Start 5-minute heartbeat
    this.startHeartbeat(accountId);

    // 4. Flush any previously queued offline syncs
    await this.flushOfflineQueue();
  }

  // ─── Heartbeat ───────────────────────────────────────────────────────────────
  private startHeartbeat(accountId: string) {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(async () => {
      await this.syncNow('heartbeat');
    }, SYNC_INTERVAL_MS);
    console.log(`[MongoSync] 💓 Heartbeat started for ${accountId} (every 5 min)`);
  }

  public stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // ─── Build Payload from localStorage ─────────────────────────────────────────
  private buildPayloadFromLocalStorage(accountId: string): PlayerSyncPayload {
    const profile = PlayerProgressionEngine.loadProfile();
    const stats   = PlayerProgressionEngine.loadStats?.() ?? null;
    const inventory = (() => {
      try {
        const raw = localStorage.getItem('piso_mining_inventory_v1');
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    })();
    const questProgress = (() => {
      try {
        const raw = localStorage.getItem('piso_quest_progress_v1');
        return raw ? JSON.parse(raw) : {};
      } catch { return {}; }
    })();
    const achievements = (() => {
      try {
        const raw = localStorage.getItem('piso_achievements_v1');
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();
    const completedLessons = (() => {
      try {
        const raw = localStorage.getItem('piso_completed_lessons');
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();
    const credentials = (() => {
      try {
        const raw = localStorage.getItem('piso_chain_credentials_v1');
        return raw ? JSON.parse(raw) : [];
      } catch { return []; }
    })();
    const savedPosition = (() => {
      try {
        const raw = localStorage.getItem('piso_player_position_v1');
        return raw ? JSON.parse(raw) : null;
      } catch { return null; }
    })();
    const walletInfo = (() => {
      try {
        const raw = localStorage.getItem('piso_wallet_state_v1');
        if (!raw) return null;
        const ws = JSON.parse(raw);
        // NEVER include privateKey/mnemonic
        return { address: ws.address || null, walletType: ws.walletType || 'burner' };
      } catch { return null; }
    })();

    return {
      accountId,
      username:              profile?.username,
      avatarMode:            profile?.avatarMode,
      wallet:                walletInfo ?? undefined,
      level:                 profile?.level,
      currentExp:            profile?.currentExp,
      expToNextLevel:        profile?.expToNextLevel,
      totalCumulativeExp:    profile?.totalCumulativeExp,
      rank:                  profile?.rank,
      playerClass:           profile?.playerClass,
      unallocatedStatPoints: profile?.unallocatedStatPoints,
      skillPoints:           profile?.skillPoints,
      digitalPower:          profile?.digitalPower,
      primaryAttributes:     profile?.primaryAttributes,
      combatStats:           stats ? {
        level:              stats.level,
        currentHp:          stats.currentHp,
        maxHp:              stats.maxHp,
        statAtk:            stats.statAtk,
        statDef:            stats.statDef,
        statHp:             stats.statHp,
        statCrit:           stats.statCrit,
        blocksMinedTotal:   stats.blocksMinedTotal,
        monstersSlain:      stats.monstersSlain,
        titansDefeated:     stats.titansDefeated,
        totalBountiesClaimedPiso: stats.totalBountiesClaimedPiso,
      } : undefined,
      savedPosition: savedPosition ?? undefined,
      resourceInventory:      inventory,
      questProgress,
      unlockedAchievementIds: Array.isArray(achievements) ? achievements : [],
      completedLessonIds:     Array.isArray(completedLessons) ? completedLessons : [],
      chainCredentialTiers:   Array.isArray(credentials) ? credentials : [],
    };
  }

  // ─── Sync Now ────────────────────────────────────────────────────────────────
  /**
   * Immediately pushes the current localStorage state to MongoDB.
   * Safe to call from anywhere — fails silently if API is down.
   *
   * @param trigger - Label for logging (login / levelup / quest / heartbeat / etc.)
   */
  public async syncNow(trigger = 'manual'): Promise<SyncResult> {
    if (!this.currentAccountId) return { success: false, error: 'No accountId set' };
    if (this.isSyncing) return { success: false, error: 'Sync already in progress' };

    this.isSyncing = true;
    const payload = this.buildPayloadFromLocalStorage(this.currentAccountId);

    try {
      const res = await fetch(`${API_BASE}/api/players/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000), // 10s timeout
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      this.lastSyncedAt = new Date(data.lastSyncedAt);
      console.log(`[MongoSync] ✅ Synced (${trigger}) → Lv.${payload.level} @ ${this.lastSyncedAt.toLocaleTimeString()}`);
      this.isSyncing = false;
      return { success: true, lastSyncedAt: data.lastSyncedAt };
    } catch (err: any) {
      const msg = err?.message || 'Network error';
      console.warn(`[MongoSync] ⚠️ Sync failed (${trigger}): ${msg} — queuing offline`);
      this.enqueueOffline(payload);
      this.isSyncing = false;
      return { success: false, error: msg, offlineQueued: true };
    }
  }

  // ─── Restore from Cloud ───────────────────────────────────────────────────────
  /**
   * On login, fetches the cloud record and merges it into localStorage
   * if the cloud record is MORE recent than local state.
   * This enables cross-device or browser-clear recovery.
   */
  public async restoreFromCloud(accountId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/players/${accountId}`, {
        headers: {
          ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
        },
        signal: AbortSignal.timeout(8_000),
      });

      if (res.status === 404) {
        console.log('[MongoSync] 🆕 No cloud record found — this is a new player');
        return false;
      }

      if (!res.ok) return false;

      const cloudRecord = await res.json();
      const cloudSyncedAt = cloudRecord.lastSyncedAt
        ? new Date(cloudRecord.lastSyncedAt).getTime()
        : 0;

      // Check local last-save timestamp
      const localProfile = PlayerProgressionEngine.loadProfile();
      const localTimestamp = localProfile?.lastSyncedAt
        ? new Date(localProfile.lastSyncedAt).getTime()
        : 0;

      if (cloudSyncedAt > localTimestamp) {
        console.log('[MongoSync] ☁️ Cloud record is newer — restoring to localStorage');
        this.mergeCloudRecordToLocalStorage(cloudRecord);
        return true;
      } else {
        console.log('[MongoSync] 💾 Local record is newer — skipping restore');
        return false;
      }
    } catch (err: any) {
      console.warn('[MongoSync] ⚠️ Cloud restore unavailable:', err.message);
      return false;
    }
  }

  // ─── Merge Cloud → localStorage ───────────────────────────────────────────────
  private mergeCloudRecordToLocalStorage(record: any) {
    try {
      // Merge profile
      if (record.username || record.level) {
        const existingProfile = PlayerProgressionEngine.loadProfile() ?? {};
        const merged = {
          ...existingProfile,
          username:              record.username ?? existingProfile.username,
          level:                 record.level ?? existingProfile.level,
          currentExp:            record.currentExp ?? existingProfile.currentExp,
          expToNextLevel:        record.expToNextLevel ?? existingProfile.expToNextLevel,
          totalCumulativeExp:    record.totalCumulativeExp ?? existingProfile.totalCumulativeExp,
          rank:                  record.rank ?? existingProfile.rank,
          playerClass:           record.playerClass ?? existingProfile.playerClass,
          unallocatedStatPoints: record.unallocatedStatPoints ?? existingProfile.unallocatedStatPoints,
          skillPoints:           record.skillPoints ?? existingProfile.skillPoints,
          digitalPower:          record.digitalPower ?? existingProfile.digitalPower,
          primaryAttributes:     record.primaryAttributes ?? existingProfile.primaryAttributes,
          avatarMode:            record.avatarMode ?? existingProfile.avatarMode,
          lastSyncedAt:          record.lastSyncedAt,
        };
        PlayerProgressionEngine.saveProfile(merged as any);
      }

      // Restore position
      if (record.savedPosition) {
        PlayerProgressionEngine.savePlayerPosition(record.savedPosition);
      }

      // Restore inventory
      if (record.resourceInventory) {
        localStorage.setItem('piso_mining_inventory_v1', JSON.stringify(record.resourceInventory));
      }

      // Restore quest progress
      if (record.questProgress) {
        const qp = record.questProgress instanceof Map
          ? Object.fromEntries(record.questProgress)
          : record.questProgress;
        localStorage.setItem('piso_quest_progress_v1', JSON.stringify(qp));
      }

      // Restore completed lessons
      if (Array.isArray(record.completedLessonIds) && record.completedLessonIds.length > 0) {
        localStorage.setItem('piso_completed_lessons', JSON.stringify(record.completedLessonIds));
      }

      // Restore credentials
      if (Array.isArray(record.chainCredentialTiers) && record.chainCredentialTiers.length > 0) {
        localStorage.setItem('piso_chain_credentials_v1', JSON.stringify(record.chainCredentialTiers));
      }

      console.log(`[MongoSync] ✅ Restored Lv.${record.level} ${record.username} from MongoDB`);

      // Dispatch global event so React components re-render
      window.dispatchEvent(new CustomEvent('piso-profile-restored', {
        detail: { source: 'mongodb', level: record.level, username: record.username },
      }));
    } catch (err: any) {
      console.warn('[MongoSync] ⚠️ Merge failed:', err.message);
    }
  }

  // ─── Offline Queue ────────────────────────────────────────────────────────────
  private enqueueOffline(payload: PlayerSyncPayload) {
    const queue = loadOfflineQueue();
    queue.push(payload);
    saveOfflineQueue(queue);
  }

  public async flushOfflineQueue(): Promise<void> {
    const queue = loadOfflineQueue();
    if (queue.length === 0) return;

    console.log(`[MongoSync] 🔄 Flushing ${queue.length} offline queued syncs...`);
    const remaining: PlayerSyncPayload[] = [];

    for (const payload of queue) {
      try {
        const res = await fetch(`${API_BASE}/api/players/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        console.log(`[MongoSync] ✅ Offline flush: ${payload.accountId}`);
      } catch {
        remaining.push(payload); // Re-queue if still failing
      }
    }

    saveOfflineQueue(remaining);
    if (remaining.length > 0) {
      console.warn(`[MongoSync] ⚠️ ${remaining.length} syncs still offline-queued`);
    }
  }

  // ─── Public Helpers ───────────────────────────────────────────────────────────
  public getLastSyncedAt(): Date | null {
    return this.lastSyncedAt;
  }

  public isAvailable(): boolean {
    return Boolean(API_BASE) && navigator.onLine;
  }
}

// Export singleton accessor
export const mongoSync = MongoSyncService.get();
