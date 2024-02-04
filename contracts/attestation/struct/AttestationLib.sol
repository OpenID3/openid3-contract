//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./Attestation.sol";
import "../kid/IKidRegistry.sol";

library AttestationLib {
    error AttestationPayloadHashMismatch();
    error AttestationPayloadsLengthMismatch();
    error InvalidAccountProvider();

    // input is with 108 bytes:
    //   bytes32: kidHash
    //   bytes32: accountIdHash
    //   bytes32: nonce
    //   bytes8(uint64): iat
    function validateAndDecodeOneAttestation(
        bytes calldata input,
        AttestationPayload calldata payload,
        IKidRegistry registry
    ) internal view returns (uint256, uint64) {
        bytes32 kid = bytes32(input[0:32]);
        uint32 provider = registry.getProvider(kid);
        if (provider == 0) {
            revert InvalidAccountProvider();
        }
        if (payload.data.length != payload.consumers.length) {
            revert AttestationPayloadsLengthMismatch();
        }
        // take last 20 bytes of accountIdHash as address for provider
        address account = address(bytes20(input[44:64]));
        uint256 from = encodeSocialAccountId(provider, account);
        bytes32 nonce = bytes32(input[64:96]);
        if (keccak256(abi.encode(payload)) != nonce) {
            revert AttestationPayloadHashMismatch();
        }
        uint64 iat = uint64(bytes8(input[96:104]));
        return (from, iat);
    }

    function encodeSocialAccountId(
        uint32 provider,
        address from
    ) internal pure returns (uint256) {
        return uint256(provider) << (160 + uint160(from));
    }

    function decodeSocialAccountId(
        uint256 id
    ) internal pure returns (uint32, address) {
        return (uint32(id >> 160), address(uint160(id)));
    }
}
