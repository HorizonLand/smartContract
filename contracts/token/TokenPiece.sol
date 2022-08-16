//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/AccessControl.sol';

/**
 * Piece token contract - BEP20
 */
contract Piece is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256('MINTER_ROLE');

    constructor() ERC20('Piece', 'PIE') {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MINTER_ROLE, _msgSender());

    }

    function decimals() public view virtual override returns (uint8) {
        return 0;
    }

    function transfer(address recipient, uint256 amount)
        public
        virtual
        override
        returns (bool)
    {
        //Prohibit user to transfer to token address
        require(recipient != address(this), "Can't transfer to token address");
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function mint(address recipient, uint256 amount) public onlyRole(MINTER_ROLE) returns (bool) {
        _mint(recipient, amount);
        return true;
    }
}
