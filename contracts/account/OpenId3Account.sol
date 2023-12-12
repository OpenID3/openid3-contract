//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/samples/callback/TokenCallbackHandler.sol";

import "../interfaces/IAccountValidator.sol";
import "../interfaces/IAccountManager.sol";
import "../interfaces/IOpenId3Account.sol";

library OpenId3AccountStorage {
    bytes32 internal constant STORAGE_SLOT = keccak256("openid3.account");

    struct Layout {
        address admin;
        uint8 mode;
    }

    function layout() internal pure returns (Layout storage l) {
        bytes32 slot = STORAGE_SLOT;
        assembly {
            l.slot := slot
        }
    }
}

contract OpenId3Account is
    IOpenId3Account,
    BaseAccount,
    TokenCallbackHandler,
    UUPSUpgradeable,
    Initializable
{
    using Address for address;
    using ECDSA for bytes32;

    error OnlyAdminAllowed();
    error NotAuthorized();
    error InvalidMode(uint8 mode);
    error WrongArrayLength();

    event NewAdmin(address indexed oldAdmin, address indexed newAdmin);
    event NewOperator(bytes32 indexed oldOperator, bytes32 indexed newOperator);

    IEntryPoint private immutable _entryPoint;
    IAccountManager private immutable _manager;

    constructor(address entryPoint_, address manager) {
        _entryPoint = IEntryPoint(entryPoint_);
        _manager = IAccountValidatorManager(manager);
        _disableInitializers();
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function initialize(
        bytes calldata adminData,
        uint256 operator,
        bytes calldata metadata
    ) public virtual override initializer {
        _setAdmin(adminData);
        manager.grant(validator);
        manager.setMetadata(metadata);
    }

    function getMode() external view override returns (uint8) {
        return OpenId3AccountStorage.layout().mode;
    }

    function getAdmin() external view override returns (address) {
        return OpenId3AccountStorage.layout().admin;
    }

    function getAccountManager() external view returns (address) {
        return address(_manager);
    }

    // only admin is allowed to update admin status
    function setAdmin(bytes calldata adminData) external {
        _guard(true);
        _setAdmin(adminData);
    }

    /** UUPSUpgradeable */

    function _authorizeUpgrade(
        address /* newImplementation */
    ) internal view override {
        _guard(true);
    }

    function implementation() external view returns (address) {
        return _getImplementation();
    }

    /** Executable  */

    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external {
        _guard(false);
        _call(dest, value, func);
    }

    function executeBatch(
        address[] calldata dest,
        uint256[] memory value,
        bytes[] calldata func
    ) external {
        _guard(false);
        if (dest.length != value.length || value.length != func.length) {
            revert WrongArrayLength();
        }
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        uint8 mode = uint8(userOp.signature[0]);
        OpenId3AccountStorage.layout().mode = mode;
        if (mode == 0x00) {
            // admin mode
            address admin = OpenId3AccountStorage.layout().admin;
            return _validateSignature(admin, userOpHash, userOp.signature[1:]);
        } else if (mode == 0x01) {
            // operator mode
            return _manager.validateSignature(userOpHash, userOp.signature[1:]);
        } else {
            revert InvalidMode(mode);
        }
    }

    /** Entrypoint related */

    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    function withdrawDepositTo(
        address payable withdrawAddress,
        uint256 amount
    ) external {
        _guard(false);
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    /* help functions */

    function _setAdmin(bytes calldata adminData) internal {
        address newAdmin = address(bytes20(adminData[0:20]));
        if (adminData.length > 20) {
            _call(newAdmin, 0, adminData[20:]);
        }
        address oldAdmin = OpenId3AccountStorage.layout().admin;
        if (oldAdmin != newAdmin) {
            OpenId3AccountStorage.layout().admin = newAdmin;
            emit NewAdmin(oldAdmin, newAdmin);
        }
    }

    function _setOperator(bytes32 newOperator) internal {
        bytes32 oldOperator = OpenId3AccountStorage.layout().operator;
        OpenId3AccountStorage.layout().operator = newOperator;
        emit NewOperator(oldOperator, newOperator);
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function _isValidator(address signer) internal view returns (bool) {
        return
            signer.isContract() &&
            IERC165(signer).supportsInterface(
                type(IAccountValidator).interfaceId
            );
    }

    function _validateSignature(
        address signer,
        bytes32 userOpHash,
        bytes calldata signature
    ) internal view returns (uint256) {
        if (_isValidator(signer)) {
            return
                IAccountValidator(signer).validateSignature(
                    userOpHash,
                    signature
                );
        } else {
            return
                SignatureChecker.isValidSignatureNow(
                    signer,
                    userOpHash.toEthSignedMessageHash(),
                    signature
                )
                    ? 0
                    : 1;
        }
    }

    // All non-view external functions must be guarded by this function.
    // We allow only four external callers:
    // 1. entryPoint: In this case, we don't need to update the mode
    //    since it's already set by the _validateSignature, but we
    //    need to check if only admin is allowed
    // 2. address(this): In this case, we don't need to update the mode
    //    since it's already set by the initial entry point call, but we
    //    need to check if only admin is allowed
    //
    // If onlyAdmin is true, we only allow admin to call
    function _guard(bool onlyAdmin) internal view {
        if (
            msg.sender == address(entryPoint()) || msg.sender == address(this)
        ) {
            if (onlyAdmin && OpenId3AccountStorage.layout().mode != 0x00) {
                revert OnlyAdminAllowed();
            }
        } else {
            revert NotAuthorized();
        }
    }
}
