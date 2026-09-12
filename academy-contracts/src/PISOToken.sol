// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IBridgeMintable
 * @dev OP Stack standard interface required by L2StandardBridge to mint/burn
 *      bridged ERC-20 tokens on the L2 side.
 *      See: https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/universal/IOptimismMintableERC20.sol
 */
interface IBridgeMintable {
    /// @notice Address of the L2StandardBridge (OP predeploy 0x4200...0010)
    function bridge() external view returns (address);

    /// @notice Address of the corresponding token on L1
    function remoteToken() external view returns (address);

    /// @notice Called by the bridge to mint tokens on L2 after an L1 deposit
    function mint(address to, uint256 amount) external;

    /// @notice Called by the bridge to burn tokens on L2 when a withdrawal is initiated
    function burn(address from, uint256 amount) external;
}

/**
 * @title PISOToken
 * @dev ERC-20 Token for the PISO Chain L2 + PISO Academy Metaverse.
 *
 *      Layer 2 Edition:
 *      ───────────────
 *      • Implements IBridgeMintable for full OP Stack L2StandardBridge compatibility
 *      • The "bridge" role (L2StandardBridge predeploy) can mint/burn for cross-chain transfers
 *      • The "farmingVault" role mints game-economy rewards up to maxSupply
 *      • Capped at exactly 100,000,000 PISO (10^8 * 10^18 wei)
 *      • 70% of supply allocated to player farming rewards via PISOFarmingVault
 *      • 30% reserved for ecosystem: marketing, team, liquidity, PvP prizes
 *
 *      Token Distribution:
 *      ───────────────────
 *        70,000,000 PISO → Players (farm, fight, learn-to-earn)
 *        10,000,000 PISO → Liquidity / DEX pool
 *         8,000,000 PISO → Ecosystem / partnerships
 *         7,000,000 PISO → Team (3-year vesting)
 *         5,000,000 PISO → Community treasury / governance
 */
contract PISOToken {
    // ─── ERC-20 State ─────────────────────────────────────────────────────────

    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;
    uint256 public immutable maxSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ─── Access Control ───────────────────────────────────────────────────────

    address public owner;
    address public farmingVault;

    /// @notice L2StandardBridge predeploy (0x4200...0010) — authorized to mint/burn cross-chain
    address public bridge;

    /// @notice L1 counterpart of this token (set after L1 lock contract is deployed)
    address public remoteToken;

    // ─── Events ───────────────────────────────────────────────────────────────

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event FarmingVaultSet(address indexed vault);
    event BridgeSet(address indexed bridge);
    event RemoteTokenSet(address indexed remoteToken);

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOToken: Not owner");
        _;
    }

    modifier onlyMinter() {
        bool isOwner   = msg.sender == owner;
        bool isVault   = farmingVault != address(0) && msg.sender == farmingVault;
        bool isBridge  = bridge      != address(0) && msg.sender == bridge;
        require(isOwner || isVault || isBridge, "PISOToken: Not authorized to mint");
        _;
    }

    modifier onlyBridge() {
        require(msg.sender == bridge, "PISOToken: Caller is not the bridge");
        _;
    }

    // ─── Constructor ──────────────────────────────────────────────────────────

    constructor(
        string memory _name,
        string memory _symbol,
        uint8  _decimals,
        uint256 _initialSupply,
        uint256 _maxSupply
    ) {
        uint256 cap = _maxSupply > 0 ? _maxSupply : 100_000_000 * 1e18;
        require(cap >= _initialSupply, "PISOToken: Max supply must exceed initial supply");

        name     = bytes(_name).length   > 0 ? _name   : "PISO Token";
        symbol   = bytes(_symbol).length > 0 ? _symbol : "PISO";
        decimals = _decimals             > 0 ? _decimals : 18;
        maxSupply = cap;
        owner    = msg.sender;

        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
        }
    }

    // ─── IBridgeMintable (OP Stack) ───────────────────────────────────────────

    /**
     * @notice Called by L2StandardBridge to mint PISO after an L1 deposit.
     * @dev Only the registered bridge (L2StandardBridge predeploy) may call this.
     */
    function mint(address to, uint256 amount) external onlyBridge {
        _mint(to, amount);
    }

    /**
     * @notice Called by L2StandardBridge to burn PISO when a withdrawal is initiated.
     * @dev Only the registered bridge may call this.
     */
    function burn(address from, uint256 amount) external onlyBridge {
        _burn(from, amount);
    }

    // ─── ERC-20 Standard ─────────────────────────────────────────────────────

    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 currentAllowance = allowance[from][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= value, "PISOToken: Insufficient allowance");
            unchecked { allowance[from][msg.sender] = currentAllowance - value; }
        }
        _transfer(from, to, value);
        return true;
    }

    function burn(uint256 amount) external returns (bool) {
        _burn(msg.sender, amount);
        return true;
    }

    function burnFrom(address account, uint256 amount) external returns (bool) {
        uint256 currentAllowance = allowance[account][msg.sender];
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "PISOToken: Insufficient allowance to burn");
            unchecked { allowance[account][msg.sender] = currentAllowance - amount; }
        }
        _burn(account, amount);
        return true;
    }

    // ─── Game Economy Minting ─────────────────────────────────────────────────

    /**
     * @notice Mints farming / game rewards. Called by owner or farmingVault.
     */
    function mintReward(address to, uint256 amount) external onlyMinter returns (bool) {
        _mint(to, amount);
        return true;
    }

    // ─── Admin ────────────────────────────────────────────────────────────────

    function setFarmingVault(address _vault) external onlyOwner {
        require(_vault != address(0), "PISOToken: Zero address");
        farmingVault = _vault;
        emit FarmingVaultSet(_vault);
    }

    /**
     * @notice Set the L2StandardBridge address (OP predeploy 0x4200...0010).
     *         Can only be called ONCE — once set the bridge address is permanent.
     *         This prevents a compromised owner key from re-routing mint/burn
     *         authority to a malicious contract after initial deployment.
     */
    function setBridge(address _bridge) external onlyOwner {
        require(_bridge  != address(0), "PISOToken: Zero bridge address");
        require(bridge   == address(0), "PISOToken: Bridge already set — immutable after first set");
        bridge = _bridge;
        emit BridgeSet(_bridge);
    }

    /**
     * @notice Set the L1 counterpart token address. Used by bridge for validation.
     *         Can only be called ONCE — prevents post-deployment tampering.
     */
    function setRemoteToken(address _remoteToken) external onlyOwner {
        require(_remoteToken  != address(0), "PISOToken: Zero remote token address");
        require(remoteToken   == address(0), "PISOToken: Remote token already set — immutable after first set");
        remoteToken = _remoteToken;
        emit RemoteTokenSet(_remoteToken);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PISOToken: New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice EIP-165 interface support declaration for OP Stack bridge compatibility.
     */
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        // IBridgeMintable selector
        bytes4 IBridgeMintableId = type(IBridgeMintable).interfaceId;
        return interfaceId == IBridgeMintableId || interfaceId == 0x01ffc9a7; // ERC-165
    }

    // ─── Internal ─────────────────────────────────────────────────────────────

    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "PISOToken: Transfer from zero address");
        require(to   != address(0), "PISOToken: Transfer to zero address");
        require(balanceOf[from] >= value, "PISOToken: Transfer amount exceeds balance");
        unchecked {
            balanceOf[from] -= value;
            balanceOf[to]   += value;
        }
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "PISOToken: Mint to zero address");
        require(totalSupply + amount <= maxSupply, "PISOToken: 100M max supply exceeded");
        totalSupply += amount;
        unchecked { balanceOf[to] += amount; }
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(balanceOf[from] >= amount, "PISOToken: Burn amount exceeds balance");
        unchecked {
            balanceOf[from] -= amount;
            totalSupply     -= amount;
        }
        emit Transfer(from, address(0), amount);
    }
}
