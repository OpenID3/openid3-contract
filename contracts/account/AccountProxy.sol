//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import {ERC1967Utils} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Utils.sol";
import "@openzeppelin/contracts/proxy/Proxy.sol";
import "../interfaces/IAccountProxy.sol";

/**
 * ignore the receive function warning since it
 * should be defined in implementation
 */
contract AccountProxy is IAccountProxy, Proxy {
    error AlreadyInitiated();

    /** We name is initProxy to specify it's for proxy not the implementation */
    function initProxy(address logic, bytes calldata data) external override {
        if (_implementation() != address(0)) {
            revert AlreadyInitiated();
        }
        ERC1967Utils.upgradeToAndCall(logic, data);
    }

    function _implementation() internal view override returns (address) {
        return ERC1967Utils.getImplementation();
    }
}
