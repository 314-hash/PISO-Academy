// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/l2/PISOBridge.sol";
import "../src/l2/PISOCrossDomainMessenger.sol";
import "../src/l2/PISOWithdrawalManager.sol";

/**
 * @title DeployL2Bridge
 * @notice Deploys PISO's custom L2 bridge infrastructure on top of OP Stack predeploys.
 *
 * Usage:
 *   # Deploy bridge contracts to PISO L2:
 *   forge script script/DeployL2Bridge.s.sol --rpc-url piso_l2 --broadcast -vvvv
 *
 * Prerequisites:
 *   • PISOToken already deployed on L2 (VITE_PISO_TOKEN_ADDR in env)
 *   • L1StandardBridge already deployed on Sepolia (VITE_L1_STANDARD_BRIDGE in env)
 *   • L1CrossDomainMessenger deployed on Sepolia (VITE_L1_CROSS_DOMAIN_MESSENGER in env)
 */
contract DeployL2Bridge is Script {

    // OP Stack Predeploys (same on every OP chain)
    address constant L2_STANDARD_BRIDGE   = 0x4200000000000000000000000000000000000010;
    address constant L2_CROSS_DOMAIN_MSG  = 0x4200000000000000000000000000000000000007;

    function run() external {
        uint256 deployerKey    = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer       = vm.addr(deployerKey);
        address pisoToken      = vm.envAddress("VITE_PISO_TOKEN_ADDR");
        address l1Bridge       = vm.envOr("VITE_L1_STANDARD_BRIDGE", address(0));
        address l1Messenger    = vm.envOr("VITE_L1_CROSS_DOMAIN_MESSENGER", address(0));
        address l1PisoToken    = vm.envOr("L1_PISO_TOKEN", address(0));

        console.log("=== PISO Bridge L2 Deployment ===");
        console.log("Deployer:     ", deployer);
        console.log("Chain ID:     ", block.chainid);
        console.log("PISOToken L2: ", pisoToken);

        vm.startBroadcast(deployerKey);

        // ── 1. PISOBridge ─────────────────────────────────────────────────────
        PISOBridge bridge = new PISOBridge(pisoToken, l1PisoToken);
        console.log("PISOBridge:              ", address(bridge));

        // ── 2. PISOCrossDomainMessenger ───────────────────────────────────────
        PISOCrossDomainMessenger messenger = new PISOCrossDomainMessenger(l1Messenger);
        if (l1Bridge != address(0)) {
            messenger.setAuthorizedSender(l1Bridge, true);
        }
        console.log("PISOCrossDomainMessenger:", address(messenger));

        // ── 3. PISOWithdrawalManager ──────────────────────────────────────────
        PISOWithdrawalManager withdrawalMgr = new PISOWithdrawalManager(
            pisoToken,
            address(bridge)
        );
        console.log("PISOWithdrawalManager:   ", address(withdrawalMgr));

        vm.stopBroadcast();

        console.log("\n=== Bridge Deployment Complete ===");
        console.log("Add to your .env:");
        console.log("VITE_PISO_BRIDGE_ADDR=",      address(bridge));
        console.log("VITE_PISO_WITHDRAWAL_ADDR=",   address(withdrawalMgr));
        console.log("\nNote: Set L2StandardBridge as PISOToken bridge:");
        console.log("  pisoToken.setBridge(", L2_STANDARD_BRIDGE, ")  // already done in DeployPISOAcademy");
    }
}
