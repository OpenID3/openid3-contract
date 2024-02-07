# Attestation

## Contracts

deploying OpenId3KidRegistry (tx: 0x977f285bd9cc3293ffd404bdffbf863c9b254ee6598fa42373a2dbd11b86d097)...: deployed at 0x311109D10a9BD4D2be1551081b87C56Be144f4Fe

deploying SocialAttestation (tx: 0x373e062f70311249c731b0de1c409cac685da9a2229d28b9b640f64f7e91ef5c)...: deployed at 0x1A130405b73d28DbA4BCBe6882aA1a4217273981

deploying SocialVoting (tx: 0x06e7aacab52aa4941b57b3555f9b2fcdc91d3080eee4389b6bc9bdbffc51af19)...: deployed at 0xbeB17b9bBc16f1d533A76f4DC18Aff40C3378B7a

deploying SocialVerification (tx: 0xd44646844d955dfa40075615f26043722c39ea77ee219e9ba9ffca819406ad6b)...: deployed at 0x40e9Ba3D55d0700bDD10795123e7750E4dFA01F7

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

For social verification, the consumer is 0x40e9Ba3D55d0700bDD10795123e7750E4dFA01F7, the data is abi encoded

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

const socialVerification = "0x40e9Ba3D55d0700bDD10795123e7750E4dFA01F7";

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

