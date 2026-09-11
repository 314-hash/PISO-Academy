// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/PISOCertificateNFT.sol";

contract PISOCertificateNFTTest {
    PISOCertificateNFT certContract;
    address student1 = address(0x1111111111111111111111111111111111111111);
    address student2 = address(0x2222222222222222222222222222222222222222);

    function setUp() public {
        certContract = new PISOCertificateNFT();
    }

    function testMintBayaniCertificate() public {
        uint256 tokenId = certContract.mintCertificate(
            student1,
            PISOCertificateNFT.Tier.BAYANI,
            "PISO Solidity Master Builder"
        );

        assert(tokenId == 1);
        assert(certContract.ownerOf(tokenId) == student1);
        assert(certContract.balanceOf(student1) == 1);
        assert(certContract.locked(tokenId) == true);

        (bool verified, address holder, , string memory tierName, , ) = certContract.verifyCertificate(tokenId);
        assert(verified == true);
        assert(holder == student1);
        assert(bytes(tierName).length > 0);
    }

    function testCannotTransferSoulbound() public {
        uint256 tokenId = certContract.mintCertificate(
            student1,
            PISOCertificateNFT.Tier.BAYANI,
            "Ecosystem Builder"
        );

        // Attempting to transfer must revert
        try certContract.transferFrom(student1, student2, tokenId) {
            revert("Soulbound token should not be transferable");
        } catch {
            // Expected revert
        }
    }
}
