//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./AttestationConsumer.sol";

contract SocialVerification is AttestationConsumer {
    error InvalidVerifiedAddress();

    event NewReferral(uint256 indexed from, address indexed referral);
    event NewVerification(uint256 indexed from, address indexed toVerify, uint64 iat);

    struct VerificationData {
        address toVerify;
        uint64 iat;
    }

    mapping(uint256 => VerificationData) _verified;
    mapping(address => uint256) _totalReferred;

    constructor(address allowed) AttestationConsumer(allowed) { }

    function _onNewAttestation(AttestationEvent calldata e) internal override {
        (
            address referredBy,
            address toVerify,
            uint64 iat
        ) = abi.decode(e.data, (address, address, uint64));
        if (toVerify == address(0)) {
            revert InvalidVerifiedAddress();
        }
        // new verified user
        if (_verified[e.from].toVerify == address(0)) {
            _totalReferred[referredBy] += 1;
            emit NewReferral(e.from, referredBy);
        }
        _verified[e.from] = VerificationData({toVerify: toVerify, iat: iat});
        emit NewVerification(e.from, toVerify, e.iat);
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
