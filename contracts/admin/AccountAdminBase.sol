//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "../interfaces/IOpenId3Account.sol";

abstract contract AccountAdminBase {
    error OnlyAdminAllowed();

    modifier onlyAdminMode() {
        if (IOpenId3Account(msg.sender).getMode() != 0x00) {
            revert OnlyAdminAllowed();
        }
        _;
    }
}