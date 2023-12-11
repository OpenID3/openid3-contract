//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleVerifier {
    function verify(
        bytes32 root,
        bytes32[] memory proof,
        address addr,
        bytes32 value
    ) external pure returns(bool) {
        bytes32 leaf = sha256(bytes.concat(sha256(abi.encode(addr, value))));
        return MerkleProof.verify(proof, root, leaf);
    }
}