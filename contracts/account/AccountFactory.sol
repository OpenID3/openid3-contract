//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../interfaces/IAccountInitializer.sol";
import "../interfaces/IAccountProxy.sol";

contract AccountFactory {
    event AccountDeployed(address account);

    address public immutable accountProxy;
    address public immutable accountImpl;

    constructor(address _accountProxy, address _accountImpl) {
        accountProxy = _accountProxy;
        accountImpl = _accountImpl;
    }

    function clone(
        bytes memory accountData
    ) external returns (address proxy) {
        bytes32 salt = keccak256(accountData);
        proxy = Clones.cloneDeterministic(accountProxy, salt);
        IAccountProxy(proxy).initProxy(accountImpl, accountData);
        emit AccountDeployed(proxy);
    }

    function deploy(
        bytes memory accountData
    ) external returns (address proxy) {
        bytes32 salt = keccak256(accountData);
        bytes memory deploymentData = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(accountImpl, accountData)
        );
        assembly ("memory-safe") {
            proxy := create2(0x0, add(deploymentData, 0x20), mload(deploymentData), salt)
        }
        if (proxy == address(0)) {
            revert();
        }
        emit AccountDeployed(proxy);
    }
}
