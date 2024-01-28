//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./struct/Attestation.sol";

interface IAttestationAggregator {
    function aggregate(
        bytes calldata input,
        AttestationPayload[] calldata payloads,
        bytes calldata signature
    ) external;
}
