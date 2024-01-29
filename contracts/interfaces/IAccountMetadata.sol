//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IAccountMetadata {
    event NewMetadata(address indexed account, string metadata);

    function setMetadata(string calldata metadata) external;
}
