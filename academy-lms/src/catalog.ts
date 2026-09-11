import { Track } from './types.js';

export const TRACKS: Track[] = [
  {
    id: 'track-01-fundamentals',
    slug: 'blockchain-fundamentals',
    title: 'Blockchain & Web3 Fundamentals',
    tagline: 'Mula sa Simula hanggang sa Unang Transaksyon',
    description: 'Learn the foundational concepts of distributed ledgers, cryptography, EVM, wallets, gas economics, and RPC nodes specifically illustrated for Filipino builders.',
    iconName: 'Sparkles',
    level: 'Beginner',
    estimatedHours: 6,
    xpReward: 500,
    certificateTier: 'BAYANI',
    modules: [
      {
        id: 'mod-1-1',
        title: 'Modyul 1: Ano ang Blockchain?',
        description: 'How blocks, hashing, and consensus secure a decentralized state without centralized intermediaries.',
        lessons: [
          {
            id: 'les-1-1-1',
            title: '1. Ang Kasaysayan at Diwa ng Bayanihan sa Web3',
            slug: 'intro-bayanihan-web3',
            durationMinutes: 15,
            contentMarkdown: `
# Ang Kasaysayan at Diwa ng Bayanihan sa Web3

Sa tradisyunal na sistemang pampinansyal at teknolohiya, ang tiwala ay nakasalalay sa mga gitnang institusyon: bangko, gobyerno, at malalaking tech platforms.

Sa **Web3**, ang tiwala ay inililipat sa **matematika, cryptography, at consensus protocols**. Ang konsepto ng *Bayanihan*—ang sama-samang pagbuhat ng bahay-kubo—ay eksaktong representasyon ng isang **Decentralized Node Network**:
- Walang iisang may-ari.
- Bawat validator o node ay nagpapatunay ng katotohanan.
- Ang buong pamayanan ang nagpapatakbo ng estado ng network.

### Mga Pangunahing Konsepto
1. **Decentralization**: Walang single point of failure.
2. **Immutability**: Hindi mabubura o mababago ang mga nairekord na transaksyon nang walang consensus.
3. **Transparency**: Sinuman ay maaaring magsuri ng state gamit ang isang Block Explorer tulad ng PISO Explorer.
`,
            quiz: [
              {
                id: 'q1',
                question: 'Ano ang pangunahing pagkakaiba ng Web3 sa Web2?',
                options: [
                  'Kailangan ng mas mabilis na internet connection.',
                  'Ang tiwala at datos ay nasa kamay ng decentralized consensus sa halip na sentralisadong kumpanya.',
                  'Libre ang lahat ng transaksyon sa lahat ng oras.',
                  'Wala nang programming na kinakailangan.'
                ],
                correctIndex: 1,
                explanation: 'Sa Web3, ang cryptography at network consensus ang nagpapatunay ng transaksyon nang walang gitnang tagapamagitan.'
              }
            ]
          },
          {
            id: 'les-1-1-2',
            title: '2. Cryptographic Hashing at Digital Signatures (ECDSA)',
            slug: 'crypto-hashing-signatures',
            durationMinutes: 20,
            contentMarkdown: `
# Cryptographic Hashing at Digital Signatures

Paano nalalaman ng blockchain na ikaw talaga ang nagpadala ng transaksyon nang hindi ibinubunyag ang iyong pribadong susi?

### 1. Cryptographic Hash (Keccak-256 / SHA-256)
- Isang deterministic na function na nagpapalit ng anumang input patungo sa isang fixed 32-byte (256-bit) string.
- *One-way*: Napakadaling kalkulahin, ngunit imposibleng i-reverse.
- *Avalanche Effect*: Kahit isang tuldok lang ang mabago sa input, 100% mag-iiba ang hash output.

### 2. Public / Private Key Cryptography (secp256k1)
- **Private Key**: Ang lihim mong susi (32 bytes). Huwag na huwag itong ibubunyag kaninuman!
- **Public Key**: Nanggagaling sa private key gamit ang elliptic curve multiplication.
- **Address**: Ang huling 20 bytes ng Keccak-256 hash ng iyong public key (nagsisimula sa \`0x\`).
`
          }
        ]
      }
    ]
  },
  {
    id: 'track-02-solidity',
    title: 'Solidity & Smart Contract Engineering',
    slug: 'solidity-engineering',
    tagline: 'Mastering the EVM with Production-Grade Solidity',
    description: 'Learn modern Solidity ^0.8.20, memory layouts, modifiers, custom errors, security best practices, and the complete OpenZeppelin standard library.',
    iconName: 'Code',
    level: 'Intermediate',
    estimatedHours: 12,
    xpReward: 1000,
    certificateTier: 'PANDAY',
    modules: [
      {
        id: 'mod-2-1',
        title: 'Modyul 1: Solidity Syntax & Data Layout',
        description: 'Value types, reference types, storage vs memory vs calldata, and view/pure mechanics.',
        lessons: [
          {
            id: 'les-2-1-1',
            title: '1. Paggawa ng Capped ERC-20 Token',
            slug: 'erc20-token-creation',
            durationMinutes: 30,
            contentMarkdown: `
# Paggawa ng Capped ERC-20 Token sa PISO Chain

Ang ERC-20 ang pamantayan sa paggawa ng fungible tokens sa EVM. Sa araling ito, matututunan mo kung paano:
1. Mag-track ng \`balanceOf\` at \`allowance\` gamit ang nested mappings.
2. Maglagay ng mahigpit na \`maxSupply\` cap para maprotektahan ang tokenomics.
3. Magpatupad ng \`onlyOwner\` access control.

Pagkatapos ng araling ito, subukan ang **Hamon #1** sa Interactive Web3 Lab!
`,
            hasCodingChallenge: true,
            challengeId: 'piso-c01-erc20'
          }
        ]
      }
    ]
  },
  {
    id: 'track-03-piso-builder',
    title: 'PISO Chain Builder Track',
    slug: 'piso-chain-builder',
    tagline: 'Build, Deploy & Verify on PISO Sovereign L1',
    description: 'Direct deep-dive into PISO Chain precompiles, Katunayan Soulbound Certificate (0x...1014), Faucet (0x...1003), Viem/Ethers SDK integration, and live dApp deployment.',
    iconName: 'Flame',
    level: 'Intermediate',
    estimatedHours: 10,
    xpReward: 1200,
    certificateTier: 'BAYANI',
    modules: [
      {
        id: 'mod-3-1',
        title: 'Modyul 1: PISO Chain Architecture & RPC',
        description: 'Connecting via JSON-RPC, listening to WebSocket events, and working with system precompiles.',
        lessons: [
          {
            id: 'les-3-1-1',
            title: '1. Katunayan ng Pag-aari (Soulbound Precompile)',
            slug: 'katunayan-soulbound-precompile',
            durationMinutes: 35,
            contentMarkdown: `
# Katunayan ng Pag-aari: PISO Chain System Precompile 0x...1014

Ang PISO Chain ay may likas na precompiled smart contract na tinatawag na **Katunayan ng Pag-aari** (\`0x0000000000000000000000000000000000001014\`).

Ito ay isang **ERC-721 + ERC-5192 Soulbound** digital certificate hub na naglalaman ng 10 Filipino cultural tiers:
- \`BAYANI\`: Ecosystem Builders & Developers
- \`PANDAY\`: Master Smart Contract Architects
- \`BABAYLAN\`: AI & Oracle Maestros
- \`TAGAPAGTATAG\`: Genesis Pioneers

Sa pamamagitan nito, ang iyong mga sertipiko at nakamit sa PISO Academy ay permanenteng nakaukit sa blockchain nang hindi maaaring ipagbili o ilipat sa iba.
`,
            hasCodingChallenge: true,
            challengeId: 'piso-c02-katunayan'
          }
        ]
      }
    ]
  },
  {
    id: 'track-04-ai-web3',
    title: 'AI + Blockchain Agent Architectures',
    slug: 'ai-blockchain-agents',
    tagline: 'Autonomous AI Agents Operating on PISO Chain',
    description: 'Learn how to integrate LLMs, autonomous agents, and cryptographic inference verification with PISO Chain smart contracts and the Babaylan AI Oracle.',
    iconName: 'Cpu',
    level: 'Advanced',
    estimatedHours: 14,
    xpReward: 1500,
    certificateTier: 'BABAYLAN',
    modules: [
      {
        id: 'mod-4-1',
        title: 'Modyul 1: AI Oracles & Cryptographic Attestations',
        description: 'Connecting off-chain LLM inference to on-chain smart contract decision engines.',
        lessons: [
          {
            id: 'les-4-1-1',
            title: '1. Pagkonsumo ng AI Inferences sa PISO Chain',
            slug: 'consuming-ai-oracle-inferences',
            durationMinutes: 40,
            contentMarkdown: `
# Pagkonsumo ng AI Inferences sa PISO Chain

Ang smart contracts ay *deterministic*—hindi sila direktang makakagawa ng HTTP request papunta sa OpenAI o Anthropic.

Paano natin pinapagana ang mga AI Agents sa PISO Chain?
1. Ang off-chain agent ay nagpapatakbo ng model inference.
2. Ang inference kasama ang confidence score at cryptographic signature ay isinusumite sa **PISO AI Oracle** (\`0x...1009\`).
3. Ang iyong dApp smart contract ay nagbe-verify ng proof bago magsagawa ng transaksyon o mag-release ng pondo.
`,
            hasCodingChallenge: true,
            challengeId: 'piso-c04-ai-oracle'
          }
        ]
      }
    ]
  }
];
