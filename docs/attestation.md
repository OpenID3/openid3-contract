# Attestation

## Contracts

deploying OpenId3KidRegistry (tx: 0x3010644511c8d0d195a642cd29d341ebb928d9dc4c37bf85e245185b5a1656f4)...: deployed at 0x9ae8bDB8361490E20AB274186e343059426B3e65
deploying SocialAttestation (tx: 0x245b25b999e3beb836c5a40f4e738a64e1b06fe19d1ced50e4ac91b82f8b9ed7)...: deployed at 0x63140654F7eaEE4d591B1601554Be092dB84eAcD
deploying SocialVoting (tx: 0xd0c7aaaeb176fea76721f083ff0be8e10d27bcad44651fb8b4fc92b362dd2776)...: deployed at 0xcB2d354FA1080DA91a915a7797091204b0c4D121
deploying SocialVerification (tx: 0x1132aae6154894c16d48655351f1a82b2cb63fc4be362609352dfad4cbf4a329)...: deployed at 0x0Ce34e57E002BBb541f6c08d78D4cF6de82e3829

## ABI

```
export const socialAttestationAbi = [
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_registry",
          "type": "address"
        },
        {
          "internalType": "address",
          "name": "_verifier",
          "type": "address"
        }
      ],
      "stateMutability": "nonpayable",
      "type": "constructor"
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
          "components": [
            {
              "internalType": "bytes[]",
              "name": "data",
              "type": "bytes[]"
            },
            {
              "internalType": "address[]",
              "name": "consumers",
              "type": "address[]"
            }
          ],
          "internalType": "struct AttestationPayload[]",
          "name": "payloads",
          "type": "tuple[]"
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
 
export const socialVerificationAbi =  [
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

For social verification, the consumer is 0x0Ce34e57E002BBb541f6c08d78D4cF6de82e3829, the data is abi encoded

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

const socialVerification = "0x0Ce34e57E002BBb541f6c08d78D4cF6de82e3829";

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

