//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./AttestationConsumer.sol";

contract SocialVerification is AttestationConsumer {
    error InvalidVerifiedAddress();

    event NewReferral(uint256 indexed from, address indexed referral);
    event NewVerification(uint256 indexed from, address indexed subject, uint64 iat);

    struct VerificationData {
        address linked;
        uint64 iat;
    }

    mapping(uint256 => VerificationData) _verified;
    mapping(address => uint256) _totalReferred;

    constructor(address allowed) AttestationConsumer(allowed) { }

    function _onNewAttestation(AttestationEvent calldata e) internal override {
        (
            address referral,
            address linked,
            uint64 iat
        ) = abi.decode(e.data, (address, address, uint64));
        if (linked == address(0)) {
            revert InvalidVerifiedAddress();
        }
        // new verified user
        if (_verified[e.from].linked == address(0)) {
            _totalReferred[referral] += 1;
            emit NewReferral(e.from, referral);
        }
        _verified[e.from] = VerificationData({linked: linked, iat: iat});
        emit NewVerification(e.from, linked, e.iat);
    }

    function getVerifiedAddress(
        uint256 account
    ) external view returns (VerificationData memory) {
        return _verified[account];
    }

    function getTotalReferred(
        address account
    ) external view returns (uint256) {
        return _totalReferred[account];
    }
}
