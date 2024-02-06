# Attestation

## Contracts

deploying PlonkVerifier (tx: 0x9033bcb4f8846ab52762aee6cef2386b0d38ccbb5418afaae56defe89c620752)...: deployed at 0xd1929562d293529E4d2296f890f98C1594Aa7050

deploying ZkAttestationVerifier (tx: 0xb06094e54c67d118132ba8e9e27193d2e81037dc74a5038743c55ff150d8ecbc)...: deployed at 0x00FC35f80C1D9633436822D1f6FE12db7cDb8817

deploying OpenId3KidRegistry (tx: 0x977f285bd9cc3293ffd404bdffbf863c9b254ee6598fa42373a2dbd11b86d097)...: deployed at 0x311109D10a9BD4D2be1551081b87C56Be144f4Fe

deploying SocialAttestation (tx: 0x051ea8eef5616dc0194f69fe6d80b4e26c1a9da3991959199bf21b6ead63225f)...: deployed at 0x2472cB4b6A82dC944715aA26e024Dd72C7C714ed

deploying SocialVoting (tx: 0xb2c4f1c54f38747dac46fef186749b9aff73ca23b4d63e9fb2533e0c7d796262)...: deployed at 0x672D1Da26CF102e1ab620A21bED86daCcE4901E2

deploying SocialVerification (tx: 0x5d1d0c032b63a2356e7c5f07d9f002d1e1f59df34ebd5b364d3328ab1d64417e)...: deployed at 0x3f224E562652ce2C6001cd14288F2D203dBd3CF2

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
          "name": "subject",
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
      "name": "getVerifiedAddress",
      "outputs": [
        {
          "components": [
            {
              "internalType": "address",
              "name": "linked",
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

For social verification, the consumer is 0x2F35F0a47e93C570884b8d5607b2415b86cf8362, the data is abi encoded

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

const socialVerification = "0x3f224E562652ce2C6001cd14288F2D203dBd3CF2";

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

