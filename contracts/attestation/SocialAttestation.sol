//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./IAttestationAggregator.sol";
import "./IAttestationConsumer.sol";

import "./kid/IKidRegistry.sol";
import "./struct/AttestationLib.sol";
import "./verifier/IAttestationVerifier.sol";

contract SocialAttestation is IAttestationAggregator {
    event NewAttestationEvent(AttestationEvent e);

    error InvalidAttestationSignature();
    error AttestationPayloadsLengthMismatch();

    IAttestationVerifier immutable verifier;
    IKidRegistry immutable registry;

    constructor(address _registry, address _verifier) {
        verifier = IAttestationVerifier(_verifier);
        registry = IKidRegistry(_registry);
    }

    function aggregate(
        bytes calldata input,
        AttestationPayload[] calldata payloads,
        bytes calldata signature
    ) external override {
        if (!verifier.verify(input, signature)) {
            revert InvalidAttestationSignature();
        }
        uint256 total = input.length / 104;
        if (payloads.length != total) {
            revert AttestationPayloadsLengthMismatch();
        }
        for (uint i = 0; i < total; i++) {
            AttestationEvent memory e = AttestationLib.decodeOneAttestation(
                input[104 * i:104 * (i + 1)],
                payloads[i],
                registry
            );
            emit NewAttestationEvent(e);
            for (uint j = 0; j < payloads[i].consumers.length; j++) {
                IAttestationConsumer(payloads[i].consumers[j]).onNewAttestation(e);
            }
        }
    }
}
