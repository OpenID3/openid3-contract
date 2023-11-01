//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "../lib/Secp256r1Verifier.sol";
import "./AccountAdminBase.sol";

contract PasskeyAdmin is IERC1271, AccountAdminBase {
    event PasskeySet(
        address indexed account,
        bytes32 indexed keyId,
        string credentialId,
        Passkey pubKey
    );

    struct PasskeyValidationData {
        // signed data
        bytes authData;
        string clientDataJsonPre;
        string clientDataJsonPost;
        // public key
        Passkey pubKey;
        // signature
        uint256 r;
        uint256 s;
    }

    mapping(address => bytes32) private _passkeys;

    function setPasskey(
        string calldata credentialId,
        Passkey calldata pubKey
    ) external onlyAdminMode {
        bytes32 keyId = _genKeyId(pubKey);
        _passkeys[msg.sender] = keyId;
        emit PasskeySet(msg.sender, keyId, credentialId, pubKey);
    }

    function getPasskeyId(address account) external view returns(bytes32) {
        return _passkeys[account];
    }

    function isValidSignature(
        bytes32 challenge,
        bytes calldata validationData
    ) public view override returns(bytes4) {
        PasskeyValidationData memory data
            = abi.decode(validationData, (PasskeyValidationData));
        if (_genKeyId(data.pubKey) != _passkeys[msg.sender]) {
            return bytes4(0);
        }
        string memory opHashBase64 = Base64.encode(bytes.concat(challenge));
        string memory clientDataJSON = string.concat(
            data.clientDataJsonPre,
            opHashBase64,
            data.clientDataJsonPost
        );
        bytes32 clientHash = sha256(bytes(clientDataJSON));
        bytes32 message = sha256(bytes.concat(data.authData, clientHash));
        if (Secp256r1Verifier.verify(data.pubKey, data.r, data.s, uint256(message))) {
            return 0x1626ba7e; // magic value for ERC1271
        } else {
            return bytes4(0);
        }
    }

    function _genKeyId(Passkey memory key) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(key.pubKeyX, key.pubKeyY));
    }
}