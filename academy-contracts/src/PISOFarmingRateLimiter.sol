// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPISOVerificationRegistry {
    function getStudentCredentials(address student) external view returns (bytes32[] memory);
}

/**
 * @title PISOFarmingRateLimiter
 * @dev Sybil-resistant, proof-of-education rate limiter for PISO Metaverse token farming & monster bounties.
 * Connects directly to PISOVerificationRegistry to verify soulbound course completion credentials.
 * Enforces daily token earning quotas and 10-minute kill rate limits based on student graduation tiers.
 */
contract PISOFarmingRateLimiter {
    address public immutable owner;
    IPISOVerificationRegistry public immutable registry;

    enum EducationalTier {
        NOVICE_GUEST,      // Tier 0: 0 certificates -> 500 PISO/day, 10 kills/10min
        BARANGAY_SCHOLAR,  // Tier 1: 1+ certificates -> 2,500 PISO/day, 25 kills/10min (+25% yield)
        MUNICIPAL_DEV,     // Tier 2: 2+ certificates -> 10,000 PISO/day, 50 kills/10min (+50% yield)
        SOVEREIGN_ARCHITECT// Tier 3: 3+ certificates -> 50,000 PISO/day, 120 kills/10min (+100% yield)
    }

    struct TierConfig {
        uint256 dailyTokenCap;
        uint256 windowKillLimit; // per 10 minutes
        uint256 yieldMultiplierBps; // 10000 = 1.0x, 12500 = 1.25x, etc.
        bool titanHuntAllowed;
    }

    mapping(EducationalTier => TierConfig) public tierConfigs;

    struct PlayerFarmRecord {
        uint256 currentDay; // day timestamp / 86400
        uint256 dailyTokensHarvested;
        uint256 windowKillCount;
        uint256 windowStartTimestamp;
    }

    mapping(address => PlayerFarmRecord) public playerRecords;

    event FarmYieldRecorded(address indexed student, uint256 amount, uint256 newDailyTotal, EducationalTier tier);
    event MonsterKillRecorded(address indexed student, uint256 windowKills);
    event RateLimitHit(address indexed student, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISORateLimiter: Unauthorized");
        _;
    }

    constructor(address _registryAddress) {
        owner = msg.sender;
        registry = IPISOVerificationRegistry(_registryAddress);

        // Tier 0: Novice / Guest
        tierConfigs[EducationalTier.NOVICE_GUEST] = TierConfig({
            dailyTokenCap: 500 * 1e18,
            windowKillLimit: 10,
            yieldMultiplierBps: 10000, // 1.0x
            titanHuntAllowed: false
        });

        // Tier 1: Barangay Scholar
        tierConfigs[EducationalTier.BARANGAY_SCHOLAR] = TierConfig({
            dailyTokenCap: 2500 * 1e18,
            windowKillLimit: 25,
            yieldMultiplierBps: 12500, // 1.25x
            titanHuntAllowed: false
        });

        // Tier 2: Municipal Solidity Developer
        tierConfigs[EducationalTier.MUNICIPAL_DEV] = TierConfig({
            dailyTokenCap: 10000 * 1e18,
            windowKillLimit: 50,
            yieldMultiplierBps: 15000, // 1.5x
            titanHuntAllowed: true // Senator Croc unlocked
        });

        // Tier 3: Sovereign Katipunero Architect
        tierConfigs[EducationalTier.SOVEREIGN_ARCHITECT] = TierConfig({
            dailyTokenCap: 50000 * 1e18,
            windowKillLimit: 120,
            yieldMultiplierBps: 20000, // 2.0x
            titanHuntAllowed: true // All Titans unlocked
        });
    }

    /**
     * @notice Checks student credentials in PISOVerificationRegistry to determine educational tier.
     */
    function getStudentEducationalTier(address student) public view returns (EducationalTier tier, uint256 certCount) {
        bytes32[] memory certs = registry.getStudentCredentials(student);
        certCount = certs.length;

        if (certCount >= 3) {
            return (EducationalTier.SOVEREIGN_ARCHITECT, certCount);
        } else if (certCount == 2) {
            return (EducationalTier.MUNICIPAL_DEV, certCount);
        } else if (certCount == 1) {
            return (EducationalTier.BARANGAY_SCHOLAR, certCount);
        } else {
            return (EducationalTier.NOVICE_GUEST, 0);
        }
    }

    /**
     * @notice Checks if student is allowed to farm an additional monster or harvest tokens.
     */
    function canFarmTokens(address student, uint256 requestedAmount) external view returns (bool allowed, uint256 remainingDailyQuota, string memory reason) {
        (EducationalTier tier, ) = getStudentEducationalTier(student);
        TierConfig memory config = tierConfigs[tier];
        PlayerFarmRecord memory rec = playerRecords[student];

        uint256 today = block.timestamp / 86400;
        uint256 currentHarvested = (rec.currentDay == today) ? rec.dailyTokensHarvested : 0;

        if (currentHarvested + requestedAmount > config.dailyTokenCap) {
            uint256 remaining = currentHarvested >= config.dailyTokenCap ? 0 : config.dailyTokenCap - currentHarvested;
            return (false, remaining, "Daily Educational Farming Quota Exceeded. Complete more PISO Academy courses to upgrade tier!");
        }

        return (true, config.dailyTokenCap - currentHarvested, "Authorized");
    }

    /**
     * @notice Records token harvest against the student's daily quota.
     */
    function recordFarmYield(address student, uint256 amount) external returns (bool) {
        (EducationalTier tier, ) = getStudentEducationalTier(student);
        TierConfig memory config = tierConfigs[tier];
        PlayerFarmRecord storage rec = playerRecords[student];

        uint256 today = block.timestamp / 86400;
        if (rec.currentDay != today) {
            rec.currentDay = today;
            rec.dailyTokensHarvested = 0;
        }

        require(rec.dailyTokensHarvested + amount <= config.dailyTokenCap, "PISORateLimiter: Quota exceeded");
        rec.dailyTokensHarvested += amount;

        emit FarmYieldRecorded(student, amount, rec.dailyTokensHarvested, tier);
        return true;
    }

    /**
     * @notice Enforces sliding 10-minute anti-bot kill rate limit.
     */
    function recordMonsterKill(address student) external returns (bool allowed, uint256 currentWindowKills) {
        (EducationalTier tier, ) = getStudentEducationalTier(student);
        TierConfig memory config = tierConfigs[tier];
        PlayerFarmRecord storage rec = playerRecords[student];

        // 10-minute sliding window (600 seconds)
        if (block.timestamp > rec.windowStartTimestamp + 600) {
            rec.windowStartTimestamp = block.timestamp;
            rec.windowKillCount = 1;
            emit MonsterKillRecorded(student, 1);
            return (true, 1);
        }

        if (rec.windowKillCount >= config.windowKillLimit) {
            emit RateLimitHit(student, "10-minute monster farming rate limit reached. Anti-bot cooldown active.");
            return (false, rec.windowKillCount);
        }

        rec.windowKillCount += 1;
        emit MonsterKillRecorded(student, rec.windowKillCount);
        return (true, rec.windowKillCount);
    }
}
