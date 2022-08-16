// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC1155/ERC1155.sol';
//import '@openzeppelin/contracts/token/ERC1155/utils/ERC1155Receiver.sol';
import './ERC1155Receiver.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/utils/Strings.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * @title ERC1155 contract, represent transportation and clothers (EIP1155 https://eips.ethereum.org/EIPS/eip-1155).
 */
contract Item1155 is ERC1155, AccessControl, ERC1155Receiver {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');
    using Strings for uint256;
    using Counters for Counters.Counter;
    /**
     * @notice stored current tokenId
     */
    Counters.Counter private _tokenIdCount;
    address public immutable tokenBaseAddress;

    /**
     * @notice initial value, set role
     */
    constructor(address _tokenBaseAddress) ERC1155('https://token-cdn-domain/{id}.json') {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
        tokenBaseAddress = _tokenBaseAddress;
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155Received.selector;
    }

    function onERC1155BatchReceived(
        address,
        address,
        uint256[] memory,
        uint256[] memory,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC1155BatchReceived.selector;
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControl, ERC1155, ERC1155Receiver) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice emit when a new nft item was minted
     */
    event ItemCreated(uint256 _tokenId, address _sender, uint256 _typeId, uint8 _rank, uint256 _price, uint256 _quantity);
    /**
     * @notice emit when buyer bought an nft item
     */
    event ItemBought(uint256 _tokenId, address _buyer, uint256 _cost, uint256 _quantity);
    event RankInfoUpdated(uint256 _rank, uint256 _quantity);
    /**
     * @notice stored external information of an item
     */
    struct Item {
        uint256 typeId;
        uint8 rank;
        uint256 price;
    }
    /**
     * @notice mapping from token id to item's information
     */
    mapping(uint256 => Item) public _tokenIdToItem;

    /**
     * @notice mapping from rank to quantity. Quantity is amount of token to mint
     */
    mapping(uint8 => uint256) public _rankToQuantity;

    function setUri(string memory _newUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _setURI(_newUri);
    }

    /**
     * @notice update or add Rank Info
     */
    function updateRankInfo(uint8 _id, uint256 _quantity) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_quantity > 0, 'Item1155: quantity must greater than 0');
        _rankToQuantity[_id] = _quantity;
        emit RankInfoUpdated(_id, _quantity);
    }

    /**
     * @notice remove rank info 
     */
    function removeRankInfo(uint8 _id) external onlyRole(DEFAULT_ADMIN_ROLE) {
        delete _rankToQuantity[_id];
        emit RankInfoUpdated(_id, 0);
    }

    /**
     * @notice user buys a quantity of token with a price
     * @param _tokenId tokenId
     * @param _quantity quantity of token
     */
    function buyItem(uint256 _tokenId, uint256 _quantity) external {
        require(_quantity > 0, 'Item1155: quantity must greater than 0');
        require(_quantity <= balanceOf(address(this), _tokenId), 'Item1155: item limited');
        Item memory item = _tokenIdToItem[_tokenId];
        uint256 cost = item.price * _quantity;
        IERC20(tokenBaseAddress).transferFrom(_msgSender(), address(this), cost);
        _safeTransferFrom(address(this), _msgSender(), _tokenId, _quantity, '');
        emit ItemBought(_tokenId, _msgSender(), cost, _quantity);
    }

    /**
     * @notice admin mints a quantity of token
     * @param _typeId type of nft
     * @param _rank rank of nft. Smart contract could get minted quantity from this param.
     * @param _price value that admin want to set to token's price
     */
    function mintItem(
        uint256 _typeId,
        uint8 _rank,
        uint256 _price
    ) external onlyRole(MINTER_ROLE) {
        require(_rankToQuantity[_rank] > 0, 'Item: invalid rank');
        require(_price > 0, 'Item: invalid price');
        require(_typeId <= 2, 'Item: invalid typeId');
        _tokenIdCount.increment();
        uint256 id = _tokenIdCount.current();
        _mint(address(this), id, _rankToQuantity[_rank], '');
        _tokenIdToItem[id] = Item(_typeId, _rank, _price);
        emit ItemCreated(id, msg.sender, _typeId, _rank, _price, _rankToQuantity[_rank]);
    }

    /**
     * @notice withdraw  erc20 token base balance of this contract
     */
    function withdrawToken(
        address _tokenAddress,
        address _receiver,
        uint256 _amount
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_amount <= IERC20(tokenBaseAddress).balanceOf(address(this)), 'Item: not enough balance');
        IERC20(_tokenAddress).transfer(_receiver, _amount);
    }

    /**
     * get number of item stored in smart contract
     */
    function getItemLength() external view returns (uint256) {
        return _tokenIdCount.current();
    }
}
