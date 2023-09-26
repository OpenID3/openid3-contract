//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.19;

struct OpenIdZkProofPublicInput {
    bytes32 jwtHeaderAndPayloadHash;
    bytes32 userIdHash;
    uint256 expirationTimestamp;
    bytes jwtSignature;
}
