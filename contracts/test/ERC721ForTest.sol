//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.12;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract ERC721ForTest is ERC721 {
    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) {
        _mint(msg.sender, 0);
        _mint(msg.sender, 1);
        _mint(msg.sender, 2);
    }
}
