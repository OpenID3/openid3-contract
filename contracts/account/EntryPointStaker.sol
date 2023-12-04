// SPDX-License-Identifier: MIT
// Hexlink Contracts

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@account-abstraction/contracts/core/StakeManager.sol";

contract EntryPointStaker is Ownable {
    receive() external payable { }

    function addStake(
        address entrypoint,
        uint32 unstakeDelaySec
    ) external payable {
        IStakeManager(entrypoint).addStake{value: msg.value}(unstakeDelaySec);
    }

    function withdrawStake(
        address entrypoint,
        address payable withdrawTo
    ) onlyOwner external {
        IStakeManager(entrypoint).withdrawStake(withdrawTo);
    }

    function unlockStake(address entrypoint) onlyOwner external {
        IStakeManager(entrypoint).unlockStake();
    }
}