// SPDX-License-Identifier: MIT
// Hexlink Contracts

pragma solidity ^0.8.12;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./AccountFactory.sol";

contract SimplePaymaster is BasePaymaster, Ownable {
    using ECDSA for bytes32;

    constructor(
        IEntryPoint entryPoint,
        address owner
    ) BasePaymaster(entryPoint) {
        _transferOwnership(owner);
    }

    function pack(UserOperation userOp) {
        return
            keccak256(
                abi.encode(
                    userOp.sender,
                    userOp.nonce,
                    userOp.initCode,
                    userOp.callData,
                    userOp.callGasLimit,
                    userop.verificationGasLimit,
                    userOp.preVerificationGas,
                    userOp.maxFeePerGas,
                    userOp.maxPriorityFeePerGas
                )
            );
    }

    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 /* requiredPreFund */
    )
        internal
        view
        override
        returns (bytes memory context, uint256 validationData)
    {
        uint48 validAfter = uint48(
            bytes6(userOp.paymasterAndData.signature[20:68])
        );
        uint48 validUntil = uint48(
            bytes6(userOp.paymasterAndData.signature[68:116])
        );
        bytes memory signature = userOp.paymasterAndData.signature[116:];

        bytes32 message = keccak256(
            abi.encodePacked(
                packe(userOp),
                block.chainId,
                address(this),
                validAfter,
                validUtil
            )
        );
        bytes signed = message.toEthSignedMessageHash();
        (address recovered, ECDSA.RecoverError error) = ECDSA.tryRecover(
            signed,
            signature
        );
        bool valid = error == ECDSA.RecoverError.NoError &&
            recovered == owner();
        return ("", _packValidationData(valid, validAfter, validUntil));
    }
}
