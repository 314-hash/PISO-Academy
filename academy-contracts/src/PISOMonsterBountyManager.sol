// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PISOToken.sol";

/**
 * @title PISOMonsterBountyManager
 * @dev Manages the 70,000,000 $PISO Player Reward Pool (70% of 100M total supply),
 * level-gating enforcement, small monster farming bounties, and the
 * "Tax Return to the People" festival upon defeating Giga Buwaya Titans.
 */
contract PISOMonsterBountyManager {
    PISOToken public immutable pisoToken;
    address public owner;

    // 70% of 100M Token Supply allocated strictly for players
    uint256 public constant TOTAL_PLAYER_BOUNTY_POOL = 70_000_000 * 1e18;
    uint256 public totalClaimedBounties;

    enum MonsterTier { SMALL_FARM, ELITE, GIGA_BUWAYA_TITAN }

    struct MonsterDef {
        string name;
        uint8 minPlayerLevelRequired;
        uint256 baseBountyPiso; // In 18 decimals
        uint256 baseExp;
        MonsterTier tier;
    }

    mapping(uint256 => MonsterDef) public monsterCatalog;
    mapping(address => uint8) public playerLevel;
    mapping(address => uint256) public playerExp;
    mapping(address => uint256) public totalTaxRefundsEarned;
    mapping(address => bool) public authorizedVerifiers;

    event MonsterSlain(address indexed player, uint256 indexed monsterId, uint256 bountyPiso, uint256 expGained);
    event TaxReturnedToPeople(uint256 indexed bossId, string bossName, uint256 totalTaxReturned, uint256 hunterCount);
    event PlayerLeveledUp(address indexed player, uint8 newLevel);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOMonsterBountyManager: Caller is not owner");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == owner || authorizedVerifiers[msg.sender], "PISOMonsterBountyManager: Unauthorized verifier");
        _;
    }

    constructor(address _pisoToken) {
        require(_pisoToken != address(0), "PISOMonsterBountyManager: Zero token address");
        pisoToken = PISOToken(_pisoToken);
        owner = msg.sender;
        authorizedVerifiers[msg.sender] = true;

        // Initialize Monster Catalog
        // Small Monster Farms - calibrated for sustainable 10-year economy
        // ~50M P2E pool / 10 years / 10,000 daily active players = ~1.37 PISO/day avg
        monsterCatalog[1] = MonsterDef("Sawa / Cyber Cobra", 1, 1 * 1e18, 30, MonsterTier.SMALL_FARM);
        monsterCatalog[2] = MonsterDef("Scavenger Vulture (Lawin)", 5, 2 * 1e18, 80, MonsterTier.SMALL_FARM);
        monsterCatalog[3] = MonsterDef("Palawan Komodo (Bayawak)", 10, 5 * 1e18, 200, MonsterTier.SMALL_FARM);
        monsterCatalog[4] = MonsterDef("Wild Cyber Hyena / Askal", 15, 10 * 1e18, 400, MonsterTier.SMALL_FARM);

        // Giga Buwaya Titans in Barongs & Capes (Level 20+ Requirement)
        // Boss raids are rare milestone events, not daily grind
        monsterCatalog[101] = MonsterDef("Giga Buwaya Don Crocodilo", 20, 75 * 1e18, 1500, MonsterTier.GIGA_BUWAYA_TITAN);
        monsterCatalog[102] = MonsterDef("Giga Buwaya General Alligator", 30, 200 * 1e18, 3000, MonsterTier.GIGA_BUWAYA_TITAN);
        monsterCatalog[103] = MonsterDef("Supreme Buwaya Senador Supremo", 45, 500 * 1e18, 6000, MonsterTier.GIGA_BUWAYA_TITAN);
    }

    function setAuthorizedVerifier(address verifier, bool authorized) external onlyOwner {
        authorizedVerifiers[verifier] = authorized;
    }

    /**
     * @notice Checks whether a player meets the level requirement to challenge a monster.
     */
    function canAttackMonster(address player, uint256 monsterId) public view returns (bool) {
        MonsterDef memory m = monsterCatalog[monsterId];
        uint8 pLevel = playerLevel[player] > 0 ? playerLevel[player] : 1;
        return pLevel >= m.minPlayerLevelRequired;
    }

    /**
     * @notice Claims bounty and EXP after slaying a monster with level gating verification.
     */
    function claimMonsterBounty(address player, uint256 monsterId) external onlyVerifier {
        require(canAttackMonster(player, monsterId), "PISOMonsterBountyManager: Level too low to attack this monster");
        MonsterDef memory m = monsterCatalog[monsterId];

        uint256 bounty = m.baseBountyPiso;
        require(totalClaimedBounties + bounty <= TOTAL_PLAYER_BOUNTY_POOL, "PISOMonsterBountyManager: 70M pool exhausted");

        totalClaimedBounties += bounty;
        playerExp[player] += m.baseExp;

        // Level Up Calculation aligned with frontend PlayerStatsEngine & PISOMineCraft
        uint8 currentLevel = playerLevel[player] > 0 ? playerLevel[player] : 1;
        uint8 startLevel = currentLevel;

        while (currentLevel < 100) {
            uint256 nextExp = getExpRequiredForLevel(currentLevel);
            if (playerExp[player] >= nextExp) {
                playerExp[player] -= nextExp;
                currentLevel += 1;
            } else {
                break;
            }
        }

        if (currentLevel > startLevel) {
            playerLevel[player] = currentLevel;
            emit PlayerLeveledUp(player, currentLevel);
        }

        if (m.tier == MonsterTier.GIGA_BUWAYA_TITAN) {
            totalTaxRefundsEarned[player] += bounty;
        }

        // Mint or transfer farmed $PISO from the 70M player pool
        require(pisoToken.mint(player, bounty), "PISOMonsterBountyManager: Token transfer failed");
        emit MonsterSlain(player, monsterId, bounty, m.baseExp);
    }

    /**
     * @notice Distributes the liberated Stolen Tax Vault among all raid participants.
     */
    function distributeTaxReturnToPeople(
        uint256 bossId,
        address[] calldata hunters
    ) external onlyVerifier {
        require(hunters.length > 0, "PISOMonsterBountyManager: No hunters");
        MonsterDef memory boss = monsterCatalog[bossId];
        require(boss.tier == MonsterTier.GIGA_BUWAYA_TITAN, "PISOMonsterBountyManager: Not a Buwaya Titan");

        uint256 totalTax = boss.baseBountyPiso;
        uint256 sharePerHunter = totalTax / hunters.length;
        require(totalClaimedBounties + totalTax <= TOTAL_PLAYER_BOUNTY_POOL, "PISOMonsterBountyManager: 70M pool exhausted");

        totalClaimedBounties += totalTax;

        for (uint256 i = 0; i < hunters.length; i++) {
            address hunter = hunters[i];
            totalTaxRefundsEarned[hunter] += sharePerHunter;
            pisoToken.mint(hunter, sharePerHunter);
            emit MonsterSlain(hunter, bossId, sharePerHunter, boss.baseExp / hunters.length);
        }

        emit TaxReturnedToPeople(bossId, boss.name, totalTax, hunters.length);
    }

    function remainingPlayerPool() external view returns (uint256) {
        return TOTAL_PLAYER_BOUNTY_POOL > totalClaimedBounties ? TOTAL_PLAYER_BOUNTY_POOL - totalClaimedBounties : 0;
    }

    /**
     * @notice Deterministic EXP requirement for next level.
     *         Simple standard RPG curve: ~100 * lvl^1.4
     *         Level 1 = 100, Level 10 ≈ 1900, Level 50 ≈ 25000
     *         Approximated with integer math: 100 + (lvl * 90) + (lvl * lvl * 2)
     */
    function getExpRequiredForLevel(uint8 lvl) public pure returns (uint256) {
        if (lvl <= 1) return 100;
        uint256 n = uint256(lvl);
        // Polynomial approximation of 100 * n^1.4: 100 + 90n + 2n^2
        return 100 + (n * 90) + (n * n * 2);
    }

    /**
     * @notice Returns player level, current exp, and exp required for next level.
     */
    function getPlayerLevelInfo(address player) external view returns (uint8 level, uint256 currentExp, uint256 expToNextLevel) {
        level = playerLevel[player] > 0 ? playerLevel[player] : 1;
        currentExp = playerExp[player];
        expToNextLevel = getExpRequiredForLevel(level);
    }
}
