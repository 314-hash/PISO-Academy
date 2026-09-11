---
sidebar_position: 1
id: rpc-specification
title: PISO Chain JSON-RPC Specification
---

# PISO Chain JSON-RPC Specification

PISO Chain exposes standard Ethereum JSON-RPC 2.0 endpoints over HTTP and WebSocket.

## Endpoints

- **Devnet HTTP RPC**: `https://piso-rpc-dev.loca.lt`
- **Devnet WS RPC**: `wss://piso-ws-dev.loca.lt`
- **Local Fallback**: `http://127.0.0.1:8545`

## Example: Querying Current Block Number

### Using cURL
```bash
curl -X POST https://piso-rpc-dev.loca.lt \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

### Using Viem in TypeScript
```typescript
import { createPublicClient, http } from 'viem';
import { pisoDevnet } from '@piso/sdk';

const client = createPublicClient({
  chain: pisoDevnet,
  transport: http('https://piso-rpc-dev.loca.lt'),
});

const blockNumber = await client.getBlockNumber();
console.log('Current PISO block:', blockNumber);
```

### Using Ethers.js v6
```typescript
import { JsonRpcProvider } from 'ethers';

const provider = new JsonRpcProvider('https://piso-rpc-dev.loca.lt');
const network = await provider.getNetwork();
console.log('Chain ID:', network.chainId); // 2026001n
```
