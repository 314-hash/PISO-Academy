// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PISOMineCraft
 * @notice On-chain mining, building, and community tip system for PISO Metaverse.
 *
 *         Economy Loop:
 *         ─────────────────────────────────────────────────────────────────
 *         Player mines blocks → earns resources (off-chain) + EXP (off-chain)
 *         Player builds structure → registers Build on-chain (PISOMineCraft)
 *         Community tips Build with $PISO → leaderboard updated
 *         Build owner claims accumulated tips
 *         ─────────────────────────────────────────────────────────────────
 *
 *         Block Types (8 Filipino-named tiers):
 *           0 = Kahoy (Wood)         — Lvl 1+
 *           1 = Lupa  (Dirt/Earth)   — Lvl 1+
 *           2 = Bato  (Stone)        — Lvl 6+
 *           3 = Bakal (Iron Ore)     — Lvl 6+
 *           4 = Ginto (Gold Ore)     — Lvl 16+
 *           5 = Kristal (Crystal)    — Lvl 16+
 *           6 = Bakunawa Scale       — Lvl 31+
 *           7 = Bituin Shard (Star)  — Lvl 31+
 */
contract PISOMineCraft {

    // ─── Block Type Definitions ───────────────────────────────────────────────

    uint8 public constant BLOCK_KAHOY    = 0;
    uint8 public constant BLOCK_LUPA     = 1;
    uint8 public constant BLOCK_BATO     = 2;
    uint8 public constant BLOCK_BAKAL    = 3;
    uint8 public constant BLOCK_GINTO    = 4;
    uint8 public constant BLOCK_KRISTAL  = 5;
    uint8 public constant BLOCK_BAKUNAWA = 6;
    uint8 public constant BLOCK_BITUIN   = 7;

    uint8 public constant BLOCK_TYPE_COUNT = 8;

    // ─── Rate Limiting ────────────────────────────────────────────────────────

    uint256 public constant MINE_WINDOW       = 60;   // 1 minute window
    uint256 public constant MINE_SOFT_CAP     = 5;    // warn above 5 blocks/min
    uint256 public constant MINE_HARD_CAP     = 20;   // block above 20 blocks/min
    uint256 public constant TIP_MIN_AMOUNT    = 1e16; // 0.01 PISO min tip
    uint256 public constant TIP_MAX_AMOUNT    = 10_000 * 1e18; // 10k PISO max tip

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct MineRecord {
        address player;
        uint8   blockType;
        int32   worldX;       // World X position (scaled ×10 for 1 decimal precision)
        int32   worldZ;       // World Z position
        uint256 timestamp;
        uint256 expAwarded;
    }

    struct Build {
        bytes32 buildId;
        address owner;
        string  name;
        string  description;
        uint8   buildCategory;   // 0=Freeform, 1=Bahay, 2=Kuta, 3=Bantayan, 4=Palengke, 5=Simbahan, 6=Kastilyo, 7=Bakunawa Tower
        int32   worldX;
        int32   worldZ;
        uint256 createdAt;
        uint256 totalTips;       // Cumulative $PISO tips received (in wei)
        uint256 claimableTips;   // Currently claimable by owner
        uint256 tipCount;
        bool    active;
    }

    struct TipRecord {
        address tipper;
        bytes32 buildId;
        uint256 amount;
        uint256 timestamp;
        string  message;
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public pisoToken;

    uint256 public totalMineEvents;
    uint256 public totalBuilds;
    uint256 public totalTipVolume;

    // Mining records
    mapping(uint256 => MineRecord)    public mineRecords;
    mapping(address => uint256[])     public playerMineIds;
    mapping(address => uint256[8])    public playerBlockCounts;   // Per block type counts

    // Rate limiting: player => window start => count in window
    mapping(address => uint256) public mineWindowStart;
    mapping(address => uint256) public mineWindowCount;

    // Build registry
    mapping(bytes32 => Build)         public builds;
    mapping(address => bytes32[])     public playerBuilds;
    bytes32[]                         public allBuildIds;         // For leaderboard enumeration

    // Tip records
    mapping(uint256 => TipRecord)     public tipRecords;
    uint256 public totalTipCount;
    mapping(bytes32 => uint256[])     public buildTipIds;

    // Leaderboard cache (top 10 build IDs by total tips)
    bytes32[10]                       public leaderboard;
    bool                              public leaderboardDirty;

    // ─── Events ───────────────────────────────────────────────────────────────

    event BlockMined(
        address indexed player,
        uint8   indexed blockType,
        int32   worldX,
        int32   worldZ,
        uint256 expAwarded,
        uint256 mineId,
        uint256 timestamp
    );

    event BuildCreated(
        bytes32 indexed buildId,
        address indexed owner,
        string  name,
        uint8   category,
        int32   worldX,
        int32   worldZ,
        uint256 timestamp
    );

    event BuildTipped(
        bytes32 indexed buildId,
        address indexed tipper,
        uint256 amount,
        string  message,
        uint256 tipId,
        uint256 timestamp
    );

    event TipsClaimed(
        bytes32 indexed buildId,
        address indexed owner,
        uint256 amount,
        uint256 timestamp
    );

    event BuildDeactivated(bytes32 indexed buildId, uint256 timestamp);

    event LeaderboardUpdated(bytes32[10] top10, uint256 timestamp);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOMineCraft: Not owner");
        _;
    }

    modifier buildExists(bytes32 buildId) {
        require(builds[buildId].active, "PISOMineCraft: Build not found or inactive");
        _;
    }

    modifier onlyBuildOwner(bytes32 buildId) {
        require(builds[buildId].owner == msg.sender, "PISOMineCraft: Not build owner");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _pisoToken) {
        require(_pisoToken != address(0), "PISOMineCraft: Zero token");
        owner      = msg.sender;
        pisoToken  = _pisoToken;
    }

    // ─── Mining ───────────────────────────────────────────────────────────────

    /**
     * @notice Record a block mining event on-chain.
     *         Rate-limited to prevent bot farming.
     * @param blockType  0–7 (BLOCK_KAHOY .. BLOCK_BITUIN)
     * @param worldX     World X position × 10
     * @param worldZ     World Z position × 10
     */
    function mine(uint8 blockType, int32 worldX, int32 worldZ) external returns (uint256 mineId) {
        require(blockType < BLOCK_TYPE_COUNT, "PISOMineCraft: Invalid block type");

        // Rate limiting
        _checkMineRateLimit(msg.sender);

        uint256 expAwarded = _blockExp(blockType);

        mineId = totalMineEvents++;
        mineRecords[mineId] = MineRecord({
            player:     msg.sender,
            blockType:  blockType,
            worldX:     worldX,
            worldZ:     worldZ,
            timestamp:  block.timestamp,
            expAwarded: expAwarded
        });

        playerMineIds[msg.sender].push(mineId);
        playerBlockCounts[msg.sender][blockType] += 1;

        emit BlockMined(msg.sender, blockType, worldX, worldZ, expAwarded, mineId, block.timestamp);
    }

    // ─── Building ─────────────────────────────────────────────────────────────

    /**
     * @notice Register a named Build on-chain. Makes it tip-able and leaderboard-eligible.
     * @param name         Display name of the build (max 64 chars)
     * @param description  Short description (max 256 chars)
     * @param category     Build template category (0–7)
     * @param worldX       Build world X × 10
     * @param worldZ       Build world Z × 10
     */
    function createBuild(
        string calldata name,
        string calldata description,
        uint8  category,
        int32  worldX,
        int32  worldZ
    ) external returns (bytes32 buildId) {
        require(bytes(name).length > 0 && bytes(name).length <= 64,   "PISOMineCraft: Name 1–64 chars");
        require(bytes(description).length <= 256,                      "PISOMineCraft: Description max 256 chars");
        require(category <= 7,                                         "PISOMineCraft: Invalid category");

        buildId = keccak256(abi.encodePacked(msg.sender, name, worldX, worldZ, block.timestamp));
        require(!builds[buildId].active, "PISOMineCraft: Build ID collision");

        builds[buildId] = Build({
            buildId:       buildId,
            owner:         msg.sender,
            name:          name,
            description:   description,
            buildCategory: category,
            worldX:        worldX,
            worldZ:        worldZ,
            createdAt:     block.timestamp,
            totalTips:     0,
            claimableTips: 0,
            tipCount:      0,
            active:        true
        });

        playerBuilds[msg.sender].push(buildId);
        allBuildIds.push(buildId);
        totalBuilds++;

        leaderboardDirty = true;

        emit BuildCreated(buildId, msg.sender, name, category, worldX, worldZ, block.timestamp);
    }

    // ─── Tipping ──────────────────────────────────────────────────────────────

    /**
     * @notice Tip a build with $PISO tokens to support the builder.
     *         Tipper must have approved this contract to spend `amount` of PISOToken.
     * @param buildId  Target build to tip
     * @param amount   Amount of $PISO to tip (in wei)
     * @param message  Optional tip message (max 140 chars)
     */
    function tipBuild(
        bytes32 buildId,
        uint256 amount,
        string calldata message
    ) external buildExists(buildId) {
        require(amount >= TIP_MIN_AMOUNT,              "PISOMineCraft: Tip below minimum (0.01 PISO)");
        require(amount <= TIP_MAX_AMOUNT,              "PISOMineCraft: Tip exceeds maximum (10,000 PISO)");
        require(bytes(message).length <= 140,          "PISOMineCraft: Message max 140 chars");
        require(builds[buildId].owner != msg.sender,   "PISOMineCraft: Cannot tip own build");

        // Transfer $PISO from tipper to this contract (held for builder)
        _transferFrom(msg.sender, address(this), amount);

        Build storage b = builds[buildId];
        b.totalTips     += amount;
        b.claimableTips += amount;
        b.tipCount      += 1;

        uint256 tipId = totalTipCount++;
        tipRecords[tipId] = TipRecord({
            tipper:    msg.sender,
            buildId:   buildId,
            amount:    amount,
            timestamp: block.timestamp,
            message:   message
        });
        buildTipIds[buildId].push(tipId);
        totalTipVolume += amount;

        leaderboardDirty = true;

        emit BuildTipped(buildId, msg.sender, amount, message, tipId, block.timestamp);
    }

    /**
     * @notice Build owner claims all accumulated $PISO tips for their build.
     */
    function claimTips(bytes32 buildId)
        external
        buildExists(buildId)
        onlyBuildOwner(buildId)
    {
        Build storage b = builds[buildId];
        uint256 claimable = b.claimableTips;
        require(claimable > 0, "PISOMineCraft: Nothing to claim");

        b.claimableTips = 0;
        _transfer(msg.sender, claimable);

        emit TipsClaimed(buildId, msg.sender, claimable, block.timestamp);
    }

    // ─── Leaderboard ──────────────────────────────────────────────────────────

    /**
     * @notice Refreshes the top-10 leaderboard. Can be called by anyone.
     *         Uses a simple O(n×10) selection sort — suitable for reasonable build counts.
     */
    function refreshLeaderboard() external {
        require(leaderboardDirty || true, "PISOMineCraft: Leaderboard already current");

        bytes32[10] memory top;
        uint256[10] memory topTips;

        uint256 n = allBuildIds.length;
        for (uint256 i = 0; i < n; i++) {
            bytes32 bid = allBuildIds[i];
            if (!builds[bid].active) continue;
            uint256 tips = builds[bid].totalTips;

            // Insertion into top-10
            for (uint256 slot = 0; slot < 10; slot++) {
                if (tips > topTips[slot]) {
                    // Shift everything down
                    for (uint256 s = 9; s > slot; s--) {
                        top[s]     = top[s - 1];
                        topTips[s] = topTips[s - 1];
                    }
                    top[slot]     = bid;
                    topTips[slot] = tips;
                    break;
                }
            }
        }

        leaderboard     = top;
        leaderboardDirty = false;

        emit LeaderboardUpdated(top, block.timestamp);
    }

    /**
     * @notice Returns the current top-10 build IDs (call refreshLeaderboard first if dirty).
     */
    function getLeaderboard() external view returns (bytes32[10] memory) {
        return leaderboard;
    }

    /**
     * @notice Get full Build data for a buildId.
     */
    function getBuild(bytes32 buildId) external view returns (Build memory) {
        return builds[buildId];
    }

    /**
     * @notice Returns all build IDs owned by a player.
     */
    function getPlayerBuilds(address player) external view returns (bytes32[] memory) {
        return playerBuilds[player];
    }

    /**
     * @notice Returns all mine event IDs for a player.
     */
    function getPlayerMines(address player) external view returns (uint256[] memory) {
        return playerMineIds[player];
    }

    /**
     * @notice Returns per-block-type mining counts for a player.
     */
    function getPlayerBlockCounts(address player) external view returns (uint256[8] memory) {
        return playerBlockCounts[player];
    }

    /**
     * @notice Returns all tips for a specific build.
     */
    function getBuildTips(bytes32 buildId) external view returns (uint256[] memory) {
        return buildTipIds[buildId];
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function deactivateBuild(bytes32 buildId) external {
        require(
            msg.sender == owner || msg.sender == builds[buildId].owner,
            "PISOMineCraft: Not authorized"
        );
        builds[buildId].active = false;
        leaderboardDirty = true;
        emit BuildDeactivated(buildId, block.timestamp);
    }

    function setToken(address _pisoToken) external onlyOwner {
        require(_pisoToken != address(0), "PISOMineCraft: Zero address");
        pisoToken = _pisoToken;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PISOMineCraft: Zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    /// @dev Returns EXP awarded for each block type
    function _blockExp(uint8 blockType) internal pure returns (uint256) {
        if (blockType == BLOCK_KAHOY)    return 10;
        if (blockType == BLOCK_LUPA)     return 8;
        if (blockType == BLOCK_BATO)     return 15;
        if (blockType == BLOCK_BAKAL)    return 30;
        if (blockType == BLOCK_GINTO)    return 60;
        if (blockType == BLOCK_KRISTAL)  return 120;
        if (blockType == BLOCK_BAKUNAWA) return 300;
        if (blockType == BLOCK_BITUIN)   return 500;
        return 0;
    }

    /// @dev Mining rate limiter: max MINE_HARD_CAP blocks per MINE_WINDOW seconds
    function _checkMineRateLimit(address player) internal {
        uint256 windowStart = mineWindowStart[player];
        uint256 count       = mineWindowCount[player];

        if (block.timestamp >= windowStart + MINE_WINDOW) {
            // New window
            mineWindowStart[player] = block.timestamp;
            mineWindowCount[player] = 1;
        } else {
            require(count < MINE_HARD_CAP, "PISOMineCraft: Mining rate limit exceeded (20/min max)");
            mineWindowCount[player] = count + 1;
        }
    }

    /// @dev Transfer PISOToken from `from` to this contract
    function _transferFrom(address from, address to, uint256 amount) internal {
        (bool ok, bytes memory data) = pisoToken.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", from, to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "PISOMineCraft: TransferFrom failed");
    }

    /// @dev Transfer PISOToken from this contract to `to`
    function _transfer(address to, uint256 amount) internal {
        (bool ok, bytes memory data) = pisoToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "PISOMineCraft: Transfer failed");
    }

    // ─── Events (admin) ───────────────────────────────────────────────────────
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
}
