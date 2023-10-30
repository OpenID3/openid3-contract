//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../interfaces/IAccountInitializer.sol";
import "../interfaces/IAccountProxy.sol";

contract AccountFactory {
    event AccountDeployed(address account);

    address private immutable ACCOUNT_PROXY;
    address private immutable ACCOUNT_IMPL;

    constructor(address accountProxy, address accountImpl) {
        ACCOUNT_PROXY = accountProxy;
        ACCOUNT_IMPL = accountImpl;
    }

    function getAccountImpl() external view returns (address) {
        return ACCOUNT_IMPL;
    }

    function getAccountProxy() external view returns (address) {
        return ACCOUNT_PROXY;
    }

    function clone(
        bytes memory adminData,
        address owner
    ) external returns (address proxy) {
        bytes32 salt = keccak256(abi.encodePacked(owner, adminData));
        proxy = Clones.cloneDeterministic(ACCOUNT_PROXY, salt);
        bytes memory accountInitData = abi.encodeWithSelector(
            IAccountInitializer.initialize.selector,
            adminData,
            owner
        );
        IAccountProxy(proxy).initProxy(ACCOUNT_IMPL, accountInitData);
        emit AccountDeployed(proxy);
    }

    function deploy(
        bytes memory adminData,
        address owner
    ) external returns (address proxy) {
        bytes32 salt = keccak256(abi.encodePacked(owner, adminData));
        bytes memory accountInitData = abi.encodeWithSelector(
            IAccountInitializer.initialize.selector,
            adminData,
            owner
        );
        bytes memory deploymentData = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(ACCOUNT_IMPL, accountInitData)
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
