//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "../../lib/PlonkVerifier.sol";
import "./IAttestationVerifier.sol";

contract ZkAttestationVerifier is IAttestationVerifier {
    bytes32 public constant MASK =
        hex"1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    PlonkVerifier public immutable plonkVerifier;

    constructor() {
        plonkVerifier = new PlonkVerifier();
    }

    function verify(
        bytes calldata inputs,
        bytes calldata signature
    ) override external view returns (bool) {
        bytes memory hashes = "";
        uint256 total = inputs.length / 104;
        for (uint i = 0; i < total; i++) {
            hashes = bytes.concat(hashes, sha256(inputs[i * 104: i * 104 + 104]));
        }
        bytes32 inputHash = total == 1 ? bytes32(hashes) : sha256(hashes);
        uint256[] memory publicInputs = new uint256[](2);
        publicInputs[0] = uint256(bytes32(signature[0:32]));
        publicInputs[1] = uint256(inputHash & MASK);
        return plonkVerifier.Verify(signature[32:], publicInputs);
    }
}
