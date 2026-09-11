# Starter Template: PISO Token (ERC-20)

A lightweight ERC-20 token template tailored for PISO Chain (`chainId: 2026001`).

## How to Build & Deploy with Foundry
```bash
# Compile contracts
forge build

# Run unit tests
forge test

# Deploy to PISO Chain Devnet
forge create --rpc-url https://piso-rpc-dev.loca.lt \
  --private-key $YOUR_PRIVATE_KEY \
  contracts/PISOToken.sol:PISOToken \
  --constructor-args "My PISO Token" "MPT" 1000000000000000000000000
```
