export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  successTitle: string;
  successGreeting: string;
  xpReward: number;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  durationMinutes: number;
  contentMarkdown: string;
  hasCodingChallenge?: boolean;
  challengeId?: string;
  quiz?: QuizQuestion[];
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Track {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedHours: number;
  xpReward: number;
  certificateTier: 'BAYANI' | 'PANDAY' | 'BABAYLAN';
  modules: Module[];
}

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
                id: 'q1-web3-intro',
                question: 'Ano ang pangunahing pagkakaiba ng Web3 sa tradisyunal na Web2 architecture?',
                options: [
                  'Kailangan ng mas mabilis na internet connection.',
                  'Ang tiwala at datos ay pinangangalagaan ng decentralized consensus sa halip na iisang sentralisadong kumpanya.',
                  'Libre ang lahat ng transaksyon sa lahat ng oras.',
                  'Wala nang programming o coding na kinakailangan.'
                ],
                correctIndex: 1,
                explanation: 'Sa Web3, ang cryptography at network consensus ang nagpapatunay ng estado nang walang monopolistikong tagapamagitan.',
                successTitle: '🎉 Malupit, Ka-Barangay Builder!',
                successGreeting: 'Natumbok mo ang tunay na diwa ng Bayanihan sa Web3! Tulad ng sama-samang pagbuhat ng bahay-kubo, ang bawat node sa PISO Chain ay sama-samang nagpapanatili ng katotohanan nang walang sinumang gitnang entidad na makapipigil.',
                xpReward: 50
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
- *One-way*: Napakadaling kalkulahin, ngunit mathematically imposibleng i-reverse.
- *Avalanche Effect*: Kahit isang tuldok lang ang mabago sa input, 100% mag-iiba ang hash output.

### 2. Public / Private Key Cryptography (secp256k1)
- **Private Key**: Ang lihim mong susi (32 bytes). Huwag na huwag itong ibubunyag kaninuman!
- **Public Key**: Nanggagaling sa private key gamit ang elliptic curve multiplication.
- **Address**: Ang huling 20 bytes ng Keccak-256 hash ng iyong public key (nagsisimula sa 0x).
`,
            quiz: [
              {
                id: 'q2-crypto-keys',
                question: 'Kung mababago mo kahit isang letra lamang sa isang input bago ito i-hash gamit ang Keccak-256, ano ang mangyayari sa output?',
                options: [
                  'Magbabago lamang ang unang byte ng hash output.',
                  'Mananatiling pareho ang hash basta pareho ang haba ng text.',
                  'Dahil sa Avalanche Effect, halos buong 32-byte hash output ay magbabago nang radikal.',
                  'Magkakaroon ng error at hindi gagana ang cryptographic hash function.'
                ],
                correctIndex: 2,
                explanation: 'Ang Avalanche Effect ang nagsisiguro na kahit katiting na pagbabago sa datos ay magdudulot ng ganap na magkaibang hash, kaya imposible itong pekein.',
                successTitle: '⚡ Cryptographic Maestro!',
                successGreeting: 'Swak na swak! Nakuha mo ang diwa ng Avalanche Effect. Dahil sa katangiang ito, walang makagagalaw o makapipilipit sa mga block at transaksyon sa PISO Chain nang hindi agad mahuhuli ng buong network!',
                xpReward: 50
              }
            ]
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
1. Mag-track ng balanceOf at allowance gamit ang nested mappings.
2. Maglagay ng mahigpit na maxSupply cap para maprotektahan ang tokenomics.
3. Magpatupad ng onlyOwner access control.

Pagkatapos ng araling ito, subukan ang **Hamon #1** sa Interactive Web3 Lab!
`,
            hasCodingChallenge: true,
            challengeId: 'piso-c01-erc20',
            quiz: [
              {
                id: 'q3-solidity-cap',
                question: 'Bakit kritikal na magtakda ng immutable na maxSupply cap at onlyOwner guard sa isang ERC-20 mint function?',
                options: [
                  'Upang mas bumaba ang gas fee sa bawat transfer ng token.',
                  'Upang maiwasan ang unlimited dilution at pigilan ang sinumang hacker na mag-mint ng bagong supply nang walang pahintulot.',
                  'Kinakailangan ito ng compiler upang makapag-deploy sa EVM.',
                  'Para gawing awtomatikong Soulbound ang lahat ng tokens.'
                ],
                correctIndex: 1,
                explanation: 'Ang access control at fixed supply cap ang nagbibigay-garantiya sa scarcity at tiwala ng pamayanan sa tokenomics ng iyong proyekto.',
                successTitle: '⚒️ Tunay na Master Panday!',
                successGreeting: 'Napakatalas ng iyong pagsusuri, Master Panday! Ang solidong access control at bounded tokenomics ang pundasyon ng ligtas na Web3 application. Handa ka nang magpanday ng mga pinakamatitibay na smart contracts sa Pilipinas!',
                xpReward: 50
              }
            ]
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

Ang PISO Chain ay may likas na precompiled smart contract na tinatawag na **Katunayan ng Pag-aari** (0x0000000000000000000000000000000000001014).

Ito ay isang **ERC-721 + ERC-5192 Soulbound** digital certificate hub na naglalaman ng 10 Filipino cultural tiers kabilang ang:
- **BAYANI**: Ecosystem Builders & Developers
- **PANDAY**: Master Smart Contract Architects
- **BABAYLAN**: AI & Oracle Maestros
- **TAGAPAGTATAG**: Genesis Pioneers

Sa pamamagitan nito, ang iyong mga sertipiko at nakamit sa PISO Academy ay permanenteng nakaukit sa blockchain nang hindi maaaring ipagbili o ilipat sa iba.
`,
            hasCodingChallenge: true,
            challengeId: 'piso-c02-katunayan',
            quiz: [
              {
                id: 'q4-katunayan-precompile',
                question: 'Sa ilalim ng pamantayang ERC-5192 para sa Katunayan ng Pag-aari, ano ang mangyayari kapag may nagtangkang tumawag ng transferFrom sa isang Soulbound certificate?',
                options: [
                  'Malilipat ang sertipiko sa bagong address ngunit may bayad na 10% tax.',
                  'Mabubura ang sertipiko mula sa blockchain.',
                  'Awtomatikong magre-revert ang transaksyon dahil ang sertipiko ay permanenteng nakatali (soulbound) sa may-ari nito.',
                  'Magiging expired ang sertipiko pagkaraan ng 24 oras.'
                ],
                correctIndex: 2,
                explanation: 'Ang ERC-5192 ay nagpapatupad ng perpetual non-transferability kung saan ang transferFrom at safeTransferFrom ay tahasang nagre-revert.',
                successTitle: '🛡️ Katunayan ng Karangalan!',
                successGreeting: 'Mabuhay ang iyong karunungan! Dahil sa ERC-5192 Soulbound standard, ang iyong mga pinaghirapang developer achievements sa PISO Academy ay kailanman hindi mananakaw, maibebenta, o mapapasa sa iba. Tunay itong katunayan ng iyong galing!',
                xpReward: 50
              }
            ]
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

Ang smart contracts ay deterministic. Gamit ang PISO AI Oracle (0x...1009), ang off-chain LLM inference na may cryptographic confidence signature ay maaaring i-verify on-chain bago magsagawa ng settlement.
`,
            hasCodingChallenge: true,
            challengeId: 'piso-c04-ai-oracle',
            quiz: [
              {
                id: 'q5-ai-oracle',
                question: 'Bakit kinakailangan ng isang cryptographic Oracle bridge tulad ng Babaylan AI Oracle (0x...1009) bago magamit ang AI outputs sa smart contracts?',
                options: [
                  'Dahil walang internet card ang mga EVM validator nodes upang direktang tumawag ng external REST APIs nang may determinismo.',
                  'Para gawing mas mabilis mag-type ang artificial intelligence.',
                  'Dahil bawal ang artificial intelligence sa anumang blockchain.',
                  'Upang awtomatikong mag-generate ng libreng cryptocurrency ang AI bot.'
                ],
                correctIndex: 0,
                explanation: 'Ang mga EVM smart contracts ay dapat na 100% deterministic sa lahat ng nodes sa network. Ang mga cryptographic oracles ang ligtas na nagpapasok ng off-chain AI inference proofs sa on-chain state.',
                successTitle: '🔮 Babaylan AI Pioneer!',
                successGreeting: 'Kahindik-hindik ang iyong galing! Naunawaan mo ang pinakamalaking hamon sa AI at Web3: ang determinism gap. Sa pamamagitan ng Babaylan AI Oracle, kaya mo nang magtayo ng autonomous AI agents na may tiwala at katotohanan sa PISO Chain!',
                xpReward: 50
              }
            ]
          }
        ]
      }
    ]
  }
];
