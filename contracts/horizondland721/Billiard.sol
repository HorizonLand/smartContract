// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol';
import './IERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * @title ERC721 contract, represent billiard's items (EIP1155 https://eips.ethereum.org/EIPS/eip-721).
 */
contract Billiard721 is Ownable, ERC721Pausable, AccessControl {
    using Counters for Counters.Counter;

    /**
     * @notice initial value, set role
     * @dev set the default gacha rank ratios
     */
    constructor(address _tokenBaseAddress, address _tokenPiece) ERC721('Horizonland NFT', 'CNFT') {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        tokenBaseAddress = _tokenBaseAddress;
        tokenPiece = _tokenPiece;
        addGacha(100 * 10**18, 100, [34, 20, 18, 15, 11, 2]);
        addGacha(500 * 10**18, 100, [11, 15, 18, 34, 11, 11]);
    }

    /**
     * @notice nft item's information
     */
    struct Billiard {
        uint8 rank;
        uint256 force;
        uint256 aim;
        uint256 spin;
        uint256 time;
    }
    /**
     * @notice gacha box's information
     */
    struct GachaBox {
        uint256 price;
        uint256 pricePiece;
        uint8[6] rankRatios;
    }
    /**
     * @notice mapping from token id to it's information
     */
    mapping(uint256 => Billiard) public _idToBilliard;
    /**
     * @notice mapping from gacha id to it's information
     */
    mapping(uint256 => GachaBox) public _idToGacha;
    /**
     * @notice store type ranks
     */
    uint8[] ranks = [1, 2, 3, 4, 5, 6];
    /**
     * @notice burn rate for diffrent type of token
     */
    uint8[] burnRate = [1, 2, 3, 4, 5, 6];
    Counters.Counter private _tokenIdCount;
    Counters.Counter private _gachaIdCount;
    /**
     * @notice address of exchange token
     */
    address public tokenBaseAddress;
    /**
     * @notice address of token piece. Use this token as ashes of an nft after being burned and for open a gacha's box
     */
    address public tokenPiece;
    string public baseTokenURI;

    event GachaOpened(uint256 _tokenId, address _owner, uint256 _rank, uint256 _force, uint256 _aim, uint256 _spin, uint256 _time);
    event GachaUpdated(uint256 _gachaId, uint256 _price, uint256 _pricePiece, uint8[6] _rankRatios);
    event GachaAdded(uint256 _gachaId, uint256 _price, uint256 _pricePiece, uint8[6] _rankRatios);
    event BilliardUpdated(uint256 _tokenId, uint256 _force, uint256 _aim, uint256 _spin, uint256 _time);

    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public onlyRole(DEFAULT_ADMIN_ROLE) {
        baseTokenURI = baseURI;
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC721) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @notice admin adds gacha box's information
     * @param _price price of gacha box in market token
     * @param _pricePiece price of gacha box in piece token
     */
    function addGacha(
        uint256 _price,
        uint256 _pricePiece,
        uint8[6] memory _rankRatios
    ) public onlyRole(DEFAULT_ADMIN_ROLE) {
        _gachaIdCount.increment();
        uint256 _gachaId = _gachaIdCount.current();
        GachaBox storage gachaBox = _idToGacha[_gachaId];
        gachaBox.price = _price;
        gachaBox.pricePiece = _pricePiece;
        gachaBox.rankRatios = _rankRatios;
        emit GachaAdded(_gachaId, _price, _pricePiece, _rankRatios);
    }

    /**
     * @notice admin updates gacha box's information
     * @param _price price of gacha box in market token
     * @param _pricePiece price of gacha box in piece token
     * @param _rankRatios ratio set of the gacha's box
     */
    function updateGacha(
        uint256 _gachaId,
        uint256 _price,
        uint256 _pricePiece,
        uint8[6] memory _rankRatios
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_gachaId <= _gachaIdCount.current(), 'Billiard: gachaId not exist');
        GachaBox storage gachaBox = _idToGacha[_gachaId];
        gachaBox.price = _price;
        gachaBox.pricePiece = _pricePiece;
        gachaBox.rankRatios = _rankRatios;
        emit GachaUpdated(_gachaId, _price, _pricePiece, _rankRatios);
    }

    /**
     * @notice admin updates nft's properties
     */
    function updateBilliard(
        uint256 _tokenId,
        uint256 _force,
        uint256 _aim,
        uint256 _spin,
        uint256 _time
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_exists(_tokenId), "Billiard: Billiard don't exist");
        Billiard storage billiard = _idToBilliard[_tokenId];
        billiard.force = _force;
        billiard.aim = _aim;
        billiard.spin = _spin;
        billiard.time = _time;
        emit BilliardUpdated(_tokenId, _force, _aim, _spin, _time);
    }

    /**
     * @notice player buy a gacha box
     * @param _typeBuy : 0 buy by marketPrice, 1 buy by pricePiece
     * @param _gachaId : type of gacha box
     */
    function buyGachaBox(uint256 _typeBuy, uint8 _gachaId) external {
        require(_typeBuy <= 1, 'Billiard: typeBuy must be 0 or 1');
        require(_gachaId <= _gachaIdCount.current(), 'Billiard: gachaId not exist');
        if (_typeBuy == 0) {
            IERC20(tokenBaseAddress).transferFrom(msg.sender, address(this), _idToGacha[_gachaId].price);
        } else {
            IERC20Mintable(tokenPiece).transferFrom(msg.sender, address(this), _idToGacha[_gachaId].pricePiece);
        }
        _createBilliard(msg.sender, _gachaId, 0);
    }

    /**
     * @dev Mints new NFTs (multi-item).
     * @param _quantity the uri list of new tokens.
     * @param _typeBuy : 0 buy by marketPrice, 1 buy by pricePiece
     * @param _gachaId : type of gacha box
     */
    function buyMultiGachaBox(
        uint8 _quantity,
        uint256 _typeBuy,
        uint8 _gachaId
    ) external {
        require(_typeBuy <= 1, 'Billiard: typeBuy must be 1 or 0');
        require(_gachaId <= _gachaIdCount.current(), 'Billiard: gachaId not exist');
        if (_typeBuy == 0) {
            IERC20(tokenBaseAddress).transferFrom(msg.sender, address(this), _idToGacha[_gachaId].price * _quantity);
        } else {
            IERC20(tokenPiece).transferFrom(msg.sender, address(this), _idToGacha[_gachaId].pricePiece * _quantity);
        }
        // mint one by one
        for (uint256 i = 0; i < _quantity; i++) {
            _createBilliard(msg.sender, _gachaId, i);
        }
    }

    function _createBilliard(
        address _owner,
        uint8 _gachaType,
        uint256 _nonce
    ) internal {
        _tokenIdCount.increment();
        uint256 id = _tokenIdCount.current();
        _mint(_owner, id);
        Billiard memory billiard = _generateRandomBilliard(_idToGacha[_gachaType].rankRatios, _nonce);
        _idToBilliard[id] = billiard;
        emit GachaOpened(id, _owner, billiard.rank, billiard.force, billiard.aim, billiard.spin, billiard.time);
    }
    function _generateRandomBilliard(uint8[6] memory _ratio, uint256 _nonce) private view returns (Billiard memory) {
        uint8 rank = _randFromRatio(ranks, _ratio, _nonce);
        return Billiard(rank, 1, 1, 1, 1);
    }

    /**
     * get number of billiard stored in smart contract
     */
    function _getBilliardLength() internal view returns (uint256) {
        return _tokenIdCount.current();
    }

    function _randInRangeWithNonce(
        uint256 _min,
        uint256 _max,
        uint256 _nonce
    ) internal view returns (uint256) {
        uint256 num = uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty, _nonce, _msgSender()))) % (_max + 1 - _min);
        return num + _min;
    }

    /**
     * @dev pick a num in array with definitional ratio nums and ratios must have same length
     * @param _nums: numbers included picked number
     * @param _ratios: ratio of number.
     * @param _nonce: any number
     */
    function _randFromRatio(
        uint8[] memory _nums,
        uint8[6] memory _ratios,
        uint256 _nonce
    ) internal view returns (uint8) {
        uint256 rand = _randInRangeWithNonce(1, 1000, _nonce);
        uint8 flag = 0;
        for (uint8 i = 0; i < _nums.length; i++) {
            if (rand <= _ratios[i] + flag && rand >= flag) {
                return _nums[i];
            }
            flag = flag + _ratios[i];
        }
        return 0;
    }

    /**
     * @notice nft's owner burns their token
     * @dev owner get amount of pieces based on burn rate
     * @param _tokenId: tokenId
     */
    function burn(uint256 _tokenId) external {
        require(_exists(_tokenId), "Billiard: tokenId don't exist");
        require(ownerOf(_tokenId) == msg.sender, 'Billiard: You are not the owner');
        _burn(_tokenId);
        uint8 tokenRank = _idToBilliard[_tokenId].rank;
        delete _idToBilliard[_tokenId];
        IERC20Mintable(tokenPiece).mint(msg.sender, burnRate[tokenRank]);
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
}
