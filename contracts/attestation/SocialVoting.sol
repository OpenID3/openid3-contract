//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

import "./IAttestationConsumer.sol";

contract SocialVoting is IAttestationConsumer {
    event NewVote(uint256 from, address to, uint256 day);

    mapping(uint256 => mapping(uint256 => bool)) _voted;
    mapping(address => mapping(uint256 => uint256)) _history;

    function onNewAttestation(AttestationEvent calldata e) external override {
        uint256 day = e.iat / 86400;
        if (_voted[e.from][day]) {
            return;
        }
        address to = address(bytes20(e.data));
        _history[to][day] = _history[to][day] + 1;
        _voted[e.from][day] = true;
        emit NewVote(e.from, to, day);
    }

    function isVoted(uint256 from, uint256 day) external view returns (bool) {
        return _voted[from][day];
    }

    function totalVoted(uint256 from, uint256 start, uint256 numOfDays) external view returns (uint256) {
        uint256 total = 0;
        for (uint i = start; i < start + numOfDays; i++) {
            if (_voted[from][i]) {
                total = total + 1;
            }
        }
        return total;
    }

    function totalConsecutiveVoted(uint256 from, uint256 start, uint256 numOfDays) external view returns (uint256) {
        uint256 total = 0;
        for (uint i = start; i < start + numOfDays; i++) {
            if (_voted[from][i]) {
                total = total + 1;
            } else if (total > 0) {
                total = total - 1;
            }
        }
        return total;
    }

    function totalVotes(
        address to,
        uint256 start,
        uint256 numOfDays
    ) external view returns (uint256[] memory) {
        uint256[] memory votes = new uint256[](numOfDays);
        for (uint256 i = start; start < start + numOfDays; start++) {
            votes[i - start] = _history[to][i];
        }
        return votes;
    }
}
