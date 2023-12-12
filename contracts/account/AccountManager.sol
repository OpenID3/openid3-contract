//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "../interfaces/IAccountManager.sol";
import "../admin/AccountAdminBase.sol";

contract AccountManager is IAccountManager, AccountAdminBase {
    using ECDSA for bytes32;
    using EnumerableSet for EnumerableSet.UintSet;

    mapping(address => EnumerableSet.UintSet) private _acls;

    function grant(uint256 validator) external override onlyAdminMode {
        _acls[msg.sender].add(validator);
        emit Grant(msg.sender, validator);
    }

    function revoke(uint256 validator) external override onlyAdminMode {
        _acls[msg.sender].remove(validator);
        emit Revoke(msg.sender, validator);
    }

    function setMetadata(
        bytes calldata metadata
    ) external override onlyAdminMode {
        emit NewMetadata(msg.sender, metadata);
    }

    function getValidators() external view override returns (uint256[] memory) {
        return _acls[msg.sender].values();
    }

    function validateSignature(
        bytes32 challenge,
        bytes calldata validationData
    ) public view override returns (uint256) {
        uint256 operator = uint256(bytes32(validationData[0:32]));
        if (!_acls[msg.sender].contains(operator)) {
            return 1;
        }
        return
            SignatureChecker.isValidSignatureNow(
                address(uint160(operator)),
                challenge.toEthSignedMessageHash(),
                validationData[32:]
            )
                ? operator &
                    0xffffffffffffffffffffffff0000000000000000000000000000000000000000
                : 1;
    }
}
