//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@account-abstraction/contracts/samples/SimpleAccount.sol";
import "../interfaces/IAccountInitializer.sol";

library AccountAdminStorage {
    bytes32 internal constant STORAGE_SLOT =
        keccak256('openid3.account.admin');
 
    struct Layout {
        address admin;
    }

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}

contract OpenId3Account is IAccountInitializer, SimpleAccount {
    using Address for address;
    using ECDSA for bytes32;

    error NotAuthorized();
    error InvalidMode(uint8 mode);
    error InvalidAdminAction(uint8 action);

    event NewAdmin(address indexed oldAdmin, address indexed newAdmin);
    event NewOwner(address indexed oldOwner, address indexed newOwner);

    modifier onlySelf() {
        if (msg.sender != address(this)) {
            revert NotAuthorized();
        }
        _;
    }

    constructor(
        address entryPoint
    ) SimpleAccount(IEntryPoint(entryPoint)) { }

    function initialize(
        bytes calldata adminData,
        address anOwner
    ) public override virtual initializer {
        _setAdmin(adminData);
        _setOwner(anOwner);
    }

    function setOwner(address newOwner) onlySelf external {
        _setOwner(newOwner);
    }

    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override virtual returns (uint256 validationData) {
        address admin = AccountAdminStorage.layout().admin;
        uint8 mode = uint8(userOp.signature[0]);
        if (mode == 0x00) { // admin mode
            return _validateSignature(admin, userOpHash, userOp.signature[1:]);
        } else if (mode == 0x01) { // operator mode
            return _validateSignature(owner, userOpHash, userOp.signature[1:]);
        } else {
            revert InvalidMode(mode);
        }
    }

    function _validateSignature(
        address signer,
        bytes32 userOpHash,
        bytes calldata signature
    ) internal view returns(uint256) {
        return SignatureChecker.isValidSignatureNow(
            signer,
            userOpHash,
            signature
        ) ? 0 : SIG_VALIDATION_FAILED;
    }

    /** UUPSUpgradeable */

    function implementation() external view returns (address) {
        return _getImplementation();
    }

    /* help functions */

    function _setAdmin(bytes calldata adminData) internal {
        address newAdmin = address(bytes20(adminData[0:20]));
        bytes memory data = adminData[20:];
        if (data.length > 0) {
            _call(newAdmin, 0, data);
        }
        address oldAdmin = AccountAdminStorage.layout().admin;
        AccountAdminStorage.layout().admin = newAdmin;
        emit NewAdmin(oldAdmin, newAdmin);
    }

    function _setOwner(address newOwner) internal {
        address oldOwner = owner;
        owner = newOwner;
        emit NewOwner(oldOwner, newOwner);
    }
}