//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./struct/Attestation.sol";

interface IAttestationConsumer {
    function onNewAttestation(AttestationEvent memory a) external;
}
