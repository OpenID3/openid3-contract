//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

struct AttestationPayload {
  address to;
  bytes32 statement;
  address[] consumers;
}

struct AttestationEvent {
    uint256 from;
    address to;
    uint64 iat;
    bytes32 statement;
}