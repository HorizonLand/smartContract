// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import '@openzeppelin/contracts/access/Ownable.sol';
import '@openzeppelin/contracts/token/ERC721/ERC721.sol';
import '@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol';
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/security/Pausable.sol';
import '@openzeppelin/contracts/utils/Counters.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * @dev Required interface of an reciver compliant contract.
 */
interface IReciver {
    function transferNFT(address to, uint256 tokenId) external;

    function receiverNFT(address from, uint256 tokenId) external;
}

/**
 * @title Smart contract of ERC721 (EIP721 https://eips.ethereum.org/EIPS/eip-721). Represent a plot of land with x and y as coordinates
 */
contract Land is Ownable, ERC721Enumerable, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256('ADMIN_ROLE');
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    uint256 constant clearLow = 0xffffffffffffffffffffffffffffffff00000000000000000000000000000000;
    uint256 constant clearHigh = 0x00000000000000000000000000000000ffffffffffffffffffffffffffffffff;
    uint256 constant factor = 0x100000000000000000000000000000000;

    string public baseTokenURI;
    /**
     * @notice emit when minter mint land
     */
    event LandMinted(uint256 tokenId, int256 x, int256 y);

    /**
     * @notice init value and set up role
     */
    constructor() ERC721('HorizonLand', 'HZL') {
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setRoleAdmin(MINTER_ROLE, MINTER_ROLE);
        _setupRole(ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());
    }

    /**
     * @notice minter mints an nft for an address with token Id
     * @param to nft's receiver
     * @param tokenId id of nft
     */
    function mintNFT(address to, uint256 tokenId) external onlyRole(MINTER_ROLE) {
        (int256 x, int256 y) = _decodeTokenId(tokenId);
        _mint(to, tokenId);
        emit LandMinted(tokenId, x, y);
    }

    /**
     * @notice get an unique id from two value x, y repesent coordinates of land.  
     * @dev An unique coordinates (x,y) will create an unique Id
     * @param x horizontal coordinates
     * @param y vertical coordinates
     */
    function encodeTokenId(int256 x, int256 y) external pure returns (uint256) {
        return _encodeTokenId(x, y);
    }

    function _encodeTokenId(int256 x, int256 y) internal pure returns (uint256 result) {
        require(-1000000 < x && x < 1000000 && -1000000 < y && y < 1000000, 'The coordinates should be inside bounds');
        return _unsafeEncodeTokenId(x, y);
    }

    function _unsafeEncodeTokenId(int256 x, int256 y) internal pure returns (uint256) {
        return ((uint256(x) * factor) & clearLow) | (uint256(y) & clearHigh);
    }

    /**
     * @notice get land's coordinates using token Id
     * @param value token Id
     */
    function decodeTokenId(uint256 value) external pure returns (int256, int256) {
        return _decodeTokenId(value);
    }

    function _unsafeDecodeTokenId(uint256 value) internal pure returns (int256 x, int256 y) {
        x = expandNegative128BitCast((value & clearLow) >> 128);
        y = expandNegative128BitCast(value & clearHigh);
    }

    function expandNegative128BitCast(uint256 value) internal pure returns (int256) {
        if (value & (1 << 127) != 0) {
            return int256(value | clearLow);
        }
        return int256(value);
    }

    function _decodeTokenId(uint256 value) internal pure returns (int256 x, int256 y) {
        (x, y) = _unsafeDecodeTokenId(value);
        require(-1000000 < x && x < 1000000 && -1000000 < y && y < 1000000, 'The coordinates should be inside bounds');
    }
    /**
     * @notice check if land's coordinates exists or not
     */
    function exists(int256 x, int256 y) external view returns (bool) {
        return _exists(x, y);
    }

    function _exists(int256 x, int256 y) internal view returns (bool) {
        return _exists(_encodeTokenId(x, y));
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return baseTokenURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        baseTokenURI = baseURI;
    }

    function supportsInterface(bytes4 interfaceId) public view override(AccessControl, ERC721Enumerable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
