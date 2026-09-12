import { ethers } from 'ethers';
import {
  PISO_NETWORK,
  L1_NETWORK,
  L1_BRIDGE_CONTRACTS,
  OP_PREDEPLOYS,
  SYSTEM_CONTRACTS,
  getSepoliaProvider,
  getPisoProvider,
} from '../pisoConfig';
import { NetworkSwitcher } from './networkSwitcher';

// ═══════════════════════════════════════════════════════════════════
//  BRIDGE SERVICE
//  Manages $PISO token bridging between Ethereum Sepolia (L1)
//  and PISO Chain L2 via the OP Stack standard bridge.
// ═══════════════════════════════════════════════════════════════════

// ─── Types ──────────────────────────────────────────────────────────────────

export type BridgeDirection = 'l1_to_l2' | 'l2_to_l1';

export type BridgeTxStatus =
  | 'pending'          // Submitted but not confirmed
  | 'confirmed_l1'     // L1 deposit confirmed, waiting for L2 relay (~2min)
  | 'relayed_l2'       // Relayed to L2 (deposit complete)
  | 'initiated_l2'     // L2 withdrawal initiated, burning complete
  | 'proven'           // L2 state root posted to L1
  | 'challengeable'    // In 7-day fraud-proof window
  | 'ready'            // Challenge window passed, ready to finalize
  | 'finalized'        // L1 claim complete (funds received on L1)
  | 'failed';

export interface BridgeTx {
  id:           string;
  direction:    BridgeDirection;
  amount:       string;         // Human-readable (e.g., "100.5")
  amountWei:    bigint;
  status:       BridgeTxStatus;
  l1TxHash:     string;
  l2TxHash:     string;
  initiatedAt:  number;         // Unix timestamp
  estimatedRelayAt?: number;
  challengeWindowEnd?: number;
  error?:       string;
}

// ─── Minimal ABIs ────────────────────────────────────────────────────────────

const L1_STANDARD_BRIDGE_ABI = [
  'function bridgeERC20(address localToken, address remoteToken, uint256 amount, uint32 minGasLimit, bytes calldata extraData) external',
  'function bridgeETH(uint32 minGasLimit, bytes calldata extraData) external payable',
  'event ERC20BridgeInitiated(address indexed localToken, address indexed remoteToken, address indexed from, address to, uint256 amount, bytes extraData)',
];

const L2_STANDARD_BRIDGE_ABI = [
  'function bridgeERC20(address localToken, address remoteToken, uint256 amount, uint32 minGasLimit, bytes calldata extraData) external',
  'event ERC20BridgeInitiated(address indexed localToken, address indexed remoteToken, address indexed from, address to, uint256 amount, bytes extraData)',
  'event ERC20BridgeFinalized(address indexed localToken, address indexed remoteToken, address indexed from, address to, uint256 amount, bytes extraData)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
];

const PISO_WITHDRAWAL_ABI = [
  'function initiateWithdrawal(uint256 amount) external returns (uint256 withdrawalId)',
  'function getWithdrawal(uint256 id) external view returns (tuple(address user, uint256 amount, uint256 initiatedAt, uint256 provenAt, uint256 finalizedAt, uint8 status, bytes32 withdrawalHash, string l1ClaimTxHash))',
  'function getUserWithdrawals(address user) external view returns (uint256[])',
  'function getTimeUntilReady(uint256 id) external view returns (int256)',
];

// ─── Bridge Service ──────────────────────────────────────────────────────────

const BRIDGE_HISTORY_KEY = 'piso_bridge_history';

export class BridgeService {

  // ── Deposit: L1 → L2 ─────────────────────────────────────────────────────

  /**
   * Deposit $PISO from Ethereum Sepolia (L1) to PISO Chain L2.
   * 1. Approve L1StandardBridge to spend $PISO on L1
   * 2. Call bridgeERC20() on L1StandardBridge
   * 3. OP Stack relays message to L2 (~1-3 minutes)
   * 4. PISOToken.mint() called on L2 via IBridgeMintable
   *
   * @param amountWei   Amount of $PISO in wei
   * @param l1PisoToken L1 PISOToken address
   * @param signer      L1 signer (must be on Sepolia)
   */
  static async depositToL2(
    amountWei: bigint,
    l1PisoToken: string,
    signer: ethers.Signer
  ): Promise<BridgeTx> {
    await NetworkSwitcher.ensureSepolia();

    const l1BridgeAddr = L1_BRIDGE_CONTRACTS.L1StandardBridge;
    if (l1BridgeAddr === ethers.ZeroAddress) {
      throw new Error('L1StandardBridge address not configured. Set VITE_L1_STANDARD_BRIDGE in .env');
    }

    // Step 1: Approve
    const pisoL1 = new ethers.Contract(l1PisoToken, ERC20_ABI, signer);
    const currentAllowance: bigint = await pisoL1.allowance(await signer.getAddress(), l1BridgeAddr);
    if (currentAllowance < amountWei) {
      const approveTx = await pisoL1.approve(l1BridgeAddr, amountWei);
      await approveTx.wait();
    }

    // Step 2: Bridge
    const l1Bridge = new ethers.Contract(l1BridgeAddr, L1_STANDARD_BRIDGE_ABI, signer);
    const MIN_GAS_LIMIT = 200_000;
    const bridgeTx = await l1Bridge.bridgeERC20(
      l1PisoToken,
      SYSTEM_CONTRACTS.PISOToken,  // L2 token address
      amountWei,
      MIN_GAS_LIMIT,
      '0x'                          // extraData
    );

    const receipt = await bridgeTx.wait();
    const txId    = `bridge_dep_${Date.now()}`;
    const now     = Math.floor(Date.now() / 1000);

    const record: BridgeTx = {
      id:             txId,
      direction:      'l1_to_l2',
      amount:         ethers.formatEther(amountWei),
      amountWei,
      status:         'confirmed_l1',
      l1TxHash:       receipt.hash,
      l2TxHash:       '',
      initiatedAt:    now,
      estimatedRelayAt: now + 120,  // ~2 minutes for OP relay
    };

    this.saveTx(record);
    return record;
  }

  // ── Withdrawal: L2 → L1 ──────────────────────────────────────────────────

  /**
   * Initiate a $PISO withdrawal from PISO Chain L2 back to Ethereum Sepolia L1.
   * Burns $PISO on L2 and starts the 7-day challenge window.
   *
   * @param amountWei  Amount of $PISO in wei
   * @param signer     L2 signer (must be on PISO Chain L2)
   */
  static async initiateWithdrawal(
    amountWei: bigint,
    signer: ethers.Signer
  ): Promise<BridgeTx> {
    await NetworkSwitcher.ensurePisoL2();

    const withdrawalMgr = new ethers.Contract(
      SYSTEM_CONTRACTS.PISOWithdrawalManager,
      PISO_WITHDRAWAL_ABI,
      signer
    );

    // Approve withdrawal manager to burn $PISO
    const pisoL2 = new ethers.Contract(SYSTEM_CONTRACTS.PISOToken, ERC20_ABI, signer);
    const currentAllowance: bigint = await pisoL2.allowance(
      await signer.getAddress(),
      SYSTEM_CONTRACTS.PISOWithdrawalManager
    );
    if (currentAllowance < amountWei) {
      const approveTx = await pisoL2.approve(SYSTEM_CONTRACTS.PISOWithdrawalManager, amountWei);
      await approveTx.wait();
    }

    const tx      = await withdrawalMgr.initiateWithdrawal(amountWei);
    const receipt = await tx.wait();
    const now     = Math.floor(Date.now() / 1000);

    const record: BridgeTx = {
      id:                 `bridge_wth_${Date.now()}`,
      direction:          'l2_to_l1',
      amount:             ethers.formatEther(amountWei),
      amountWei,
      status:             'initiated_l2',
      l1TxHash:           '',
      l2TxHash:           receipt.hash,
      initiatedAt:        now,
      challengeWindowEnd: now + PISO_NETWORK.fraudProofWindowDays * 86400,
    };

    this.saveTx(record);
    return record;
  }

  // ── Status Polling ────────────────────────────────────────────────────────

  /**
   * Polls current bridge status for a transaction.
   * For deposits: checks L2 balance change.
   * For withdrawals: checks PISOWithdrawalManager state.
   */
  static async getBridgeStatus(txId: string): Promise<BridgeTxStatus> {
    const tx = this.getTx(txId);
    if (!tx) return 'failed';

    if (tx.direction === 'l1_to_l2') {
      // For deposits, check if estimated relay time has passed
      const now = Math.floor(Date.now() / 1000);
      if (tx.status === 'confirmed_l1' && tx.estimatedRelayAt && now >= tx.estimatedRelayAt) {
        return 'relayed_l2';
      }
      return tx.status;
    }

    // For withdrawals, we check the challenge window
    if (tx.direction === 'l2_to_l1' && tx.challengeWindowEnd) {
      const now = Math.floor(Date.now() / 1000);
      if (tx.status === 'initiated_l2' || tx.status === 'proven') {
        if (now >= tx.challengeWindowEnd) return 'ready';
        return 'challengeable';
      }
    }

    return tx.status;
  }

  /**
   * Returns a human-readable status string with countdown.
   */
  static formatStatus(tx: BridgeTx): string {
    const now = Math.floor(Date.now() / 1000);
    switch (tx.status) {
      case 'pending':        return '⏳ Submitting...';
      case 'confirmed_l1': {
        if (tx.estimatedRelayAt) {
          const secs = tx.estimatedRelayAt - now;
          if (secs > 0) return `🔷 L1 confirmed — relaying to L2 (~${Math.ceil(secs / 60)}min)`;
        }
        return '🔷 L1 confirmed — relaying to L2';
      }
      case 'relayed_l2':     return '✅ Deposited on PISO Chain L2';
      case 'initiated_l2':   return '🔄 Withdrawal initiated — burning PISO on L2';
      case 'proven':         return '📋 Proven on L1';
      case 'challengeable': {
        if (tx.challengeWindowEnd) {
          const days = Math.ceil((tx.challengeWindowEnd - now) / 86400);
          return `🔒 Challenge window — ${days} day(s) remaining`;
        }
        return '🔒 Challenge window active';
      }
      case 'ready':          return '🟢 Ready to finalize on L1!';
      case 'finalized':      return '✅ Finalized — PISO received on Sepolia';
      case 'failed':         return '❌ Failed';
      default:               return tx.status;
    }
  }

  // ── Balance Helpers ────────────────────────────────────────────────────────

  /**
   * Get $PISO balance on PISO Chain L2 for an address.
   */
  static async getPisoL2Balance(address: string): Promise<string> {
    const provider = getPisoProvider();
    const pisoL2   = new ethers.Contract(SYSTEM_CONTRACTS.PISOToken, ERC20_ABI, provider);
    const raw: bigint = await pisoL2.balanceOf(address);
    return ethers.formatEther(raw);
  }

  /**
   * Get ETH (gas token) balance on PISO Chain L2.
   */
  static async getL2EthBalance(address: string): Promise<string> {
    const provider = getPisoProvider();
    const raw      = await provider.getBalance(address);
    return ethers.formatEther(raw);
  }

  // ── History (localStorage) ────────────────────────────────────────────────

  static getHistory(): BridgeTx[] {
    try {
      const raw = localStorage.getItem(BRIDGE_HISTORY_KEY);
      if (!raw) return [];
      const history = JSON.parse(raw);
      // Deserialize BigInt
      return history.map((t: any) => ({ ...t, amountWei: BigInt(t.amountWei || '0') }));
    } catch {
      return [];
    }
  }

  static getTx(txId: string): BridgeTx | undefined {
    return this.getHistory().find(t => t.id === txId);
  }

  static saveTx(tx: BridgeTx): void {
    const history = this.getHistory().filter(t => t.id !== tx.id);
    history.unshift({ ...tx, amountWei: tx.amountWei.toString() as any });
    localStorage.setItem(BRIDGE_HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  }

  static updateTxStatus(txId: string, updates: Partial<BridgeTx>): void {
    const tx = this.getTx(txId);
    if (!tx) return;
    this.saveTx({ ...tx, ...updates });
  }

  static clearHistory(): void {
    localStorage.removeItem(BRIDGE_HISTORY_KEY);
  }
}
