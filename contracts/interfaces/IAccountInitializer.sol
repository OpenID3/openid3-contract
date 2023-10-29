//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IAccountInitializer {
    function initialize(
        bytes calldata adminData,
        address owner
    ) external;
}