# Attestation

## Contracts

Reusing OpenId3KidRegistry deployed at 0x9ae8bDB8361490E20AB274186e343059426B3e65
Reusing SocialAttestation deployed at 0xC6DB97Eb9938Ff912fa7023cbC55303e79897849
Reusing SocialVoting deployed at 0x3bF5609eD6dCA26fA48981fCFe90813132fBfbd4
Reusing SocialVerification deployed at 0x3E2Bd53C96cb0e32D1102229940A7144537F1C0E
## ABI

```
export const socialAttestationAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_registry",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "AttestationPayloadDataLengthMismatch",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AttestationPayloadHashMismatch",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "AttestationPayloadsLengthMismatch",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidAccountProvider",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "InvalidAttestationSignature",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "consumer",
          "type": "address"
        },
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "from",
              "type": "uint256"
            },
            {
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
            },
            {
              "internalType": "uint64",
              "name": "iat",
              "type": "uint64"
            }
          ],
          "indexed": false,
          "internalType": "struct AttestationEvent",
          "name": "e",
          "type": "tuple"
        }
      ],
      "name": "NewAttestationEvent",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes",
          "name": "input",
          "type": "bytes"
        },
        {
          "internalType": "bytes[]",
          "name": "payloads",
          "type": "bytes[]"
        },
        {
          "internalType": "bytes",
          "name": "signature",
          "type": "bytes"
        }
      ],
      "name": "aggregate",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const;
 
export const socialVerificationAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "allowed",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [],
      "name": "InvalidVerifiedAddress",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "NotAllowedAttestationSource",
      "type": "error"
    },
    {
      "inputs": [],
      "name": "StaleAttestationEvent",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "from",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "referral",
          "type": "address"
        }
      ],
      "name": "NewReferral",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "uint256",
          "name": "from",
          "type": "uint256"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "toVerify",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint64",
          "name": "iat",
          "type": "uint64"
        }
      ],
      "name": "NewVerification",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "getTotalReferred",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "uint256",
          "name": "account",
          "type": "uint256"
        }
      ],
      "name": "getVerificationData",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "toVerify",
              "type": "address"
            },
            {
              "internalType": "uint64",
              "name": "iat",
              "type": "uint64"
            }
          ],
          "internalType": "struct SocialVerification.VerificationData",
          "name": "",
          "type": "tuple"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "components": [
            {
              "internalType": "uint256",
              "name": "from",
              "type": "uint256"
            },
            {
              "internalType": "bytes",
              "name": "data",
              "type": "bytes"
            },
            {
              "internalType": "uint64",
              "name": "iat",
              "type": "uint64"
            }
          ],
          "internalType": "struct AttestationEvent",
          "name": "e",
          "type": "tuple"
        }
      ],
      "name": "onNewAttestation",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ] as const;
```

## Structs

```
struct AttestationPayload {
  bytes[] data;
  address[] consumers;
}
```

For social verification, the consumer is 0x3E2Bd53C96cb0e32D1102229940A7144537F1C0E, the data is abi encoded

```
struct VerificationData {
    address referral;
    address linked;
    uint64 iat;
}
```

Example code:

```
import { encodeAbiParameters, parseAbiParameters } from 'viem'

const socialVerification = "0x3E2Bd53C96cb0e32D1102229940A7144537F1C0E";

const encodedData = encodeAbiParameters(
  [
    {
      components: [
        {
          name: 'referral',
          type: 'address',
        },
        {
          name: 'toVerify',
          type: 'address',
        },
      ],
      name: 'VerificationData',
      type: 'tuple',
    },
  ],
  [{referral, toVerify}]
);

const encodePayload = encodeAbiParameters(
  [
    {
      components: [
        {
          name: 'data',
          type: 'bytes[]',
        },
        {
          name: 'consumers',
          type: 'address[]',
        },
      ],
      name: 'AttestationPayload',
      type: 'tuple',
    },
  ],
  [{data: [encodedData], consumers: [socialVerification]}]
);

const nonce = keccak256(encodedPayload);
```

