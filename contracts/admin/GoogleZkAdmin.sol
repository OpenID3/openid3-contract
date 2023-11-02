//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/interfaces/IERC1271.sol";
import "../interfaces/IPlonkVerifier.sol";
import "../interfaces/OpenIdZkProofPublicInput.sol";
import "../lib/RsaVerifier.sol";
import "./AccountAdminBase.sol";

contract GoogleZkAdmin is IERC1271, AccountAdminBase {
    event AccountLinked(address indexed account, bytes32 indexed idHash);

    error InvalidRsaKey(string key, bytes32 keyId);

    // Google RSA PubKey: https://www.googleapis.com/oauth2/v3/certs
    bytes RSA_E = hex"010001";
    // sha256("a06af0b68a2119d692cac4abf415ff3788136f65")
    bytes32 RSA_KEY_ID1 = hex"caec9e4d30a403bf780f0f723bcda0de46d7cad4236e62937e082ca8e787b732";
    bytes RSA_N1 = hex"cab2293271d8ad53f095b0be218f1a53643a40a9cb7ffa751505cd8933bd99615d7985cfe1c345e90296832e236d54ab3acfb8a8b65b2b046f6617d3bae296e9fc23e6555970db2ae5d77a19747ae48f24c2898c1fe66ffe90edf732e28890a9e7f194e8a95bf33318fe3104d5f669f3c1c8936722e06ae6b4f4dbc3c2c70249f43f9e2c410aa60adcea016a7caa467e1863484f1308750318db6e645fb0f1f75aee09bdba8cf0af179b8eac74fe23aac553d7d96c8827e13f4fb61aeeb9b6d40aeb4a211f892bc07b7637fad5ff044ee2a899a1d56c273103e43bc43d03109cde44caa23eb95bf6726ccd98e6a7f56c0a1a10420fb09748c53fed51ca0b31f7";
    // sha256("f5f4bf46e52b31d9b6249f7309ad0338400680cd")
    bytes32 RSA_KEY_ID2 = hex"1c21d7977155420d8f58affbc31983f09c956b361d2e9a70df010b3a8a3e3c0f";
    bytes RSA_N2 = hex"ab985ca3047822e3e24af1dbc23f51bfd8f65d19eb81b00015806aa0b070515e4654888d3ca9d00586bc64420ada76a3f60aa9a370d4f65c7b77b473795973092e5e500d8b57de3ef8a6d3d188082670298f9fa1c8321a7af23549fd9842bfdc9ed8152efc6a7d6d67f59bdb4128adcf94e0874729959bee8963053eee3f9a1e81dd284428897eaa2fa1d1c6499517087f467091f70339313c6ea133594be50a9087f452ba328f582e3c392eba017077546ce83729ebb4b96e520848bed9705080217ac45de4962722c309efd878423f24e25f4a5a33fb13dae2aca58a1c93e2108254364c4c6826a6d865ee8222748788003af1f9129094039ee45913b5d325";

    // keccak256(bytes("https://accounts.google.com"))
    bytes32 constant issHash = "0x";
    // keccak256(bytes("YOUR_AUD"))
    bytes32 constant audHash = "0x";
    struct PlonkZkProof {
        uint256 verifierDigest;
        uint256 inputHash1;
        uint256 inputHash2;
        bytes proof;
    }

    struct GoogleZkValidationData {
        OpenIdZkProofPublicInput input;
        bytes32 keyId;
        bytes32 userOpHash;
        PlonkZkProof zkProof;
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
    ) external view returns(bytes32) {
        return _accounts[account];
    }

    function isValidSignature(
        bytes32 /* challenge */,
        bytes calldata validationData
    ) public view override returns(bytes4) {
        (GoogleZkValidationData memory data) = abi.decode(validationData, (GoogleZkValidationData));
        // 1. construct public inputs of proof

        // 2. verify JWT signature
        if (data.keyId == RSA_KEY_ID1) {
            RsaVerifier.pkcs1Sha256(
                data.input.jwtHeaderAndPayloadHash,
                data.input.jwtSignature,
                RSA_E,
                RSA_N1
            );
        } else if (data.keyId == RSA_KEY_ID2) {
            RsaVerifier.pkcs1Sha256(
                data.input.jwtHeaderAndPayloadHash,
                data.input.jwtSignature,
                RSA_E,
                RSA_N2
            );
        } else {
            revert InvalidRsaKey("keyId", data.keyId);
        }

        // 3. verify zk input
        uint256[] memory publicInputs = new uint256[](3);
        publicInputs[0] = data.zkProof.verifierDigest;
        publicInputs[0] = data.zkProof.inputHash1;
        publicInputs[0] = data.zkProof.inputHash2;
        if (plonkVerifier.verify(data.zkProof.proof, publicInputs)) {
            return 0x1626ba7e; // magic value of IERC1271
        } else {
            return bytes4(0);
        }
    }
}