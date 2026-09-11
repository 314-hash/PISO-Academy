import { defineChain } from 'viem';
import { JsonRpcProvider } from 'ethers';

export const PISO_NETWORK = {
  chainId: 2026001,
  chainIdHex: '0x1EE349',
  name: 'PISO Chain Devnet',
  symbol: 'PISO',
  currencyName: 'PISO',
  decimals: 18,
  rpcUrl: import.meta.env.VITE_PISO_RPC_URL || 'https://piso-rpc-dev.loca.lt',
  rpcFallback: 'http://127.0.0.1:8545',
  wsUrl: 'wss://piso-ws-dev.loca.lt',
  explorerUrl: 'https://piso-blockchain.vercel.app/explorer',
  faucetUrl: 'https://piso-blockchain.vercel.app/',
  blockTimeSeconds: 3.0,
} as const;

export const SYSTEM_CONTRACTS = {
  PISOCertificateNFT: '0x0000000000000000000000000000000000001014',
  PISOFaucet: '0x0000000000000000000000000000000000001003',
  PISOValidatorSet: '0x0000000000000000000000000000000000001000',
  PISOAIOracle: '0x0000000000000000000000000000000000001009',
  PISOPaymaster: '0x0000000000000000000000000000000000001006',
  PISOGovernor: '0x0000000000000000000000000000000000001005',
} as const;

export const pisoViemChain = defineChain({
  id: PISO_NETWORK.chainId,
  name: PISO_NETWORK.name,
  network: 'piso-devnet',
  nativeCurrency: {
    name: PISO_NETWORK.currencyName,
    symbol: PISO_NETWORK.symbol,
    decimals: PISO_NETWORK.decimals,
  },
  rpcUrls: {
    default: { http: [PISO_NETWORK.rpcUrl, PISO_NETWORK.rpcFallback] },
    public: { http: [PISO_NETWORK.rpcUrl] },
  },
  blockExplorers: {
    default: { name: 'PISO Explorer', url: PISO_NETWORK.explorerUrl },
  },
});

export function getPisoProvider(): JsonRpcProvider {
  return new JsonRpcProvider(PISO_NETWORK.rpcUrl, {
    chainId: PISO_NETWORK.chainId,
    name: PISO_NETWORK.name,
  });
}
