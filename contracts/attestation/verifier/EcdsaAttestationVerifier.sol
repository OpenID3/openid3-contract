//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";

import "./IAttestationVerifier.sol";

contract EcdsaAttestationVerifier is IAttestationVerifier {
    using ECDSA for bytes32;

    address immutable signer;

    constructor(address _signer) {
        signer = _signer;
    }

    function verify(
        bytes calldata inputs,
        bytes calldata signature
    ) override external view returns (bool) {
        bytes32 inputHash = keccak256(inputs);
        return SignatureChecker.isValidSignatureNow(
            signer,
            inputHash.toEthSignedMessageHash(),
            signature
        );
    }
}
