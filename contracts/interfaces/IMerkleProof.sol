//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IMerkleProof {
    error MerkleProofInvalidMultiproof();

    function verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf, uint leafIndex) external pure returns (bool);
}