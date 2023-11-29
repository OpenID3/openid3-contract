//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IPlonkVerifier.sol";
import "../interfaces/OpenIdZkProofPublicInput.sol";
import "../lib/RsaVerifier.sol";
import "./AccountAdminBase.sol";

import "hardhat/console.sol";

contract GoogleZkAdmin is AccountAdminBase {
    using Strings for uint256;

    event AccountLinked(address indexed account, bytes32 indexed idHash);

    error InvalidRsaKey(string key, bytes32 keyId);

    bytes16 private constant _SYMBOLS = "0123456789abcdef";

    // Google RSA PubKey: https://www.googleapis.com/oauth2/v3/certs
    bytes constant public RSA_E = hex"010001";

    // sha256("5b3706960e3e60024a2655e78cfa63f87c97d309")
    bytes32 constant public RSA_KEY_ID1 = hex"e2de8d1d8b4e64dfcba1ec07baca750c9b1eeac480a050316055f37fae14bf7a";
    bytes constant public RSA_N1 = hex"e15085941a1f8c254cbc0a4d43ded8fb8ef7bc6a2ffbe89d3661908a8520d0f5c9bf4a116800a55d620dc0d68cb8b21e80286458d3696efb2b749a5aa52347adafdc740a12ae177fb4b3560ed0469bab6c55933cbdc8a0827247b89c0cb46c195225231de61679b689ad999687559e99896e420cb1803018fd17fb39d22d840970b00cef98e6ee072a32914fbbe0cc8c2556a5ed0cc04da121d237bb06aa0311a7c6ef9d14accc334a70028e566f9e6ac21d1e0ab1e4f84efe056b4ac273fc2944ff94ba996b8bf11b312af5e4e5e81930ee6fa50cf3fd0b22334bd3246a8792697ac6ceb715bf394d5b31e494389780673000e3ebeafe5fa3ac395e947c59c7";
    // sha256("0e72da1df501ca6f756bf103fd7c720294772506")
    bytes32 constant public RSA_KEY_ID2 = hex"fd5e13b316764e193579ba553e91c5ec11c5557777bf8a9403dfdef308bf8519";
    bytes constant public RSA_N2 = hex"bd980f7fd9ebb8c618ef5ab9a604e10f09a4e99dc30fb73037e679dbffdbe311de63de7039e2a98d2962688f0ad4fa5e05b9b83729079ba5267c1fe90b0e4fda8c291d9f09105d8509e0c529c3ad64ece895856029963c4ae9eac5caf74a6d27ef78db19c3e0aaee4fa639ce4785a46429e9983119df828d41ab7f31860d519644d9195ba69a4d1e22dab5d88b5bead68bd6029a9b04e0421d77e5ca23266941944a68097ec3bd816e84c3fcaa2ad8290039939a6fbdd0fc6e45553d0daf1116a8fe9aaed55f8390dcfd554f9efb6c0bdc8c7bc94d814ddcddafa613ebf313da31023af4b3c124d0887fb2ff826d62fcc47888ecc3b28083c6fda42abcc84f69";

    // sha256("")
    bytes32 constant public OUTPUT_SHA256_MASKED = hex"03b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    bytes32 constant public MASK = hex"1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    uint256 constant public JWT_TTL = 1800; // 30 mins

    struct GoogleZkValidationData {
        OpenIdZkProofPublicInput input;
        bytes32 circuitDigest;
        bytes proof;
    }

    IPlonkVerifier immutable public plonkVerifier;
    mapping(address => bytes32) private _accounts;

    constructor(address _plonkVerifier) {
        plonkVerifier = IPlonkVerifier(_plonkVerifier);
    }

    function linkAccount(bytes32 idHash) external onlyAdminMode {
        _accounts[msg.sender] = idHash;
        emit AccountLinked(msg.sender, idHash);
    }

    function getLinkedAccountHash(
        address account
    ) public view returns(bytes32) {
        return _accounts[account];
    }

    function validateSignature(
        bytes32 challenge,
        bytes calldata validationData
    ) public view override returns(uint256) {
        (GoogleZkValidationData memory data) = abi.decode(validationData, (GoogleZkValidationData));

        // 1. verify JWT signature
        if (data.input.kidHash == RSA_KEY_ID1) {
            if (!RsaVerifier.pkcs1Sha256(
                data.input.jwtHeaderAndPayloadHash,
                data.input.jwtSignature,
                RSA_E,
                RSA_N1
            )) {
                return 1;
            }
        } else if (data.input.kidHash == RSA_KEY_ID2) {
            if (!RsaVerifier.pkcs1Sha256(
                data.input.jwtHeaderAndPayloadHash,
                data.input.jwtSignature,
                RSA_E,
                RSA_N2
            )) {
                return 1;
            }
        } else {
            revert InvalidRsaKey("keyId", data.input.kidHash);
        }

        // 2. construct public inputs of proof
        bytes32 accountHash = getLinkedAccountHash(msg.sender);
        bytes32 inputHash = sha256(abi.encodePacked(
            data.input.jwtHeaderAndPayloadHash,
            data.input.kidHash, // kid
            sha256(bytes(toHexString(uint256(challenge)))), // nonce
            sha256(bytes(data.input.iat)), // iat
            accountHash // iss+aud+sub
        ));
        bytes32 inputHashMasked = inputHash & MASK;

        // 3. verify ZK proof
        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = uint256(data.circuitDigest);
        publicInputs[1] = uint256(inputHashMasked);
        publicInputs[2] = uint256(OUTPUT_SHA256_MASKED);
        if (plonkVerifier.verify(data.proof, publicInputs)) {
            uint256 validUntil = _stringToUint(data.input.iat) + JWT_TTL;
            return validUntil << 160;
        } else {
            return 1;
        }
    }

    function _stringToUint(string memory s) internal pure returns (uint256 result) {
        bytes memory b = bytes(s);
        uint256 i;
        result = 0;
        for (i = 0; i < b.length; i++) {
            uint256 c = uint256(uint8(b[i]));
            if (c >= 48 && c <= 57) {
                result = result * 10 + (c - 48);
            }
        }
    }

    /**
     * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
     */
    function toHexString(uint256 value) internal pure returns (string memory) {
        bytes memory buffer = new bytes(64);
        for (uint256 i = 64; i > 0; --i) {
            buffer[i - 1] = _SYMBOLS[value & 0xf];
            value >>= 4;
        }
        return string(buffer);
    }
}