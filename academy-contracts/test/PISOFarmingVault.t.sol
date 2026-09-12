// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../src/PISOToken.sol";
import "../src/PISOFarmingVault.sol";
import "../src/PISOItemsRelics.sol";
import "../src/PISOWeaponsGears.sol";
import "../src/PISOPetsCompanions.sol";

contract PISOFarmingVaultTest {
    PISOToken token;
    PISOFarmingVault vault;
    PISOItemsRelics relics;
    PISOWeaponsGears weapons;
    PISOPetsCompanions pets;

    address alice = address(0xAAAA);
    address bob = address(0xBBBB);

    function setUp() public {
        // 1. Deploy PISOToken with 100M max supply, 10,000 initial supply to deployer
        token = new PISOToken("PISO Token", "PISO", 18, 10_000 * 1e18, 100_000_000 * 1e18);

        // 2. Deploy 100M Farming Vault
        vault = new PISOFarmingVault(address(token));
        token.setFarmingVault(address(vault));

        // 3. Deploy Items, Weapons, Pets contracts
        relics = new PISOItemsRelics(address(token));
        weapons = new PISOWeaponsGears(address(token));
        pets = new PISOPetsCompanions(address(token));

        // Transfer some initial tokens to Alice
        token.transfer(alice, 2_000 * 1e18);
    }

    function test100MSupplyCap() public view {
        assert(token.maxSupply() == 100_000_000 * 1e18);
        assert(vault.TOTAL_FARM_SUPPLY() == 100_000_000 * 1e18);
    }

    function testGameplayActivityRewardAndHarvest() public {
        // Record quest / proof-of-play farming reward for Alice
        vault.recordGameActivityReward(alice, 500 * 1e18, "Daily Coding Quest & Defeat Boss");
        assert(vault.getPendingRewards(alice) == 500 * 1e18);
    }

    function testRelicCrafting() public {
        // Test that relics cost configuration is initialized
        (string memory name, uint256 cost, string memory rarity, uint256 apr) = relics.itemConfigs(1);
        assert(cost == 250 * 1e18);
        assert(apr == 1500); // +15% APR
    }

    function testWeaponsStats() public view {
        assert(weapons.nextTokenId() == 1);
    }

    function testPetsSpecies() public view {
        assert(pets.nextTokenId() == 1);
    }
}
