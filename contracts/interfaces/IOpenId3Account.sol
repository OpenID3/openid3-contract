//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IOpenId3Account {
    function getMode() external view returns(uint8);

    function initialize(
        bytes calldata adminData,
        address owner
    ) external;
}