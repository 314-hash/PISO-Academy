---
sidebar_position: 2
id: precompiles
title: PISO Chain System Precompiles & Fixed Contracts
---

# PISO Chain System Precompiles

PISO Chain hosts a suite of native system smart contracts at pre-allocated addresses starting at `0x0000000000000000000000000000000000001000`.

| Contract Name | Address | Role |
| :--- | :--- | :--- |
| `PISOValidatorSet` | `0x...1000` | Manages active Clique PoA block validators |
| `PISOSlashIndicator` | `0x...1001` | Slashes double-signing or offline validators |
| `PISOQuantumSecurity` | `0x...1002` | Post-quantum cryptography fallback logic |
| `PISOFaucet` | `0x...1003` | On-chain gas drip rate-limiting faucet |
| `PISOStaking` | `0x...1004` | Validator staking & delegation engine |
| `PISOGovernor` | `0x...1005` | On-chain DAO proposal & voting system |
| `PISOPaymaster` | `0x...1006` | ERC-4337 Account Abstraction gas sponsorship |
| `PISOBridge` | `0x...1007` | Cross-chain token bridge lockbox |
| `PISOZKRecovery` | `0x...1008` | Zero-knowledge social recovery module |
| `PISOAIOracle` | `0x...1009` | Autonomous AI inference and price oracle |
| **`PISOCertificateNFT`** | **`0x...1014`** | **Katunayan ng Pag-aari (Soulbound ERC-721/5192)** |

## Interacting with Katunayan ng Pag-aari (`0x...1014`)
This contract awards verifiable credentials for PISO Academy course completions.

### Querying Student Verification Status
```solidity
(
    bool verified,
    address holder,
    Tier tier,
    string memory tierName,
    uint256 issueTimestamp,
    uint256 multiplierBps
) = PISOCertificateNFT(0x0000000000000000000000000000000000001014).verifyCertificate(tokenId);
```
