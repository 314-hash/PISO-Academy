# 📜 THIRD-PARTY NOTICES & OPEN-SOURCE ATTRIBUTIONS

This document lists the third-party open-source software, architectural concepts, and asset licenses incorporated into or referenced by the **PISO Academy Metaverse** multiplayer system.

---

## 1. Matrix Third Room

- **Project:** Third Room
- **Repository:** https://github.com/matrix-org/thirdroom
- **Copyright:** Copyright 2021-2023 The Matrix.org Foundation C.I.C.
- **License:** Apache License, Version 2.0 (http://www.apache.org/licenses/LICENSE-2.0)

### Architectural & Design Attribution:
The PISO Academy Metaverse multiplayer integration incorporates architectural concepts from the Matrix Third Room open-source project:
1. **Network Historian & Interpolation System:**
   - Ring-buffer state sampling, client-side dead-reckoning extrapolation, and interpolation buffer smoothing (`vec3.lerp`, `slerpAngle`) to eliminate jitter and packet burst teleportation.
2. **Billboard Projection & Nametags:**
   - 3D camera-facing billboard nametag scaling with distance thresholds and frustum LOD gating.
3. **Decoupled Tick Rate Architecture:**
   - Separation of 60 FPS Three.js rendering loops from 15-20 Hz throttled network packet transmission.
4. **Clean Entity Lifecycle:**
   - Modular spawn, update, and resource disposal (`dispose()` of textures, canvas buffers, materials, and geometries) preventing memory leaks across player join/leave cycles.

---

## 2. Three.js

- **Project:** Three.js JavaScript 3D Library
- **Repository:** https://github.com/mrdoob/three.js
- **Copyright:** Copyright 2010-2024 Three.js Authors
- **License:** MIT License

---

## 3. Gun.js

- **Project:** Gun P2P Graph Database
- **Repository:** https://github.com/amark/gun
- **Copyright:** Mark Nadal & Contributors
- **License:** Apache License, Version 2.0 / MIT License

---

## 4. Lucide Icons

- **Project:** Lucide
- **Repository:** https://github.com/lucide-icons/lucide
- **Copyright:** Lucide Contributors
- **License:** ISC License
