//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Strings.sol";
import "../interfaces/IPlonkVerifier.sol";
import "../interfaces/IMerkleProof.sol";
import "../interfaces/OpenIdZkProofPublicInput.sol";
import "../interfaces/IRsaCert.sol";
import "../lib/RsaVerifier.sol";
import "./RsaCertRegistration.sol";
import "./AccountAdminBase.sol";

contract ZkAdmin is AccountAdminBase, RsaCertRegistration {
    event AccountLinked(address indexed account, bytes32 indexed idHash);

    error InvalidRsaKey(string key, bytes32 keyId);

    bytes16 private constant _SYMBOLS = "0123456789abcdef";
    bytes32 constant GOOGLE_PROVIDER = keccak256("google");

    bytes32 public constant MASK =
        hex"1fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";

    uint256 public constant JWT_TTL = 1800; // 30 mins

    struct GoogleZkValidationData {
        OpenIdZkProofPublicInput input;
        bytes32 circuitDigest;
        bytes proof;
    }

    IPlonkVerifier public immutable plonkVerifier;
    IMerkleProof public immutable merkleProofVerifier;

    mapping(address => bytes32) private _accounts;
    mapping(uint256 => bytes32) private _proofCache;

    constructor(address _plonkVerifier, address _merkleProofVerifier) {
        plonkVerifier = IPlonkVerifier(_plonkVerifier);
        merkleProofVerifier = IMerkleProof(_merkleProofVerifier);
    }

    function linkAccount(bytes32 idHash) external onlyAdminMode {
        _accounts[msg.sender] = idHash;
        emit AccountLinked(msg.sender, idHash);
    }

    function getLinkedAccountHash(
        address account
    ) public view returns (bytes32) {
        return _accounts[account];
    }

    function cacheProof(
        uint256 batchId,
        bytes32 maskedMerkleRoot,
        bytes32 circuitDigest,
        bytes calldata proof
    ) external {
        uint256[] memory publicInputs = new uint256[](2);
        publicInputs[0] = uint256(circuitDigest);
        publicInputs[1] = uint256(maskedMerkleRoot);
        if (!plonkVerifier.verify(proof, publicInputs)) {
            revert("Invalid proof");
        }

        _proofCache[batchId] = maskedMerkleRoot;
    }

    function validateSignatureViaCache(
        bytes32 challenge,
        bytes calldata validationData
    ) external view returns (uint256) {
        // validationData 
        // idHash: Bytes32 + rsa_pub_key_hash: Bytes32 + nonce(challenge): Byte32 + iat: u32 >> leafHash
        // batchId: aggregation batch id
        // leafIndex: index of the proof inside the batch
        // merkleProof: bytes32[]

        // assert! rsa_pub_key_hash is allowed
        // assert! nonce matches 
        // assert! merkleProofVerify( root: _proofCache[batchId],  proof: merkleProof, leaf: leafHash, leafIndex: leafIndex)

        // return (iat + JWT_TTL) << 160
        // else return false!


        uint256 iat = abi.decode(validationData, (uint256));
        bytes32 cachedProof = keccak256(abi.encodePacked(challenge, iat));
        if (_proofCache[msg.sender] == cachedProof) {
            return (iat + JWT_TTL) << 160;
        } else {
            return 1;
        }
    }

    function validateSignature(
        bytes32 challenge,
        bytes calldata validationData
    ) external view override returns (uint256) {
        GoogleZkValidationData memory data = abi.decode(
            validationData,
            (GoogleZkValidationData)
        );
        if (!_validateJwtSignature(data.input)) {
            return 1;
        }
        bytes32 inputHashMasked = _genInputHash(challenge, data.input);
        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = uint256(data.circuitDigest);
        publicInputs[1] = uint256(inputHashMasked);
        if (plonkVerifier.verify(data.proof, publicInputs)) {
            uint256 validUntil = _stringToUint(data.input.iat) + JWT_TTL;
            return validUntil << 160;
        } else {
            return 1;
        }
    }

    function _stringToUint(
        string memory s
    ) internal pure returns (uint256 result) {
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

    function _validateJwtSignature(
        OpenIdZkProofPublicInput memory input
    ) internal view returns (bool) {
        address cert = getCert(input.kidHash);
        IRsaCert rsaCert = IRsaCert(cert);
        if (cert == address(0) || rsaCert.getIssuer() != GOOGLE_PROVIDER) {
            return false;
        }
        return RsaVerifier.pkcs1Sha256(
                input.jwtHeaderAndPayloadHash,
                input.jwtSignature,
                rsaCert.E(),
                rsaCert.N()
        );
    }

    function _buildInputBytes(
        bytes32 challenge,
        OpenIdZkProofPublicInput memory input
    ) internal returns (bytes memory) {
        
    }

    function _genInputHash(
        bytes32 challenge,
        OpenIdZkProofPublicInput memory input
    ) internal view returns (bytes32) {
        bytes32 accountHash = getLinkedAccountHash(msg.sender);
        bytes32 inputHash = sha256(
            abi.encodePacked(
                input.jwtHeaderAndPayloadHash,
                input.kidHash, // kid
                accountHash, // iss+aud+sub
                sha256(bytes(toHexString(uint256(challenge)))), // nonce
                sha256(bytes(input.iat)) // iat
            )
        );
        return inputHash & MASK;
    }
}
