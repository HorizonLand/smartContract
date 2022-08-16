// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/security/ReentrancyGuard.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * @notice Contract Marketplace for trading ERC721 token (EIP721 https://eips.ethereum.org/EIPS/eip-721)
 */
contract Marketplace is ReentrancyGuard, AccessControl {
    using Counters for Counters.Counter;
    /**
     * @dev stored current itemid
     */
    Counters.Counter private _itemIds;
    /**
     * @dev stored number of item sold
     */
    Counters.Counter private _itemsSold;
    /**
     * @dev emit when create market item
     */
    event MarketItemCreated(
        uint256 indexed _itemId,
        address indexed _nftContract,
        uint256 indexed _tokenId,
        address _seller,
        address _owner,
        uint256 _price,
        bool _sold
    );
    /**
     * @notice emit when user makes offer to an item
     */
    event MakeOfferEvent(address _from, uint256 _itemId, uint256 _amount, uint256 _offerId);
    /**
     * @notice emit when user calls refund
     */
    event RefundEvent(address _sender, uint256 _itemId, uint256 _offerId, uint256 _amount);
    /**
     * @notice emit when seller selects offer of item
     */
    event SelectOfferEvent(address _asker, address _owner, uint256 _itemId, uint256 _offerId, uint256 _amount);
    /**
     * @notice emit when user buys an item directly
     */
    event DirectlyBuyEvent(address _sender, address _receiver, uint256 _itemId, uint256 _amount);
    /**
     * @notice emit when cancels a market item
     */
    event CancelMarketItem(address _sender, uint256 _itemId);
    /**
     * @notice emit when admin upoates fee rate
     */
    event FeeRateUpdated(uint256 feeDecimal, uint256 feeRate);
    /**
     * @notice stored nft infor that up to sale. Once an Nft was sold on this smart contract, a market item would be created
     * @dev This struct hold fields that define the states of the market item
     */
    struct MarketItem {
        uint256 itemId;
        address nftContract;
        uint256 tokenId;
        address seller;
        address owner;
        uint256 price;
        bool sold;
        bool isCanceled;
        uint256 offerWin;
    }
    /**
     * @notice stored offer information of an item
     */
    struct Offer {
        uint256 offerId;
        address asker;
        uint256 amount;
        bool refunable;
    }
    /**
     * @notice address of erc20 smart contract used for exchange nft in this smart contract
     */
    address tokenBase;
    /**
     * @notice the decimal of fee, use this variable to create a decimal fee
     */
    uint256 public feeDecimal;
    /**
     * @notice a value repesent the percentage per transaction that contract take as transaction fee.
     */
    uint256 public feeRate;
    /**
     * @notice mapping from market item Id to market item struct
     */
    mapping(uint256 => MarketItem) public idToMarketItem;
    /**
     * @notice mapping from market item Id to offer Id to offer struct
     */
    mapping(uint256 => mapping(uint256 => Offer)) public itemToOffer;
    /**
     * @notice mapping from market item Id to the number of offer of it's market item
     */
    mapping(uint256 => uint256) offerCount;

    /**
     * @notice initial value, set role for admin
     */
    constructor(
        address _tokenBase,
        uint256 feeDecimal_,
        uint256 feeRate_
    ) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        tokenBase = _tokenBase;
        _updateFeeRate(feeDecimal_, feeRate_);
    }

    function _updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) internal {
        require(feeRate_ < 10**(feeDecimal_ + 2), 'NFTMarketplace: bad fee rate');
        feeDecimal = feeDecimal_;
        feeRate = feeRate_;
        emit FeeRateUpdated(feeDecimal_, feeRate_);
    }

    /**
     * @notice admin updates fee rate
     */
    function updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _updateFeeRate(feeDecimal_, feeRate_);
    }

    /**
     * @notice seller creates a market item (in other words token sale).
     * @dev sender must not owner
     * @dev input price must greater than zero
     * @dev nft's ownership will be transfered to this address after transaction finished
     * @param nftContract: address of nft contract
     * @param tokenId: id of token in nft contract
     * @param price: price in tokenBase
     */
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public nonReentrant {
        require(IERC721(nftContract).ownerOf(tokenId) == msg.sender, 'sender is not owner');
        require(price > 0, 'the price must be bigger than zero');
        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(itemId, nftContract, tokenId, msg.sender, address(0), price, false, false, 0);
        offerCount[itemId] = 1;
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        emit MarketItemCreated(itemId, nftContract, tokenId, msg.sender, address(0), price, false);
    }

    function _calculateFee(uint256 _price) private view returns (uint256) {
        if (feeRate == 0) {
            return 0;
        }
        return (feeRate * _price) / 10**(feeDecimal + 2);
    }

    /**
     * @notice owner changes price of their market item
     * @dev sender must be item's owner
     * @dev input price must greater than zero
     * @dev item is still avaiable
     * @param itemId: id of market item
     * @param price: new price
     */
    function changePriceOfMarketItem(uint256 itemId, uint256 price) public nonReentrant {
        require(msg.sender == idToMarketItem[itemId].seller, 'sender must be owner');
        require(price > 0, 'the price must be bigger than zero');
        require(idToMarketItem[itemId].sold == false, 'Item has been sold');
        require(idToMarketItem[itemId].isCanceled == false, 'Item has been canceled');
        idToMarketItem[itemId].price = price;
    }

    /**
     * @notice buyer busy nft directly from a avaiable market item
     * @dev sender must not owner
     * @dev item is still avaiable
     * @param itemId: id of market item
     */
    function buyItemDirectly(uint256 itemId) public nonReentrant {
        require(msg.sender != idToMarketItem[itemId].seller, 'owner must not sender');
        require(idToMarketItem[itemId].sold == false, 'Item has been sold');
        require(idToMarketItem[itemId].isCanceled == false, 'Item has been canceled');
        uint256 price = idToMarketItem[itemId].price;
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        address seller = idToMarketItem[itemId].seller;
        address nftContract = idToMarketItem[itemId].nftContract;
        uint256 fee = _calculateFee(price);
        //ERC20 token must approve
        IERC20(tokenBase).transferFrom(msg.sender, address(this), fee);
        IERC20(tokenBase).transferFrom(msg.sender, seller, price - fee);
        IERC721(nftContract).transferFrom(address(this), msg.sender, tokenId);
        idToMarketItem[itemId].owner = msg.sender;
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        emit DirectlyBuyEvent(msg.sender, seller, itemId, price);
    }

    /**
     * @notice bidder makes an offer for market item
     * @dev sender must not owner
     * @dev item is still avaiable
     * @param itemId: id of market item
     * @param offerPrice: offer price want to set
     */
    function createMarketOffer(uint256 itemId, uint256 offerPrice) public nonReentrant {
        require(msg.sender != idToMarketItem[itemId].seller, 'owner must not sender');
        require(idToMarketItem[itemId].sold == false, 'Item has been sold');
        require(idToMarketItem[itemId].isCanceled == false, 'Item has been canceled');
        uint256 price = idToMarketItem[itemId].price;
        require(offerPrice < price, 'Offer price must less than item price');
        IERC20(tokenBase).transferFrom(msg.sender, address(this), offerPrice);
        uint256 offerId = offerCount[itemId];
        Offer memory newOffer;
        newOffer.offerId = offerId;
        newOffer.asker = msg.sender;
        newOffer.amount = offerPrice;
        newOffer.refunable = true;
        itemToOffer[itemId][offerId] = newOffer;
        offerCount[itemId] = offerId + 1;
        emit MakeOfferEvent(msg.sender, itemId, offerPrice, offerId);
    }

    /**
     * @notice seller selects offer
     * @dev sender must not owner
     * @dev item is still avaiable 
     * @param itemId: id of market item
     * @param offerId: id of offer
     */
    function selectOffer(uint256 itemId, uint256 offerId) public {
        uint256 tokenId = idToMarketItem[itemId].tokenId;
        address nftContract = idToMarketItem[itemId].nftContract;
        require(idToMarketItem[itemId].seller == msg.sender, 'sender is not owner');
        require(itemToOffer[itemId][offerId].refunable, 'Offer was refuned');
        require(idToMarketItem[itemId].sold == false, 'item was already sold');
        require(idToMarketItem[itemId].isCanceled == false, 'Item was canceled');
        IERC721(nftContract).transferFrom(address(this), itemToOffer[itemId][offerId].asker, tokenId);
        uint256 offerPrice = itemToOffer[itemId][offerId].amount;
        uint256 fee = _calculateFee(offerPrice);
        IERC20(tokenBase).transfer(msg.sender, itemToOffer[itemId][offerId].amount - fee);
        itemToOffer[itemId][offerId].refunable = false;
        idToMarketItem[itemId].owner = itemToOffer[itemId][offerId].asker;
        idToMarketItem[itemId].sold = true;
        idToMarketItem[itemId].offerWin = offerId;
        _itemsSold.increment();

        emit SelectOfferEvent(itemToOffer[itemId][offerId].asker, msg.sender, itemId, offerId, itemToOffer[itemId][offerId].amount);
    }

    /**
     * @notice bidder take back token that they bid from a specific offer
     * @dev the offer would not be the winning offer
     * @dev the offer would not be refunded 
     * @dev sender must be offer owner
     * @param itemId: id of market item
     * @param offerId: id of offer
     */
    function refundOffer(uint256 itemId, uint256 offerId) public {
        require(idToMarketItem[itemId].offerWin != offerId, "Winner can't refund");
        require(itemToOffer[itemId][offerId].refunable, 'Offer has arlready refunded');
        require(itemToOffer[itemId][offerId].asker == msg.sender, "Sender isn't offer owner");

        IERC20(tokenBase).transfer(msg.sender, itemToOffer[itemId][offerId].amount);
        itemToOffer[itemId][offerId].refunable = false;
        emit RefundEvent(msg.sender, itemId, offerId, itemToOffer[itemId][offerId].amount);
    }

    /**
     * @notice owner cancels market item
     * @dev sender must be market item's owner
     * @dev item is still avaiable
     * @param itemId: id of market item
     */
    function cancelMarketItem(uint256 itemId) public {
        require(idToMarketItem[itemId].seller == msg.sender, 'sender is not item owner');
        require(idToMarketItem[itemId].sold == false, 'Item has been sold');
        require(idToMarketItem[itemId].isCanceled == false, 'Item has been canceled');
        IERC721(idToMarketItem[itemId].nftContract).transferFrom(address(this), msg.sender, idToMarketItem[itemId].tokenId);
        idToMarketItem[itemId].isCanceled = true;
        emit CancelMarketItem(msg.sender, itemId);
    }


    /**
     * @notice get token base balance of this smart contract
     */
    function getContractERC20Balance() public view returns (uint256) {
        return IERC20(tokenBase).balanceOf(address(this));
    }
}
