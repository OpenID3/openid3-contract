//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

struct AttestationPayload {
  bytes[] data;
  address[] consumers;
}

struct AttestationEvent {
    uint256 from;
    bytes data;
    uint64 iat;
}