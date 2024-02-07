//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./IAttestationAggregator.sol";

import "./kid/IKidRegistry.sol";
import "./struct/AttestationLib.sol";
import "./verifier/ZkAttestationVerifier.sol";
import "./consumer/IAttestationConsumer.sol";

import "hardhat/console.sol";

contract SocialAttestation is IAttestationAggregator {
    event NewAttestationEvent(address indexed consumer, AttestationEvent e);

    error InvalidAttestationSignature();
    error AttestationPayloadsLengthMismatch();

    ZkAttestationVerifier immutable verifier;
    IKidRegistry immutable registry;

    constructor(address _registry) {
        registry = IKidRegistry(_registry);
        verifier = new ZkAttestationVerifier();
    }

    function aggregate(
        bytes calldata input, // pis
        AttestationPayload[] calldata payloads,
        bytes calldata signature // verifierDigest+proof
    ) external override {
        if (!verifier.verify(input, signature)) {
            revert InvalidAttestationSignature();
        }
        uint256 total = input.length / 104;
        if (payloads.length != total) {
            revert AttestationPayloadsLengthMismatch();
        }
        for (uint i = 0; i < total; i++) {
            (uint256 from, uint64 iat) = AttestationLib.validateAndDecodeOneAttestation(
                input[104 * i:104 * (i + 1)],
                payloads[i],
                registry
            );
            uint256 totalConsumers = payloads[i].consumers.length;
            for (uint j = 0; j < totalConsumers; j++) {
                AttestationEvent memory e = AttestationEvent({
                    from: from,
                    data: payloads[i].data[j],
                    iat: iat
                });
                address consumer = payloads[i].consumers[j];
                emit NewAttestationEvent(consumer, e);
                IAttestationConsumer(consumer).onNewAttestation(e);
            }
        }
    }
}
