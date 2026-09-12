// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PISOToken.sol";

/**
 * @title PISOFarmingVault
 * @dev 100 Million $PISO Yield Farm and Proof-of-Gameplay Activity Vault.
 * Governed by Kapitan Datu and Bayanihan DAO for PISO Chain metaverse builders.
 */
contract PISOFarmingVault {
    PISOToken public immutable pisoToken;
    address public owner;

    // Total farming supply allocated: 100,000,000 PISO
    uint256 public constant TOTAL_FARM_SUPPLY = 100_000_000 * 1e18;
    uint256 public totalMintedRewards;
    uint256 public totalStakedTokens;

    // Base reward rate: ~1 PISO per block / unit time per 1000 staked
    uint256 public rewardRatePerSecond = 1e16; // 0.01 PISO/sec base emission pool

    struct StakeInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastStakeTimestamp;
        uint256 activityRewardBalance; // Farmed via quests, mining & auto-idle combat
        uint256 multiplierBps; // Multiplier basis points (10000 = 100%, 15000 = 150%)
    }

    mapping(address => StakeInfo) public stakers;

    // Authorized game engines & NPC mentors (Panday, Babaylan, Kapitan Datu)
    mapping(address => bool) public authorizedGameMinters;

    // Reentrancy guard
    uint8 private _unlocked = 1;
    modifier nonReentrant() {
        require(_unlocked == 1, "PISOFarmingVault: Reentrant call");
        _unlocked = 0;
        _;
        _unlocked = 1;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOFarmingVault: Caller is not owner");
        _;
    }

    modifier onlyGameMinter() {
        require(msg.sender == owner || authorizedGameMinters[msg.sender], "PISOFarmingVault: Unauthorized game minter");
        _;
    }

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardsHarvested(address indexed user, uint256 amount);
    event ActivityPointsEarned(address indexed user, uint256 amount, string reason);
    event MultiplierUpdated(address indexed user, uint256 multiplierBps);

    constructor(address _pisoToken) {
        require(_pisoToken != address(0), "PISOFarmingVault: Zero token address");
        pisoToken = PISOToken(_pisoToken);
        owner = msg.sender;
        authorizedGameMinters[msg.sender] = true;
    }

    function setAuthorizedGameMinter(address minter, bool authorized) external onlyOwner {
        authorizedGameMinters[minter] = authorized;
    }

    function setRewardRate(uint256 _newRatePerSecond) external onlyOwner {
        rewardRatePerSecond = _newRatePerSecond;
    }

    /**
     * @notice Stakes PISO tokens to earn continuous farming yield.
     */
    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "PISOFarmingVault: Cannot stake 0");

        updateStakerYield(msg.sender);

        stakers[msg.sender].amount += amount;
        totalStakedTokens += amount;
        stakers[msg.sender].lastStakeTimestamp = block.timestamp;
        if (stakers[msg.sender].multiplierBps == 0) {
            stakers[msg.sender].multiplierBps = 10000; // 100% baseline
        }

        require(pisoToken.transferFrom(msg.sender, address(this), amount), "PISOFarmingVault: Transfer failed");
        emit Staked(msg.sender, amount);
    }

    /**
     * @notice Withdraws staked tokens and updates reward accumulator.
     */
    function withdraw(uint256 amount) external nonReentrant {
        StakeInfo storage user = stakers[msg.sender];
        require(user.amount >= amount, "PISOFarmingVault: Insufficient staked amount");

        updateStakerYield(msg.sender);

        user.amount -= amount;
        totalStakedTokens -= amount;
        user.lastStakeTimestamp = block.timestamp;

        require(pisoToken.transfer(msg.sender, amount), "PISOFarmingVault: Transfer failed");
        emit Withdrawn(msg.sender, amount);
    }

    /**
     * @notice Records proof-of-gameplay activity rewards (quests, monster slaying, idle farming).
     */
    function recordGameActivityReward(
        address player,
        uint256 rewardAmount,
        string calldata reason
    ) external onlyGameMinter {
        require(player != address(0), "PISOFarmingVault: Zero player address");
        require(totalMintedRewards + rewardAmount <= TOTAL_FARM_SUPPLY, "PISOFarmingVault: 100M supply cap reached");

        StakeInfo storage user = stakers[player];
        uint256 mult = user.multiplierBps > 0 ? user.multiplierBps : 10000;
        uint256 boostedAmount = (rewardAmount * mult) / 10000;

        user.activityRewardBalance += boostedAmount;
        emit ActivityPointsEarned(player, boostedAmount, reason);
    }

    /**
     * @notice Sets farming APR multiplier from equipped NFT relics (Agimat, Salakot) or pets.
     */
    function setFarmingMultiplier(address player, uint256 multiplierBps) external onlyGameMinter {
        require(multiplierBps >= 10000 && multiplierBps <= 50000, "PISOFarmingVault: Invalid multiplier"); // 1.0x to 5.0x
        stakers[player].multiplierBps = multiplierBps;
        emit MultiplierUpdated(player, multiplierBps);
    }

    /**
     * @notice Harvests all earned staking and gameplay farming rewards into player's wallet.
     */
    function harvestRewards() external nonReentrant returns (uint256) {
        updateStakerYield(msg.sender);

        StakeInfo storage user = stakers[msg.sender];
        uint256 totalClaimable = user.activityRewardBalance;
        require(totalClaimable > 0, "PISOFarmingVault: No rewards available to harvest");
        require(totalMintedRewards + totalClaimable <= TOTAL_FARM_SUPPLY, "PISOFarmingVault: 100M Cap reached");

        user.activityRewardBalance = 0;
        user.lastStakeTimestamp = block.timestamp;
        totalMintedRewards += totalClaimable;

        // Mint farmed $PISO tokens directly to user from the 100M pool
        require(pisoToken.mint(msg.sender, totalClaimable), "PISOFarmingVault: Minting failed");
        emit RewardsHarvested(msg.sender, totalClaimable);
        return totalClaimable;
    }

    /**
     * @notice Returns total pending rewards for an account.
     */
    function getPendingRewards(address account) external view returns (uint256) {
        StakeInfo storage user = stakers[account];
        uint256 pending = user.activityRewardBalance;

        if (user.amount > 0 && block.timestamp > user.lastStakeTimestamp) {
            uint256 secondsPassed = block.timestamp - user.lastStakeTimestamp;
            uint256 mult = user.multiplierBps > 0 ? user.multiplierBps : 10000;
            // 20% Base APR on staked balance
            uint256 stakeYield = (user.amount * 20 * secondsPassed * mult) / (100 * 365 days * 10000);
            pending += stakeYield;
        }

        return pending;
    }

    function updateStakerYield(address account) internal {
        StakeInfo storage user = stakers[account];
        if (user.amount > 0 && user.lastStakeTimestamp > 0 && block.timestamp > user.lastStakeTimestamp) {
            uint256 secondsPassed = block.timestamp - user.lastStakeTimestamp;
            uint256 mult = user.multiplierBps > 0 ? user.multiplierBps : 10000;
            uint256 stakeYield = (user.amount * 20 * secondsPassed * mult) / (100 * 365 days * 10000);
            user.activityRewardBalance += stakeYield;
        }
        user.lastStakeTimestamp = block.timestamp;
    }

    function remainingFarmSupply() external view returns (uint256) {
        return TOTAL_FARM_SUPPLY > totalMintedRewards ? TOTAL_FARM_SUPPLY - totalMintedRewards : 0;
    }
}
