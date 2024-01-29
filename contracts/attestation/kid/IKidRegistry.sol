//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IKidRegistry {
    error StaleKid();

    function getProvider(bytes32 kid) external view returns(uint32);

    function isValidKid(bytes32 kid) external view returns(bool);
}