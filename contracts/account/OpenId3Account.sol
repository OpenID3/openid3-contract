//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/samples/callback/TokenCallbackHandler.sol";

import "../interfaces/IOpenId3Account.sol";

library OpenId3AccountStorage {
    bytes32 internal constant STORAGE_SLOT =
        keccak256('openid3.account');
 
    struct Layout {
        address admin;
        address operator;
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

    event NewAdmin(address indexed oldAdmin, address indexed newAdmin);
    event NewOwner(address indexed oldOwner, address indexed newOwner);

    IEntryPoint private immutable _entryPoint;

    constructor(address entryPoint_) {
        _entryPoint = IEntryPoint(entryPoint_);
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
        address operator
    ) public override virtual initializer {
        _setAdmin(adminData);
        _setOperator(operator);
    }

    function getMode() external override view returns(uint8) {
        return OpenId3AccountStorage.layout().mode;
    }

    // both operator and admin are allowed to update operator
    function setOperator(address newOperator) external {
        _guard(false);
        _setOperator(newOperator);
    }

    // only admin is allowed to update admin status
    function setAdmin(bytes calldata adminData) external {
        _guard(true);
        _setAdmin(adminData);
    }

    /** UUPSUpgradeable */

    function _authorizeUpgrade(
        address /* newImplementation */
    ) internal override  {
        _guard(true);
    }

    function implementation() external view returns (address) {
        return _getImplementation();
    }

    /** Executable  */

    function execute(address dest, uint256 value, bytes calldata func)
        external
    {
        _guard(false);
        _call(dest, value, func);
    }

    function executeBatch(address[] calldata dest, bytes[] calldata func)
        external
    {
        _guard(false);
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    function _validateSignature(UserOperation calldata userOp, bytes32 userOpHash)
    internal override virtual returns (uint256 validationData) {
        uint8 mode = uint8(userOp.signature[0]);
        OpenId3AccountStorage.layout().mode = mode;
        if (mode == 0x00) { // admin mode
            address admin = OpenId3AccountStorage.layout().admin;
            return _validateSignature(admin, userOpHash, userOp.signature[1:]);
        } else if (mode == 0x01) { // operator mode
            address operator = OpenId3AccountStorage.layout().operator;
            return _validateSignature(operator, userOpHash, userOp.signature[1:]);
        } else {
            revert InvalidMode(mode);
        }
    }

    /** Entrypoint related */

    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    function addDeposit() public payable {
        entryPoint().depositTo{value : msg.value}(address(this));
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
        OpenId3AccountStorage.layout().admin = newAdmin;
        emit NewAdmin(oldAdmin, newAdmin);
    }

    function _setOperator(address newOperator) internal {
        address oldOperator = OpenId3AccountStorage.layout().operator;
        OpenId3AccountStorage.layout().operator = newOperator;
        emit NewOwner(oldOperator, newOperator);
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value : value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
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

    // All non-view external functions must be guarded by this function.
    // We allow only four external callers:
    // 1. entryPoint: In this case, we don't need to update the mode
    //    since it's already set by the _validateSignature, but we
    //    need to check the mode to ensure only admin is allowed
    //    if onlyAdminAllowed is true
    // 2. address(this): In this case, we don't need to update the mode
    //    since it's already set by the initial entry point call, but we
    //    need to check the mode to ensure only admin is allowed
    //    if onlyAdminAllowed is true
    // 3. operator: In this case, we set the mode to operator mode and revert
    //    if only admin is allowed
    // 4. admin: In this case, we set the mode to admin mode
    //
    // If onlyAdminAllowed is true, we only allow admin to call
    function _guard(bool onlyAdminAllowed) internal {
        if (msg.sender == address(entryPoint()) || msg.sender == address(this)) {
            if (onlyAdminAllowed && OpenId3AccountStorage.layout().mode != 0x00) {
                revert OnlyAdminAllowed();
            }
        } else if (msg.sender == OpenId3AccountStorage.layout().admin) {
            OpenId3AccountStorage.layout().mode = 0x00;
        } else if (msg.sender == OpenId3AccountStorage.layout().operator) {
            if (onlyAdminAllowed) {
                revert OnlyAdminAllowed();
            }
            OpenId3AccountStorage.layout().mode = 0x01;
        } else {
            revert NotAuthorized();
        }
    }
}