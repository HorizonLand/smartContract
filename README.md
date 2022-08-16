# Solidity API

## ERC1155Receiver

__Available since v3.1.__

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

_See {IERC165-supportsInterface}._

## Item1155

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### _tokenIdCount

```solidity
struct Counters.Counter _tokenIdCount
```

stored current tokenId

### tokenBaseAddress

```solidity
address tokenBaseAddress
```

### constructor

```solidity
constructor(address _tokenBaseAddress) public
```

initial value, set role

### onERC1155Received

```solidity
function onERC1155Received(address, address, uint256, uint256, bytes) public virtual returns (bytes4)
```

### onERC1155BatchReceived

```solidity
function onERC1155BatchReceived(address, address, uint256[], uint256[], bytes) public virtual returns (bytes4)
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view virtual returns (bool)
```

### ItemCreated

```solidity
event ItemCreated(uint256 _tokenId, address _sender, uint256 _typeId, uint8 _rank, uint256 _price, uint256 _quantity)
```

emit when a new nft item was minted

### ItemBought

```solidity
event ItemBought(uint256 _tokenId, address _buyer, uint256 _cost, uint256 _quantity)
```

emit when buyer bought an nft item

### RankInfoUpdated

```solidity
event RankInfoUpdated(uint256 _rank, uint256 _quantity)
```

### Item

```solidity
struct Item {
  uint256 typeId;
  uint8 rank;
  uint256 price;
}
```

### _tokenIdToItem

```solidity
mapping(uint256 => struct Item1155.Item) _tokenIdToItem
```

mapping from token id to item's information

### _rankToQuantity

```solidity
mapping(uint8 => uint256) _rankToQuantity
```

mapping from rank to quantity. Quantity is amount of token to mint

### setUri

```solidity
function setUri(string _newUri) external
```

### updateRankInfo

```solidity
function updateRankInfo(uint8 _id, uint256 _quantity) external
```

update or add Rank Info

### removeRankInfo

```solidity
function removeRankInfo(uint8 _id) external
```

remove rank info

### buyItem

```solidity
function buyItem(uint256 _tokenId, uint256 _quantity) external
```

user buys a quantity of token with a price

| Name | Type | Description |
| ---- | ---- | ----------- |
| _tokenId | uint256 | tokenId |
| _quantity | uint256 | quantity of token |

### mintItem

```solidity
function mintItem(uint256 _typeId, uint8 _rank, uint256 _price) external
```

admin mints a quantity of token

| Name | Type | Description |
| ---- | ---- | ----------- |
| _typeId | uint256 | type of nft |
| _rank | uint8 | rank of nft. Smart contract could get minted quantity from this param. |
| _price | uint256 | value that admin want to set to token's price |

### withdrawToken

```solidity
function withdrawToken(address _tokenAddress, address _receiver, uint256 _amount) external
```

withdraw  erc20 token base balance of this contract

### getItemLength

```solidity
function getItemLength() external view returns (uint256)
```

get number of item stored in smart contract

## Billiard721

### constructor

```solidity
constructor(address _tokenBaseAddress, address _tokenPiece) public
```

initial value, set role

_set the default gacha rank ratios_

### Billiard

```solidity
struct Billiard {
  uint8 rank;
  uint256 force;
  uint256 aim;
  uint256 spin;
  uint256 time;
}
```

### GachaBox

```solidity
struct GachaBox {
  uint256 price;
  uint256 pricePiece;
  uint8[6] rankRatios;
}
```

### _idToBilliard

```solidity
mapping(uint256 => struct Billiard721.Billiard) _idToBilliard
```

mapping from token id to it's information

### _idToGacha

```solidity
mapping(uint256 => struct Billiard721.GachaBox) _idToGacha
```

mapping from gacha id to it's information

### ranks

```solidity
uint8[] ranks
```

store type ranks

### burnRate

```solidity
uint8[] burnRate
```

burn rate for diffrent type of token

### _tokenIdCount

```solidity
struct Counters.Counter _tokenIdCount
```

### _gachaIdCount

```solidity
struct Counters.Counter _gachaIdCount
```

### tokenBaseAddress

```solidity
address tokenBaseAddress
```

address of exchange token

### tokenPiece

```solidity
address tokenPiece
```

address of token piece. Use this token as ashes of an nft after being burned and for open a gacha's box

### baseTokenURI

```solidity
string baseTokenURI
```

### GachaOpened

```solidity
event GachaOpened(uint256 _tokenId, address _owner, uint256 _rank, uint256 _force, uint256 _aim, uint256 _spin, uint256 _time)
```

### GachaUpdated

```solidity
event GachaUpdated(uint256 _gachaId, uint256 _price, uint256 _pricePiece, uint8[6] _rankRatios)
```

### GachaAdded

```solidity
event GachaAdded(uint256 _gachaId, uint256 _price, uint256 _pricePiece, uint8[6] _rankRatios)
```

### BilliardUpdated

```solidity
event BilliardUpdated(uint256 _tokenId, uint256 _force, uint256 _aim, uint256 _spin, uint256 _time)
```

### pause

```solidity
function pause() public
```

### unpause

```solidity
function unpause() public
```

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the `baseURI` and the `tokenId`. Empty
by default, can be overriden in child contracts._

### setBaseURI

```solidity
function setBaseURI(string baseURI) public
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

### addGacha

```solidity
function addGacha(uint256 _price, uint256 _pricePiece, uint8[6] _rankRatios) public
```

admin adds gacha box's information

| Name | Type | Description |
| ---- | ---- | ----------- |
| _price | uint256 | price of gacha box in market token |
| _pricePiece | uint256 | price of gacha box in piece token |
| _rankRatios | uint8[6] |  |

### updateGacha

```solidity
function updateGacha(uint256 _gachaId, uint256 _price, uint256 _pricePiece, uint8[6] _rankRatios) external
```

admin updates gacha box's information

| Name | Type | Description |
| ---- | ---- | ----------- |
| _gachaId | uint256 |  |
| _price | uint256 | price of gacha box in market token |
| _pricePiece | uint256 | price of gacha box in piece token |
| _rankRatios | uint8[6] | ratio set of the gacha's box |

### updateBilliard

```solidity
function updateBilliard(uint256 _tokenId, uint256 _force, uint256 _aim, uint256 _spin, uint256 _time) external
```

admin updates nft's properties

### buyGachaBox

```solidity
function buyGachaBox(uint256 _typeBuy, uint8 _gachaId) external
```

player buy a gacha box

| Name | Type | Description |
| ---- | ---- | ----------- |
| _typeBuy | uint256 | : 0 buy by marketPrice, 1 buy by pricePiece |
| _gachaId | uint8 | : type of gacha box |

### buyMultiGachaBox

```solidity
function buyMultiGachaBox(uint8 _quantity, uint256 _typeBuy, uint8 _gachaId) external
```

_Mints new NFTs (multi-item)._

| Name | Type | Description |
| ---- | ---- | ----------- |
| _quantity | uint8 | the uri list of new tokens. |
| _typeBuy | uint256 | : 0 buy by marketPrice, 1 buy by pricePiece |
| _gachaId | uint8 | : type of gacha box |

### _createBilliard

```solidity
function _createBilliard(address _owner, uint8 _gachaType, uint256 _nonce) internal
```

### _generateRandomBilliard

```solidity
function _generateRandomBilliard(uint8[6] _ratio, uint256 _nonce) private view returns (struct Billiard721.Billiard)
```

### _getBilliardLength

```solidity
function _getBilliardLength() internal view returns (uint256)
```

get number of billiard stored in smart contract

### _randInRangeWithNonce

```solidity
function _randInRangeWithNonce(uint256 _min, uint256 _max, uint256 _nonce) internal view returns (uint256)
```

### _randFromRatio

```solidity
function _randFromRatio(uint8[] _nums, uint8[6] _ratios, uint256 _nonce) internal view returns (uint8)
```

_pick a num in array with definitional ratio nums and ratios must have same length_

| Name | Type | Description |
| ---- | ---- | ----------- |
| _nums | uint8[] |  |
| _ratios | uint8[6] |  |
| _nonce | uint256 |  |

### burn

```solidity
function burn(uint256 _tokenId) external
```

nft's owner burns their token

_owner get amount of pieces based on burn rate_

### withdrawToken

```solidity
function withdrawToken(address _tokenAddress, address _receiver, uint256 _amount) external
```

withdraw  erc20 token base balance of this contract

## IERC20Mintable

_Interface of the ERC20 standard as defined in the EIP._

### mint

```solidity
function mint(address recipient, uint256 amount) external returns (bool)
```

## IReciver

_Required interface of an reciver compliant contract._

### transferNFT

```solidity
function transferNFT(address to, uint256 tokenId) external
```

### receiverNFT

```solidity
function receiverNFT(address from, uint256 tokenId) external
```

## Land

### ADMIN_ROLE

```solidity
bytes32 ADMIN_ROLE
```

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### clearLow

```solidity
uint256 clearLow
```

### clearHigh

```solidity
uint256 clearHigh
```

### factor

```solidity
uint256 factor
```

### baseTokenURI

```solidity
string baseTokenURI
```

### LandMinted

```solidity
event LandMinted(uint256 tokenId, int256 x, int256 y)
```

emit when minter mint land

### constructor

```solidity
constructor() public
```

init value and set up role

### mintNFT

```solidity
function mintNFT(address to, uint256 tokenId) external
```

minter mints an nft for an address with token Id

| Name | Type | Description |
| ---- | ---- | ----------- |
| to | address | nft's receiver |
| tokenId | uint256 | id of nft |

### encodeTokenId

```solidity
function encodeTokenId(int256 x, int256 y) external pure returns (uint256)
```

get an unique id from two value x, y repesent coordinates of land.

_An unique coordinates (x,y) will create an unique Id_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |

### _encodeTokenId

```solidity
function _encodeTokenId(int256 x, int256 y) internal pure returns (uint256 result)
```

### _unsafeEncodeTokenId

```solidity
function _unsafeEncodeTokenId(int256 x, int256 y) internal pure returns (uint256)
```

### decodeTokenId

```solidity
function decodeTokenId(uint256 value) external pure returns (int256, int256)
```

get land's coordinates using token Id

| Name | Type | Description |
| ---- | ---- | ----------- |
| value | uint256 | token Id |

### _unsafeDecodeTokenId

```solidity
function _unsafeDecodeTokenId(uint256 value) internal pure returns (int256 x, int256 y)
```

### expandNegative128BitCast

```solidity
function expandNegative128BitCast(uint256 value) internal pure returns (int256)
```

### _decodeTokenId

```solidity
function _decodeTokenId(uint256 value) internal pure returns (int256 x, int256 y)
```

### exists

```solidity
function exists(int256 x, int256 y) external view returns (bool)
```

check if land's coordinates exists or not

### _exists

```solidity
function _exists(int256 x, int256 y) internal view returns (bool)
```

### _baseURI

```solidity
function _baseURI() internal view virtual returns (string)
```

_Base URI for computing {tokenURI}. If set, the resulting URI for each
token will be the concatenation of the `baseURI` and the `tokenId`. Empty
by default, can be overriden in child contracts._

### setBaseURI

```solidity
function setBaseURI(string baseURI) public
```

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceId) public view returns (bool)
```

## IHorizonLand

_Required interface of an reciver compliant contract._

### mintNFT

```solidity
function mintNFT(address to, uint256 tokenId) external
```

### encodeTokenId

```solidity
function encodeTokenId(int256 x, int256 y) external pure returns (uint256)
```

### decodeTokenId

```solidity
function decodeTokenId(uint256 value) external pure returns (int256, int256)
```

### exists

```solidity
function exists(int256 x, int256 y) external view returns (bool)
```

## MarketHorizonLand

### ADMIN_ROLE

```solidity
bytes32 ADMIN_ROLE
```

### MANAGERMENT_ROLE

```solidity
bytes32 MANAGERMENT_ROLE
```

### tokenBaseAddress

```solidity
address tokenBaseAddress
```

address of exchange token

### receiver

```solidity
address receiver
```

account's address which holds token when admin sell token

### horizonLand

```solidity
address horizonLand
```

land smart contract's address

### TokenOnSale

```solidity
event TokenOnSale(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 price, address seller)
```

emit when seller or admin sells an nft

### TokenBought

```solidity
event TokenBought(uint256 id, int256 x, int256 y, uint256 indexSale, address buyer, address seller)
```

emit when buyer buys a selling nft

### Offered

```solidity
event Offered(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 offerId, uint256 amount, address offerOwner, address seller)
```

emit when bidder bids an offer

### OfferSelected

```solidity
event OfferSelected(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 offerId, address seller, address receiver)
```

emit when nft's owner selects offer

### OfferRefunded

```solidity
event OfferRefunded(uint256 id, int256 x, int256 y, uint256 indexSale, uint256 offerId)
```

emit when bidder refunds offer

### SaleCanceled

```solidity
event SaleCanceled(uint256 id, int256 x, int256 y, uint256 indexSale)
```

nft's ower cancels nft's sale

### TokenMintedByAdmin

```solidity
event TokenMintedByAdmin(int256 x, int256 y, address receiver)
```

admin mints an nft to a receiver

### tokenIdInfo

```solidity
struct tokenIdInfo {
  uint256 indexSale;
  address seller;
  address owner;
  uint256 price;
  bool sold;
  bool isCanceled;
}
```

### Offer

```solidity
struct Offer {
  address asker;
  uint256 amount;
  bool isRefuned;
  bool isWinner;
}
```

### infoNFT

```solidity
mapping(uint256 => struct MarketHorizonLand.tokenIdInfo) infoNFT
```

mapping from nft id to its information

### itemToOffer

```solidity
mapping(uint256 => mapping(uint256 => mapping(uint256 => struct MarketHorizonLand.Offer))) itemToOffer
```

mapping from nft id to offer id to offer's information

### offerCount

```solidity
mapping(uint256 => mapping(uint256 => uint256)) offerCount
```

mapping from nft id to index sale to offer count

_index sale is a uint represents sell times of an nft
index sale equal to zero means the nft is sold by admin_

### constructor

```solidity
constructor(address _tokenBaseAddress, address _receiver, address _horizonLand) public
```

initial value, set role

### setPriceForTokenId

```solidity
function setPriceForTokenId(int256 x, int256 y, uint256 price) external
```

admin set a price for an token with coordinates (x,y)

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |
| price | uint256 |  |

### mintByAdmin

```solidity
function mintByAdmin(int256 x, int256 y, address to) external
```

admin mint an nft with coordinates (x,y) to a receiver

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
this contract must have minter role of land contract_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |
| to | address | receiver's address |

### resellTokenId

```solidity
function resellTokenId(int256 x, int256 y, uint256 price) external
```

seller sells an nft

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
sender must be nft's owner
nft's ownership will be transfered to this address after transaction finished_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |
| price | uint256 | price of nft that seller want to set |

### buyNFTisSale

```solidity
function buyNFTisSale(int256 x, int256 y) external
```

buyer buys an nft

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
nft's sale is still avaiable to buy
price must greater than zero
nft's ownership will be transfered to buyer_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |

### offerLand

```solidity
function offerLand(int256 x, int256 y, uint256 amountOffer) external
```

bidder place an offer

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
nft's sale is still avaiable to offer
price must greater than zero_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |
| amountOffer | uint256 | placed amount |

### selectOfferWhenAdminSale

```solidity
function selectOfferWhenAdminSale(int256 x, int256 y, uint256 offerId) external
```

admin select an offer

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
nft's sale is still avaiable
nft must be sold by admin
nft's ownership will be transfered to offer's owner_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |
| offerId | uint256 | id of offer |

### selectOfferbyUser

```solidity
function selectOfferbyUser(int256 x, int256 y, uint256 offerId) external
```

seller select an offer

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
nft's sale is still avaiable
nft must be sold by sender (not admin)
nft's ownership will be transfered to offer's owner_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |
| offerId | uint256 | id of offer |

### refundOffer

```solidity
function refundOffer(int256 x, int256 y, uint256 indexSale, uint256 offerId) external
```

bidder request to refund offer

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
nft's sale is still avaiable to refund
sender must be offer's owner
sender take back the offer amount_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |
| indexSale | uint256 | current index sale of token |
| offerId | uint256 | id of offer |

### cancelSale

```solidity
function cancelSale(int256 x, int256 y) external
```

seller cancel sale

_coordinates (x,y) could be combined to an unique id by function `encodeTokenId` in land smart contract
nft's sale is still avaiable to cancel
sender must be sale's owner
nft's ownership will be transfered back to seller_

| Name | Type | Description |
| ---- | ---- | ----------- |
| x | int256 | horizontal coordinates |
| y | int256 | vertical coordinates |

## Marketplace

Contract Marketplace for trading ERC721 token (EIP721 https://eips.ethereum.org/EIPS/eip-721)

### _itemIds

```solidity
struct Counters.Counter _itemIds
```

_stored current itemid_

### _itemsSold

```solidity
struct Counters.Counter _itemsSold
```

_stored number of item sold_

### MarketItemCreated

```solidity
event MarketItemCreated(uint256 _itemId, address _nftContract, uint256 _tokenId, address _seller, address _owner, uint256 _price, bool _sold)
```

_emit when create market item_

### MakeOfferEvent

```solidity
event MakeOfferEvent(address _from, uint256 _itemId, uint256 _amount, uint256 _offerId)
```

emit when user makes offer to an item

### RefundEvent

```solidity
event RefundEvent(address _sender, uint256 _itemId, uint256 _offerId, uint256 _amount)
```

emit when user calls refund

### SelectOfferEvent

```solidity
event SelectOfferEvent(address _asker, address _owner, uint256 _itemId, uint256 _offerId, uint256 _amount)
```

emit when seller selects offer of item

### DirectlyBuyEvent

```solidity
event DirectlyBuyEvent(address _sender, address _receiver, uint256 _itemId, uint256 _amount)
```

emit when user buys an item directly

### CancelMarketItem

```solidity
event CancelMarketItem(address _sender, uint256 _itemId)
```

emit when cancels a market item

### FeeRateUpdated

```solidity
event FeeRateUpdated(uint256 feeDecimal, uint256 feeRate)
```

emit when admin upoates fee rate

### MarketItem

```solidity
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
```

### Offer

```solidity
struct Offer {
  uint256 offerId;
  address asker;
  uint256 amount;
  bool refunable;
}
```

### tokenBase

```solidity
address tokenBase
```

address of erc20 smart contract used for exchange nft in this smart contract

### feeDecimal

```solidity
uint256 feeDecimal
```

the decimal of fee, use this variable to create a decimal fee

### feeRate

```solidity
uint256 feeRate
```

a value repesent the percentage per transaction that contract take as transaction fee.

### idToMarketItem

```solidity
mapping(uint256 => struct Marketplace.MarketItem) idToMarketItem
```

mapping from market item Id to market item struct

### itemToOffer

```solidity
mapping(uint256 => mapping(uint256 => struct Marketplace.Offer)) itemToOffer
```

mapping from market item Id to offer Id to offer struct

### offerCount

```solidity
mapping(uint256 => uint256) offerCount
```

mapping from market item Id to the number of offer of it's market item

### constructor

```solidity
constructor(address _tokenBase, uint256 feeDecimal_, uint256 feeRate_) public
```

initial value, set role for admin

### _updateFeeRate

```solidity
function _updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) internal
```

### updateFeeRate

```solidity
function updateFeeRate(uint256 feeDecimal_, uint256 feeRate_) external
```

admin updates fee rate

### createMarketItem

```solidity
function createMarketItem(address nftContract, uint256 tokenId, uint256 price) public
```

seller creates a market item (in other words token sale).

_sender must not owner
input price must greater than zero
nft's ownership will be transfered to this address after transaction finished_

| Name | Type | Description |
| ---- | ---- | ----------- |
| nftContract | address |  |
| tokenId | uint256 |  |
| price | uint256 | in tokenBase |

### _calculateFee

```solidity
function _calculateFee(uint256 _price) private view returns (uint256)
```

### changePriceOfMarketItem

```solidity
function changePriceOfMarketItem(uint256 itemId, uint256 price) public
```

owner changes price of their market item

_sender must be item's owner
input price must greater than zero
item is still avaiable_

| Name | Type | Description |
| ---- | ---- | ----------- |
| itemId | uint256 |  |
| price | uint256 |  |

### buyItemDirectly

```solidity
function buyItemDirectly(uint256 itemId) public
```

buyer busy nft directly from a avaiable market item

_sender must not owner
item is still avaiable_

| Name | Type | Description |
| ---- | ---- | ----------- |
| itemId | uint256 |  |

### createMarketOffer

```solidity
function createMarketOffer(uint256 itemId, uint256 offerPrice) public
```

bidder makes an offer for market item

_sender must not owner
item is still avaiable_

| Name | Type | Description |
| ---- | ---- | ----------- |
| itemId | uint256 |  |
| offerPrice | uint256 |  |

### selectOffer

```solidity
function selectOffer(uint256 itemId, uint256 offerId) public
```

seller selects offer

_sender must not owner
item is still avaiable_

| Name | Type | Description |
| ---- | ---- | ----------- |
| itemId | uint256 |  |
| offerId | uint256 |  |

### refundOffer

```solidity
function refundOffer(uint256 itemId, uint256 offerId) public
```

bidder take back token that they bid from a specific offer

_the offer would not be the winning offer
the offer would not be refunded 
sender must be offer owner_

| Name | Type | Description |
| ---- | ---- | ----------- |
| itemId | uint256 |  |
| offerId | uint256 |  |

### cancelMarketItem

```solidity
function cancelMarketItem(uint256 itemId) public
```

owner cancels market item

_sender must be market item's owner
item is still avaiable_

| Name | Type | Description |
| ---- | ---- | ----------- |
| itemId | uint256 |  |

### getContractERC20Balance

```solidity
function getContractERC20Balance() public view returns (uint256)
```

get token base balance of this smart contract

## MarketToken

Market token contract - BEP20

### constructor

```solidity
constructor() public
```

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

## Piece

Piece token contract - BEP20

### MINTER_ROLE

```solidity
bytes32 MINTER_ROLE
```

### constructor

```solidity
constructor() public
```

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5.05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

### transfer

```solidity
function transfer(address recipient, uint256 amount) public virtual returns (bool)
```

### mint

```solidity
function mint(address recipient, uint256 amount) public returns (bool)
```

## TokenInfo

### decimals

```solidity
function decimals() public view virtual returns (uint8)
```

_Returns the number of decimals used to get its user representation.
For example, if `decimals` equals `2`, a balance of `505` tokens should
be displayed to a user as `5.05` (`505 / 10 ** 2`).

Tokens usually opt for a value of 18, imitating the relationship between
Ether and Wei. This is the value {ERC20} uses, unless this function is
overridden;

NOTE: This information is only used for _display_ purposes: it in
no way affects any of the arithmetic of the contract, including
{IERC20-balanceOf} and {IERC20-transfer}._

## TokenWithdrawable

### tokenBlacklist

```solidity
mapping(address => bool) tokenBlacklist
```

### TokenWithdrawn

```solidity
event TokenWithdrawn(address token, uint256 amount, address to)
```

### blacklistToken

```solidity
function blacklistToken(address _token) public
```

Blacklists a token to be withdrawn from the contract.

### withdrawToken

```solidity
function withdrawToken(contract IERC20 token, uint256 amount, address to) external
```

Withdraws any tokens in the contract.

