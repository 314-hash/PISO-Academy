// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function approve(address to, uint256 tokenId) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function transferFrom(address from, address to, uint256 tokenId) external;
}

/**
 * @title PISOAvatarNFT
 * @dev ERC-721 Dynamic Character NFT on PISO Chain.
 * Represents the player's 3D humanoid hero, starting with clean default civilian attire (no costume).
 * Dynamically binds equipped weapons, armor, and relics owned by that wallet.
 */
contract PISOAvatarNFT is IERC721 {
    string public name = "PISO Metaverse Character NFT";
    string public symbol = "pAVATAR";
    address public contractOwner;

    uint256 public nextTokenId = 1;

    struct AvatarMetadata {
        string name;
        string dnaHash; // Unique visual fingerprint (skin tone, hair, base traits)
        string gender; // "male" | "female"
        uint256 level;
        uint256 mintTimestamp;
        uint256 equippedWeaponTokenId; // References PISOWeaponsGears ERC-721
        uint256 equippedRelicTokenId;  // References PISOItemsRelics ERC-1155
        bool isDefaultCostume; // True: Starts with no costume (plain clothes)
    }

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    mapping(uint256 => AvatarMetadata) public avatars;
    mapping(address => uint256) public primaryAvatarOf;

    event AvatarMinted(address indexed owner, uint256 indexed tokenId, string name, string dnaHash);
    event AvatarEquipUpdated(uint256 indexed tokenId, uint256 weaponTokenId, uint256 relicTokenId);
    event AvatarLevelUp(uint256 indexed tokenId, uint256 newLevel);

    modifier onlyOwner() {
        require(msg.sender == contractOwner, "Only owner");
        _;
    }

    constructor() {
        contractOwner = msg.sender;
    }

    // --- ERC-721 Standard Implementation ---

    function balanceOf(address owner) public view override returns (uint256) {
        require(owner != address(0), "Zero address");
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "Nonexistent token");
        return tokenOwner;
    }

    function approve(address to, uint256 tokenId) public override {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "Current owner approval");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public override {
        require(operator != msg.sender, "Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "Not authorized");
        require(ownerOf(tokenId) == from, "Incorrect owner");
        require(to != address(0), "Zero address");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        if (primaryAvatarOf[from] == tokenId) {
            delete primaryAvatarOf[from];
        }
        if (primaryAvatarOf[to] == 0) {
            primaryAvatarOf[to] = tokenId;
        }

        emit Transfer(from, to, tokenId);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address tokenOwner = ownerOf(tokenId);
        return (spender == tokenOwner || isApprovedForAll(tokenOwner, spender) || getApproved(tokenId) == spender);
    }

    // --- Avatar Minting & Loadout Functions ---

    /**
     * @notice Mints a starter Avatar NFT for a player (new or existing wallet).
     * Starts with default clean civilian clothes (no pre-equipped costume).
     */
    function mintStarterAvatar(
        address to,
        string memory avatarName,
        string memory gender,
        string memory dnaHash
    ) external returns (uint256) {
        require(to != address(0), "Zero address");
        require(bytes(avatarName).length > 0, "Empty name");

        uint256 tokenId = nextTokenId++;

        _balances[to] += 1;
        _owners[tokenId] = to;

        avatars[tokenId] = AvatarMetadata({
            name: avatarName,
            dnaHash: dnaHash,
            gender: gender,
            level: 1,
            mintTimestamp: block.timestamp,
            equippedWeaponTokenId: 0,
            equippedRelicTokenId: 0,
            isDefaultCostume: true
        });

        if (primaryAvatarOf[to] == 0) {
            primaryAvatarOf[to] = tokenId;
        }

        emit Transfer(address(0), to, tokenId);
        emit AvatarMinted(to, tokenId, avatarName, dnaHash);

        return tokenId;
    }

    /**
     * @notice Updates the on-chain equipped weapon & relic bound to this Avatar NFT.
     */
    function updateEquippedItems(
        uint256 tokenId,
        uint256 weaponTokenId,
        uint256 relicTokenId
    ) external {
        require(ownerOf(tokenId) == msg.sender, "Must be avatar owner");
        AvatarMetadata storage meta = avatars[tokenId];
        meta.equippedWeaponTokenId = weaponTokenId;
        meta.equippedRelicTokenId = relicTokenId;
        meta.isDefaultCostume = (weaponTokenId == 0 && relicTokenId == 0);

        emit AvatarEquipUpdated(tokenId, weaponTokenId, relicTokenId);
    }

    /**
     * @notice Increments avatar on-chain level.
     */
    function levelUpAvatar(uint256 tokenId) external onlyOwner {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        avatars[tokenId].level += 1;
        emit AvatarLevelUp(tokenId, avatars[tokenId].level);
    }

    /**
     * @notice Returns complete avatar data.
     */
    function getAvatar(uint256 tokenId) external view returns (AvatarMetadata memory) {
        require(_owners[tokenId] != address(0), "Nonexistent token");
        return avatars[tokenId];
    }
}
