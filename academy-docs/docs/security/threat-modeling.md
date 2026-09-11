---
sidebar_position: 1
id: threat-modeling
title: Threat Modeling & Smart Contract Security
---

# Threat Modeling & Smart Contract Security

> "Do not claim that using OpenZeppelin automatically makes contracts secure. Always teach testing, review, threat modeling, and formal audits."

## The Top 5 Vulnerabilities in EVM Contracts

### 1. Reentrancy
- Occurs when an external contract call hands execution back to the caller before state is updated.
- **Defense**: Always follow the **Checks-Effects-Interactions** pattern. Use `ReentrancyGuard` from OpenZeppelin as secondary defense.

### 2. Access Control Flaws
- Forgetting to restrict critical administration functions (e.g. `mint`, `pause`, `withdraw`).
- **Defense**: Use `Ownable2Step` or role-based `AccessControl`.

### 3. Frontrunning & MEV
- Public mempool transactions can be observed and sandwich-attacked.
- **Defense**: Implement commit-reveal schemes, private RPCs, and reasonable slippage tolerances.

### 4. Integer Over/Underflow (Pre-0.8.0)
- In modern Solidity `^0.8.20`, arithmetic operations revert by default on overflow unless explicitly enclosed in an `unchecked { ... }` block.

### 5. Signature Replay Attacks
- Reusing signatures across different chains or transactions.
- **Defense**: Implement EIP-712 typed data hashing incorporating `block.chainid` (e.g. `2026001`) and a non-reusable nonce.
