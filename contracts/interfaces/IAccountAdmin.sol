//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IAccountAdmin {
    function validate(
        bytes32 userOpHash,
        bytes calldata data
    ) external view returns(bool);
}