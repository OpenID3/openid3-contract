//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";

import "@account-abstraction/contracts/core/BaseAccount.sol";
import "@account-abstraction/contracts/samples/callback/TokenCallbackHandler.sol";

import "../interfaces/IAccountMetadata.sol";
import "../interfaces/IOpenId3Account.sol";

library OpenId3AccountStorage {
    bytes32 internal constant STORAGE_SLOT = keccak256("openid3.account");

    struct Layout {
        address admin;
        bytes32 operator;
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
    address private immutable _defaultAdmin;
    IAccountMetadata private immutable _metadata;

    modifier onlyEntryPointOrSelf() {
        if (
            msg.sender != address(entryPoint()) && msg.sender != address(this)
        ) {
            revert NotAuthorized();
        }
        _;
    }

    modifier onlyAdminMode() {
        if (OpenId3AccountStorage.layout().mode != 0x00) {
            revert OnlyAdminAllowed();
        }
        _;
    }

    constructor(address entryPoint_, address admin_, address metadata_) {
        _entryPoint = IEntryPoint(entryPoint_);
        _defaultAdmin = admin_;
        _metadata = IAccountMetadata(metadata_);
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
        bytes32 operator,
        string calldata metadata
    ) public virtual override initializer {
        _setAdmin(address(bytes20(adminData[0:20])), adminData[20:]);
        _setOperator(operator);
        _metadata.setMetadata(metadata);
    }

    function getMode() external view override returns (uint8) {
        return OpenId3AccountStorage.layout().mode;
    }

    function getAdmin() public view override returns (address) {
        address admin = OpenId3AccountStorage.layout().admin;
        return admin == address(0) ? _defaultAdmin : admin;
    }

    function getOperator() public view returns (bytes32) {
        return OpenId3AccountStorage.layout().operator;
    }

    function setAdmin(
        address admin,
        bytes memory adminData
    ) public onlyEntryPointOrSelf onlyAdminMode {
        address oldAdmin = getAdmin();
        _setAdmin(admin, adminData);
        emit NewAdmin(oldAdmin, admin);
    }

    function setOperator(
        bytes32 operator
    ) public onlyEntryPointOrSelf onlyAdminMode {
        bytes32 oldOperator = getOperator();
        _setOperator(operator);
        emit NewOperator(oldOperator, operator);
    }

    function _setAdmin(address newAdmin, bytes memory adminData) internal {
        if (adminData.length > 0) {
            _call(newAdmin, 0, adminData);
        }
        if (newAdmin == _defaultAdmin) {
            OpenId3AccountStorage.layout().admin = address(0);
        } else {
            OpenId3AccountStorage.layout().admin = newAdmin;
        }
    }

    function _setOperator(bytes32 operator) internal {
        OpenId3AccountStorage.layout().operator = operator;
    }

    /** UUPSUpgradeable */

    function _authorizeUpgrade(
        address /* newImplementation */
    ) internal view override onlyEntryPointOrSelf onlyAdminMode {}

    function implementation() external view returns (address) {
        return _getImplementation();
    }

    /** Executable  */

    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external onlyEntryPointOrSelf {
        _call(dest, value, func);
    }

    function executeBatch(
        address[] calldata dest,
        uint256[] memory value,
        bytes[] calldata func
    ) external onlyEntryPointOrSelf {
        if (dest.length != value.length || value.length != func.length) {
            revert WrongArrayLength();
        }
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], value[i], func[i]);
        }
    }

    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 uoHash
    ) internal virtual override returns (uint256 validationData) {
        uint8 mode = uint8(userOp.signature[0]);
        bytes32 message = uoHash.toEthSignedMessageHash();
        OpenId3AccountStorage.layout().mode = mode;
        if (mode == 0x00) {
            // admin mode
            return
                SignatureChecker.isValidSignatureNow(
                    getAdmin(),
                    message,
                    userOp.signature[1:]
                )
                    ? 0
                    : 1;
        } else if (mode == 0x01) {
            // operator mode
            return
                _validateOperatorSig(
                    getOperator(),
                    message,
                    userOp.signature[1:]
                )
                    ? 0
                    : 1;
        } else {
            revert InvalidMode(mode);
        }
    }

    function _validateOperatorSig(
        bytes32 operator,
        bytes32 message,
        bytes calldata signature
    ) internal view returns (bool) {
        uint256 totalOps = signature.length / 85;
        if (keccak256(signature[0:totalOps * 20]) != operator) {
            return false;
        }
        for (uint i = 0; i < totalOps; i++) {
            uint256 opStart = i * 20;
            address op = address(bytes20(signature[opStart:opStart + 20]));
            uint256 sigStart = totalOps * 20 + i * 65;
            bytes memory sig = signature[sigStart:sigStart + 65];
            if (!SignatureChecker.isValidSignatureNow(op, message, sig)) {
                return false;
            }
        }
        return true;
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
    ) external onlyEntryPointOrSelf {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    /* help functions */

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public pure override returns (bool) {
        return
            interfaceId == type(IOpenId3Account).interfaceId ||
            interfaceId == type(IERC721Receiver).interfaceId ||
            interfaceId == type(IERC1155Receiver).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }
}
