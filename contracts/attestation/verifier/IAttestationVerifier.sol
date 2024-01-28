//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IAttestationVerifier {
    function verify(
        bytes calldata input,
        bytes calldata signature
    ) external view returns (bool);
}
