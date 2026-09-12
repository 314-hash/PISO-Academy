// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PISOCrossDomainMessenger
 * @notice Thin wrapper around the OP Stack L2CrossDomainMessenger predeploy.
 *         Provides a typed, PISO-specific interface for sending and receiving
 *         cross-chain messages between PISO Chain L2 and Ethereum Sepolia (L1).
 *
 *         OP Stack Message Flow:
 *         ────────────────────────────────────────────────────────────────
 *         L2 → L1:
 *           sendMessageToL1()
 *             └─► L2CrossDomainMessenger.sendMessage(target, message, gasLimit)
 *                 └─► L2ToL1MessagePasser (auto-included in next state root)
 *                     └─► After fraud-proof window: L1CrossDomainMessenger.relayMessage()
 *
 *         L1 → L2:
 *           L1CrossDomainMessenger.sendMessage()
 *             └─► OP Sequencer includes tx in L2 block
 *                 └─► L2CrossDomainMessenger.relayMessage()
 *                     └─► target.call(message)  [this contract or PISOBridge]
 *         ────────────────────────────────────────────────────────────────
 */
contract PISOCrossDomainMessenger {
    // ─── Constants ────────────────────────────────────────────────────────────

    /// @notice OP predeploy address (same on every OP Stack chain)
    address public constant L2_MESSENGER = 0x4200000000000000000000000000000000000007;

    // ─── State ────────────────────────────────────────────────────────────────

    address public owner;
    address public l1CounterpartMessenger;  // L1CrossDomainMessenger address on Sepolia

    uint256 public messagesSent;
    uint256 public messagesReceived;

    struct SentMessage {
        address l1Target;
        bytes   message;
        uint32  gasLimit;
        uint256 sentAt;
        bytes32 msgHash;
    }

    struct ReceivedMessage {
        address l1Sender;
        bytes   data;
        uint256 receivedAt;
        bool    processed;
    }

    mapping(uint256 => SentMessage)     public sentMessages;
    mapping(uint256 => ReceivedMessage) public receivedMessages;
    mapping(address => bool)            public authorizedSenders; // L1 contracts allowed to message us

    // ─── Events ───────────────────────────────────────────────────────────────

    event MessageSentToL1(
        address indexed l1Target,
        uint256 indexed messageId,
        bytes32 msgHash,
        uint256 timestamp
    );

    event MessageReceivedFromL1(
        address indexed l1Sender,
        uint256 indexed messageId,
        uint256 timestamp
    );

    event AuthorizedSenderUpdated(address indexed sender, bool authorized);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOMessenger: Not owner");
        _;
    }

    modifier onlyL2Messenger() {
        require(msg.sender == L2_MESSENGER, "PISOMessenger: Not L2CrossDomainMessenger");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(address _l1CounterpartMessenger) {
        owner                   = msg.sender;
        l1CounterpartMessenger  = _l1CounterpartMessenger;
    }

    // ─── Send L2 → L1 Messages ────────────────────────────────────────────────

    /**
     * @notice Send a cross-chain message from PISO Chain L2 to a contract on Sepolia L1.
     * @param l1Target  Address of the contract on L1 that will receive the message.
     * @param message   ABI-encoded calldata to execute on L1.
     * @param gasLimit  Gas to allocate for execution on L1 (minimum 100_000).
     */
    function sendMessageToL1(
        address l1Target,
        bytes calldata message,
        uint32  gasLimit
    ) external returns (uint256 messageId) {
        require(l1Target  != address(0), "PISOMessenger: Zero L1 target");
        require(gasLimit  >= 50_000,     "PISOMessenger: Gas limit too low");
        require(message.length > 0,      "PISOMessenger: Empty message");

        messageId        = messagesSent++;
        bytes32 msgHash  = keccak256(abi.encodePacked(l1Target, message, block.timestamp, messageId));

        sentMessages[messageId] = SentMessage({
            l1Target:  l1Target,
            message:   message,
            gasLimit:  gasLimit,
            sentAt:    block.timestamp,
            msgHash:   msgHash
        });

        // Forward to OP Stack L2CrossDomainMessenger
        IL2CrossDomainMessenger(L2_MESSENGER).sendMessage(l1Target, message, gasLimit);

        emit MessageSentToL1(l1Target, messageId, msgHash, block.timestamp);
    }

    // ─── Receive L1 → L2 Messages ────────────────────────────────────────────

    /**
     * @notice Entry point called by L2CrossDomainMessenger when an L1 message is relayed.
     * @param l1Sender  The L1 contract that originated the message.
     * @param data      ABI-encoded action payload.
     */
    function receiveMessageFromL1(
        address l1Sender,
        bytes calldata data
    ) external onlyL2Messenger {
        require(
            authorizedSenders[l1Sender] || l1Sender == l1CounterpartMessenger,
            "PISOMessenger: Unauthorized L1 sender"
        );

        uint256 msgId     = messagesReceived++;
        receivedMessages[msgId] = ReceivedMessage({
            l1Sender:   l1Sender,
            data:       data,
            receivedAt: block.timestamp,
            processed:  true
        });

        emit MessageReceivedFromL1(l1Sender, msgId, block.timestamp);
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setAuthorizedSender(address l1Contract, bool authorized) external onlyOwner {
        authorizedSenders[l1Contract] = authorized;
        emit AuthorizedSenderUpdated(l1Contract, authorized);
    }

    function setL1Counterpart(address _l1CounterpartMessenger) external onlyOwner {
        require(_l1CounterpartMessenger != address(0), "PISOMessenger: Zero address");
        l1CounterpartMessenger = _l1CounterpartMessenger;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PISOMessenger: Zero address");
        owner = newOwner;
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getSentMessage(uint256 id) external view returns (SentMessage memory) {
        return sentMessages[id];
    }

    function getReceivedMessage(uint256 id) external view returns (ReceivedMessage memory) {
        return receivedMessages[id];
    }

    function getStats() external view returns (uint256 sent, uint256 received) {
        return (messagesSent, messagesReceived);
    }
}

// ─── Minimal L2CrossDomainMessenger Interface ─────────────────────────────────

interface IL2CrossDomainMessenger {
    function sendMessage(address target, bytes calldata message, uint32 gasLimit) external;
    function xDomainMessageSender() external view returns (address);
}
