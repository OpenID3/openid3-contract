//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./IAttestationConsumer.sol";

contract SocialVerification is IAttestationConsumer {
    error InvalidVerifiedAddress();
    error StaleAttestationEvent();

    event NewReferral(
        address indexed attestation,
        address indexed referredBy,
        address indexed toVerify
    );
    event NewVerification(
        address indexed attestation,
        uint256 indexed socialAccount,
        address indexed toVerify,
        uint64 iat
    );

    struct VerificationData {
        address toVerify;
        uint64 iat;
    }

    mapping(address => mapping(uint256 => VerificationData)) _verification;
    mapping(address => mapping(address => uint256)) _totalReferred;
    mapping(address => mapping(address => bool)) _verified;

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
        // new verified address
        if (_verified[msg.sender][toVerify] == false) {
            _verified[msg.sender][toVerify] = true;
            _totalReferred[msg.sender][referredBy] += 1;
            emit NewReferral(msg.sender, referredBy, toVerify);
        }
        _verification[msg.sender][e.from] = VerificationData({
            toVerify: toVerify,
            iat: e.iat
        });
        emit NewVerification(msg.sender, e.from, toVerify, e.iat);
    }

    function getVerificationData(
        address attestation,
        uint256 account
    ) public view returns (VerificationData memory) {
        return _verification[attestation][account];
    }

    function getTotalReferred(
        address attestation,
        address account
    ) external view returns (uint256) {
        return _totalReferred[attestation][account];
    }
}
