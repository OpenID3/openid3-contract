//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "../interfaces/IAccountEventIndexer.sol";
import "./AccountAdminBase.sol";

contract AccountEventIndexer is IAccountEventIndexer, AccountAdminBase {
    function newMetadata(
        string calldata metadata
    ) external override onlyAdminMode {
        emit NewMetadata(msg.sender, metadata);
    }

    function newOperators(
        bytes32 operatorHash,
        bytes calldata operators
    ) external override onlyAdminMode {
        emit NewOperators(msg.sender, operatorHash, operators);
    }

    function newAdmin(
        address oldAdmin,
        address admin
    ) external override onlyAdminMode {
        emit NewAdmin(msg.sender, oldAdmin, admin);
    }
}
