# Contributing to PISO Academy

Mabuhay! We welcome contributions from builders across the Philippines and around the world to expand PISO Academy.

## How You Can Contribute
1. **Curriculum & Tutorials**: Add new guides, smart contract tutorials, or localized explanations in English or Filipino/Tagalog.
2. **Coding Challenges**: Propose new automated challenges in `academy-challenges/`.
3. **Starter Templates**: Add new production-ready templates in `academy-templates/`.
4. **UI & Developer Experience**: Enhance the interactive web laboratory, builder profile, or certificate verifier in `academy-web/`.
5. **Documentation**: Expand the developer docs in `academy-docs/`.

## Development Workflow
1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/my-new-challenge
   ```
2. Ensure tests pass:
   ```bash
   npm run test
   npm run contracts:test
   ```
3. Commit with semantic messages (`feat:`, `fix:`, `docs:`, `chore:`).
4. Open a Pull Request with a clear description and screenshot if UI is touched.

## Code Standards
- Strict TypeScript throughout frontend and adapters.
- 60-30-10 Color System adherence for all visual interfaces.
- Zero server-side execution of untrusted user code; all challenge evaluations must use isolated sandboxes.
- Never hardcode private keys, seed phrases, or sensitive RPC credentials.
