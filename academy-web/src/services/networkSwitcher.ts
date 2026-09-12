import { ethers } from 'ethers';
import {
  PISO_NETWORK,
  L1_NETWORK,
  SYSTEM_CONTRACTS,
  L1_BRIDGE_CONTRACTS,
  OP_PREDEPLOYS,
  PISO_L2_WALLET_PARAMS,
  SEPOLIA_WALLET_PARAMS,
  pisoViemChain,
  sepoliaViemChain,
  getChainLabel,
  isPisoChain,
  isL1Chain,
} from '../pisoConfig';

// ═══════════════════════════════════════════════════════════════════
//  NETWORK SWITCHER SERVICE
//  Handles wallet network detection, chain switching, and
//  MetaMask / EIP-1193 add-chain (EIP-3085) for PISO Chain L2.
// ═══════════════════════════════════════════════════════════════════

export type NetworkStatus = {
  currentChainId: number;
  isOnPisoL2: boolean;
  isOnSepolia: boolean;
  isOnUnknown: boolean;
  label: string;
};

export class NetworkSwitcher {
  private static provider(): any {
    return (window as any).ethereum;
  }

  // ─── Current Chain Detection ────────────────────────────────────────────────

  static async getCurrentChainId(): Promise<number> {
    const eth = this.provider();
    if (!eth) throw new Error('No Web3 wallet detected. Please install MetaMask.');
    const chainIdHex: string = await eth.request({ method: 'eth_chainId' });
    return parseInt(chainIdHex, 16);
  }

  static async getNetworkStatus(): Promise<NetworkStatus> {
    const chainId = await this.getCurrentChainId();
    return {
      currentChainId: chainId,
      isOnPisoL2:    isPisoChain(chainId),
      isOnSepolia:   isL1Chain(chainId),
      isOnUnknown:   !isPisoChain(chainId) && !isL1Chain(chainId),
      label:         getChainLabel(chainId),
    };
  }

  // ─── Add PISO Chain L2 to Wallet ────────────────────────────────────────────

  /**
   * Prompts MetaMask (or any EIP-1193 wallet) to add PISO Chain L2.
   * Silently succeeds if already added.
   */
  static async addPisoL2ToWallet(): Promise<void> {
    const eth = this.provider();
    if (!eth) throw new Error('No wallet detected.');

    try {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [PISO_L2_WALLET_PARAMS],
      });
    } catch (err: any) {
      // Error code 4902 = chain not added; other errors propagate
      if (err?.code !== 4902) throw err;
    }
  }

  /**
   * Prompts MetaMask to add Ethereum Sepolia (L1 for bridging).
   */
  static async addSepoliaToWallet(): Promise<void> {
    const eth = this.provider();
    if (!eth) throw new Error('No wallet detected.');

    try {
      await eth.request({
        method: 'wallet_addEthereumChain',
        params: [SEPOLIA_WALLET_PARAMS],
      });
    } catch (err: any) {
      if (err?.code !== 4902) throw err;
    }
  }

  // ─── Switch Network ─────────────────────────────────────────────────────────

  /**
   * Switches the wallet to PISO Chain L2.
   * If the chain isn't known to the wallet, it will first add it.
   */
  static async switchToPisoL2(): Promise<void> {
    const eth = this.provider();
    if (!eth) throw new Error('No wallet detected.');

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: PISO_NETWORK.chainIdHex }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        // Chain not in wallet — add it first, then switch
        await this.addPisoL2ToWallet();
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: PISO_NETWORK.chainIdHex }],
        });
      } else {
        throw err;
      }
    }
  }

  /**
   * Switches the wallet to Ethereum Sepolia (L1).
   */
  static async switchToSepolia(): Promise<void> {
    const eth = this.provider();
    if (!eth) throw new Error('No wallet detected.');

    try {
      await eth.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: L1_NETWORK.chainIdHex }],
      });
    } catch (err: any) {
      if (err?.code === 4902) {
        await this.addSepoliaToWallet();
        await eth.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: L1_NETWORK.chainIdHex }],
        });
      } else {
        throw err;
      }
    }
  }

  // ─── Guard Helpers ──────────────────────────────────────────────────────────

  /**
   * Ensures the wallet is on PISO L2. If not, prompts a switch.
   * Returns true if already on the right chain (no prompt needed).
   */
  static async ensurePisoL2(): Promise<boolean> {
    const status = await this.getNetworkStatus();
    if (status.isOnPisoL2) return true;
    await this.switchToPisoL2();
    return false;
  }

  /**
   * Ensures wallet is on Sepolia (for bridge L1 interactions).
   */
  static async ensureSepolia(): Promise<boolean> {
    const status = await this.getNetworkStatus();
    if (status.isOnSepolia) return true;
    await this.switchToSepolia();
    return false;
  }

  // ─── Chain Change Listener ──────────────────────────────────────────────────

  /**
   * Subscribe to chain change events.
   * @param callback  Called with new NetworkStatus whenever user switches chains.
   * @returns Cleanup function — call to remove the listener.
   */
  static onChainChanged(callback: (status: NetworkStatus) => void): () => void {
    const eth = this.provider();
    if (!eth) return () => {};

    const handler = async (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      callback({
        currentChainId: chainId,
        isOnPisoL2:     isPisoChain(chainId),
        isOnSepolia:    isL1Chain(chainId),
        isOnUnknown:    !isPisoChain(chainId) && !isL1Chain(chainId),
        label:          getChainLabel(chainId),
      });
    };

    eth.on('chainChanged', handler);
    return () => eth.removeListener('chainChanged', handler);
  }

  // ─── Viem Chain Objects (for use with wagmi / viem createPublicClient) ──────

  static getPisoViemChain() {
    return pisoViemChain;
  }

  static getSepoliaViemChain() {
    return sepoliaViemChain;
  }
}
