import { Challenge } from '../types.js';

export const CHALLENGES: Challenge[] = [
  {
    id: 'piso-c01-erc20',
    title: 'Likhain ang PISO Token (Capped ERC-20)',
    slug: 'piso-token-builder',
    category: 'Solidity',
    difficulty: 'Beginner',
    xpReward: 250,
    badgeAwarded: 'Token Creator',
    estimatedMinutes: 20,
    shortDescription: 'Build an ERC-20 token contract with capped total supply and owner-only minting.',
    instructionsMarkdown: `
### Layunin ng Hamon (Challenge Objective)
Create a solid ERC-20 smart contract that:
1. Stores the contract owner.
2. Enforces a \`maxSupply\` cap on minting.
3. Only permits the \`owner\` to call \`mint(address to, uint256 amount)\`.
4. Emits the standard \`Transfer(address indexed from, address indexed to, uint256 value)\` event on minting.

### Tagubilin (Requirements)
- Initialize \`owner\` as \`msg.sender\` in the constructor.
- Revert with \`"Caller is not owner"\` if a non-owner attempts to mint.
- Revert with \`"Max supply exceeded"\` if minting exceeds \`maxSupply\`.
`,
    startingCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PISOTokenChallenge {
    string public name = "Pinoy Builder Token";
    string public symbol = "PBT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 public immutable maxSupply = 1_000_000 * 1e18;
    address public owner;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        // TODO: I-assign ang owner sa deployer (msg.sender)
    }

    modifier onlyOwner() {
        // TODO: Maglagay ng require check para sa owner
        _;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        // TODO: Siguraduhing hindi lumagpas sa maxSupply
        // TODO: Dagdagan ang totalSupply at balanceOf[to]
        // TODO: Mag-emit ng Transfer event
    }
}
`,
    solutionTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract PISOTokenChallenge {
    string public name = "Pinoy Builder Token";
    string public symbol = "PBT";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    uint256 public immutable maxSupply = 1_000_000 * 1e18;
    address public owner;

    mapping(address => uint256) public balanceOf;

    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Zero address");
        require(totalSupply + amount <= maxSupply, "Max supply exceeded");
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
`,
    testCases: [
        { id: 'test-1', name: 'Sets Owner on Deployment', description: 'Constructor correctly sets owner to msg.sender', points: 25 },
        { id: 'test-2', name: 'Only Owner Can Mint', description: 'Reverts if called by an unauthorized address', points: 25 },
        { id: 'test-3', name: 'Enforces Maximum Supply Cap', description: 'Reverts when minting more than maxSupply', points: 25 },
        { id: 'test-4', name: 'Emits Transfer Event', description: 'Emits Transfer(address(0), to, amount) upon successful mint', points: 25 }
    ],
    hints: [
        'Sa constructor, isulat ang: `owner = msg.sender;`',
        'Gamitin ang `require(msg.sender == owner, "Caller is not owner");` sa modifier.',
        'Huwag kalimutang i-check ang `totalSupply + amount <= maxSupply` bago mag-mint.'
    ]
  },
  {
    id: 'piso-c02-katunayan',
    title: 'Katunayan ng Pag-aari (Soulbound Certificate)',
    slug: 'soulbound-certificate',
    category: 'Solidity',
    difficulty: 'Intermediate',
    xpReward: 350,
    badgeAwarded: 'Katunayan Architect',
    estimatedMinutes: 30,
    shortDescription: 'Implement an ERC-5192 Soulbound digital credential contract on PISO Chain that blocks transfers.',
    instructionsMarkdown: `
### Layunin ng Hamon
Implement the core security feature of PISO Chain's Soulbound Certificates:
1. Once minted, a token must be locked permanently.
2. Calling \`transferFrom\` or \`safeTransferFrom\` MUST revert with \`"PISOCert: Soulbound non-transferable"\`.
3. The \`locked(uint256 tokenId)\` function must return \`true\` for any existing token.
`,
    startingCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KatunayanChallenge {
    string public name = "PISO Katunayan Soulbound";
    string public symbol = "PKAT";
    address public owner;
    uint256 public nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) public balanceOf;

    event Locked(uint256 tokenId);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() {
        owner = msg.sender;
    }

    function mint(address recipient) external returns (uint256) {
        require(msg.sender == owner, "Only owner");
        uint256 tokenId = nextTokenId++;
        _owners[tokenId] = recipient;
        balanceOf[recipient]++;
        emit Transfer(address(0), recipient, tokenId);
        emit Locked(tokenId);
        return tokenId;
    }

    function locked(uint256 tokenId) external view returns (bool) {
        // TODO: I-check kung nage-exist ang token, at magbalik ng true
        return false;
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        // TODO: I-block ang pag-transfer ng soulbound credential!
    }
}
`,
    solutionTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract KatunayanChallenge {
    string public name = "PISO Katunayan Soulbound";
    string public symbol = "PKAT";
    address public owner;
    uint256 public nextTokenId = 1;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) public balanceOf;

    event Locked(uint256 tokenId);
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    constructor() {
        owner = msg.sender;
    }

    function mint(address recipient) external returns (uint256) {
        require(msg.sender == owner, "Only owner");
        require(recipient != address(0), "Zero address");
        uint256 tokenId = nextTokenId++;
        _owners[tokenId] = recipient;
        balanceOf[recipient]++;
        emit Transfer(address(0), recipient, tokenId);
        emit Locked(tokenId);
        return tokenId;
    }

    function locked(uint256 tokenId) external view returns (bool) {
        require(_owners[tokenId] != address(0), "Token does not exist");
        return true;
    }

    function transferFrom(address, address, uint256) external pure {
        revert("PISOCert: Soulbound non-transferable");
    }
}
`,
    testCases: [
        { id: 'test-1', name: 'Token Minting', description: 'Owner can mint a new soulbound certificate to a student address', points: 30 },
        { id: 'test-2', name: 'Locked Status Check', description: 'locked() returns true for valid minted tokens', points: 35 },
        { id: 'test-3', name: 'Blocks Transfer Attempts', description: 'Reverts transfer attempts with Soulbound message', points: 35 }
    ],
    hints: [
        'Sa soulbound tokens, ang `locked` function ay laging nagbabalik ng `true` kung valid ang token.',
        'Gamitin ang `revert("PISOCert: Soulbound non-transferable");` sa `transferFrom`.'
    ]
  },
  {
    id: 'piso-c03-faucet',
    title: 'Bayanihan Faucet (Time-locked Gas Drip)',
    slug: 'bayanihan-faucet',
    category: 'PISO-Chain',
    difficulty: 'Intermediate',
    xpReward: 300,
    badgeAwarded: 'Faucet Guardian',
    estimatedMinutes: 25,
    shortDescription: 'Build a rate-limited faucet that drips testnet PISO coins with a 24-hour cooldown.',
    startingCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BayanihanFaucetChallenge {
    uint256 public constant DRIP_AMOUNT = 1 ether; // 1 PISO
    uint256 public constant COOLDOWN = 1 days;

    mapping(address => uint256) public lastDripTime;

    event Drip(address indexed recipient, uint256 amount);

    receive() external payable {}

    function requestPiso() external {
        // TODO: Siguruhing lumipas na ang 24 hours mula sa huling drip
        // TODO: I-update ang lastDripTime[msg.sender]
        // TODO: Ipadala ang DRIP_AMOUNT sa msg.sender
    }
}
`,
    solutionTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BayanihanFaucetChallenge {
    uint256 public constant DRIP_AMOUNT = 1 ether; // 1 PISO
    uint256 public constant COOLDOWN = 1 days;

    mapping(address => uint256) public lastDripTime;

    event Drip(address indexed recipient, uint256 amount);

    receive() external payable {}

    function requestPiso() external {
        require(block.timestamp >= lastDripTime[msg.sender] + COOLDOWN, "Cooldown active");
        require(address(this).balance >= DRIP_AMOUNT, "Faucet empty");

        lastDripTime[msg.sender] = block.timestamp;
        (bool success, ) = payable(msg.sender).call{value: DRIP_AMOUNT}("");
        require(success, "Transfer failed");

        emit Drip(msg.sender, DRIP_AMOUNT);
    }
}
`,
    testCases: [
        { id: 'test-1', name: 'Successful Initial Drip', description: 'Sends 1 PISO on initial request', points: 40 },
        { id: 'test-2', name: 'Enforces 24-Hour Cooldown', description: 'Reverts second request if 24 hours have not elapsed', points: 60 }
    ],
    hints: [
        'Gamitin ang `require(block.timestamp >= lastDripTime[msg.sender] + COOLDOWN, "Cooldown active");`'
    ]
  },
  {
    id: 'piso-c04-ai-oracle',
    title: 'Babaylan AI Oracle Consumer',
    slug: 'ai-oracle-consumer',
    category: 'AI-Web3',
    difficulty: 'Advanced',
    xpReward: 450,
    badgeAwarded: 'Babaylan AI Sage',
    estimatedMinutes: 35,
    shortDescription: 'Interact with the PISO AI Oracle (0x...1009) to verify AI inference proofs on-chain.',
    startingCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPISOAIOracle {
    function getLatestInference(bytes32 promptHash) external view returns (string memory result, uint256 confidenceBps);
}

contract AIOracleConsumerChallenge {
    address public immutable oracleAddress;

    constructor(address _oracle) {
        oracleAddress = _oracle;
    }

    function queryInference(bytes32 promptHash, uint256 minConfidence) external view returns (string memory) {
        // TODO: Tawagin ang oracleAddress gamit ang interface
        // TODO: Siguraduhing ang confidenceBps ay >= minConfidence
        // TODO: Ibalik ang resulta
        return "";
    }
}
`,
    solutionTemplate: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPISOAIOracle {
    function getLatestInference(bytes32 promptHash) external view returns (string memory result, uint256 confidenceBps);
}

contract AIOracleConsumerChallenge {
    address public immutable oracleAddress;

    constructor(address _oracle) {
        oracleAddress = _oracle;
    }

    function queryInference(bytes32 promptHash, uint256 minConfidence) external view returns (string memory) {
        (string memory result, uint256 confidenceBps) = IPISOAIOracle(oracleAddress).getLatestInference(promptHash);
        require(confidenceBps >= minConfidence, "Insufficient AI confidence");
        return result;
    }
}
`,
    testCases: [
        { id: 'test-1', name: 'Queries Oracle Contract', description: 'Correctly calls IPISOAIOracle at the configured address', points: 50 },
        { id: 'test-2', name: 'Validates Confidence Threshold', description: 'Reverts if returned confidence is lower than minConfidence', points: 50 }
    ],
    hints: [
        'Gamitin ang `IPISOAIOracle(oracleAddress).getLatestInference(promptHash);` para makuha ang tuple.',
        'Suriin ang `require(confidenceBps >= minConfidence, "Insufficient AI confidence");`'
    ]
  }
];
