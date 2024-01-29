//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "../../interfaces/IPlonkVerifier.sol";
import "./IAttestationVerifier.sol";

contract ZkAttestationVerifier is IAttestationVerifier {
    bytes32 public constant MASK =
        hex"1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
    IPlonkVerifier public immutable plonkVerifier;

    constructor(address _plonkVerifier) {
        plonkVerifier = IPlonkVerifier(_plonkVerifier);
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
        bytes32 inputHashMasked = sha256(hashes) & MASK;
        bytes32 circuitDigest = bytes32(signature[0:32]);
        uint256[] memory publicInputs = new uint256[](2);
        publicInputs[0] = uint256(circuitDigest);
        publicInputs[1] = uint256(inputHashMasked);
        return plonkVerifier.verify(signature[32:], publicInputs);
    }
}
