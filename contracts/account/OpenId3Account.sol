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

import "../interfaces/IOpenId3Account.sol";

contract OpenId3Account is
    IOpenId3Account,
    BaseAccount,
    TokenCallbackHandler,
    UUPSUpgradeable,
    Initializable
{
    using Address for address;
    using ECDSA for bytes32;

    error NotAuthorized();
    error WrongArrayLength();

    IEntryPoint private immutable _entryPoint;
    address public immutable admin;

    modifier onlyEntryPointOrSelf() {
        if (
            msg.sender != address(entryPoint()) && msg.sender != address(this)
        ) {
            revert NotAuthorized();
        }
        _;
    }

    constructor(address entryPoint_, address admin_) {
        _entryPoint = IEntryPoint(entryPoint_);
        admin = admin_;
        _disableInitializers();
    }

    /// @inheritdoc BaseAccount
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    function initialize(
        bytes calldata adminData
    ) public virtual override initializer {
        if (adminData.length > 0) {
            _call(admin, 0, adminData);
        }
    }

    /** UUPSUpgradeable */

    function _authorizeUpgrade(
        address /* newImplementation */
    ) internal view override onlyEntryPointOrSelf {}

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
        return
            SignatureChecker.isValidSignatureNow(
                admin,
                uoHash,
                userOp.signature
            )
                ? 0
                : 1;
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
