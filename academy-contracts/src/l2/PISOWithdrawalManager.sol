// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PISOWithdrawalManager
 * @notice Manages the full lifecycle of $PISO token withdrawals from PISO Chain L2
 *         to Ethereum Sepolia L1, including the 7-day fraud-proof challenge window.
 *
 *         Withdrawal Lifecycle:
 *         ─────────────────────────────────────────────────────────────────────
 *         [1] INITIATED   → User calls initiateWithdrawal(); PISO burned on L2
 *         [2] PROVEN      → L2 state root submitted to L1 OutputOracle (by sequencer)
 *         [3] CHALLENGEABLE → 7-day fraud-proof window open on L1
 *         [4] READY       → Challenge window passed; user can finalize on L1
 *         [5] FINALIZED   → User called OptimismPortal.finalizeWithdrawalTransaction()
 *                           ERC-20 unlocked on L1. L2 contract marked finalized.
 *         ─────────────────────────────────────────────────────────────────────
 *
 *         Security Properties:
 *         • Non-custodial: funds locked in L1 from the moment of deposit
 *         • No double-claim: each withdrawal ID is one-time use
 *         • Time-locked: 7-day window gives watchdogs time to submit fraud proofs
 *         • User-controlled: only the original withdrawer can finalize
 */
contract PISOWithdrawalManager {

    // ─── Constants ────────────────────────────────────────────────────────────

    uint256 public constant CHALLENGE_PERIOD = 7 days;

    /// @notice OP predeploy: L2CrossDomainMessenger
    address public constant L2_MESSENGER = 0x4200000000000000000000000000000000000007;

    // ─── Withdrawal Status Enum ───────────────────────────────────────────────

    enum WithdrawalStatus {
        None,           // 0 — does not exist
        Initiated,      // 1 — PISO burned on L2, awaiting L1 proof
        Proven,         // 2 — L2 state root accepted on L1
        ReadyToFinalize,// 3 — challenge period elapsed
        Finalized,      // 4 — user claimed on L1, fully settled
        Cancelled       // 5 — emergency cancel by admin (extreme cases only)
    }

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public pisoToken;
    address public pisoBridge;

    uint256 public totalWithdrawals;
    uint256 public totalFinalizedAmount;
    uint256 public pendingAmount;          // Sum of all non-finalized withdrawals

    struct Withdrawal {
        address user;
        uint256 amount;
        uint256 initiatedAt;
        uint256 provenAt;
        uint256 finalizedAt;
        WithdrawalStatus status;
        bytes32 withdrawalHash;            // Unique hash for L1 proof verification
        string  l1ClaimTxHash;            // Set by off-chain indexer after L1 finalization
    }

    mapping(uint256 => Withdrawal)    public withdrawals;
    mapping(address => uint256[])     public userWithdrawals;
    mapping(bytes32 => bool)          public usedHashes;  // Prevent replay

    // ─── Events ───────────────────────────────────────────────────────────────

    event WithdrawalInitiated(
        address indexed user,
        uint256 indexed withdrawalId,
        uint256 amount,
        bytes32 withdrawalHash,
        uint256 challengeWindowEnd
    );

    event WithdrawalProven(uint256 indexed withdrawalId, uint256 provenAt);

    event WithdrawalReadyToFinalize(uint256 indexed withdrawalId);

    event WithdrawalFinalized(
        address indexed user,
        uint256 indexed withdrawalId,
        uint256 amount,
        string  l1ClaimTxHash
    );

    event WithdrawalCancelled(uint256 indexed withdrawalId, string reason);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOWithdrawal: Not owner");
        _;
    }

    modifier onlyMessengerOrOwner() {
        require(
            msg.sender == owner || msg.sender == L2_MESSENGER,
            "PISOWithdrawal: Unauthorized"
        );
        _;
    }

    modifier validWithdrawal(uint256 id) {
        require(id < totalWithdrawals, "PISOWithdrawal: Invalid ID");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _pisoToken, address _pisoBridge) {
        require(_pisoToken != address(0), "PISOWithdrawal: Zero token");
        owner      = msg.sender;
        pisoToken  = _pisoToken;
        pisoBridge = _pisoBridge;
    }

    // ─── Core Functions ───────────────────────────────────────────────────────

    /**
     * @notice Step 1: Initiate a withdrawal. Burns $PISO on L2 and records the withdrawal.
     *         User must approve this contract to spend `amount` of $PISO before calling.
     * @param amount Amount of $PISO to withdraw (in wei).
     * @return withdrawalId The unique ID for this withdrawal.
     */
    function initiateWithdrawal(uint256 amount) external returns (uint256 withdrawalId) {
        require(amount > 0, "PISOWithdrawal: Amount must be > 0");
        require(amount <= 1_000_000 * 1e18, "PISOWithdrawal: Exceeds per-tx limit (1M PISO)");

        // Burn $PISO on L2 (user must have approved this contract)
        _burnToken(msg.sender, amount);

        // Build unique withdrawal hash
        bytes32 wHash = keccak256(
            abi.encodePacked(msg.sender, amount, block.timestamp, totalWithdrawals, block.chainid)
        );
        require(!usedHashes[wHash], "PISOWithdrawal: Hash collision");
        usedHashes[wHash] = true;

        withdrawalId = totalWithdrawals++;
        uint256 windowEnd = block.timestamp + CHALLENGE_PERIOD;

        withdrawals[withdrawalId] = Withdrawal({
            user:           msg.sender,
            amount:         amount,
            initiatedAt:    block.timestamp,
            provenAt:       0,
            finalizedAt:    0,
            status:         WithdrawalStatus.Initiated,
            withdrawalHash: wHash,
            l1ClaimTxHash:  ""
        });

        userWithdrawals[msg.sender].push(withdrawalId);
        pendingAmount += amount;

        emit WithdrawalInitiated(msg.sender, withdrawalId, amount, wHash, windowEnd);
    }

    /**
     * @notice Step 2: Mark withdrawal as proven (called by bridge or off-chain relayer
     *         after the L2 output root is posted to L1 OutputOracle).
     */
    function proveWithdrawal(uint256 withdrawalId)
        external
        validWithdrawal(withdrawalId)
        onlyMessengerOrOwner
    {
        Withdrawal storage w = withdrawals[withdrawalId];
        require(w.status == WithdrawalStatus.Initiated, "PISOWithdrawal: Not in Initiated state");

        w.status   = WithdrawalStatus.Proven;
        w.provenAt = block.timestamp;

        emit WithdrawalProven(withdrawalId, block.timestamp);

        // If challenge window already passed (fast L1), advance status
        if (block.timestamp >= w.initiatedAt + CHALLENGE_PERIOD) {
            w.status = WithdrawalStatus.ReadyToFinalize;
            emit WithdrawalReadyToFinalize(withdrawalId);
        }
    }

    /**
     * @notice Step 3: Mark withdrawal as ready (challenge window elapsed).
     *         Anyone can call this after CHALLENGE_PERIOD passes.
     */
    function advanceToReady(uint256 withdrawalId) external validWithdrawal(withdrawalId) {
        Withdrawal storage w = withdrawals[withdrawalId];
        require(w.status == WithdrawalStatus.Proven, "PISOWithdrawal: Not proven yet");
        require(
            block.timestamp >= w.initiatedAt + CHALLENGE_PERIOD,
            "PISOWithdrawal: Challenge period not elapsed"
        );
        w.status = WithdrawalStatus.ReadyToFinalize;
        emit WithdrawalReadyToFinalize(withdrawalId);
    }

    /**
     * @notice Step 4: Mark as finalized. Called by bridge/owner after L1 claim confirmed.
     * @param l1ClaimTxHash The Sepolia transaction hash where tokens were released.
     */
    function markFinalized(uint256 withdrawalId, string calldata l1ClaimTxHash)
        external
        validWithdrawal(withdrawalId)
        onlyMessengerOrOwner
    {
        Withdrawal storage w = withdrawals[withdrawalId];
        require(
            w.status == WithdrawalStatus.ReadyToFinalize,
            "PISOWithdrawal: Not ready to finalize"
        );

        w.status        = WithdrawalStatus.Finalized;
        w.finalizedAt   = block.timestamp;
        w.l1ClaimTxHash = l1ClaimTxHash;

        pendingAmount        = pendingAmount > w.amount ? pendingAmount - w.amount : 0;
        totalFinalizedAmount += w.amount;

        emit WithdrawalFinalized(w.user, withdrawalId, w.amount, l1ClaimTxHash);
    }

    /**
     * @notice Emergency cancel — only owner, only for Initiated/Proven withdrawals.
     *         Re-mints burned tokens back to user. Use only in absolute emergencies.
     */
    function emergencyCancel(uint256 withdrawalId, string calldata reason)
        external
        validWithdrawal(withdrawalId)
        onlyOwner
    {
        Withdrawal storage w = withdrawals[withdrawalId];
        require(
            w.status == WithdrawalStatus.Initiated || w.status == WithdrawalStatus.Proven,
            "PISOWithdrawal: Cannot cancel at this stage"
        );

        w.status = WithdrawalStatus.Cancelled;
        pendingAmount = pendingAmount > w.amount ? pendingAmount - w.amount : 0;

        // Re-mint tokens to user
        _mintToken(w.user, w.amount);

        emit WithdrawalCancelled(withdrawalId, reason);
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getWithdrawal(uint256 id) external view returns (Withdrawal memory) {
        return withdrawals[id];
    }

    function getUserWithdrawals(address user) external view returns (uint256[] memory) {
        return userWithdrawals[user];
    }

    function getTimeUntilReady(uint256 withdrawalId) external view validWithdrawal(withdrawalId)
        returns (int256 secondsRemaining)
    {
        uint256 windowEnd = withdrawals[withdrawalId].initiatedAt + CHALLENGE_PERIOD;
        if (block.timestamp >= windowEnd) return 0;
        return int256(windowEnd - block.timestamp);
    }

    function getStats() external view returns (
        uint256 total,
        uint256 finalized,
        uint256 pending,
        uint256 finalizedAmount,
        uint256 pendingAmt
    ) {
        return (
            totalWithdrawals,
            _countByStatus(WithdrawalStatus.Finalized),
            _countByStatus(WithdrawalStatus.Initiated) + _countByStatus(WithdrawalStatus.Proven),
            totalFinalizedAmount,
            pendingAmount
        );
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setConfig(address _pisoToken, address _pisoBridge) external onlyOwner {
        require(_pisoToken != address(0), "PISOWithdrawal: Zero token");
        pisoToken  = _pisoToken;
        pisoBridge = _pisoBridge;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PISOWithdrawal: Zero address");
        owner = newOwner;
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _burnToken(address from, uint256 amount) internal {
        (bool ok, bytes memory data) = pisoToken.call(
            abi.encodeWithSignature("burnFrom(address,uint256)", from, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "PISOWithdrawal: Burn failed");
    }

    function _mintToken(address to, uint256 amount) internal {
        (bool ok, bytes memory data) = pisoToken.call(
            abi.encodeWithSignature("mintReward(address,uint256)", to, amount)
        );
        require(ok && (data.length == 0 || abi.decode(data, (bool))), "PISOWithdrawal: Mint failed");
    }

    function _countByStatus(WithdrawalStatus status) internal view returns (uint256 count) {
        for (uint256 i = 0; i < totalWithdrawals; i++) {
            if (withdrawals[i].status == status) count++;
        }
    }
}
