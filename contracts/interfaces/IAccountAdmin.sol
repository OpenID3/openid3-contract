//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IAccountAdmin {
    function validateSignature(
        bytes32 challenge,
        bytes calldata signature
    ) external view returns(uint256 validationData);
}