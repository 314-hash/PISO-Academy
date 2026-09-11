// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title KatunayanCertificate
 * @notice Starter template for Soulbound Katunayan Certificates on PISO Chain.
 */
contract KatunayanCertificate {
    string public name = "PISO Katunayan ng Pagtatapos";
    string public symbol = "KATUNAYAN";
    address public issuer;
    uint256 public nextTokenId = 1;

    struct CertData {
        address recipient;
        string courseTitle;
        uint256 issueDate;
    }

    mapping(uint256 => CertData) public certificates;
    mapping(address => uint256[]) public recipientTokens;

    event CertificateAwarded(uint256 indexed tokenId, address indexed recipient, string courseTitle);

    constructor() {
        issuer = msg.sender;
    }

    function awardCertificate(address recipient, string calldata courseTitle) external returns (uint256) {
        require(msg.sender == issuer, "Only authorized issuer");
        uint256 id = nextTokenId++;
        certificates[id] = CertData(recipient, courseTitle, block.timestamp);
        recipientTokens[recipient].push(id);
        emit CertificateAwarded(id, recipient, courseTitle);
        return id;
    }

    function verify(uint256 id) external view returns (address recipient, string memory courseTitle, uint256 issueDate) {
        CertData memory c = certificates[id];
        require(c.issueDate > 0, "Nonexistent certificate");
        return (c.recipient, c.courseTitle, c.issueDate);
    }
}
