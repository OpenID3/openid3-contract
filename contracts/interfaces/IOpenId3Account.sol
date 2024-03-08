//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IOpenId3Account {
    function initialize(
        bytes calldata adminData
    ) external;    
}