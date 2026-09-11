---
sidebar_position: 1
id: architecture
title: Blockchain & EVM Architecture
---

# Blockchain & EVM Architecture for Filipino Builders

A blockchain is fundamentally a **cryptographically secured, append-only, decentralized state transition system**.

```
  ┌───────────────┐     Transaction     ┌───────────────┐
  │  State S_t    │ ──────────────────> │ State S_{t+1} │
  └───────────────┘     APPLY(S, TX)    └───────────────┘
```

## How PISO Chain Reaches Consensus
PISO Chain utilizes a **Clique Proof-of-Authority (PoA) / PoW hybrid** engine:
- **Validators**: 21 bonded validator nodes propose and sign blocks on a fixed 3-second heartbeat.
- **Deterministic Finality**: Fast block times allow immediate confirmation for merchant transactions and interactive dApps.
- **Gas Model**: Gas limits prevent denial-of-service loops while keeping transaction costs negligible in PISO coins.

## EVM Memory Model
Smart contracts run in the Ethereum Virtual Machine (EVM), which features 3 distinct data storage locations:
1. **Storage**: Permanent, expensive persistent state stored in the Merkle Patricia Trie.
2. **Memory**: Temporary byte array that is cleared after the transaction completes.
3. **Calldata**: Read-only, unmodifiable array containing transaction arguments.
