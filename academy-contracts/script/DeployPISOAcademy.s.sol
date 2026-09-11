// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/PISOCertificateNFT.sol";
import "../src/PISOToken.sol";
import "../src/PISOVerificationRegistry.sol";

contract DeployPISOAcademy {
    function run() external returns (
        address certAddr,
        address tokenAddr,
        address registryAddr
    ) {
        // In local or live PISO Chain deployment
        PISOCertificateNFT cert = new PISOCertificateNFT();
        PISOToken token = new PISOToken(
            "PISO Academy Token",
            "pACAD",
            18,
            1_000_000 * 1e18,
            10_000_000 * 1e18
        );
        PISOVerificationRegistry registry = new PISOVerificationRegistry();

        return (address(cert), address(token), address(registry));
    }
}
