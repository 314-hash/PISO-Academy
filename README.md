# 🇵🇭 PISO ACADEMY — OPEN-SOURCE BUILDER ECOSYSTEM
> **Learn. Code. Build. Test. Deploy. Verify. Become a PISO Builder.**

PISO Academy is an open-source Filipino Web3 developer academy and builder ecosystem powered by **PISO Chain** (Chain ID: `2026001`).

Our mission is to equip Filipino developers, students, and engineers with real-world smart contract and decentralized application skills, granting portable, on-chain soulbound achievements that prove their craft.

---

## 🚀 The Builder Journey

```
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │  1. LEARN   │ ──> │   2. CODE   │ ──> │  3. BUILD   │ ──> │   4. TEST   │
  │ Fundamentals│     │ Interactive │     │ Scaffolded  │     │ Automated   │
  │   & Theory  │     │ Web3 Lab    │     │  Templates  │     │ Challenges  │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                     │
                                                                     ▼
  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
  │7. PISO HERO │ <── │6. PORTFOLIO │ <── │  5. VERIFY  │ <── │ 4. DEPLOY   │
  │  Ecosystem  │     │   Builder   │     │  Soulbound  │     │ PISO Chain  │
  │ Contributor │     │   Profile   │     │ Certificate │     │   Devnet    │
  └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 🏛️ Modular Repository Structure

```
piso-academy/
├── academy-web/          # Flagship Next/Vite Web3 builder cockpit, lab, verifier & showcase
├── academy-docs/         # Docusaurus developer documentation, RPC specs & tutorials
├── academy-contracts/    # Foundry Solidity test suite & smart contract templates
├── academy-challenges/   # Automated coding challenges & grading test runner
├── academy-templates/    # Starter repositories (piso-token, piso-nft, piso-certificate, piso-dapp)
├── academy-lms/          # Moodle LMS adapter & curriculum data model
├── docker/               # Docker Compose environments for local orchestration
└── README.md             # This document
```

---

## ⛏️ 3D Metaverse Voxel Mining & $PISO Block Economy

PISO Academy features a persistent, procedurally generated 3D Terranian world with an integrated voxel mining and construction economy:

- **8 Filipino Block Tiers**: Kahoy (🪵), Lupa (🟫), Bato (🪨), Bakal (⚙️), Ginto (🥇), Kristal (💎), Bakunawa Scale (🐉), and Bituin Shard (⭐).
- **$PISO Block Purchasing**: Players can spend `$PISO` tokens directly from their in-game burner or Web3 wallet to acquire blocks individually or in discounted builder bundles (Starter Bahay, Fortress Mason, Mythic Architect).
- **Auto-Buy Missing Materials**: 1-click blueprint auto-fill computes and buys exactly what resources are missing to construct Bahay, Kuta, Bantayan, or Kastilyo fortresses.
- **Smart Level Progression & Parity**: Deterministic integer-safe polynomial EXP curve ($100 + (L-1) \cdot 150 + (L-1)^2 \cdot 20$) shared identically between Solidity smart contracts (`PISOMineCraft.sol`, `PISOMonsterBountyManager.sol`) and the client (`PlayerStatsEngine.ts`).
- **Hold-to-Seek Mining**: Holding `E` auto-targets and navigates to the nearest unmined block, performing continuous automated voxel harvesting.

---

## 👤 On-Chain Avatar NFTs & Flexible Wallet Onboarding

- **PISO Avatar NFT (`PISOAvatarNFT.sol`)**: ERC-721 character NFT on PISO Chain storing DNA hash, level, and equip slot states.
- **Default "No Costume" Plain Attire**: Avatars begin in neutral civilian attire (white sandô/shirt & denim); only items actually earned, mined, or purchased appear on the character.
- **3-Way Wallet Onboarding**:
  - 🆕 **Create New Wallet**: Generates local burner keypair for instant 1-click play.
  - 🔗 **Connect Existing Wallet**: Connects MetaMask / Rabby or imports existing private key.
  - ⏳ **Connect Later (Guest)**: Play immediately without wallet friction; Avatar NFT automatically re-binds to the wallet once connected later.
- **Dynamic Online & Idle Suiting**: Weapons, shields, and relics automatically attach to the 3D humanoid rig during walking and idle cycles.

---

## 🎒 P2P Bidding Marketplace & Elemental Combat Economy

- **P2P Bidding & Fixed Sales**: Liquidate gear for instant `$PISO` liquidity or launch decentralized auctions with countdown timers, buyouts, and highest-bid settlement.
- **Fair-Play Anti-Cheat Combat**: Cryptographic distance, pacing, and damage-ceiling verification prevents range hacks, auto-clickers, and memory tampering.
- **4 Elemental Monster Drops**: Collect Food (🍗), Textile (🧵), Liquid (💧), and Shards (💎) to swap for `$PISO` tokens (with a +10% bulk conversion bonus).
- **Alt+1 to Alt+10 Hotkey Architecture**: Keys `1` through `0` are dedicated to Anime Superpowers; `Alt + 1` through `Alt + 10` navigate the bottom application dock.

## 🔗 Official PISO Chain Devnet Configuration

| Parameter | Configuration Value |
| :--- | :--- |
| **Network Name** | PISO Chain Devnet / Mainnet |
| **Chain ID** | `2026001` (`0x1EE349`) |
| **Currency Symbol** | `PISO` (₱) — 18 Decimals |
| **HTTP RPC Endpoint** | `https://piso-rpc-dev.loca.lt` (Local fallback: `http://127.0.0.1:8545`) |
| **WebSocket Endpoint**| `wss://piso-ws-dev.loca.lt` (Local fallback: `ws://127.0.0.1:8546`) |
| **Block Explorer** | [https://piso-blockchain.vercel.app/explorer](https://piso-blockchain.vercel.app/explorer) |
| **Faucet / Portal**| [https://piso-blockchain.vercel.app/](https://piso-blockchain.vercel.app/) |
| **Block Time** | 3.0 Seconds (Clique PoA Engine) |
| **Katunayan Certificate Precompile** | `0x0000000000000000000000000000000000001014` |
| **Faucet Precompile** | `0x0000000000000000000000000000000000001003` |

---

## 📦 Open-Source Foundations & Attribution

PISO Academy stands on the shoulders of battle-tested open-source projects:
- **[Moodle](https://github.com/moodle/moodle)**: Learning paths, quizzes, and LMS tracking.
- **[Docusaurus](https://github.com/facebook/docusaurus)**: Developer documentation and technical tutorials.
- **[Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2)**: Interactive Web3 laboratory foundation.
- **[Foundry](https://github.com/foundry-rs/foundry)**: Solidity compilation, unit testing, and deployment scripts.
- **[OpenZeppelin Contracts](https://github.com/OpenZeppelin/openzeppelin-contracts)**: Secure token and access-control standards.
- **[Judge0](https://github.com/judge0/judge0)**: Sandboxed code challenge execution layer.
- **[Ethereum Attestation Service](https://github.com/ethereum-attestation-service/eas-contracts)**: Verifiable attestation architecture.
- **[OpenCerts](https://github.com/OpenCerts/open-certificate)**: Cryptographic verifiable certificate design.

---

## 🛠️ Quick Start

```bash
# Clone the repository
git clone https://github.com/314-hash/piso-academy.git
cd piso-academy

# Start the Academy Web Cockpit
npm run dev

# Start the Documentation Engine
npm run dev:docs

# Run Foundry Contract Tests
npm run contracts:test
```

---

## 📄 License & Community
Licensed under the [MIT License](./LICENSE). Built by Filipino builders for builders worldwide.
