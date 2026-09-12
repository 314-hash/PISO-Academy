// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PISOToken.sol";

interface IERC1155 {
    event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value);
    event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values);
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);
    event URI(string value, uint256 indexed id);

    function balanceOf(address account, uint256 id) external view returns (uint256);
    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view returns (uint256[] memory);
    function setApprovalForAll(address operator, bool approved) external;
    function isApprovedForAll(address account, address operator) external view returns (bool);
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata data) external;
    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata data) external;
}

/**
 * @title PISOItemsRelics
 * @dev ERC-1155 Multi-Token Cultural Relics & Consumables for PISO Academy.
 * Crafted through Babaylan Maya and Panday Blacksmith using farmed $PISO tokens.
 */
contract PISOItemsRelics is IERC1155 {
    string public name = "PISO Cultural Relics & Items";
    string public symbol = "pRELIC";
    address public owner;
    PISOToken public immutable pisoToken;

    // Item IDs
    uint256 public constant ITEM_AGIMAT_NARDONG_DIKIT   = 1;
    uint256 public constant ITEM_TABO_HOLY_CLEANSING    = 2;
    uint256 public constant ITEM_MAGIC_KALDERO_LID     = 3;
    uint256 public constant ITEM_SALAKOT_SOLAR_HAT      = 4;
    uint256 public constant ITEM_GOOD_MORNING_TOWEL     = 5;
    uint256 public constant ITEM_TSINELAS_DISCIPLINE    = 6;
    uint256 public constant ITEM_WALIS_TAMBO_STAFF      = 7;
    uint256 public constant ITEM_JEEPNEY_ROUTE_PLATE    = 8;
    uint256 public constant ITEM_SARIMANOK_FEATHER      = 9;
    uint256 public constant ITEM_CYBER_SAMPAGUITA       = 10;

    struct ItemConfig {
        string name;
        uint256 craftingCostPiso; // Cost in PISO tokens (18 decimals)
        string rarity;
        uint256 buffAprBps; // Multiplier added to farming APR (e.g. 1500 = +15%)
    }

    mapping(uint256 => ItemConfig) public itemConfigs;
    mapping(uint256 => mapping(address => uint256)) private _balances;
    mapping(address => mapping(address => bool)) private _operatorApprovals;
    mapping(address => bool) public authorizedForges;

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOItemsRelics: Caller is not owner");
        _;
    }

    modifier onlyForge() {
        require(msg.sender == owner || authorizedForges[msg.sender], "PISOItemsRelics: Unauthorized forge");
        _;
    }

    event ItemCrafted(address indexed player, uint256 indexed itemId, uint256 amount, uint256 pisoCost);

    constructor(address _pisoToken) {
        require(_pisoToken != address(0), "PISOItemsRelics: Zero token address");
        pisoToken = PISOToken(_pisoToken);
        owner = msg.sender;
        authorizedForges[msg.sender] = true;

        // Initialize Cultural Relic Catalog & Crafting Costs
        itemConfigs[ITEM_AGIMAT_NARDONG_DIKIT] = ItemConfig("Agimat ni Nardong Dikit", 250 * 1e18, "Epic", 1500);
        itemConfigs[ITEM_TABO_HOLY_CLEANSING] = ItemConfig("Tabo of Holy Cleansing", 100 * 1e18, "Rare", 800);
        itemConfigs[ITEM_MAGIC_KALDERO_LID] = ItemConfig("Magic Kaldero Lid Aegis", 200 * 1e18, "Epic", 1200);
        itemConfigs[ITEM_SALAKOT_SOLAR_HAT] = ItemConfig("Salakot Solar Bamboo Hat", 75 * 1e18, "Uncommon", 500);
        itemConfigs[ITEM_GOOD_MORNING_TOWEL] = ItemConfig("Good Morning Towel", 25 * 1e18, "Common", 250);
        itemConfigs[ITEM_TSINELAS_DISCIPLINE] = ItemConfig("Tsinelas ni Nanay", 120 * 1e18, "Rare", 750);
        itemConfigs[ITEM_WALIS_TAMBO_STAFF] = ItemConfig("Baguio Walis Tambo", 80 * 1e18, "Uncommon", 400);
        itemConfigs[ITEM_JEEPNEY_ROUTE_PLATE] = ItemConfig("Jeepney Route Plate", 50 * 1e18, "Common", 300);
        itemConfigs[ITEM_SARIMANOK_FEATHER] = ItemConfig("Sarimanok Rainbow Feather", 500 * 1e18, "Legendary", 2500);
        itemConfigs[ITEM_CYBER_SAMPAGUITA] = ItemConfig("Cyber Sampaguita", 15 * 1e18, "Common", 100);
    }

    function setAuthorizedForge(address forge, bool authorized) external onlyOwner {
        authorizedForges[forge] = authorized;
    }

    /**
     * @notice Crafts cultural relics by spending farmed $PISO tokens.
     */
    function craftItem(uint256 itemId, uint256 amount) external {
        require(itemId >= 1 && itemId <= 10, "PISOItemsRelics: Invalid item ID");
        require(amount > 0, "PISOItemsRelics: Amount must be > 0");

        ItemConfig memory config = itemConfigs[itemId];
        uint256 totalCost = config.craftingCostPiso * amount;

        // Burn farmed PISO tokens for crafting
        require(pisoToken.burnFrom(msg.sender, totalCost), "PISOItemsRelics: PISO burn failed");

        _mint(msg.sender, itemId, amount);
        emit ItemCrafted(msg.sender, itemId, amount, totalCost);
    }

    function forgeMint(address to, uint256 itemId, uint256 amount) external onlyForge {
        _mint(to, itemId, amount);
    }

    function burn(address from, uint256 id, uint256 amount) external {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "PISOItemsRelics: Caller not owner nor approved");
        _burn(from, id, amount);
    }

    // --- ERC-1155 Core Functions ---

    function balanceOf(address account, uint256 id) public view override returns (uint256) {
        require(account != address(0), "PISOItemsRelics: Zero address query");
        return _balances[id][account];
    }

    function balanceOfBatch(address[] calldata accounts, uint256[] calldata ids) external view override returns (uint256[] memory) {
        require(accounts.length == ids.length, "PISOItemsRelics: Length mismatch");
        uint256[] memory batchBalances = new uint256[](accounts.length);
        for (uint256 i = 0; i < accounts.length; ++i) {
            batchBalances[i] = balanceOf(accounts[i], ids[i]);
        }
        return batchBalances;
    }

    function setApprovalForAll(address operator, bool approved) external override {
        require(msg.sender != operator, "PISOItemsRelics: Setting approval for self");
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address account, address operator) public view override returns (bool) {
        return _operatorApprovals[account][operator];
    }

    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes calldata) external override {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "PISOItemsRelics: Caller not owner nor approved");
        require(to != address(0), "PISOItemsRelics: Transfer to zero address");

        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "PISOItemsRelics: Insufficient balance");
        unchecked {
            _balances[id][from] = fromBalance - amount;
            _balances[id][to] += amount;
        }
        emit TransferSingle(msg.sender, from, to, id, amount);
    }

    function safeBatchTransferFrom(address from, address to, uint256[] calldata ids, uint256[] calldata amounts, bytes calldata) external override {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "PISOItemsRelics: Caller not owner nor approved");
        require(to != address(0), "PISOItemsRelics: Transfer to zero address");
        require(ids.length == amounts.length, "PISOItemsRelics: Length mismatch");

        for (uint256 i = 0; i < ids.length; ++i) {
            uint256 id = ids[i];
            uint256 amount = amounts[i];
            uint256 fromBalance = _balances[id][from];
            require(fromBalance >= amount, "PISOItemsRelics: Insufficient balance");
            unchecked {
                _balances[id][from] = fromBalance - amount;
                _balances[id][to] += amount;
            }
        }
        emit TransferBatch(msg.sender, from, to, ids, amounts);
    }

    function _mint(address to, uint256 id, uint256 amount) internal {
        require(to != address(0), "PISOItemsRelics: Mint to zero address");
        _balances[id][to] += amount;
        emit TransferSingle(msg.sender, address(0), to, id, amount);
    }

    function _burn(address from, uint256 id, uint256 amount) internal {
        require(from != address(0), "PISOItemsRelics: Burn from zero address");
        uint256 fromBalance = _balances[id][from];
        require(fromBalance >= amount, "PISOItemsRelics: Burn amount exceeds balance");
        unchecked {
            _balances[id][from] = fromBalance - amount;
        }
        emit TransferSingle(msg.sender, from, address(0), id, amount);
    }
}
