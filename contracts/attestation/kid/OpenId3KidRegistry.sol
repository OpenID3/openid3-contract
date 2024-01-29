//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./IKidRegistry.sol";

struct KidData {
    uint32 provider; // 0 means invalid provider
    uint48 validUntil;
}

contract OpenId3KidRegistry is IKidRegistry, Ownable {
    event KidSet(bytes32 kid, KidData data);
    event KidDisabled(bytes32 kid);

    uint48 constant TTL = 24 * 60 * 60; // one day
    mapping(bytes32 => KidData) _kids;

    constructor(address owner) {
        _transferOwnership(owner);
    }

    function setKid(bytes32 kid, KidData memory metadata) external onlyOwner {
        _kids[kid] = metadata;
        emit KidSet(kid, metadata);
    }

    function getProvider(bytes32 kid) override external view returns(uint32) {
        return isValidKid(kid) ? _kids[kid].provider : 0;
    }

    function isValidKid(bytes32 kid) override public view returns(bool) {
        return _kids[kid].validUntil > block.timestamp;
    }
}