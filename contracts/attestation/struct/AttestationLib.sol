//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./Attestation.sol";
import "../kid/IKidRegistry.sol";

library AttestationLib {
    error AttestationPayloadHashMismatch();
    error AttestationPayloadDataLengthMismatch();
    error InvalidAccountProvider();

    function decodePayload(
        bytes calldata payload
    ) internal pure returns(AttestationPayload memory) {
        AttestationPayload memory result = abi.decode(payload, (AttestationPayload));
        if (result.consumers.length != result.data.length) {
            revert AttestationPayloadDataLengthMismatch();
        }
        return result;
    }

    function reverse(uint64 input) internal pure returns (uint64 v) {
        v = input;
        v = ((v & 0xFF00FF00FF00FF00) >> 8) |
            ((v & 0x00FF00FF00FF00FF) << 8);
        v = ((v & 0xFFFF0000FFFF0000) >> 16) |
            ((v & 0x0000FFFF0000FFFF) << 16);
        v = (v >> 32) | (v << 32);
    }

    // input is with 108 bytes:
    //   bytes32: kidHash
    //   bytes32: accountIdHash
    //   bytes32: nonce
    //   bytes8(uint64): iat
    function validateAndDecodeOneAttestation(
        bytes calldata input,
        bytes calldata payload,
        IKidRegistry registry
    ) internal view returns (uint256, uint64) {
        bytes32 kid = bytes32(input[0:32]);
        uint32 provider = registry.getProvider(kid);
        if (provider == 0) {
            revert InvalidAccountProvider();
        }
        // take last 20 bytes of accountIdHash as address for provider
        address account = address(bytes20(input[44:64]));
        uint256 from = encodeSocialAccountId(provider, account);
        bytes32 nonce = bytes32(input[64:96]);
        if (keccak256(payload) != nonce) {
            revert AttestationPayloadHashMismatch();
        }
        uint64 iat = reverse(uint64(bytes8(input[96:104])));
        return (from, iat);
    }

    function encodeSocialAccountId(
        uint32 provider,
        address from
    ) internal pure returns (uint256) {
        return (uint256(provider) << 160) + uint160(from);
    }

    function decodeSocialAccountId(
        uint256 id
    ) internal pure returns (uint32, address) {
        return (uint32(id >> 160), address(uint160(id)));
    }
}
