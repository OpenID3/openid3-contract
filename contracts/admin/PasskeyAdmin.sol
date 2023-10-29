//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "../interfaces/IAccountAdmin.sol";
import "./PasskeyVerificationLib.sol";

contract PasskeyAdmin is IAccountAdmin {
    event PasskeySet(
        address indexed account,
        bytes32 indexed fingerprint,
        string credentialId
    );

    mapping(address => bytes32) internal passkeys;

    struct PasskeyValidationData {
        // signed data
        bytes authenticatorData;
        string clientDataJsonPre;
        string clientDataJsonPost;
        // public key
        uint256 publicKeyX;
        uint256 publicKeyY;
        // signature
        uint256 r;
        uint256 s;
    }

    function setPasskey(bytes32 fingerprint, string memory credentialId) internal {
        passkeys[msg.sender] = fingerprint;
        emit PasskeySet(msg.sender, fingerprint, credentialId);
    }

    function validate(
        bytes32 userOpHash,
        bytes calldata valdiationData
    ) external view override returns(bool) {
        PasskeyValidationData memory data
            = abi.decode(valdiationData, (PasskeyValidationData));
        bytes32 fp = keccak256(abi.encodePacked(data.publicKeyX, data.publicKeyY));
        if (fp != passkeys[msg.sender]) {
            return false;
        }
        string memory opHashBase64 = Base64.encode(bytes.concat(userOpHash));
        string memory clientDataJSON = string.concat(
            data.clientDataJsonPre,
            opHashBase64,
            data.clientDataJsonPost
        );
        bytes32 clientHash = sha256(bytes(clientDataJSON));
        bytes32 message = sha256(bytes.concat(data.authenticatorData, clientHash));
        Passkey memory passkey = Passkey(data.publicKeyX, data.publicKeyY);
        return Secp256r1.verify(passkey, data.r, data.s, uint256(message));
    }
}