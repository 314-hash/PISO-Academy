# Security Policy — PISO Academy

Security is our foremost priority. PISO Academy teaches secure smart contract engineering and enforces strict security practices across our platform.

## Key Security Mandates
1. **No Custody of Private Keys**: PISO Academy NEVER requests, stores, or transmits student private keys or recovery seed phrases. Transactions are strictly signed client-side via user wallets (MetaMask, Rabby, or ephemeral in-browser burner wallets).
2. **Untrusted Code Execution Isolation**: Student code submitted for challenges is never run directly on host application servers. Code execution is isolated client-side via WebAssembly (`solc-js`) or inside sandboxed container workers (e.g. Judge0) with tight memory, CPU, and network limits.
3. **Smart Contract Verification**: Contracts deployed to PISO Chain are audited against OpenZeppelin standards, avoiding common vulnerabilities such as reentrancy, integer overflows, authorization bypasses, and flash loan attacks.

## Reporting a Vulnerability
If you discover a security vulnerability in PISO Academy or related smart contracts, please **DO NOT open a public GitHub issue**.

Instead, email the security team at:
`security@piso-chain.org` or notify the core team privately.

We will acknowledge receipt within 24 hours and coordinate a patch and responsible disclosure.
