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
 * @title PISOPetsCompanions
 * @dev ERC-721 NFT Pets & Companions that accompany players in the PISO Metaverse 3D world.
 * Hatched, fed, and trained through Babaylan Maya and Kapitan Datu using farmed $PISO tokens.
 */
contract PISOPetsCompanions is IERC721 {
    string public name = "PISO Metaverse Pets & Companions";
    string public symbol = "pPET";
    address public owner;
    PISOToken public immutable pisoToken;

    uint256 public nextTokenId = 1;

    enum PetSpecies {
        RECON_DRONE,          // Cyber scout companion
        PHILIPPINE_AGILA,     // Haribon eagle companion (+25% Air DPS aura)
        CYBER_CARABAO,        // Heavy ground mount (+40% Defense)
        TARSIER_SCOUT,        // Night vision & hidden relic finder
        SARIMANOK_CELESTIAL   // Mythical rainbow aura & +50% PISO farming boost
    }

    struct PetStats {
        string customName;
        PetSpecies species;
        uint8 level;
        uint256 xp;
        uint8 stamina; // 0..100
        uint8 happiness; // 0..100
        uint256 buffAprBps; // Staking / farming boost (e.g. 5000 = +50%)
        uint256 lastFedTimestamp;
    }

    mapping(uint256 => PetStats) public petStats;
    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;
    mapping(uint256 => address) private _tokenApprovals;
    mapping(address => mapping(address => bool)) private _operatorApprovals;

    event PetHatched(address indexed player, uint256 indexed tokenId, PetSpecies species, string name);
    event PetFed(address indexed player, uint256 indexed tokenId, uint8 newHappiness);
    event PetTrained(address indexed player, uint256 indexed tokenId, uint8 newLevel, uint256 newXp);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOPetsCompanions: Caller is not owner");
        _;
    }

    constructor(address _pisoToken) {
        require(_pisoToken != address(0), "PISOPetsCompanions: Zero token address");
        pisoToken = PISOToken(_pisoToken);
        owner = msg.sender;
    }

    /**
     * @notice Hatches an on-chain companion egg at Babaylan Maya's grove.
     */
    function hatchEgg(
        PetSpecies species,
        string calldata petName
    ) external returns (uint256) {
        uint256 hatchCost = 200 * 1e18; // 200 PISO base
        uint256 buffBps = 1500; // 15% base

        if (species == PetSpecies.PHILIPPINE_AGILA) {
            hatchCost = 500 * 1e18;
            buffBps = 2500; // +25%
        } else if (species == PetSpecies.CYBER_CARABAO) {
            hatchCost = 350 * 1e18;
            buffBps = 2000; // +20%
        } else if (species == PetSpecies.SARIMANOK_CELESTIAL) {
            hatchCost = 1500 * 1e18;
            buffBps = 5000; // +50% Mythical boost
        }

        require(pisoToken.burnFrom(msg.sender, hatchCost), "PISOPetsCompanions: PISO burn failed");

        uint256 tokenId = nextTokenId++;
        petStats[tokenId] = PetStats({
            customName: petName,
            species: species,
            level: 1,
            xp: 0,
            stamina: 100,
            happiness: 100,
            buffAprBps: buffBps,
            lastFedTimestamp: block.timestamp
        });

        _mint(msg.sender, tokenId);
        emit PetHatched(msg.sender, tokenId, species, petName);
        return tokenId;
    }

    /**
     * @notice Feeds pet to restore stamina and happiness.
     */
    function feedPet(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "PISOPetsCompanions: Not pet owner");
        uint256 feedCost = 10 * 1e18; // 10 PISO feeding cost
        require(pisoToken.burnFrom(msg.sender, feedCost), "PISOPetsCompanions: Feed burn failed");

        PetStats storage pet = petStats[tokenId];
        pet.stamina = 100;
        pet.happiness = 100;
        pet.lastFedTimestamp = block.timestamp;
        emit PetFed(msg.sender, tokenId, 100);
    }

    /**
     * @notice Trains pet through metaverse sparring, increasing level and farming buff.
     */
    function trainPet(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "PISOPetsCompanions: Not pet owner");
        PetStats storage pet = petStats[tokenId];
        require(pet.stamina >= 20, "PISOPetsCompanions: Pet is exhausted, feed it first");

        pet.stamina -= 20;
        pet.xp += 100;

        // Level up check
        if (pet.xp >= uint256(pet.level) * 300) {
            pet.level += 1;
            pet.buffAprBps += 250; // +2.5% buff per level
        }

        emit PetTrained(msg.sender, tokenId, pet.level, pet.xp);
    }

    // --- ERC-721 Implementation ---

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address tokenOwner = _owners[tokenId];
        require(tokenOwner != address(0), "PISOPetsCompanions: Nonexistent token");
        return tokenOwner;
    }

    function balanceOf(address tokenOwner) external view override returns (uint256) {
        require(tokenOwner != address(0), "PISOPetsCompanions: Zero address query");
        return _balances[tokenOwner];
    }

    function approve(address to, uint256 tokenId) external override {
        address tokenOwner = ownerOf(tokenId);
        require(to != tokenOwner, "PISOPetsCompanions: Approval to current owner");
        require(msg.sender == tokenOwner || isApprovedForAll(tokenOwner, msg.sender), "PISOPetsCompanions: Not authorized");
        _tokenApprovals[tokenId] = to;
        emit Approval(tokenOwner, to, tokenId);
    }

    function getApproved(uint256 tokenId) external view override returns (address) {
        require(_owners[tokenId] != address(0), "PISOPetsCompanions: Nonexistent token");
        return _tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, "PISOPetsCompanions: Approve to caller");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address tokenOwner, address operator) public view override returns (bool) {
        return _operatorApprovals[tokenOwner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) external override {
        require(ownerOf(tokenId) == from, "PISOPetsCompanions: Transfer from incorrect owner");
        require(to != address(0), "PISOPetsCompanions: Transfer to zero address");
        require(msg.sender == from || isApprovedForAll(from, msg.sender) || _tokenApprovals[tokenId] == msg.sender, "PISOPetsCompanions: Not authorized");

        delete _tokenApprovals[tokenId];
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "PISOPetsCompanions: Mint to zero address");
        _balances[to] += 1;
        _owners[tokenId] = to;
        emit Transfer(address(0), to, tokenId);
    }
}
