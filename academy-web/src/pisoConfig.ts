import { defineChain } from 'viem';
import { JsonRpcProvider } from 'ethers';

// ═══════════════════════════════════════════════════════════════════
//  PISO CHAIN — LAYER 2 CONFIGURATION
//  Optimistic Rollup (OP Stack) anchored to Ethereum Sepolia (L1)
// ═══════════════════════════════════════════════════════════════════

/** Layer 1 anchor chain — Ethereum Sepolia testnet */
export const L1_NETWORK = {
  chainId: 11155111,
  chainIdHex: '0xaa36a7',
  name: 'Ethereum Sepolia',
  symbol: 'ETH',
  currencyName: 'Ether',
  decimals: 18,
  rpcUrl: import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
  rpcFallback: 'https://ethereum-sepolia-rpc.publicnode.com',
  wsUrl: 'wss://ethereum-sepolia-rpc.publicnode.com',
  explorerUrl: 'https://sepolia.etherscan.io',
} as const;

/** PISO Chain — Layer 2 (Optimistic Rollup on Sepolia) */
export const PISO_NETWORK = {
  // ── Identity ──────────────────────────────────────────────────
  chainId: 202600101,
  chainIdHex: '0xC154165',
  name: 'PISO Chain L2',
  network: 'piso-l2',
  symbol: 'ETH',           // Gas token on L2 is bridged ETH (OP Stack standard)
  currencyName: 'Ether',
  decimals: 18,

  // ── Game / Academy Token ──────────────────────────────────────
  gameToken: {
    symbol: 'PISO',
    name: 'PISO Token',
    decimals: 18,
    maxSupply: 100_000_000, // 100M hard cap
  },

  // ── Network Endpoints ─────────────────────────────────────────
  rpcUrl: import.meta.env.VITE_PISO_RPC_URL || 'https://piso-rpc-dev.loca.lt',
  rpcFallback: 'http://127.0.0.1:9545',   // Local OP Stack devnet port
  wsUrl: import.meta.env.VITE_PISO_WS_URL || 'wss://piso-ws-dev.loca.lt',
  explorerUrl: 'https://piso-blockchain.vercel.app/explorer',
  faucetUrl: 'https://piso-blockchain.vercel.app/',

  // ── Rollup Metadata ───────────────────────────────────────────
  rollupType: 'optimistic' as const,
  l1ChainId: 11155111,
  blockTimeSeconds: 2.0,           // OP Stack target block time
  fraudProofWindowDays: 7,
  isL2: true,
  sequencerUrl: import.meta.env.VITE_PISO_SEQUENCER_URL || 'https://piso-sequencer.loca.lt',
} as const;

// ═══════════════════════════════════════════════════════════════════
//  SYSTEM CONTRACT ADDRESSES  (pre-deployed on PISO Chain L2)
// ═══════════════════════════════════════════════════════════════════

/** OP Stack precompile / predeploy addresses on every OP chain */
export const OP_PREDEPLOYS = {
  L2CrossDomainMessenger: '0x4200000000000000000000000000000000000007',
  L2ToL1MessagePasser:    '0x4200000000000000000000000000000000000016',
  L2StandardBridge:       '0x4200000000000000000000000000000000000010',
  OptimismMintableERC20Factory: '0x4200000000000000000000000000000000000012',
  L1Block:                '0x4200000000000000000000000000000000000015',
  GasPriceOracle:         '0x420000000000000000000000000000000000000F',
  SequencerFeeVault:      '0x4200000000000000000000000000000000000011',
  WETHForL2:              '0x4200000000000000000000000000000000000006',
} as const;

/** L1-side OP Stack contracts (deployed on Sepolia) */
export const L1_BRIDGE_CONTRACTS = {
  OptimismPortal:       import.meta.env.VITE_L1_OPTIMISM_PORTAL       || '0x0000000000000000000000000000000000000000',
  L1CrossDomainMessenger: import.meta.env.VITE_L1_CROSS_DOMAIN_MESSENGER || '0x0000000000000000000000000000000000000000',
  L1StandardBridge:     import.meta.env.VITE_L1_STANDARD_BRIDGE        || '0x0000000000000000000000000000000000000000',
  L2OutputOracle:       import.meta.env.VITE_L1_L2_OUTPUT_ORACLE        || '0x0000000000000000000000000000000000000000',
  SystemConfig:         import.meta.env.VITE_L1_SYSTEM_CONFIG           || '0x0000000000000000000000000000000000000000',
} as const;

/** PISO Academy game contracts deployed on L2 */
export const SYSTEM_CONTRACTS = {
  // Core NFT / Token
  PISOToken:              import.meta.env.VITE_PISO_TOKEN_ADDR            || '0x0000000000000000000000000000000000001001',
  PISOCertificateNFT:     import.meta.env.VITE_PISO_CERT_NFT_ADDR         || '0x0000000000000000000000000000000000001014',
  PISOVerificationRegistry: import.meta.env.VITE_PISO_REGISTRY_ADDR       || '0x0000000000000000000000000000000000001002',

  // Economy
  PISOFaucet:             import.meta.env.VITE_PISO_FAUCET_ADDR            || '0x0000000000000000000000000000000000001003',
  PISOFarmingVault:       import.meta.env.VITE_PISO_FARMING_VAULT_ADDR     || '0x0000000000000000000000000000000000001004',
  PISOFarmingRateLimiter: import.meta.env.VITE_PISO_RATE_LIMITER_ADDR      || '0x0000000000000000000000000000000000001007',
  PISOMarketplace:        import.meta.env.VITE_PISO_MARKETPLACE_ADDR       || '0x0000000000000000000000000000000000001008',

  // Game Assets (ERC-1155 / ERC-721)
  PISOItemsRelics:        import.meta.env.VITE_PISO_ITEMS_ADDR             || '0x0000000000000000000000000000000000001010',
  PISOWeaponsGears:       import.meta.env.VITE_PISO_WEAPONS_ADDR           || '0x0000000000000000000000000000000000001011',
  PISOPetsCompanions:     import.meta.env.VITE_PISO_PETS_ADDR              || '0x0000000000000000000000000000000000001012',

  // PvP / Combat
  PISOPvPArena:           import.meta.env.VITE_PISO_PVP_ARENA_ADDR         || '0x0000000000000000000000000000000000001013',
  PISOMonsterBountyManager: import.meta.env.VITE_PISO_BOUNTY_ADDR          || '0x0000000000000000000000000000000000001015',

  // Governance / System
  PISOGovernor:           import.meta.env.VITE_PISO_GOVERNOR_ADDR          || '0x0000000000000000000000000000000000001005',
  PISOPaymaster:          import.meta.env.VITE_PISO_PAYMASTER_ADDR         || '0x0000000000000000000000000000000000001006',
  PISOAIOracle:           import.meta.env.VITE_PISO_AI_ORACLE_ADDR         || '0x0000000000000000000000000000000000001009',
  PISOValidatorSet:       import.meta.env.VITE_PISO_VALIDATOR_SET_ADDR     || '0x0000000000000000000000000000000000001000',

  // Bridge (custom PISO wrappers on top of OP Stack L2StandardBridge)
  PISOBridge:             import.meta.env.VITE_PISO_BRIDGE_ADDR            || '0x0000000000000000000000000000000000001016',
  PISOWithdrawalManager:  import.meta.env.VITE_PISO_WITHDRAWAL_ADDR        || '0x0000000000000000000000000000000000001017',
} as const;

// ═══════════════════════════════════════════════════════════════════
//  VIEM CHAIN DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

/** Viem chain config for PISO Chain L2 */
export const pisoViemChain = defineChain({
  id: PISO_NETWORK.chainId,
  name: PISO_NETWORK.name,
  network: PISO_NETWORK.network,
  nativeCurrency: {
    name: PISO_NETWORK.currencyName,
    symbol: PISO_NETWORK.symbol,
    decimals: PISO_NETWORK.decimals,
  },
  rpcUrls: {
    default: { http: [PISO_NETWORK.rpcUrl, PISO_NETWORK.rpcFallback] },
    public:  { http: [PISO_NETWORK.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'PISO Explorer', url: PISO_NETWORK.explorerUrl },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
    },
  },
  sourceId: L1_NETWORK.chainId, // Sepolia as L1 source
});

/** Viem chain config for Sepolia L1 (bridge interactions) */
export const sepoliaViemChain = defineChain({
  id: L1_NETWORK.chainId,
  name: L1_NETWORK.name,
  network: 'sepolia',
  nativeCurrency: {
    name: L1_NETWORK.currencyName,
    symbol: L1_NETWORK.symbol,
    decimals: L1_NETWORK.decimals,
  },
  rpcUrls: {
    default: { http: [L1_NETWORK.rpcUrl, L1_NETWORK.rpcFallback] },
    public:  { http: [L1_NETWORK.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'Sepolia Etherscan', url: L1_NETWORK.explorerUrl },
  },
});

// ═══════════════════════════════════════════════════════════════════
//  PROVIDER FACTORIES
// ═══════════════════════════════════════════════════════════════════

/** Ethers provider for PISO Chain L2 */
export function getPisoProvider(): JsonRpcProvider {
  return new JsonRpcProvider(PISO_NETWORK.rpcUrl, {
    chainId: PISO_NETWORK.chainId,
    name: PISO_NETWORK.name,
  });
}

/** Ethers provider for Ethereum Sepolia (L1 bridge interactions) */
export function getSepoliaProvider(): JsonRpcProvider {
  return new JsonRpcProvider(L1_NETWORK.rpcUrl, {
    chainId: L1_NETWORK.chainId,
    name: L1_NETWORK.name,
  });
}

// ═══════════════════════════════════════════════════════════════════
//  WALLET ADD-CHAIN PARAMS  (EIP-3085 format for MetaMask)
// ═══════════════════════════════════════════════════════════════════

export const PISO_L2_WALLET_PARAMS = {
  chainId: PISO_NETWORK.chainIdHex,
  chainName: PISO_NETWORK.name,
  nativeCurrency: {
    name: PISO_NETWORK.currencyName,
    symbol: PISO_NETWORK.symbol,
    decimals: PISO_NETWORK.decimals,
  },
  rpcUrls: [PISO_NETWORK.rpcUrl],
  blockExplorerUrls: [PISO_NETWORK.explorerUrl],
};

export const SEPOLIA_WALLET_PARAMS = {
  chainId: L1_NETWORK.chainIdHex,
  chainName: L1_NETWORK.name,
  nativeCurrency: {
    name: L1_NETWORK.currencyName,
    symbol: L1_NETWORK.symbol,
    decimals: L1_NETWORK.decimals,
  },
  rpcUrls: [L1_NETWORK.rpcUrl],
  blockExplorerUrls: [L1_NETWORK.explorerUrl],
};

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════

/** Returns a short human-readable string for any chain ID */
export function getChainLabel(chainId: number): string {
  if (chainId === PISO_NETWORK.chainId) return '🎮 PISO Chain L2';
  if (chainId === L1_NETWORK.chainId)   return '🔷 Sepolia (L1)';
  if (chainId === 1)                     return '🔷 Ethereum';
  return `Chain ${chainId}`;
}

/** True if the given chainId is the PISO L2 */
export function isPisoChain(chainId: number): boolean {
  return chainId === PISO_NETWORK.chainId;
}

/** True if the given chainId is the L1 anchor (Sepolia) */
export function isL1Chain(chainId: number): boolean {
  return chainId === L1_NETWORK.chainId;
}
