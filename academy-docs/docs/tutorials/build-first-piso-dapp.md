---
sidebar_position: 1
id: build-first-piso-dapp
title: Tutorial - Build Your First PISO dApp
---

# Tutorial: Build Your First PISO dApp

In this step-by-step tutorial, you will write, test, and deploy a decentralized application on PISO Chain Devnet (`chainId: 2026001`).

---

## Step 1: Initialize Your Project
Clone the official PISO dApp starter template:
```bash
git clone https://github.com/314-hash/piso-academy.git
cd piso-academy/academy-templates/piso-dapp
npm install
```

---

## Step 2: Configure the Network
Open `src/pisoConfig.ts` and verify your connection endpoint:
```typescript
export const pisoDevnet = {
  id: 2026001,
  name: 'PISO Chain Devnet',
  rpcUrls: {
    default: { http: ['https://piso-rpc-dev.loca.lt'] },
  },
};
```

---

## Step 3: Write Your Smart Contract
In `contracts/KatunayanCertificate.sol`:
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KatunayanCertificate {
    string public name = "Katunayan ng Pag-aari";
    address public issuer;

    constructor() {
        issuer = msg.sender;
    }
}
```

---

## Step 4: Deploy with Foundry
```bash
forge create --rpc-url https://piso-rpc-dev.loca.lt \
  --private-key $YOUR_DEV_PRIVATE_KEY \
  contracts/KatunayanCertificate.sol:KatunayanCertificate
```

---

## Step 5: Verify on PISO Explorer
Open the [PISO Explorer](https://piso-blockchain.vercel.app/explorer) and paste your newly deployed contract address. You can now interact with it directly through the PISO Academy Web Cockpit!
