// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ─── Typed Interfaces ────────────────────────────────────────────────────────

/**
 * @dev Minimal interface for PISOToken — used instead of a raw low-level call
 *      to guarantee type safety and proper revert propagation.
 */
interface IPISOToken {
    function burnFrom(address account, uint256 amount) external returns (bool);
}

/**
 * @dev Minimal interface for the OP Stack L2CrossDomainMessenger predeploy.
 *      Same address (0x4200...0007) on every OP Stack chain.
 */
interface IL2CrossDomainMessenger {
    function sendMessage(address target, bytes calldata message, uint32 gasLimit) external;
    function xDomainMessageSender() external view returns (address);
}

/**
 * @title PISOBridge
 * @notice L2-side bridge wrapper that sits on top of the OP Stack L2StandardBridge predeploy.
 *         Provides game-aware deposit/withdrawal tracking and auto-credits $PISO to
 *         players who bridge from Ethereum Sepolia (L1) to PISO Chain (L2).
 *
 *         Flow (Deposit  L1 → L2):
 *         ┌────────────────────────────────────────────────────────────────────┐
 *         │  User calls L1StandardBridge.bridgeERC20() on Sepolia              │
 *         │       └─► OP Stack relays cross-domain message to L2               │
 *         │           └─► L2StandardBridge.finalizeBridgeERC20()               │
 *         │               └─► PISOToken.mint(user, amount)  [IBridgeMintable]  │
 *         │               └─► PISOBridge.recordDeposit() — emits event         │
 *         └────────────────────────────────────────────────────────────────────┘
 *
 *         Flow (Withdrawal L2 → L1):
 *         ┌────────────────────────────────────────────────────────────────────┐
 *         │  User calls PISOBridge.initiateWithdrawal()                        │
 *         │       └─► PISOToken.burn(user, amount)                             │
 *         │       └─► L2CrossDomainMessenger.sendMessage() → 7-day window      │
 *         │  After 7 days: user calls L1 to finalize and unlock ERC-20 on L1   │
 *         └────────────────────────────────────────────────────────────────────┘
 */
contract PISOBridge {
    // ─── OP Stack Interfaces ──────────────────────────────────────────────────

    /// @notice OP predeploy: L2CrossDomainMessenger
    address public constant L2_CROSS_DOMAIN_MESSENGER = 0x4200000000000000000000000000000000000007;

    /// @notice OP predeploy: L2StandardBridge
    address public constant L2_STANDARD_BRIDGE = 0x4200000000000000000000000000000000000010;

    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice Gas allocated to the L1-side finalization call sent via cross-domain message.
    ///         200 000 is standard for OP Stack ERC-20 bridge finalizations.
    uint32 public constant L1_GAS_LIMIT = 200_000;

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public pisoToken;              // PISOToken contract on L2
    address public l1TokenCounterpart;     // Locked ERC-20 on Sepolia L1
    address public l1Bridge;               // L1StandardBridge on Sepolia (cross-domain target)

    uint256 public totalDeposited;
    uint256 public totalWithdrawn;
    uint256 public depositCount;
    uint256 public withdrawalCount;

    struct DepositRecord {
        address user;
        uint256 amount;
        uint256 timestamp;
        bytes32 l1TxHash;      // L1 deposit tx hash (passed via cross-domain message)
        bool    credited;
    }

    struct WithdrawalRecord {
        address user;
        uint256 amount;
        uint256 timestamp;
        bytes32 l2TxHash;
        bool    finalized;
    }

    mapping(uint256 => DepositRecord)    public deposits;
    mapping(uint256 => WithdrawalRecord) public withdrawals;
    mapping(address => uint256[])        public userDepositIds;
    mapping(address => uint256[])        public userWithdrawalIds;

    // ─── Events ───────────────────────────────────────────────────────────────

    event BridgeDeposit(
        address indexed user,
        uint256 amount,
        uint256 depositId,
        bytes32 l1TxHash,
        uint256 timestamp
    );

    event WithdrawalInitiated(
        address indexed user,
        uint256 amount,
        uint256 withdrawalId,
        bytes32 l2TxHash,
        uint256 timestamp
    );

    event WithdrawalFinalized(
        address indexed user,
        uint256 withdrawalId,
        uint256 timestamp
    );

    event CrossDomainMessageSent(
        address indexed l1Target,
        uint256 indexed withdrawalId,
        bytes32 l2TxHash
    );

    /// @notice Emitted on every ownership transfer for on-chain auditability.
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    event ConfigUpdated(address pisoToken, address l1TokenCounterpart, address l1Bridge);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOBridge: Not owner");
        _;
    }

    modifier onlyMessenger() {
        require(
            msg.sender == L2_CROSS_DOMAIN_MESSENGER,
            "PISOBridge: Caller is not L2CrossDomainMessenger"
        );
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _pisoToken, address _l1TokenCounterpart, address _l1Bridge) {
        require(_pisoToken != address(0), "PISOBridge: Zero token address");
        owner              = msg.sender;
        pisoToken          = _pisoToken;
        l1TokenCounterpart = _l1TokenCounterpart;
        l1Bridge           = _l1Bridge;  // L1StandardBridge on Sepolia; may be address(0) pre-deployment
    }

    // ─── Deposit Recording (called by cross-domain messenger) ─────────────────

    /**
     * @notice Called by the L2CrossDomainMessenger after an L1 deposit is relayed.
     *         Records the deposit for game-side tracking and emits a BridgeDeposit event
     *         so the frontend can react instantly.
     * @param user     The player's address.
     * @param amount   Amount of $PISO minted (IBridgeMintable already handled by bridge).
     * @param l1TxHash Original L1 deposit transaction hash for UX cross-referencing.
     */
    function recordDeposit(
        address user,
        uint256 amount,
        bytes32 l1TxHash
    ) external onlyMessenger {
        require(user   != address(0), "PISOBridge: Zero user");
        require(amount > 0,           "PISOBridge: Zero amount");

        uint256 id = depositCount++;
        deposits[id] = DepositRecord({
            user:      user,
            amount:    amount,
            timestamp: block.timestamp,
            l1TxHash:  l1TxHash,
            credited:  true
        });
        userDepositIds[user].push(id);
        totalDeposited += amount;

        emit BridgeDeposit(user, amount, id, l1TxHash, block.timestamp);
    }

    // ─── Withdrawal Initiation (L2 → L1) ─────────────────────────────────────

    /**
     * @notice Initiate a $PISO withdrawal from L2 → L1.
     *         Burns $PISO on L2 and sends a cross-domain message to unlock on L1.
     *         After the 7-day fraud-proof window the user can finalize on L1.
     * @param amount  Amount of $PISO to withdraw (in wei).
     */
    function initiateWithdrawal(uint256 amount) external {
        require(amount > 0, "PISOBridge: Amount must be > 0");

        // 1. Burn $PISO on L2 via typed interface (not low-level call)
        //    User must have approved this contract to spend `amount` before calling.
        IPISOToken(pisoToken).burnFrom(msg.sender, amount);

        // 2. Record withdrawal
        uint256 id       = withdrawalCount++;
        bytes32 l2TxHash = keccak256(abi.encodePacked(msg.sender, amount, block.timestamp, id));

        withdrawals[id] = WithdrawalRecord({
            user:      msg.sender,
            amount:    amount,
            timestamp: block.timestamp,
            l2TxHash:  l2TxHash,
            finalized: false
        });
        userWithdrawalIds[msg.sender].push(id);
        totalWithdrawn += amount;

        emit WithdrawalInitiated(msg.sender, amount, id, l2TxHash, block.timestamp);

        // 3. Send cross-domain message to L1 — this is what actually initiates the
        //    OP Stack withdrawal proof and links the L2 burn to the L1 unlock.
        //    L1StandardBridge.finalizeBridgeERC20() will be callable after the
        //    7-day fraud-proof window elapses.
        if (l1Bridge != address(0)) {
            // ABI-encode the L1StandardBridge.finalizeBridgeERC20 call
            bytes memory l1CallData = abi.encodeWithSignature(
                "finalizeBridgeERC20(address,address,address,address,uint256,bytes)",
                l1TokenCounterpart,   // localToken  (L1 PISO)
                pisoToken,            // remoteToken (L2 PISO)
                address(this),        // from        (this bridge, which burned on behalf of user)
                msg.sender,           // to          (user receives on L1)
                amount,
                abi.encode(l2TxHash)  // extraData   (withdrawal hash for traceability)
            );

            IL2CrossDomainMessenger(L2_CROSS_DOMAIN_MESSENGER).sendMessage(
                l1Bridge,
                l1CallData,
                L1_GAS_LIMIT
            );

            emit CrossDomainMessageSent(l1Bridge, id, l2TxHash);
        }
        // Note: if l1Bridge is address(0) (pre-deployment / devnet mode), the burn
        // is recorded but no L1 message is sent. Set l1Bridge via setConfig() before mainnet.
    }

    /**
     * @notice Mark a withdrawal as finalized (called after L1 claim is confirmed).
     *         Only for off-chain indexer UX — actual finality is enforced on L1.
     */
    function markWithdrawalFinalized(uint256 withdrawalId) external onlyOwner {
        WithdrawalRecord storage w = withdrawals[withdrawalId];
        require(!w.finalized, "PISOBridge: Already finalized");
        w.finalized = true;
        emit WithdrawalFinalized(w.user, withdrawalId, block.timestamp);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getUserDeposits(address user) external view returns (uint256[] memory) {
        return userDepositIds[user];
    }

    function getUserWithdrawals(address user) external view returns (uint256[] memory) {
        return userWithdrawalIds[user];
    }

    function getDepositRecord(uint256 id) external view returns (DepositRecord memory) {
        return deposits[id];
    }

    function getWithdrawalRecord(uint256 id) external view returns (WithdrawalRecord memory) {
        return withdrawals[id];
    }

    function getBridgeStats() external view returns (
        uint256 _totalDeposited,
        uint256 _totalWithdrawn,
        uint256 _depositCount,
        uint256 _withdrawalCount,
        uint256 _netFlow
    ) {
        return (
            totalDeposited,
            totalWithdrawn,
            depositCount,
            withdrawalCount,
            totalDeposited > totalWithdrawn ? totalDeposited - totalWithdrawn : 0
        );
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setConfig(
        address _pisoToken,
        address _l1Counterpart,
        address _l1Bridge
    ) external onlyOwner {
        require(_pisoToken != address(0), "PISOBridge: Zero token");
        pisoToken          = _pisoToken;
        l1TokenCounterpart = _l1Counterpart;
        l1Bridge           = _l1Bridge;
        emit ConfigUpdated(_pisoToken, _l1Counterpart, _l1Bridge);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PISOBridge: Zero address");
        emit OwnershipTransferred(owner, newOwner);  // ← audit fix: emit before state change
        owner = newOwner;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────
    // (No _burnPISO helper needed — initiateWithdrawal calls IPISOToken directly,
    //  giving proper type-safety and automatic revert propagation.)
}
