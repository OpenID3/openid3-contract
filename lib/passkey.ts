import crypto from "crypto";
import { Contract, ethers } from "ethers";
import { callWithEntryPoint, genUserOp, genUserOpHash } from "./userop";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { secp256r1 } from "@noble/curves/p256";
import {encodeAbiParameters} from "viem";
import { HexString } from "ethers/lib.commonjs/utils/data";

export interface Passkey {
  id: string;
  privKey: Uint8Array;
  pubKey: Uint8Array;
  pubKeyX: bigint;
  pubKeyY: bigint;
}

export const genPasskey = (): Passkey => {
  const id = crypto.randomBytes(32).toString("hex");
  const privKey = secp256r1.utils.randomPrivateKey();
  const pubKey = secp256r1.getPublicKey(privKey);
  const point = secp256r1.ProjectivePoint.fromPrivateKey(privKey);
  return { privKey, pubKey, pubKeyX: point.x, pubKeyY: point.y, id };
};

export const buildPasskeyAdminCallData = (admin: Contract, key: Passkey) => {
  return admin.interface.encodeFunctionData("setPasskey", [
    {
      pubKeyX: key.pubKeyX,
      pubKeyY: key.pubKeyY,
    },
    key.id,
  ]);
};

export const buildPasskeyAdminData = (admin: Contract, key: Passkey) => {
  let adminData = buildPasskeyAdminCallData(admin, key);
  return ethers.solidityPacked(["address", "bytes"], [admin.target, adminData]);
};

function buildAdminValidationData(key: Passkey, userOpHash: string) {
  const authData = ethers.solidityPacked(
    ["uint256", "uint256", "uint256"],
    [key.pubKeyX, key.pubKeyY, 0]
  ) as `0x${string}`;
  const challenge = ethers.encodeBase64(userOpHash);
  const clientJson = JSON.stringify({
    preField: "preValue",
    challenge: challenge,
    postField: "postValue",
  });
  const [clientDataJsonPre, clientDataJsonPost] = clientJson.split(challenge);
  const clientDataHash = crypto
    .createHash("sha256")
    .update(clientJson)
    .digest("hex");
  const signedDataHex = ethers.solidityPacked(
    ["bytes", "bytes32"],
    [authData, "0x" + clientDataHash]
  );
  const signedDataHash = crypto
    .createHash("sha256")
    .update(ethers.getBytes(signedDataHex))
    .digest("hex");
  const signature = secp256r1.sign(signedDataHash, key.privKey);
  return {
    r: signature.r, // bigint
    s: signature.s, // bigint
    clientDataJsonPre,
    clientDataJsonPost,
    authData,
    clientDataHash,
  };
}

export const adminDataAbi = [
  {
    components: [
      {
        name: "authData",
        type: "bytes",
      },
      {
        name: "clientDataJsonPre",
        type: "string",
      },
      {
        name: "clientDataJsonPost",
        type: "string",
      },
      {
        components: [
          {
            name: "x",
            type: "uint256",
          },
          {
            name: "y",
            type: "uint256",
          },
        ],
        name: "pubKey",
        type: "tuple",
      },
      {
        name: "r",
        type: "uint256",
      },
      {
        name: "s",
        type: "uint256",
      },
    ],
    name: "PasskeyValidationData",
    type: "tuple",
  },
] as const;

export async function callFromPasskey(
  sender: string,
  key: Passkey,
  initCode: string,
  callData: string,
  signer: HardhatEthersSigner,
  log?: boolean
) {
  const userOp = await genUserOp(sender, initCode, callData);
  const userOpHash = await genUserOpHash(userOp);
  const validationData = buildAdminValidationData(key, userOpHash);
  const signature = encodeAbiParameters(adminDataAbi, [
    {
      authData: validationData.authData,
      clientDataJsonPre: validationData.clientDataJsonPre,
      clientDataJsonPost: validationData.clientDataJsonPost,
      pubKey: {
        x: key.pubKeyX,
        y: key.pubKeyY,
      },
      r: validationData.r,
      s: validationData.s,
    },
  ]);
  userOp.signature = ethers.solidityPacked(["uint8", "bytes"], [0, signature]);
  return await callWithEntryPoint(userOp, signer, log ?? false);
}
