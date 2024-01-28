//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IKidRegistry.sol";

struct KidData {
    uint32 provider;
    uint48 validUntil;
}

contract OpenId3KidRegistry is IKidRegistry, Ownable {
    event KidSet(bytes32 kid, KidData data);
    event KidDisabled(bytes32 kid);

    uint48 constant TTL = 24 * 60 * 60; // one day
    mapping(bytes32 => KidData) _kids;

    function setKid(bytes32 kid, KidData memory metadata) external onlyOwner {
        _kids[kid] = metadata;
        emit KidSet(kid, metadata);
    }

    function getProvider(bytes32 kid) override external view returns(uint32) {
        return _kids[kid].provider;
    }

    function validateKid(bytes32 kid) override external view {
        if (_kids[kid].validUntil < block.timestamp) {
            revert StaleKid();
        }
    }
}