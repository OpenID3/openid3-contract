//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

struct OpenIdZkProofPublicInput {
    uint256 exp;
    bytes32 kidHash;
    bytes32 jwtHeaderAndPayloadHash;
    bytes jwtSignature;
}
