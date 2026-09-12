// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./PISOToken.sol";

interface IERC721Minimal {
    function transferFrom(address from, address to, uint256 tokenId) external;
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title PISOMarketplace
 * @dev Tokenized P2P Marketplace for trading weapons, armor, cultural relics, and monster drops using $PISO tokens.
 * Features a 1% anti-inflationary burn tax on all peer trades.
 */
contract PISOMarketplace {
    PISOToken public immutable pisoToken;
    address public owner;
    uint256 public nextListingId = 1;

    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 pricePiso;
        string itemName;
        string itemCategory;
        bool active;
    }

    mapping(uint256 => Listing) public listings;

    event ItemListed(uint256 indexed listingId, address indexed seller, uint256 indexed tokenId, uint256 pricePiso, string itemName);
    event ItemPurchased(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 pricePiso);
    event ListingCancelled(uint256 indexed listingId);

    modifier onlyOwner() {
        require(msg.sender == owner, "PISOMarketplace: Caller is not owner");
        _;
    }

    constructor(address _pisoToken) {
        require(_pisoToken != address(0), "PISOMarketplace: Zero token address");
        pisoToken = PISOToken(_pisoToken);
        owner = msg.sender;
    }

    /**
     * @notice Lists an NFT or item for sale in $PISO tokens.
     */
    function createListing(
        address nftContract,
        uint256 tokenId,
        uint256 pricePiso,
        string calldata itemName,
        string calldata itemCategory
    ) external returns (uint256) {
        require(pricePiso > 0, "PISOMarketplace: Price must be > 0");

        uint256 listingId = nextListingId++;
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            pricePiso: pricePiso,
            itemName: itemName,
            itemCategory: itemCategory,
            active: true
        });

        emit ItemListed(listingId, msg.sender, tokenId, pricePiso, itemName);
        return listingId;
    }

    /**
     * @notice Purchases a listed item using $PISO tokens.
     * 1% of the purchase price is burned permanently.
     */
    function buyListing(uint256 listingId) external {
        Listing storage item = listings[listingId];
        require(item.active, "PISOMarketplace: Listing is not active");
        require(item.seller != msg.sender, "PISOMarketplace: Cannot buy own listing");

        item.active = false;
        uint256 totalPrice = item.pricePiso;
        uint256 burnFee = totalPrice / 100; // 1% Burn Fee
        uint256 sellerProceeds = totalPrice - burnFee;

        // Burn 1% deflationary tax
        require(pisoToken.burnFrom(msg.sender, burnFee), "PISOMarketplace: Burn fee failed");
        // Transfer 99% to seller
        require(pisoToken.transferFrom(msg.sender, item.seller, sellerProceeds), "PISOMarketplace: Payment failed");

        // Transfer NFT to buyer if contract specified
        if (item.nftContract != address(0)) {
            IERC721Minimal(item.nftContract).transferFrom(item.seller, msg.sender, item.tokenId);
        }

        emit ItemPurchased(listingId, msg.sender, item.seller, totalPrice);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage item = listings[listingId];
        require(item.active, "PISOMarketplace: Listing not active");
        require(item.seller == msg.sender || msg.sender == owner, "PISOMarketplace: Not authorized");

        item.active = false;
        emit ListingCancelled(listingId);
    }
}
