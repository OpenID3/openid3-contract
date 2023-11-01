import crypto from "crypto";
import * as secp from "@lionello/secp256k1-js";
import { Contract, ethers } from "ethers";
import { callWithEntryPoint, genUserOp, genUserOpHash } from "./userop";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export interface Passkey {
    privKey: Uint8Array,
    pubKeyX: string;
    pubKeyY: string;
}

export const genPasskey = () : Passkey => {
    const privKeyBuf = crypto.randomBytes(32);
    const privKey = secp.uint256(privKeyBuf, 16);
    const pubKey = secp.generatePublicKeyFromPrivateKeyData(privKey);
    const pubKeyX = secp.uint256(pubKey.x, 16).toString();
    const pubKeyY = secp.uint256(pubKey.y, 16).toString();
    return { privKey, pubKeyX, pubKeyY };
}

export const buildAdminData = (
    admin: Contract,
    key: Passkey
  ) => {
    let adminData = admin.interface.encodeFunctionData(
      "setPasskey", [
        "mypasskey",
        {pubKeyX: key.pubKeyX, pubKeyY: key.pubKeyY}
      ]
    );
    return ethers.solidityPacked(
      ["address", "bytes"], [admin.target, adminData])
}

export function buildAdminValidationData(
    key: Passkey,
    userOpHash: string,
) {
    const authData = ethers.getBytes(ethers.solidityPacked(
        ["uint256", "uint256", "uint256"],
        [key.pubKeyX, key.pubKeyY, 0]
    ));
    const clientJson = JSON.stringify({
        "preField": "preValue",
        "challenge": userOpHash,
        "postField": "postValue",
    });
    const [clientDataJsonPre, clientDataJsonPost] = clientJson.split(userOpHash);
    const clientDataHash = crypto.createHash("sha256")
        .update(clientJson)
        .digest("hex");
    const clientData = ethers.getBytes(clientDataHash);
    const signedData = [...authData, ...clientData];
    const signature = secp.ecsign(key.privKey, signedData);
    return {
        r: signature.r, // hex
        s: signature.s, // hex
        clientDataJsonPre,
        clientDataJsonPost,
        authData,
    }
}

export async function callAsAdmin(
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
    const signature = ethers.AbiCoder.defaultAbiCoder().encode(
        ["bytes", "string", "string", "tuple(uint256, uint256)", "uint256", "uint256"],
        [
            validationData.authData,
            validationData.clientDataJsonPre,
            validationData.clientDataJsonPost,
            [validationData.r, validationData.s],
            userOp.verificationGasLimit,
            userOp.preVerificationGas,
        ]
    );
    userOp.signature = ethers.solidityPacked(["uint8", "bytes"], [0, signature]);
    return await callWithEntryPoint(userOp, signer, log ?? false);
}

export async function callAsOperator(
    sender: string,
    operator: ethers.Signer,
    initCode: string,
    callData: string,
    signer: HardhatEthersSigner,
    log?: boolean
) {
    const userOp = await genUserOp(sender, initCode, callData);
    const userOpHash = await genUserOpHash(userOp);
    const signature = await operator.signMessage(ethers.getBytes(userOpHash));
    userOp.signature = ethers.solidityPacked(["uint8", "bytes"], [1, signature]);
    return await callWithEntryPoint(userOp, signer, log ?? false);
}