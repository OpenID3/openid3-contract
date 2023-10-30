//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "./PasskeyVerificationLib.sol";

contract PasskeyAdmin is IERC1271 {
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
        _passkeys[msg.sender].keyId = keyId;
        emit PasskeySet(msg.sender, keyId, credentialId, pubKey);
    }

    function isValidSignature(
        bytes32 challenge,
        bytes calldata validationData
    ) public view override returns(bytes4) {
        PasskeyValidationData memory data
            = abi.decode(validationData, (PasskeyValidationData));
        bytes32 keyId = keccak256(abi.encode(data.credentialId, data.pubKey));
        if (keyId != _passkeys[msg.sender].keyId) {
            return bytes4(0);
        }
        string memory opHashBase64 = Base64.encode(bytes.concat(challenge));
        string memory clientDataJSON = string.concat(
            data.clientDataJsonPre,
            opHashBase64,
            data.clientDataJsonPost
        );
        bytes32 clientHash = sha256(bytes(clientDataJSON));
        bytes32 message = sha256(bytes.concat(data.authenticatorData, clientHash));
        if (Secp256r1.verify(data.pubKey, data.r, data.s, uint256(message))) {
            return 0x1626ba7e; // magic value for ERC1271
        } else {
            return bytes4(0);
        }
    }
}