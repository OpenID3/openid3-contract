//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IOpenId3Account {
    function getMode() external view returns(uint8);

    function getAdmin() external view returns(address);

    function getOperator() external view returns(bytes32);

    function initialize(
        bytes calldata adminData,
        bytes calldata operator,
        string calldata metadata
    ) external;    
}