//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./IAttestationConsumer.sol";

contract SocialVerification is IAttestationConsumer {
    error InvalidVerifiedAddress();
    error StaleAttestationEvent();

    event NewReferral(
        address indexed attestation,
        uint256 indexed from,
        address indexed referral
    );
    event NewVerification(
        address indexed attestation,
        uint256 indexed from,
        address indexed toVerify,
        uint64 iat
    );

    struct VerificationData {
        address toVerify;
        uint64 iat;
    }

    mapping(address => mapping(uint256 => VerificationData)) _verified;
    mapping(address => mapping(address => uint256)) _totalReferred;

    function onNewAttestation(AttestationEvent calldata e) external override {
        (address referredBy, address toVerify) = abi.decode(
            e.data,
            (address, address)
        );
        if (toVerify == address(0)) {
            revert InvalidVerifiedAddress();
        }
        VerificationData memory data = getVerificationData(msg.sender, e.from);
        if (data.iat >= e.iat) {
            revert StaleAttestationEvent();
        }
        // new verified user
        if (data.toVerify == address(0)) {
            _totalReferred[msg.sender][referredBy] += 1;
            emit NewReferral(msg.sender, e.from, referredBy);
        }
        _verified[msg.sender][e.from] = VerificationData({
            toVerify: toVerify,
            iat: e.iat
        });
        emit NewVerification(msg.sender, e.from, toVerify, e.iat);
    }

    function getVerificationData(
        address attestation,
        uint256 account
    ) public view returns (VerificationData memory) {
        return _verified[attestation][account];
    }

    function getTotalReferred(
        address attestation,
        address account
    ) external view returns (uint256) {
        return _totalReferred[attestation][account];
    }
}
