//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IAccountMetadata {
    event NewMetadata(bytes metadata);

    function setMetadata(
        bytes calldata metadata
    ) external;
}