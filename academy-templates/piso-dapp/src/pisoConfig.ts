import { defineChain } from 'viem';

export const pisoDevnet = defineChain({
  id: 2026001,
  name: 'PISO Chain Devnet',
  network: 'piso-devnet',
  nativeCurrency: {
    decimals: 18,
    name: 'PISO',
    symbol: 'PISO',
  },
  rpcUrls: {
    default: {
      http: ['https://piso-rpc-dev.loca.lt', 'http://127.0.0.1:8545'],
      webSocket: ['wss://piso-ws-dev.loca.lt'],
    },
    public: {
      http: ['https://piso-rpc-dev.loca.lt'],
    },
  },
  blockExplorers: {
    default: { name: 'PISO Explorer', url: 'https://piso-blockchain.vercel.app/explorer' },
  },
});
