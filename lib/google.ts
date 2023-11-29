import { Contract, ethers } from "ethers";
import { callWithEntryPoint, genUserOp, genUserOpHash } from "./userop";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

export interface JwtInput {
    kidSha256: string,
    iat: string,
    jwtHeaderAndPayloadHash: string,
    jwtSignature: string,
}

export interface OidcZkProofInput {
    jwt: JwtInput,
    circuitDigest: string,
    proof: string,
}

export const buildZkAdminData = (
    admin: Contract,
    accountHash: string,
  ) => {
    let adminData = admin.interface.encodeFunctionData(
      "linkAccount", [accountHash]
    );
    return ethers.solidityPacked(
      ["address", "bytes"], [admin.target, adminData])
}

export const buildZkValidationData = (proof: OidcZkProofInput) => {
    return ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(tuple(bytes32, string, bytes32, bytes), bytes32, bytes)"],
        [
            [
                [
                    proof.jwt.kidSha256,
                    proof.jwt.iat,
                    proof.jwt.jwtHeaderAndPayloadHash,
                    proof.jwt.jwtSignature
                ],
                proof.circuitDigest,
                proof.proof
            ]
        ]
    );
}

export async function callFromGoogle(
    sender: string,
    proof: OidcZkProofInput,
    initCode: string,
    callData: string,
    signer: HardhatEthersSigner,
    log?: boolean
) {
    const userOp = await genUserOp(sender, initCode, callData);
    const validationData = buildZkValidationData(proof);
    userOp.signature = ethers.solidityPacked(["uint8", "bytes"], [0, validationData]);
    return await callWithEntryPoint(userOp, signer, log ?? false);
}
