//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./IAttestationConsumer.sol";

abstract contract AttestationConsumer is IAttestationConsumer {
    error NotAllowedAttestationSource();

    address immutable allowed;

    modifier onlyAllowed() {
        if (msg.sender != allowed) {
            revert NotAllowedAttestationSource();
        }
        _;
    }

    constructor(address _allowed) {
        allowed = _allowed;
    }

    function onNewAttestation(
        AttestationEvent calldata e
    ) external override onlyAllowed {
        _onNewAttestation(e);
    }

    function _onNewAttestation(AttestationEvent calldata e) internal virtual;
}