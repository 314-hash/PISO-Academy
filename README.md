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
