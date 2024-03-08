//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "../interfaces/IAccountMetadata.sol";

contract AccountMetadata is IAccountMetadata {
    function newMetadata(
        string calldata metadata
    ) external override {
        emit NewMetadata(msg.sender, metadata);
    }
}
