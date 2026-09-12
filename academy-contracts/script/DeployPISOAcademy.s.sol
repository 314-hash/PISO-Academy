// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PISOToken.sol";
import "../src/PISOCertificateNFT.sol";
import "../src/PISOVerificationRegistry.sol";
import "../src/PISOFarmingVault.sol";
import "../src/PISOFarmingRateLimiter.sol";
import "../src/PISOMarketplace.sol";
import "../src/PISOItemsRelics.sol";
import "../src/PISOWeaponsGears.sol";
import "../src/PISOPetsCompanions.sol";
import "../src/PISOPvPArena.sol";
import "../src/PISOMonsterBountyManager.sol";

/**
 * @title DeployPISOAcademy
 * @notice Full deployment script for PISO Academy on PISO Chain L2 (OP Stack).
 *
 * Usage:
 *   # Deploy to local PISO L2 devnet (port 9545):
 *   forge script script/DeployPISOAcademy.s.sol --rpc-url piso_local --broadcast -vvvv
 *
 *   # Deploy to PISO Chain L2 (production):
 *   forge script script/DeployPISOAcademy.s.sol --rpc-url piso_l2 --broadcast --verify -vvvv
 *
 * Environment Variables Required:
 *   DEPLOYER_PRIVATE_KEY  — Deployer wallet private key
 *   L2_STANDARD_BRIDGE    — OP Stack L2StandardBridge predeploy (0x4200...0010)
 *   L1_PISO_TOKEN         — L1 PISOToken address (after L1 deployment)
 */
contract DeployPISOAcademy is Script {

    // ─── OP Stack Predeploys ──────────────────────────────────────────────────
    address constant L2_STANDARD_BRIDGE = 0x4200000000000000000000000000000000000010;

    // ─── Token Supply (100M total) ────────────────────────────────────────────
    uint256 constant MAX_SUPPLY          = 100_000_000 * 1e18;
    uint256 constant INITIAL_SUPPLY      = 0;              // Mint-on-demand via farming
    uint256 constant FARMING_ALLOCATION  = 70_000_000 * 1e18;  // 70% for players
    uint256 constant LIQUIDITY_ALLOC     = 10_000_000 * 1e18;  // 10% DEX liquidity
    uint256 constant ECOSYSTEM_ALLOC     =  8_000_000 * 1e18;  // 8%  ecosystem
    uint256 constant TEAM_ALLOC          =  7_000_000 * 1e18;  // 7%  team (vested)
    uint256 constant TREASURY_ALLOC      =  5_000_000 * 1e18;  // 5%  governance treasury

    function run() external {
        uint256 deployerKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);
        address l1PisoToken = vm.envOr("L1_PISO_TOKEN", address(0));

        console.log("=== PISO Academy L2 Deployment ===");
        console.log("Deployer:    ", deployer);
        console.log("Chain ID:    ", block.chainid);
        console.log("L1 PISO:     ", l1PisoToken);

        vm.startBroadcast(deployerKey);

        // ── 1. Core Token ─────────────────────────────────────────────────────
        PISOToken pisoToken = new PISOToken(
            "PISO Token",
            "PISO",
            18,
            INITIAL_SUPPLY,
            MAX_SUPPLY
        );
        console.log("PISOToken:              ", address(pisoToken));

        // Wire up L2StandardBridge for cross-chain mint/burn
        pisoToken.setBridge(L2_STANDARD_BRIDGE);
        if (l1PisoToken != address(0)) {
            pisoToken.setRemoteToken(l1PisoToken);
        }

        // ── 2. Certificate NFT ────────────────────────────────────────────────
        PISOCertificateNFT certNFT = new PISOCertificateNFT();
        console.log("PISOCertificateNFT:     ", address(certNFT));

        // ── 3. Verification Registry ──────────────────────────────────────────
        PISOVerificationRegistry registry = new PISOVerificationRegistry();
        console.log("PISOVerificationRegistry:", address(registry));

        // ── 4. Farming Rate Limiter ───────────────────────────────────────────
        PISOFarmingRateLimiter rateLimiter = new PISOFarmingRateLimiter();
        console.log("PISOFarmingRateLimiter:  ", address(rateLimiter));

        // ── 5. Farming Vault (holds 70M farming allocation) ───────────────────
        PISOFarmingVault farmingVault = new PISOFarmingVault(
            address(pisoToken),
            address(rateLimiter)
        );
        console.log("PISOFarmingVault:        ", address(farmingVault));

        // Authorize farmingVault to mint rewards
        pisoToken.setFarmingVault(address(farmingVault));

        // Mint farming allocation to vault
        pisoToken.mintReward(address(farmingVault), FARMING_ALLOCATION);
        console.log("Farming allocation minted: 70,000,000 PISO");

        // ── 6. Game Asset Contracts ───────────────────────────────────────────
        PISOItemsRelics itemsRelics = new PISOItemsRelics();
        console.log("PISOItemsRelics:         ", address(itemsRelics));

        PISOWeaponsGears weaponsGears = new PISOWeaponsGears();
        console.log("PISOWeaponsGears:         ", address(weaponsGears));

        PISOPetsCompanions petsCompanions = new PISOPetsCompanions();
        console.log("PISOPetsCompanions:       ", address(petsCompanions));

        // ── 7. Marketplace ────────────────────────────────────────────────────
        PISOMarketplace marketplace = new PISOMarketplace(address(pisoToken));
        console.log("PISOMarketplace:          ", address(marketplace));

        // ── 8. PvP Arena ──────────────────────────────────────────────────────
        PISOPvPArena pvpArena = new PISOPvPArena(address(pisoToken));
        console.log("PISOPvPArena:             ", address(pvpArena));

        // ── 9. Monster Bounty Manager ─────────────────────────────────────────
        PISOMonsterBountyManager bountyManager = new PISOMonsterBountyManager(
            address(pisoToken),
            address(farmingVault)
        );
        console.log("PISOMonsterBountyManager: ", address(bountyManager));

        // ── 10. Distribute remaining allocations ──────────────────────────────
        pisoToken.mintReward(deployer, LIQUIDITY_ALLOC);   // 10M — deployer → DEX
        pisoToken.mintReward(deployer, ECOSYSTEM_ALLOC);   // 8M  — deployer → ecosystem wallet
        pisoToken.mintReward(deployer, TEAM_ALLOC);        // 7M  — deployer → team vesting
        pisoToken.mintReward(deployer, TREASURY_ALLOC);    // 5M  — deployer → governance

        console.log("All allocations minted. Total:", MAX_SUPPLY / 1e18, "PISO");

        vm.stopBroadcast();

        // ── Summary ───────────────────────────────────────────────────────────
        console.log("\n=== Deployment Complete on Chain", block.chainid, "===");
        console.log("Set these in your .env:");
        console.log("VITE_PISO_TOKEN_ADDR=",           address(pisoToken));
        console.log("VITE_PISO_CERT_NFT_ADDR=",        address(certNFT));
        console.log("VITE_PISO_REGISTRY_ADDR=",        address(registry));
        console.log("VITE_PISO_RATE_LIMITER_ADDR=",    address(rateLimiter));
        console.log("VITE_PISO_FARMING_VAULT_ADDR=",   address(farmingVault));
        console.log("VITE_PISO_ITEMS_ADDR=",           address(itemsRelics));
        console.log("VITE_PISO_WEAPONS_ADDR=",         address(weaponsGears));
        console.log("VITE_PISO_PETS_ADDR=",            address(petsCompanions));
        console.log("VITE_PISO_MARKETPLACE_ADDR=",     address(marketplace));
        console.log("VITE_PISO_PVP_ARENA_ADDR=",       address(pvpArena));
        console.log("VITE_PISO_BOUNTY_ADDR=",          address(bountyManager));
    }
}
