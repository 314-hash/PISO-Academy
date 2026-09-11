---
sidebar_position: 1
id: best-practices
title: Solidity Best Practices & Design Patterns
---

# Solidity Best Practices & Design Patterns

Writing production-ready Solidity on PISO Chain requires code that is clean, gas-efficient, and mathematically sound.

## 1. Custom Errors Instead of Require Strings
Custom errors save substantial deployment and runtime gas:

```solidity
// Gas-expensive
require(msg.sender == owner, "Only the authorized owner can execute this action");

// Gas-efficient
error UnauthorizedCaller(address caller);

if (msg.sender != owner) {
    revert UnauthorizedCaller(msg.sender);
}
```

## 2. Immutables & Constants
Values that never change after construction should be marked `immutable` or `constant`:
```solidity
uint256 public constant MAX_VALIDATORS = 21;
address public immutable treasury;
```

## 3. Pull Over Push Payments
Instead of iterating through accounts and pushing native PISO coins to them, maintain a balance mapping and let users withdraw:
```solidity
mapping(address => uint256) public pendingWithdrawals;

function withdraw() external {
    uint256 amount = pendingWithdrawals[msg.sender];
    require(amount > 0, "Zero balance");
    pendingWithdrawals[msg.sender] = 0;
    (bool success, ) = payable(msg.sender).call{value: amount}("");
    require(success, "Transfer failed");
}
```
