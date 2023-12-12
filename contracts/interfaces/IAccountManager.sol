//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./IAccountValidator.sol";

interface IAccountManager is IAccountValidator {
    event Grant(address indexed account, uint256 indexed validator);
    event Revoke(address indexed account, uint256 indexed validator);
    event NewMetadata(address indexed account, bytes metadata);

    function grant(uint256 validator) external;

    function revoke(uint256 validator) external;

    function getValidators() external returns (uint256[] memory);

    function setMetadata(bytes calldata metadata) external;
}