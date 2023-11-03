//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "../interfaces/IAccountAdmin.sol";
import "../interfaces/IOpenId3Account.sol";

abstract contract AccountAdminBase is IERC165 {
    error OnlyAdminAllowed();

    modifier onlyAdminMode() {
        if (IOpenId3Account(msg.sender).getMode() != 0x00) {
            revert OnlyAdminAllowed();
        }
        _;
    }

    function supportsInterface(bytes4 interfaceId) public pure returns(bool) {
        return interfaceId == type(IAccountAdmin).interfaceId;
    }
}