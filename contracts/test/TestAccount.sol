//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../interfaces/IOpenId3Account.sol";

contract TestAccount is IOpenId3Account, Ownable {
    uint8 private _mode;

    constructor() {
        _transferOwnership(msg.sender);
    }

    function setMode(uint8 mode) external {
        _mode = mode;
    }

    function getMode() external view override returns(uint8) {
        return _mode;
    }

    function getAdmin() external view returns(address) {
        return owner();
    }

    function getOperator() external view returns(address) {
        return owner();
    }

    function getMetadata() external pure returns(bytes32) {
        return bytes32(0);
    }

    function initialize(
        bytes calldata /** adminData **/,
        address /* owner */,
        bytes32 /* metadata */
    ) external pure {
        return;
    }

    function execute(address dest, uint256 value, bytes calldata func)
        external
    {
        (bool success, bytes memory result) = dest.call{value : value}(func);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }
}