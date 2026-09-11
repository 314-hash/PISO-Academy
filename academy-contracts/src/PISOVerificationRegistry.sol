// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PISOVerificationRegistry
 * @dev Open-source on-chain attestation and credential registry for PISO Academy.
 * Allows verifiable checking of student graduation and challenge completion hashes
 * following OpenAttestation / W3C Verifiable Credentials architectural principles.
 */
contract PISOVerificationRegistry {
    address public owner;

    struct CredentialRecord {
        bytes32 certificateHash; // SHA-256 hash of certificate payload
        address recipient;
        string courseId;
        string trackTitle;
        uint256 issuedAt;
        bool isRevoked;
    }

    // Mapping from certificateHash => CredentialRecord
    mapping(bytes32 => CredentialRecord) public credentials;
    // Mapping from student => list of certificate hashes
    mapping(address => bytes32[]) private _studentCredentials;

    event CredentialIssued(
        bytes32 indexed certificateHash,
        address indexed recipient,
        string courseId,
        string trackTitle,
        uint256 issuedAt
    );
    event CredentialRevoked(bytes32 indexed certificateHash, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISORegistry: Caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCredential(
        bytes32 certificateHash,
        address recipient,
        string calldata courseId,
        string calldata trackTitle
    ) external onlyOwner returns (bool) {
        require(certificateHash != bytes32(0), "PISORegistry: Invalid hash");
        require(recipient != address(0), "PISORegistry: Invalid recipient");
        require(credentials[certificateHash].issuedAt == 0, "PISORegistry: Credential already issued");

        credentials[certificateHash] = CredentialRecord({
            certificateHash: certificateHash,
            recipient: recipient,
            courseId: courseId,
            trackTitle: trackTitle,
            issuedAt: block.timestamp,
            isRevoked: false
        });

        _studentCredentials[recipient].push(certificateHash);

        emit CredentialIssued(certificateHash, recipient, courseId, trackTitle, block.timestamp);
        return true;
    }

    function verifyCredential(bytes32 certificateHash) external view returns (
        bool isValid,
        address recipient,
        string memory courseId,
        string memory trackTitle,
        uint256 issuedAt
    ) {
        CredentialRecord memory record = credentials[certificateHash];
        if (record.issuedAt == 0 || record.isRevoked) {
            return (false, address(0), "", "", 0);
        }
        return (true, record.recipient, record.courseId, record.trackTitle, record.issuedAt);
    }

    function getStudentCredentials(address student) external view returns (bytes32[] memory) {
        return _studentCredentials[student];
    }

    function revokeCredential(bytes32 certificateHash, string calldata reason) external onlyOwner {
        require(credentials[certificateHash].issuedAt > 0, "PISORegistry: Nonexistent credential");
        require(!credentials[certificateHash].isRevoked, "PISORegistry: Already revoked");
        credentials[certificateHash].isRevoked = true;
        emit CredentialRevoked(certificateHash, reason);
    }
}
