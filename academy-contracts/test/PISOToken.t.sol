// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/PISOToken.sol";

contract PISOTokenTest {
    PISOToken token;
    address alice = address(0xAAAA);
    address bob = address(0xBBBB);

    function setUp() public {
        // Initial supply: 1,000, Max supply: 10,000
        token = new PISOToken("PISO Academy Token", "pACAD", 18, 1000 * 1e18, 10000 * 1e18);
    }

    function testInitialState() public view {
        assert(token.totalSupply() == 1000 * 1e18);
        assert(token.maxSupply() == 10000 * 1e18);
        assert(token.balanceOf(address(this)) == 1000 * 1e18);
    }

    function testTransfer() public {
        token.transfer(alice, 100 * 1e18);
        assert(token.balanceOf(alice) == 100 * 1e18);
        assert(token.balanceOf(address(this)) == 900 * 1e18);
    }

    function testMintControlled() public {
        token.mint(bob, 500 * 1e18);
        assert(token.balanceOf(bob) == 500 * 1e18);
        assert(token.totalSupply() == 1500 * 1e18);
    }
}
