//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.20;

interface IAccountEventIndexer {
    event NewMetadata(address indexed account, string metadata);
    
    event NewOperators(address indexed account, bytes32 operatorHash, bytes operators);

    event NewAdmin(address indexed account, address oldAdmin, address newAdmin);

    function newMetadata(string calldata metadata) external;

    function newOperators(bytes32 operatorHash, bytes calldata operators) external;

    function newAdmin(address oldAdmin, address newAdmin) external;
}
