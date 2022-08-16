// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * @dev Required interface of an reciver compliant contract.
 */
interface IHorizonLand {
    function mintNFT(address to, uint256 tokenId) external;

    function encodeTokenId(int256 x, int256 y) external pure returns (uint256);

    function decodeTokenId(uint256 value) external pure returns (int256, int256);

    function exists(int256 x, int256 y) external view returns (bool);
}

/**
 * @title Martket smart constract for trading nft land (EIP721 https://eips.ethereum.org/EIPS/eip-721).
 */
contract MarketHorizonLand is Ownable, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
    bytes32 public constant MANAGERMENT_ROLE = keccak256('MANAGERMENT_ROLE');
    /**
     * @notice address of exchange token
     */
    address tokenBaseAddress;
    /**
     * @notice account's address which holds token when admin sell token
     */
    address receiver;
    /**
     * @notice land smart contract's address
     */
    address horizonLand;
    /**
     * @notice emit when seller or admin sells an nft
     */
    event TokenOnSale(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 price, address seller);
    /**
     * @notice emit when buyer buys a selling nft
     */
    event TokenBought(uint256 id, int256 x, int256 y, uint256 indexSale, address buyer, address seller);
    /**
     * @notice emit when bidder bids an offer
     */
    event Offered(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 offerId, uint256 amount, address offerOwner, address seller);
    /**
     * @notice emit when nft's owner selects offer
     */
    event OfferSelected(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 offerId, address seller, address receiver);
    /**
     * @notice emit when bidder refunds offer
     */
    event OfferRefunded(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 offerId);
    /**
     * @notice nft's ower cancels nft's sale
     */
    event SaleCanceled(uint256 id, int256 x, int256 y, uint256 indexSale);
    /**
     * @notice admin mints an nft to a receiver
     */
    event TokenMintedByAdmin(int256 x, int256 y, address receiver);
    /**
     * @notice created by seller when an nft was up to sale
     */
    struct tokenIdInfo {
        uint256 indexSale;
        address seller;
        address owner;
        uint256 price;
        bool sold;
        bool isCanceled;
    }

    /**
     * @notice created by bidders when they make an offer
     */
    struct Offer {
        address asker;
        uint256 amount;
        bool isRefuned;
        bool isWinner;
    }
    /**
     * @notice mapping from nft id to its information
     */
    mapping(uint256 => tokenIdInfo) public infoNFT;
    /**
     * @notice mapping from nft id to offer id to offer's information
     */
    mapping(uint256 => mapping(uint256 => mapping(uint256 => Offer))) public itemToOffer;

    /**
     * @notice mapping from nft id to index sale to offer count
     * @dev index sale is a uint represents sell times of an nft
     * @dev index sale equal to zero means the nft is sold by admin
     */
    mapping(uint256 => mapping(uint256 => uint256)) public offerCount;

    /**
     * @notice initial value, set role
     */
    constructor(
        address _tokenBaseAddress,
        address _receiver,
        address _horizonLand
    ) {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(MANAGERMENT_ROLE, MANAGERMENT_ROLE);
        _setupRole(ADMIN_ROLE, _msgSender());
        _setupRole(MANAGERMENT_ROLE, _msgSender());
        tokenBaseAddress = _tokenBaseAddress;
        receiver = _receiver;
        horizonLand = _horizonLand;
    }

    /**
     * @notice admin set a price for an token with coordinates (x,y)
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @param x horizontal coordinates
     * @param y vertical coordinates
     */
    function setPriceForTokenId(
        int256 x,
        int256 y,
        uint256 price
    ) external onlyRole(MANAGERMENT_ROLE) {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        require(infoNFT[tokenId].indexSale == 0, 'token was on sale');

        infoNFT[tokenId] = tokenIdInfo(0, address(0), address(0), price, false, false);
        offerCount[tokenId][0] = 0;
        emit TokenOnSale(tokenId, x, y, 0, price, _msgSender());
    }

    /**
     * @notice admin mint an nft with coordinates (x,y) to a receiver
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev this contract must have minter role of land contract
     * @param x horizontal coordinates
     * @param y vertical coordinates
     * @param to receiver's address
     */
    function mintByAdmin(
        int256 x,
        int256 y,
        address to
    ) external onlyRole(MANAGERMENT_ROLE) {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        require(infoNFT[tokenId].price == 0, 'token sale has existed');
        IHorizonLand(horizonLand).mintNFT(to, tokenId);
        infoNFT[tokenId] = tokenIdInfo(1, address(0), to, 0, true, true);
        emit TokenMintedByAdmin(x, y, receiver);
    }

    /**
     * @notice seller sells an nft
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev sender must be nft's owner
     * @dev nft's ownership will be transfered to this address after transaction finished
     * @param x horizontal coordinates
     * @param y vertical coordinates
     * @param price price of nft that seller want to set
     */
    function resellTokenId(
        int256 x,
        int256 y,
        uint256 price
    ) external {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        tokenIdInfo memory land = infoNFT[tokenId];

        require(IERC721(horizonLand).ownerOf(tokenId) == msg.sender, 'sender is not owner');
        IERC721(horizonLand).transferFrom(msg.sender, address(this), tokenId);

        infoNFT[tokenId] = tokenIdInfo(land.indexSale, msg.sender, address(0), price, false, false);
        offerCount[tokenId][land.indexSale] = 1;
        emit TokenOnSale(tokenId, x, y, land.indexSale, price, _msgSender());
    }
    /**
     * @notice buyer buys an nft
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev nft's sale is still avaiable to buy
     * @dev price must greater than zero
     * @dev nft's ownership will be transfered to buyer
     * @param x horizontal coordinates
     * @param y vertical coordinates
     */
    function buyNFTisSale(int256 x, int256 y) external {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        tokenIdInfo memory land = infoNFT[tokenId];
        uint256 indexSale = land.indexSale;
        require(msg.sender != land.seller, 'seller must not sender');
        require(land.price > 0, 'land do not set price');
        require(!land.sold, 'land was sold');
        require(!land.isCanceled, 'land sale was canceled');

        if (land.indexSale == 0) {
            IERC20(tokenBaseAddress).transferFrom(msg.sender, receiver, land.price);
            IHorizonLand(horizonLand).mintNFT(msg.sender, tokenId);
        } else {
            IERC20(tokenBaseAddress).transferFrom(msg.sender, land.seller, land.price);
            IERC721(horizonLand).transferFrom(address(this), msg.sender, tokenId);
        }

        infoNFT[tokenId].owner = msg.sender;
        infoNFT[tokenId].sold = true;
        infoNFT[tokenId].price = 0;
        infoNFT[tokenId].indexSale += 1;
        emit TokenBought(tokenId, x, y, indexSale, _msgSender(), infoNFT[tokenId].seller);
    }
    /**
     * @notice bidder place an offer
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev nft's sale is still avaiable to offer
     * @dev price must greater than zero
     * @param x horizontal coordinates
     * @param y vertical coordinates
     * @param amountOffer placed amount
     */
    function offerLand(
        int256 x,
        int256 y,
        uint256 amountOffer
    ) external {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        tokenIdInfo memory land = infoNFT[tokenId];
        uint256 indexSale = land.indexSale;

        uint256 offerId = offerCount[tokenId][indexSale];
        require(msg.sender != land.seller, 'seller must not sender');
        require(land.price > 0, 'price must greater than 0');
        require(!land.sold, 'land was sold');
        require(!land.isCanceled, 'land sale was canceled');
        if (indexSale == 0) {
            offerId += 1;
        }
        require(offerId > 0, 'item is not sale');

        IERC20(tokenBaseAddress).transferFrom(msg.sender, address(this), amountOffer);

        itemToOffer[tokenId][indexSale][offerId] = Offer(msg.sender, amountOffer, false, false);
        offerCount[tokenId][indexSale] = offerId + 1;
        emit Offered(tokenId, x, y, indexSale, offerId, amountOffer, _msgSender(), land.seller);
    }
    /**
     * @notice admin select an offer
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev nft's sale is still avaiable
     * @dev nft must be sold by admin
     * @dev nft's ownership will be transfered to offer's owner
     * @param x horizontal coordinates
     * @param y vertical coordinates
     * @param offerId id of offer
     */
    function selectOfferWhenAdminSale(
        int256 x,
        int256 y,
        uint256 offerId
    ) external onlyRole(MANAGERMENT_ROLE) {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        tokenIdInfo memory land = infoNFT[tokenId];
        uint256 indexSale = land.indexSale;
        Offer memory offer = itemToOffer[tokenId][indexSale][offerId];
        require(offerId > 0, 'offerId is not equal zero');
        require(!land.sold, 'land was sold');
        require(indexSale == 0, 'nft must sell by admin');
        require(!offer.isRefuned, 'offer was refunded');

        IHorizonLand(horizonLand).mintNFT(offer.asker, tokenId);
        IERC20(tokenBaseAddress).transfer(receiver, offer.amount);

        infoNFT[tokenId].owner = msg.sender;
        infoNFT[tokenId].sold = true;
        infoNFT[tokenId].price = 0;
        infoNFT[tokenId].indexSale += 1;
        itemToOffer[tokenId][indexSale][offerId].isWinner = true;
        emit OfferSelected(tokenId, x, y, indexSale, offerId, land.seller, offer.asker);
    }
    /**
     * @notice seller select an offer
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev nft's sale is still avaiable
     * @dev nft must be sold by sender (not admin)
     * @dev nft's ownership will be transfered to offer's owner
     * @param x horizontal coordinates
     * @param y vertical coordinates
     * @param offerId id of offer
     */
    function selectOfferbyUser(
        int256 x,
        int256 y,
        uint256 offerId
    ) external {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        tokenIdInfo memory land = infoNFT[tokenId];
        uint256 indexSale = land.indexSale;
        Offer memory offer = itemToOffer[tokenId][indexSale][offerId];
        uint256 offerIdCount = offerCount[tokenId][indexSale];

        require(offerIdCount > 0, "item don't have any offer");
        require(offerId > 0, 'offerId is not equal zero');
        require(indexSale > 0, 'nft is sale by admin');
        require(!land.sold, 'land was sold');
        require(!land.isCanceled, 'land sale was canceled');
        require(!offer.isRefuned, 'offer was refunded');
        require(!offer.isWinner, 'offer owner must not be the winner');

        IERC721(horizonLand).transferFrom(address(this), offer.asker, tokenId);
        IERC20(tokenBaseAddress).transfer(land.seller, offer.amount);

        infoNFT[tokenId].owner = msg.sender;
        infoNFT[tokenId].sold = true;
        infoNFT[tokenId].price = 0;
        infoNFT[tokenId].indexSale += 1;
        itemToOffer[tokenId][indexSale][offerId].isWinner = true;
        emit OfferSelected(tokenId, x, y, indexSale, offerId, land.seller, offer.asker);
    }
    /**
     * @notice bidder request to refund offer
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev nft's sale is still avaiable to refund
     * @dev sender must be offer's owner
     * @dev sender take back the offer amount
     * @param x horizontal coordinates
     * @param y vertical coordinates
     * @param indexSale current index sale of token
     * @param offerId id of offer
     */
    function refundOffer(
        int256 x,
        int256 y,
        uint256 indexSale,
        uint256 offerId
    ) external {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        Offer memory offer = itemToOffer[tokenId][indexSale][offerId];

        require(offerId > 0, 'offerId must greater than 0');
        require(!offer.isRefuned, 'offer was refunded');
        require(!offer.isWinner, 'offer owner must not be the winner');
        require(offer.asker == msg.sender, 'sender must be owner');

        IERC20(tokenBaseAddress).transfer(msg.sender, offer.amount);
        itemToOffer[tokenId][indexSale][offerId].isRefuned = true;
        emit OfferRefunded(tokenId, x, y, indexSale, offerId);
    }
   /**
     * @notice  seller cancel sale
     * @dev coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
     * @dev nft's sale is still avaiable to cancel
     * @dev sender must be sale's owner
     * @dev nft's ownership will be transfered back to seller
     * @param x horizontal coordinates
     * @param y vertical coordinates
     */
    function cancelSale(int256 x, int256 y) external {
        uint256 tokenId = IHorizonLand(horizonLand).encodeTokenId(x, y);
        tokenIdInfo memory land = infoNFT[tokenId];
        uint256 indexSale = land.indexSale;
        require(!land.sold, 'tokenId was sold');
        require(!land.isCanceled, 'land sale was canceled');
        require(indexSale > 0, 'sold by admin');
        require(land.seller == msg.sender, 'sender must be seller');

        IERC721(horizonLand).transferFrom(address(this), msg.sender, tokenId);
        infoNFT[tokenId].indexSale += 1;
        infoNFT[tokenId].owner = msg.sender;
        infoNFT[tokenId].isCanceled = true;
        emit SaleCanceled(tokenId, x, y, indexSale);
    }
}
