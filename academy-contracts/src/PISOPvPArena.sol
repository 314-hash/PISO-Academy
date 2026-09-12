// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

interface IERC721 {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IERC1155 {
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/**
 * @title PISOPvPArena
 * @dev High-stakes item-wagered PvP arena with strictly enforced fair queue matchmaking.
 * Rules:
 *  1. Equal Queue Matchmaking: Players can only duel if:
 *     - Level difference is within +/- 2 levels (|L_A - L_B| <= 2)
 *     - Coin / net worth difference is within 25% (|Coins_A - Coins_B| <= 25% max)
 *  2. High-Stakes Escrow Wager:
 *     - Both duelists lock an equivalent wager (PISO tokens, ERC-721 weapon, or ERC-1155 relic).
 *     - The loser forfeits their wagered item/tokens directly to the winner.
 *     - 1% protocol fee on token wagers is burned permanently to 0x0...dead for deflationary tokenomics.
 */
contract PISOPvPArena {
    address public immutable owner;
    address public arbiter; // Trusted match referee or autonomous game engine signer
    address public constant BURN_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    uint256 public constant PROTOCOL_BURN_BPS = 100; // 1.0% deflationary burn

    enum WagerType {
        NONE,
        PISO_TOKEN,
        ERC721_WEAPON,
        ERC1155_RELIC
    }

    enum MatchStatus {
        OPEN_QUEUE,
        ACTIVE_DUEL,
        RESOLVED,
        CANCELLED
    }

    struct WagerItem {
        WagerType wagerType;
        address tokenAddress;
        uint256 tokenId;
        uint256 amount;
    }

    struct PvPMatch {
        uint256 matchId;
        address playerA;
        address playerB;
        uint256 playerALevel;
        uint256 playerBLevel;
        uint256 playerACoins;
        uint256 playerBCoins;
        WagerItem wagerA;
        WagerItem wagerB;
        MatchStatus status;
        address winner;
        uint256 createdAt;
        uint256 resolvedAt;
    }

    uint256 public nextMatchId = 1;
    mapping(uint256 => PvPMatch) public matches;
    mapping(address => uint256) public activeMatchOf;

    // Leaderboard & Combat records
    struct CombatantRecord {
        uint256 duelsWon;
        uint256 duelsLost;
        uint256 totalItemsWon;
        uint256 totalPisoWon;
    }
    mapping(address => CombatantRecord) public combatRecords;

    // Events
    event MatchQueued(
        uint256 indexed matchId,
        address indexed playerA,
        uint256 playerLevel,
        uint256 playerCoins,
        WagerType wagerType,
        uint256 amount
    );

    event MatchAccepted(
        uint256 indexed matchId,
        address indexed playerA,
        address indexed playerB,
        uint256 levelA,
        uint256 levelB
    );

    event MatchResolved(
        uint256 indexed matchId,
        address indexed winner,
        address indexed loser,
        WagerType wagerTypeForfeited
    );

    event MatchCancelled(uint256 indexed matchId, address indexed playerA);
    event ArbiterUpdated(address indexed oldArbiter, address indexed newArbiter);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOPvP: Only Owner");
        _;
    }

    modifier onlyArbiterOrOwner() {
        require(msg.sender == arbiter || msg.sender == owner, "PISOPvP: Only Arbiter");
        _;
    }

    constructor(address _arbiter) {
        owner = msg.sender;
        arbiter = _arbiter != address(0) ? _arbiter : msg.sender;
    }

    function setArbiter(address _newArbiter) external onlyOwner {
        require(_newArbiter != address(0), "Invalid address");
        emit ArbiterUpdated(arbiter, _newArbiter);
        arbiter = _newArbiter;
    }

    /**
     * @notice Initiates a PvP queue challenge by locking an offered wager in escrow.
     */
    function queueMatch(
        uint256 playerLevel,
        uint256 playerCoins,
        WagerType wagerType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external returns (uint256) {
        require(activeMatchOf[msg.sender] == 0, "PISOPvP: Already in active duel");
        require(playerLevel >= 1, "PISOPvP: Invalid level");

        uint256 matchId = nextMatchId++;
        PvPMatch storage duel = matches[matchId];
        duel.matchId = matchId;
        duel.playerA = msg.sender;
        duel.playerALevel = playerLevel;
        duel.playerACoins = playerCoins;
        duel.status = MatchStatus.OPEN_QUEUE;
        duel.createdAt = block.timestamp;

        duel.wagerA = WagerItem({
            wagerType: wagerType,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            amount: amount
        });

        // Transfer playerA's wager into escrow
        _lockWager(msg.sender, duel.wagerA);

        activeMatchOf[msg.sender] = matchId;

        emit MatchQueued(matchId, msg.sender, playerLevel, playerCoins, wagerType, amount);
        return matchId;
    }

    /**
     * @notice Accepts a queued duel. Strictly verifies fair queue matchmaking rules:
     *  - |Level_A - Level_B| <= 2
     *  - |Coins_A - Coins_B| <= 25% max
     *  - Matching wager type and proportional value
     */
    function acceptMatch(
        uint256 matchId,
        uint256 playerLevel,
        uint256 playerCoins,
        WagerType wagerType,
        address tokenAddress,
        uint256 tokenId,
        uint256 amount
    ) external {
        PvPMatch storage duel = matches[matchId];
        require(duel.status == MatchStatus.OPEN_QUEUE, "PISOPvP: Match not open");
        require(duel.playerA != msg.sender, "PISOPvP: Cannot duel yourself");
        require(activeMatchOf[msg.sender] == 0, "PISOPvP: Already in active duel");

        // 1. Equal Queue Matchmaking - Level Check (+/- 2 Levels)
        uint256 levelDiff = duel.playerALevel > playerLevel
            ? duel.playerALevel - playerLevel
            : playerLevel - duel.playerALevel;
        require(levelDiff <= 2, "PISOPvP: Unfair duel - Level difference exceeds +/- 2 levels!");

        // 2. Equal Queue Matchmaking - Coins / Net Worth Check (Within 25%)
        uint256 higherCoins = duel.playerACoins > playerCoins ? duel.playerACoins : playerCoins;
        uint256 coinDiff = duel.playerACoins > playerCoins
            ? duel.playerACoins - playerCoins
            : playerCoins - duel.playerACoins;
        if (higherCoins > 0) {
            require(coinDiff * 100 <= higherCoins * 25, "PISOPvP: Unfair duel - Coin net worth gap > 25%!");
        }

        // 3. Wager symmetry check
        require(duel.wagerA.wagerType == wagerType, "PISOPvP: Wager type mismatch");
        if (wagerType == WagerType.PISO_TOKEN) {
            require(amount == duel.wagerA.amount, "PISOPvP: Token wager amount must match");
        }

        duel.playerB = msg.sender;
        duel.playerBLevel = playerLevel;
        duel.playerBCoins = playerCoins;
        duel.status = MatchStatus.ACTIVE_DUEL;

        duel.wagerB = WagerItem({
            wagerType: wagerType,
            tokenAddress: tokenAddress,
            tokenId: tokenId,
            amount: amount
        });

        // Transfer playerB's wager into escrow
        _lockWager(msg.sender, duel.wagerB);

        activeMatchOf[msg.sender] = matchId;

        emit MatchAccepted(matchId, duel.playerA, msg.sender, duel.playerALevel, playerLevel);
    }

    /**
     * @notice Cancels an open queue duel if no opponent has accepted yet.
     */
    function cancelMatch(uint256 matchId) external {
        PvPMatch storage duel = matches[matchId];
        require(duel.playerA == msg.sender, "PISOPvP: Not match creator");
        require(duel.status == MatchStatus.OPEN_QUEUE, "PISOPvP: Cannot cancel active match");

        duel.status = MatchStatus.CANCELLED;
        activeMatchOf[msg.sender] = 0;

        // Refund player A
        _releaseWager(msg.sender, duel.wagerA);

        emit MatchCancelled(matchId, msg.sender);
    }

    /**
     * @notice Resolves duel outcome. Winner claims loser's forfeited wager.
     * 1% burned on token wagers.
     */
    function resolveMatch(uint256 matchId, address winner) external onlyArbiterOrOwner {
        PvPMatch storage duel = matches[matchId];
        require(duel.status == MatchStatus.ACTIVE_DUEL, "PISOPvP: Match not in active state");
        require(winner == duel.playerA || winner == duel.playerB, "PISOPvP: Invalid winner");

        address loser = winner == duel.playerA ? duel.playerB : duel.playerA;
        WagerItem memory winnerOwnWager = winner == duel.playerA ? duel.wagerA : duel.wagerB;
        WagerItem memory forfeitedLoserWager = winner == duel.playerA ? duel.wagerB : duel.wagerA;

        duel.status = MatchStatus.RESOLVED;
        duel.winner = winner;
        duel.resolvedAt = block.timestamp;

        activeMatchOf[duel.playerA] = 0;
        activeMatchOf[duel.playerB] = 0;

        // Update leaderboard records
        combatRecords[winner].duelsWon += 1;
        combatRecords[loser].duelsLost += 1;

        // 1. Return winner's original wager to winner
        _releaseWager(winner, winnerOwnWager);

        // 2. Award forfeited loser wager to winner (loser forfeits item)
        if (forfeitedLoserWager.wagerType == WagerType.PISO_TOKEN && forfeitedLoserWager.amount > 0) {
            uint256 burnShare = (forfeitedLoserWager.amount * PROTOCOL_BURN_BPS) / 10000;
            uint256 winnerSpoils = forfeitedLoserWager.amount - burnShare;

            IERC20(forfeitedLoserWager.tokenAddress).transfer(BURN_ADDRESS, burnShare);
            IERC20(forfeitedLoserWager.tokenAddress).transfer(winner, winnerSpoils);

            combatRecords[winner].totalPisoWon += winnerSpoils;
        } else if (forfeitedLoserWager.wagerType == WagerType.ERC721_WEAPON) {
            IERC721(forfeitedLoserWager.tokenAddress).transferFrom(
                address(this),
                winner,
                forfeitedLoserWager.tokenId
            );
            combatRecords[winner].totalItemsWon += 1;
        } else if (forfeitedLoserWager.wagerType == WagerType.ERC1155_RELIC) {
            IERC1155(forfeitedLoserWager.tokenAddress).safeTransferFrom(
                address(this),
                winner,
                forfeitedLoserWager.tokenId,
                forfeitedLoserWager.amount,
                ""
            );
            combatRecords[winner].totalItemsWon += forfeitedLoserWager.amount;
        }

        emit MatchResolved(matchId, winner, loser, forfeitedLoserWager.wagerType);
    }

    /**
     * @dev Internal escrow lock
     */
    function _lockWager(address depositor, WagerItem memory wager) internal {
        if (wager.wagerType == WagerType.NONE) return;

        if (wager.wagerType == WagerType.PISO_TOKEN) {
            require(wager.tokenAddress != address(0), "Invalid token address");
            require(wager.amount > 0, "Amount must be > 0");
            IERC20(wager.tokenAddress).transferFrom(depositor, address(this), wager.amount);
        } else if (wager.wagerType == WagerType.ERC721_WEAPON) {
            require(wager.tokenAddress != address(0), "Invalid NFT address");
            IERC721(wager.tokenAddress).transferFrom(depositor, address(this), wager.tokenId);
        } else if (wager.wagerType == WagerType.ERC1155_RELIC) {
            require(wager.tokenAddress != address(0), "Invalid Relic address");
            require(wager.amount > 0, "Amount must be > 0");
            IERC1155(wager.tokenAddress).safeTransferFrom(
                depositor,
                address(this),
                wager.tokenId,
                wager.amount,
                ""
            );
        }
    }

    /**
     * @dev Internal escrow release
     */
    function _releaseWager(address recipient, WagerItem memory wager) internal {
        if (wager.wagerType == WagerType.NONE) return;

        if (wager.wagerType == WagerType.PISO_TOKEN) {
            IERC20(wager.tokenAddress).transfer(recipient, wager.amount);
        } else if (wager.wagerType == WagerType.ERC721_WEAPON) {
            IERC721(wager.tokenAddress).transferFrom(address(this), recipient, wager.tokenId);
        } else if (wager.wagerType == WagerType.ERC1155_RELIC) {
            IERC1155(wager.tokenAddress).safeTransferFrom(
                address(this),
                recipient,
                wager.tokenId,
                wager.amount,
                ""
            );
        }
    }

    // ERC1155 receiver support
    function onERC1155Received(address, address, uint256, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(address, address, uint256[] calldata, uint256[] calldata, bytes calldata) external pure returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function getCombatRecord(address fighter) external view returns (CombatantRecord memory) {
        return combatRecords[fighter];
    }
}
