# Starter Template: PISO Katunayan Certificate

Soulbound, verifiable certificate smart contract template.

## Use Cases
- University / Boot camp graduation credentials
- Event attendance proof (POAP equivalent)
- Employee skill attestations on PISO Chain

## Deployment
```bash
forge create --rpc-url https://piso-rpc-dev.loca.lt \
  --private-key $YOUR_PRIVATE_KEY \
  contracts/KatunayanCertificate.sol:KatunayanCertificate
```
