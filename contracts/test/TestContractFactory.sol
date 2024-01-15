//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract TestEmpty { }

contract TestContractFactory {
    event AccountDeployed(address account);

    function deploy(bytes32 salt) external returns (address deployed) {
        bytes memory bytecode = hex"3859818153F3";
        assembly ("memory-safe") {
            deployed := create2(0x0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        if (deployed == address(0)) {
            revert();
        }
        emit AccountDeployed(deployed);
    }

    function predictDeployedAddress(bytes32 salt) external view returns (address) {
        bytes32 hash = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                salt,
                keccak256(type(TestEmpty).creationCode)
            )
        );
        return address(uint160(uint(hash)));
    }
}
