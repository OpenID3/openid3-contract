//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

struct OpenIdZkProofPublicInput {
    string exp;
    bytes32 kidHash;
    bytes32 jwtHeaderAndPayloadHash;
    bytes32 circuitDigest;
    bytes jwtSignature;
}
