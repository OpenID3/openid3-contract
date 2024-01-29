//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "../interfaces/IAccountMetadata.sol";
import "./AccountAdminBase.sol";

contract AccountMetadata is IAccountMetadata, AccountAdminBase {
    function setMetadata(
        string calldata metadata
    ) external override onlyAdminMode {
        emit NewMetadata(msg.sender, metadata);
    }
}
