// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PISOToken
 * @dev Standard ERC-20 Token implementation for PISO Academy builders.
 * Demonstrates capped supply, controlled minting, burnability, and Bayanihan event emissions.
 */
contract PISOToken {
    string public name;
    string public symbol;
    uint8 public immutable decimals;
    uint256 public totalSupply;
    uint256 public immutable maxSupply;
    address public owner;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOToken: Caller is not the owner");
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _initialSupply,
        uint256 _maxSupply
    ) {
        require(_maxSupply >= _initialSupply, "PISOToken: Max supply must exceed initial supply");
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        maxSupply = _maxSupply;
        owner = msg.sender;

        if (_initialSupply > 0) {
            _mint(msg.sender, _initialSupply);
        }
    }

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
            unchecked {
                allowance[from][msg.sender] = currentAllowance - value;
            }
        }
        _transfer(from, to, value);
        return true;
    }

    function mint(address to, uint256 amount) external onlyOwner returns (bool) {
        _mint(to, amount);
        return true;
    }

    function burn(uint256 amount) external returns (bool) {
        _burn(msg.sender, amount);
        return true;
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "PISOToken: New owner cannot be zero address");
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function _transfer(address from, address to, uint256 value) internal {
        require(from != address(0), "PISOToken: Transfer from zero address");
        require(to != address(0), "PISOToken: Transfer to zero address");
        require(balanceOf[from] >= value, "PISOToken: Transfer amount exceeds balance");

        unchecked {
            balanceOf[from] -= value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 amount) internal {
        require(to != address(0), "PISOToken: Mint to zero address");
        require(totalSupply + amount <= maxSupply, "PISOToken: Max supply exceeded");

        totalSupply += amount;
        unchecked {
            balanceOf[to] += amount;
        }
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        require(balanceOf[from] >= amount, "PISOToken: Burn amount exceeds balance");

        unchecked {
            balanceOf[from] -= amount;
            totalSupply -= amount;
        }
        emit Transfer(from, address(0), amount);
    }
}
