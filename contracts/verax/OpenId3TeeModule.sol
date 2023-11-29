//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "linea-attestation-registry-contracts/src/abstracts/AbstractModule.sol";

contract OpenId3TeeModule is AbstractModule {
    error InvalidSchemaId();
    error AttestationExpired();
    error UnsupportedProvider();
    error InvalidSignature();

    // keccak256("string provider, string account");
    bytes32 constant public SCHEMA_ID =
        hex"44a18728bda7ce4b5891c75a6e6d316f8d9020453bdf55754e63c1d3a85acee9";

    // keccak256("google");
    bytes32 constant public GOOGLE_PROVIDER =
        hex"8f2f90d8304f6eb382d037c47a041d8c8b4d18bdd8b082fa32828e016a584ca7";

    address public signer = 0xf3b4e49Fd77A959B704f6a045eeA92bd55b3b571;

    function run(
        AttestationPayload memory attestationPayload,
        bytes memory validationPayload,
        address /* txSender */,
        uint256 /* value */
    ) public virtual override {
        if (attestationPayload.schemaId != SCHEMA_ID) {
            revert InvalidSchemaId();
        }
        (string memory provider, string memory account) = abi.decode(
            attestationPayload.attestationData,
            (string, string)
        );
        if (keccak256(abi.encodePacked(provider)) != GOOGLE_PROVIDER) {
            revert UnsupportedProvider();
        }
        bytes32 accAndTypeHash = keccak256(
            abi.encodePacked(provider, ":", account)
        );
        bytes32 payload = keccak256(attestationPayload.subject);
        bytes32 message = keccak256(abi.encode(accAndTypeHash, payload));
        if (!SignatureChecker.isValidSignatureNow(
              signer,
              message,
              validationPayload)) {
          revert InvalidSignature();
        }
    }
}
