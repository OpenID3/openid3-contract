//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@account-abstraction/contracts/samples/SimpleAccount.sol";
import "../interfaces/IAccountInitializer.sol";
import "../interface/IAccountAdmin.sol";
import "./PasskeyAdminManager.sol";

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

contract OpenId3Account is SimpleAccount, IAccountInitializer {
    using Address for address;

    error NotAuthorized();
    error InvalidSignType(uint8 signType);
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
        address anOwner,
    ) public override virtual initializer {
        _setAdmin(adminData);
        _setOwner(anOwner);
    }

    function setOwner(address newOwner) onlySelf external {
        _setOwner(newOwner);
    }

    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override virtual returns (uint256 validationData) {
        uint8 signType = uint8(userOp.signature[0]);
        if (signType == 0x00) { // admin mode
            return IAccountAdmin(admin).validate(userOpHash, userOp.signature[1:])
                ? 0 : SIG_VALIDATION_FAILED;
        } else if (signType == 0x02) { // operator mode
            bytes32 hash = userOpHash.toEthSignedMessageHash();
            return owner != hash.recover(userOp.signature[1:])
                ? SIG_VALIDATION_FAILED : 0;
        } else {
            revert InvalidSignType(signType);
        }
    }

    /** UUPSUpgradeable */

    function implementation() external view returns (address) {
        return _getImplementation();
    }

    /* help functions */

    function _setAdmin(bytes calldata adminData) internal {
        address newAdmin = adminData[0:20];
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