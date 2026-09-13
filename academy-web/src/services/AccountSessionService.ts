/**
 * AccountSessionService.ts
 * Centralized Account, Session, and Security Event Engine for PISO Academy Metaverse.
 * 
 * Features:
 * - Stable Account ID decoupled from wallet address.
 * - Auto-restores existing sessions without creating duplicate wallets or resetting progress.
 * - Reconnects previously linked Injected Wallets (MetaMask) or PISO Dev Keypairs.
 * - Persistent Security Notifications Center (Login, Wallet Connected, Wallet Changed, Username Changed).
 * - Zero plaintext private key exposure in UI.
 */

import { ethers } from 'ethers';
import { WalletService, WalletState } from './walletService';
import { PlayerProgressionEngine } from './playerProgressionEngine';
import { MongoSyncService } from './mongoSyncService';

export type WalletType = 'injected' | 'burner' | null;

export interface SessionData {
  sessionId: string;
  accountId: string;
  username: string;
  walletAddress: string | null;
  walletType: WalletType;
  createdAt: number;
  lastLoginAt: number;
  lastActiveAt: number;
  userAgent?: string;
}

export type SecurityEventType =
  | 'new_login'
  | 'wallet_connected'
  | 'wallet_changed'
  | 'username_changed'
  | 'security_alert'
  | 'session_restored';

export interface SecurityNotification {
  id: string;
  type: SecurityEventType;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  metadata?: Record<string, any>;
}

const STORAGE_ACCOUNT_ID = 'piso_account_id_v1';
const STORAGE_SESSION = 'piso_session_v1';
const STORAGE_WALLET_PREF = 'piso_preferred_wallet_type';
const STORAGE_NOTIFICATIONS = 'piso_security_notifications_v1';

export class AccountSessionService {
  private static instance: AccountSessionService | null = null;

  public static get(): AccountSessionService {
    if (!AccountSessionService.instance) {
      AccountSessionService.instance = new AccountSessionService();
    }
    return AccountSessionService.instance;
  }

  private currentSession: SessionData | null = null;
  private notifications: SecurityNotification[] = [];

  private constructor() {
    this.loadNotifications();
  }

  // ─── 1. Account & Session Initialization ─────────────────────────────────────

  /**
   * Initializes or restores the authenticated player session on startup.
   * NEVER creates a new wallet or resets profile if an account already exists.
   */
  public async initializeSession(): Promise<{
    session: SessionData;
    isNewUser: boolean;
    walletState: WalletState;
  }> {
    const existingAccountId = this.getStoredAccountId();
    const existingSession = this.getStoredSession();
    const profile = PlayerProgressionEngine.getProfile();

    let isNewUser = false;
    let accountId = existingAccountId || profile.accountId;

    if (!accountId) {
      // Brand new user: provision stable account ID
      isNewUser = true;
      accountId = `acc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem(STORAGE_ACCOUNT_ID, accountId);
    }

    const now = Date.now();
    const sessionId = existingSession?.sessionId || `sess_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const preferredWalletType = (localStorage.getItem(STORAGE_WALLET_PREF) as WalletType) || (existingSession?.walletType || 'burner');

    // Restore or provision linked wallet
    const walletState = await this.resolveSessionWallet(preferredWalletType, isNewUser);

    const session: SessionData = {
      sessionId,
      accountId,
      username: profile.username || 'Janus',
      walletAddress: walletState.address,
      walletType: walletState.type,
      createdAt: existingSession?.createdAt || profile.createdAt || now,
      lastLoginAt: now,
      lastActiveAt: now,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    };

    this.currentSession = session;
    this.saveSession(session);

    // Sync account ID & wallet address to player profile
    if (!profile.accountId || profile.accountId !== accountId || profile.walletAddress !== walletState.address) {
      profile.accountId = accountId;
      profile.walletAddress = walletState.address || undefined;
      profile.createdAt = session.createdAt;
      profile.lastLoginAt = now;
      PlayerProgressionEngine.saveProfile(profile);
    }

    // Record appropriate security notification
    if (isNewUser) {
      this.addNotification(
        'new_login',
        '🔐 Welcome to PISO Academy!',
        `Your Sovereign Account (${accountId.slice(0, 8)}...) has been initialized with a PISO Dev Wallet.`
      );
    } else {
      this.addNotification(
        'session_restored',
        '🔐 Session Restored',
        `Welcome back, ${session.username}! Your progress, inventory, and linked wallet have been restored.`
      );
    }

    // ── MongoDB Backup Sync ──────────────────────────────────────────────────
    // Non-blocking: init starts cloud restore + 5-min heartbeat silently.
    // If the API is unreachable, gameplay continues normally from localStorage.
    MongoSyncService.get().init(accountId).catch((err) =>
      console.warn('[AccountSession] MongoDB sync init skipped:', err?.message)
    );

    return { session, isNewUser, walletState };
  }

  /**
   * Resolves the linked wallet on startup without creating redundant wallets.
   */
  private async resolveSessionWallet(
    preferredType: WalletType,
    isNewUser: boolean
  ): Promise<WalletState> {
    // A. If preferred type is Injected (MetaMask/Rabby)
    if (preferredType === 'injected' && typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum as any);
        const accounts = await provider.send('eth_accounts', []);
        if (accounts && accounts.length > 0) {
          const address = accounts[0];
          const balWei = await provider.getBalance(address);
          const balance = ethers.formatEther(balWei);
          return {
            address,
            balance,
            type: 'injected',
            isConnected: true,
            chainId: 2026001,
          };
        }
      } catch (e) {
        console.warn('Silent injected wallet reconnect error:', e);
      }
    }

    // B. Restore existing Burner/Dev Wallet
    const burner = WalletService.getOrCreateBurnerWallet();
    const bal = await WalletService.getBalance(burner.address);

    return {
      address: burner.address,
      balance: bal,
      type: 'burner',
      isConnected: true,
      chainId: 2026001,
    };
  }

  // ─── 2. Wallet Connection & Switch Notification ──────────────────────────────

  /**
   * Called when player connects or switches their wallet.
   */
  public recordWalletChange(
    newAddress: string,
    type: 'injected' | 'burner'
  ): void {
    if (!this.currentSession) return;

    const oldAddress = this.currentSession.walletAddress;
    this.currentSession.walletAddress = newAddress;
    this.currentSession.walletType = type;
    this.currentSession.lastActiveAt = Date.now();
    this.saveSession(this.currentSession);
    localStorage.setItem(STORAGE_WALLET_PREF, type);

    // Update Player Profile
    const profile = PlayerProgressionEngine.getProfile();
    profile.walletAddress = newAddress;
    PlayerProgressionEngine.saveProfile(profile);

    if (oldAddress && oldAddress.toLowerCase() !== newAddress.toLowerCase()) {
      this.addNotification(
        'wallet_changed',
        '⚠️ Connected Wallet Changed',
        `Active wallet changed from ${oldAddress.slice(0, 6)}...${oldAddress.slice(-4)} to ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}.`
      );
    } else {
      this.addNotification(
        'wallet_connected',
        '🔗 Wallet Connected',
        `Successfully linked ${type === 'injected' ? 'MetaMask' : 'PISO Game Wallet'}: ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}.`
      );
    }
  }

  // ─── 3. Persistent Security Notifications Center ─────────────────────────────

  public addNotification(
    type: SecurityEventType,
    title: string,
    message: string,
    metadata?: Record<string, any>
  ): SecurityNotification {
    const notif: SecurityNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      title,
      message,
      timestamp: Date.now(),
      read: false,
      metadata,
    };

    this.notifications.unshift(notif);
    // Keep last 40 notifications
    if (this.notifications.length > 40) {
      this.notifications = this.notifications.slice(0, 40);
    }
    this.saveNotifications();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('piso-security-notification', { detail: { notification: notif } }));
    }

    return notif;
  }

  public getNotifications(): SecurityNotification[] {
    return [...this.notifications];
  }

  public getUnreadCount(): number {
    return this.notifications.filter((n) => !n.read).length;
  }

  public markAllAsRead(): void {
    this.notifications = this.notifications.map((n) => ({ ...n, read: true }));
    this.saveNotifications();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('piso-security-notifications-read'));
    }
  }

  public clearNotifications(): void {
    this.notifications = [];
    this.saveNotifications();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('piso-security-notifications-read'));
    }
  }

  private loadNotifications(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_NOTIFICATIONS);
      if (raw) {
        this.notifications = JSON.parse(raw);
      }
    } catch {
      this.notifications = [];
    }
  }

  private saveNotifications(): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_NOTIFICATIONS, JSON.stringify(this.notifications));
    } catch {}
  }

  // ─── 4. Session Getters & Storage ────────────────────────────────────────────

  public getSession(): SessionData | null {
    return this.currentSession || this.getStoredSession();
  }

  public getStoredAccountId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(STORAGE_ACCOUNT_ID);
  }

  public getStoredSession(): SessionData | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(STORAGE_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  private saveSession(session: SessionData): void {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_SESSION, JSON.stringify(session));
    } catch {}
  }
}
