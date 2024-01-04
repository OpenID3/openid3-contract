// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts (last updated v5.0.0) (utils/cryptography/MerkleProof.sol)

pragma solidity ^0.8.20;

// From https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/MerkleProof.sol
// but with sha256 as the hash function instead of keccak256
contract MerkleProof {
    error MerkleProofInvalidMultiproof();
    bytes32 public constant MASK = hex"1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    /**
     * @dev Returns true if a `leaf` can be proved to be a part of a Merkle tree
     * defined by `root`. For this, a `proof` must be provided, containing
     * sibling hashes on the branch from the leaf to the root of the tree. Each
     * pair of leaves and each pair of pre-images are assumed to be sorted.
     */
    function verify(bytes32[] calldata proof, bytes32 root, bytes32 leaf, uint leafIndex) public pure returns (bool) {
        return processProof(proof, leaf, leafIndex) & MASK == root;
    }

    /**
     * @dev Returns the rebuilt hash obtained by traversing a Merkle tree up
     * from `leaf` using `proof`. A `proof` is valid if and only if the rebuilt
     * hash matches the root of the tree. When processing the proof, the pairs
     * of leafs & pre-images are assumed to be sorted.
     */
    function processProof(bytes32[] calldata proof, bytes32 leaf, uint leafIndex) internal pure returns (bytes32) {
        bytes32 computedHash = leaf;
        uint updatedIndex = leafIndex;
        for (uint256 i = 0; i < proof.length; i++) {
            if (updatedIndex % 2 == 1) {
                computedHash = _sha256(proof[i], computedHash);
            } else {
                computedHash = _sha256(computedHash, proof[i]);
            }
            updatedIndex /= 2;
        }
        return computedHash;
    }

    function _sha256(bytes32 a, bytes32 b) private pure returns (bytes32 value) {
        bytes memory result = new bytes(64);
        assembly {
            mstore(add(result, 32), a)
            mstore(add(result, 64), b)
        }
        value = sha256(result);
    }
}