// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PISOToken.sol";

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
 * @title PISOWeaponsGears
 * @dev ERC-721 On-Chain Weapons, Armor & Combat Gears with Panday Blacksmith +1..+15 Upgrade Engine.
 */
contract PISOWeaponsGears is IERC721 {
    string public name = "PISO Metaverse Weapons & Gears";
    string public symbol = "pGEAR";
    address public owner;
    PISOToken public immutable pisoToken;

    uint256 public nextTokenId = 1;

    enum GearCategory { WEAPON, ARMOR, SHIELD, ACCESSORY }
    enum Rarity { COMMON, UNCOMMON, RARE, EPIC, LEGENDARY, MYTHICAL }

    struct GearStats {
        string name;
        GearCategory category;
        Rarity rarity;
        uint256 attackPower;
        uint256 defensePower;
        uint8 enhancementLevel; // +0 up to +15
        uint256 durability;
        uint256 maxDurability;
    }

    mapping(uint256 => GearStats) public gearStats;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event WeaponForged(address indexed player, uint256 indexed tokenId, string name, Rarity rarity);
    event WeaponUpgraded(address indexed player, uint256 indexed tokenId, uint8 newLevel, uint256 newAtk, uint256 newDef);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOWeaponsGears: Caller is not owner");
        _;
    }

    constructor(address _pisoToken) {
        require(_pisoToken != address(0), "PISOWeaponsGears: Zero token address");
        pisoToken = PISOToken(_pisoToken);
        owner = msg.sender;
    }

    /**
     * @notice Forges a new weapon or armor at Panday's Blacksmith station using farmed $PISO tokens.
     */
    function forgeGear(
        string calldata gearName,
        GearCategory category,
        Rarity rarity
    ) external returns (uint256) {
        uint256 forgeCost = 150 * 1e18; // 150 PISO base forge
        if (rarity == Rarity.RARE) forgeCost = 300 * 1e18;
        if (rarity == Rarity.EPIC) forgeCost = 600 * 1e18;
        if (rarity == Rarity.LEGENDARY) forgeCost = 1500 * 1e18;
        if (rarity == Rarity.MYTHICAL) forgeCost = 3000 * 1e18;

        require(pisoToken.burnFrom(msg.sender, forgeCost), "PISOWeaponsGears: PISO burn failed");

        uint256 tokenId = nextTokenId++;
        uint256 baseAtk = category == GearCategory.WEAPON ? (50 + uint256(rarity) * 40) : 10;
        uint256 baseDef = category == GearCategory.ARMOR || category == GearCategory.SHIELD ? (40 + uint256(rarity) * 35) : 5;

        gearStats[tokenId] = GearStats({
            name: gearName,
            category: category,
            rarity: rarity,
            attackPower: baseAtk,
            defensePower: baseDef,
            enhancementLevel: 0,
            durability: 100,
            maxDurability: 100
        });

        _mint(msg.sender, tokenId);
        emit WeaponForged(msg.sender, tokenId, gearName, rarity);
        return tokenId;
    }

    /**
     * @notice Upgrades a weapon or gear at Panday Blacksmith from +0 to +15.
     */
    function upgradeGear(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "PISOWeaponsGears: Not gear owner");
        GearStats storage stats = gearStats[tokenId];
        require(stats.enhancementLevel < 15, "PISOWeaponsGears: Max +15 enhancement reached");

        uint256 upgradeCost = (uint256(stats.enhancementLevel) + 1) * 75 * 1e18;
        require(pisoToken.burnFrom(msg.sender, upgradeCost), "PISOWeaponsGears: Upgrade burn failed");

        stats.enhancementLevel += 1;
        // +15% compound attack and defense boost per level
        stats.attackPower = (stats.attackPower * 115) / 100;
        stats.defensePower = (stats.defensePower * 115) / 100;

        emit WeaponUpgraded(msg.sender, tokenId, stats.enhancementLevel, stats.attackPower, stats.defensePower);
    }

    // --- ERC-721 Implementation ---

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "PISOWeaponsGears: Nonexistent token");
        return tokenOwner;
    }

    function balanceOf(address tokenOwner) external view override returns (uint256) {
        require(tokenOwner != address(0), "PISOWeaponsGears: Zero address query");
        return _balances[tokenOwner];
    }

    function approve(address to, uint256 tokenId) external override {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "PISOWeaponsGears: Approval to current owner");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "PISOWeaponsGears: Not owner nor approved");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view override returns (address) {
        require(_owners[tokenId] != address(0), "PISOWeaponsGears: Nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, "PISOWeaponsGears: Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view override returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) external override {
        require(ownerOf(tokenId) == from, "PISOWeaponsGears: Transfer from incorrect owner");
        require(to != address(0), "PISOWeaponsGears: Transfer to zero address");
        require(msg.sender == from || isApprovedForAll(from, msg.sender) || _tokenApprovals[tokenId] == msg.sender, "PISOWeaponsGears: Not authorized");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "PISOWeaponsGears: Mint to zero address");
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }
}
