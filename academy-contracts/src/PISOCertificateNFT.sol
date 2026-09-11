// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PISOCertificateNFT
 * @dev Official "Katunayan ng Pag-aari" Soulbound ERC-721 Digital Certificate Hub for PISO Chain.
 * Deployed at System Precompile Address: 0x0000000000000000000000000000000000001014
 * 
 * Complies with ERC-721 and ERC-5192 (Soulbound Non-Transferable Tokens).
 * Encapsulates 10 distinct Filipino cultural tiers with on-chain trait logic,
 * staking multipliers, and verifiable cryptographic attestations.
 */

interface IERC5192 {
    event Locked(uint256 tokenId);
    event Unlocked(uint256 tokenId);
    function locked(uint256 tokenId) external view returns (bool);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Metadata is IERC721 {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function tokenURI(uint256 tokenId) external view returns (string memory);
}

contract PISOCertificateNFT is IERC721Metadata, IERC5192 {
    string private constant _NAME = "PISO Chain - Katunayan ng Pag-aari";
    string private constant _SYMBOL = "PISO-CERT";

    address public owner;
    uint256 public nextTokenId = 1;

    enum Tier {
        SARI_SARI,        // 0: Community Member / Merchant POS
        DATU,             // 1: Community Leader / Staker
        BAYANI,           // 2: Ecosystem Builder / Dev
        TAGAPAGTANGGOL,   // 3: DePIN Validator / Network Guardian
        TAGAPAGTATAG,     // 4: Genesis Member / Founding Pioneer
        MAHARLIKA,        // 5: Liquidity Provider / DEX Noble (+5% Farm Yield)
        MANDIRIGMA,       // 6: PoW High-Hashrate Miner (+15% PoW Multiplier)
        BABAYLAN,         // 7: AI Agent & Oracle Maestro (Gasless AI Subsidies)
        KASANGGA,         // 8: Bayanihan Ambassador (+10% Referral Bonus)
        PANDAY            // 9: Master Smart Contract Architect (VIP Gas Priority)
    }

    struct Certificate {
        uint256 tokenId;
        address holder;
        Tier tier;
        uint256 issueTimestamp;
        string customTitle;
        uint256 multiplierBasisPoints; // e.g., 10500 = 105% (5% bonus)
        bool isValid;
    }

    // Storage
    mapping(uint256 => Certificate) public certificates;
    mapping(address => uint256[]) private _holderCertificates;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    // Events
    event CertificateMinted(uint256 indexed tokenId, address indexed holder, Tier tier, string customTitle);
    event CertificateRevoked(uint256 indexed tokenId, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOCert: Only governance owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // ==========================================
    // ERC-721 Basic Implementations
    // ==========================================
    function name() external pure override returns (string memory) {
        return _NAME;
    }

    function symbol() external pure override returns (string memory) {
        return _SYMBOL;
    }

    function balanceOf(address holder) external view override returns (uint256) {
        require(holder != address(0), "PISOCert: Query for zero address");
        return _balances[holder];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "PISOCert: Query for nonexistent token");
        return tokenOwner;
    }

    // ==========================================
    // ERC-5192 Soulbound Lock (Non-Transferable)
    // ==========================================
    function locked(uint256 tokenId) external view override returns (bool) {
        require(_owners[tokenId] != address(0), "PISOCert: Nonexistent token");
        return true; // All certificates are permanently soulbound
    }

    function approve(address, uint256) external pure override {
        revert("PISOCert: Soulbound tokens cannot be approved");
    }

    function setApprovalForAll(address, bool) external pure override {
        revert("PISOCert: Soulbound tokens cannot be approved");
    }

    function getApproved(uint256) external pure override returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure override returns (bool) {
        return false;
    }

    function transferFrom(address, address, uint256) external pure override {
        revert("PISOCert: Soulbound non-transferable Katunayan ng Pag-aari");
    }

    function safeTransferFrom(address, address, uint256) external pure override {
        revert("PISOCert: Soulbound non-transferable Katunayan ng Pag-aari");
    }

    function safeTransferFrom(address, address, uint256, bytes calldata) external pure override {
        revert("PISOCert: Soulbound non-transferable Katunayan ng Pag-aari");
    }

    // ==========================================
    // Core Minting & Tier Logic
    // ==========================================
    function mintCertificate(
        address to,
        Tier tier,
        string calldata customTitle
    ) external returns (uint256) {
        require(to != address(0), "PISOCert: Cannot mint to zero address");

        uint256 tokenId = nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        _holderCertificates[to].push(tokenId);

        // Determine on-chain multiplier logic based on tier
        uint256 multiplier = 10000; // Baseline 100%
        if (tier == Tier.MAHARLIKA) multiplier = 10500;   // +5% Yield
        else if (tier == Tier.MANDIRIGMA) multiplier = 11500; // +15% Mining
        else if (tier == Tier.KASANGGA) multiplier = 11000;   // +10% Referral
        else if (tier == Tier.TAGAPAGTATAG) multiplier = 12000; // +20% Genesis

        certificates[tokenId] = Certificate({
            tokenId: tokenId,
            holder: to,
            tier: tier,
            issueTimestamp: block.timestamp,
            customTitle: bytes(customTitle).length > 0 ? customTitle : _getTierName(tier),
            multiplierBasisPoints: multiplier,
            isValid: true
        });

        emit Transfer(address(0), to, tokenId);
        emit Locked(tokenId);
        emit CertificateMinted(tokenId, to, tier, customTitle);

        return tokenId;
    }

    // ==========================================
    // On-Chain Verifier & Getters
    // ==========================================
    function verifyCertificate(uint256 tokenId) external view returns (
        bool verified,
        address holder,
        Tier tier,
        string memory tierName,
        uint256 issueTimestamp,
        uint256 multiplierBps
    ) {
        Certificate memory cert = certificates[tokenId];
        require(cert.isValid, "PISOCert: Invalid or revoked certificate");
        return (
            true,
            cert.holder,
            cert.tier,
            _getTierName(cert.tier),
            cert.issueTimestamp,
            cert.multiplierBasisPoints
        );
    }

    function getHolderCertificates(address holder) external view returns (uint256[] memory) {
        return _holderCertificates[holder];
    }

    function _getTierName(Tier tier) internal pure returns (string memory) {
        if (tier == Tier.SARI_SARI) return "SARI-SARI BADGE";
        if (tier == Tier.DATU) return "DATU BADGE";
        if (tier == Tier.BAYANI) return "BAYANI (Ecosystem Builder)";
        if (tier == Tier.TAGAPAGTANGGOL) return "TAGAPAGTANGGOL";
        if (tier == Tier.TAGAPAGTATAG) return "TAGAPAGTATAG (Genesis)";
        if (tier == Tier.MAHARLIKA) return "MAHARLIKA GUILD (DEX Noble)";
        if (tier == Tier.MANDIRIGMA) return "MANDIRIGMA (PoW Miner)";
        if (tier == Tier.BABAYLAN) return "BABAYLAN (AI & Oracle Maestro)";
        if (tier == Tier.KASANGGA) return "KASANGGA (Bayanihan Ambassador)";
        if (tier == Tier.PANDAY) return "PANDAY (Master Smart Contract Architect)";
        return "UNKNOWN";
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        Certificate memory cert = certificates[tokenId];
        require(cert.isValid, "PISOCert: URI query for invalid token");

        string memory svg = string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">',
                '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">',
                '<stop offset="0%" stop-color="#0B0F17"/><stop offset="100%" stop-color="#1E293B"/>',
                '</linearGradient></defs>',
                '<rect width="400" height="400" rx="20" fill="url(#g)" stroke="#F59E0B" stroke-width="3"/>',
                '<text x="200" y="70" font-family="sans-serif" font-size="14" fill="#F59E0B" font-weight="bold" text-anchor="middle">PISO CHAIN ACADEMY</text>',
                '<text x="200" y="110" font-family="sans-serif" font-size="20" fill="#FFFFFF" font-weight="900" text-anchor="middle">KATUNAYAN NG PAG-AARI</text>',
                '<circle cx="200" cy="180" r="45" fill="#2563EB" opacity="0.8"/>',
                '<text x="200" y="190" font-family="sans-serif" font-size="32" fill="#FBBF24" text-anchor="middle">&#x2600;</text>',
                '<text x="200" y="270" font-family="sans-serif" font-size="16" fill="#60A5FA" font-weight="bold" text-anchor="middle">', _getTierName(cert.tier), '</text>',
                '<text x="200" y="310" font-family="sans-serif" font-size="13" fill="#94A3B8" text-anchor="middle">', cert.customTitle, '</text>',
                '<text x="200" y="350" font-family="sans-serif" font-size="11" fill="#64748B" text-anchor="middle">Token #', _toString(tokenId), ' | Soulbound</text>',
                '</svg>'
            )
        );

        return string(
            abi.encodePacked(
                'data:application/json;utf8,{"name":"PISO Certificate #',
                _toString(tokenId),
                ' - ',
                _getTierName(cert.tier),
                '","description":"Katunayan ng Pag-aari sa PISO Chain Sovereign L1 Blockchain.","attributes":[{"trait_type":"Tier","value":"',
                _getTierName(cert.tier),
                '"},{"trait_type":"Title","value":"',
                cert.customTitle,
                '"},{"trait_type":"Soulbound","value":"True"}],"image":"data:image/svg+xml;utf8,',
                svg,
                '"}'
            )
        );
    }

    function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
        return interfaceId == 0x01ffc9a7 // ERC165
            || interfaceId == 0x80ac58cd // ERC721
            || interfaceId == 0x5b5e139f // ERC721Metadata
            || interfaceId == 0xb45a3c0e; // ERC5192
    }

    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) return "0";
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
