//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "../interfaces/IAccountAdmin.sol";
import "./PasskeyVerificationLib.sol";

contract PasskeyAdminManager is IAccountAdmin {
    error AlreadyInitialized(address account);
    error Unauthorized();

    event PasskeySet(
        address indexed account,
        bytes32 indexed keyId,
        string credentialId,
        Passkey pubKey
    );

    struct PasskeyValidationData {
        // signed data
        bytes authenticatorData;
        string clientDataJsonPre;
        string clientDataJsonPost;
        // public key
        string credentialId;
        Passkey pubKey;
        // signature
        uint256 r;
        uint256 s;
    }

    struct PasskeyStorage {
        bytes32 keyId; // unique identifier for the passkey
    }

    mapping(address => PasskeyStorage) private _passkeys;

    function initialize(
        string calldata credentialId,
        Passkey calldata pubKey
    ) external {
        bytes32 keyId = keccak256(abi.encode(credentialId, pubKey));
        if (_passkeys[msg.sender].keyId != bytes32(0)) {
            revert AlreadyInitialized(msg.sender);
        }
        _setPasskey(msg.sender, keyId, credentialId, pubKey);
    }

    function validate(
        bytes32 challenge,
        bytes calldata validationData
    ) public view override returns(bool) {
        PasskeyValidationData memory data
            = abi.decode(validationData, (PasskeyValidationData));
        bytes32 keyId = keccak256(abi.encode(data.credentialId, data.pubKey));
        if (keyId != _passkeys[msg.sender].keyId) {
            return false;
        }
        string memory opHashBase64 = Base64.encode(bytes.concat(challenge));
        string memory clientDataJSON = string.concat(
            data.clientDataJsonPre,
            opHashBase64,
            data.clientDataJsonPost
        );
        bytes32 clientHash = sha256(bytes(clientDataJSON));
        bytes32 message = sha256(bytes.concat(data.authenticatorData, clientHash));
        return Secp256r1.verify(data.pubKey, data.r, data.s, uint256(message));
    }

    function resetPasskey(
        address account,
        string calldata credentialId,
        Passkey calldata pubKey,
        bytes calldata validationData
    ) external {
        bytes32 newKeyId = keccak256(abi.encode(credentialId, pubKey));
        bytes32 challenge = keccak256(abi.encode(
            block.chainid, address(this), account, newKeyId, credentialId
        ));
        if (!validate(challenge, validationData)) {
           revert Unauthorized();
        }
        _setPasskey(account, newKeyId, credentialId, pubKey);
    }

    function _setPasskey(
        address account,
        bytes32 keyId,
        string calldata credentialId,
        Passkey calldata pubKey
    ) internal {
        _passkeys[account].keyId = keyId;
        emit PasskeySet(account, keyId, credentialId, pubKey);
    }
}