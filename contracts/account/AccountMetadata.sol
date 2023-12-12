//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "../interfaces/IAccountMetadata.sol";

contract AccountMetadata is IAccountMetadata {
    event NewMetadata(address indexed account, bytes metadata);

    function setMetadata(bytes calldata metadata) external {
        emit NewMetadata(msg.sender, metadata);
    }
}