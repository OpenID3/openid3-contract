//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IOpenId3Account.sol";

abstract contract AccountAdminBase {
    using Address for address;

    error OnlyAdminAllowed();

    modifier onlyAdminMode() {
        if (
            msg.sender.isContract() &&
            IOpenId3Account(msg.sender).getMode() != 0x00
        ) {
            revert OnlyAdminAllowed();
        }
        _;
    }
}
