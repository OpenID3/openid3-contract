import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Contract, ethers } from "ethers";
import {
  getDeterministicDeployer,
  getEntryPointAddress,
  genBytecode,
} from "./deployer";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import * as fs from "fs";

export async function getAbi(hre: HardhatRuntimeEnvironment, contract: string) {
  const artifact = await hre.artifacts.readArtifact(contract);
  return artifact.abi;
}

export async function getArtifact(
  hre: HardhatRuntimeEnvironment,
  contract: string
) {
  return await hre.artifacts.readArtifact(contract);
}

export async function getInterface(
  hre: HardhatRuntimeEnvironment,
  contract: string
) {
  const artifact = await getArtifact(hre, contract);
  return new hre.ethers.Interface(artifact.abi);
}

export async function getDeployedContract(
  hre: HardhatRuntimeEnvironment,
  contract: string,
  args?: string,
  signer?: HardhatEthersSigner | ethers.Signer
) {
  const bytecode = genBytecode(await getArtifact(hre, contract), args ?? "0x");
  const admin = hre.ethers.getCreate2Address(
    getDeterministicDeployer(),
    hre.ethers.ZeroHash,
    hre.ethers.keccak256(hre.ethers.getBytes(bytecode))
  );
  if (signer) {
    return new Contract(admin, await getAbi(hre, contract), signer);
  } else {
    const { deployer } = await hre.ethers.getNamedSigners();
    return new Contract(admin, await getAbi(hre, contract), deployer);
  }
}

export async function getPasskeyAdmin(hre: HardhatRuntimeEnvironment) {
  return getDeployedContract(hre, "PasskeyAdmin");
}

export async function getVeraxModule(hre: HardhatRuntimeEnvironment) {
  return getDeployedContract(hre, "OpenId3TeeModule");
}

export async function getOpenId3KidRegistry(hre: HardhatRuntimeEnvironment) {
  const signer = new ethers.Wallet(process.env.OPENID3_OWNER_PRIV!, hre.ethers.provider);
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [signer.address]
  );
  return getDeployedContract(hre, "OpenId3KidRegistry", args, signer);
}

export async function getSimplePaymaster(hre: HardhatRuntimeEnvironment) {
  const signer = new ethers.Wallet(process.env.OPENID3_OWNER_PRIV!, hre.ethers.provider);
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [getEntryPointAddress(), signer.address]
  );
  return getDeployedContract(hre, "SimplePaymaster", args, signer);
}

export async function getEcdsaAttestationVerifier(hre: HardhatRuntimeEnvironment) {
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [process.env.OPENID3_ECDSA_SIGNER]
  );
  return getDeployedContract(hre, "Ecdsa", args);
}

export async function getEcdsaSocialAttestation(hre: HardhatRuntimeEnvironment) {
  const registry = await getOpenId3KidRegistry(hre);
  const ecsdaVerifier = await getEcdsaAttestationVerifier(hre);
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [await registry.getAddress(), await ecsdaVerifier.getAddress()],
  );
  return getDeployedContract(hre, "SocialAttestation", args);
}

export async function getSocialVoting(hre: HardhatRuntimeEnvironment) {
  return getDeployedContract(hre, "SocialVoting");
}

export async function getSocialVerification(hre: HardhatRuntimeEnvironment) {
  return getDeployedContract(hre, "SocialVerification");
}

export async function getAccountProxy(hre: HardhatRuntimeEnvironment) {
  return getDeployedContract(hre, "AccountProxy");
}

export async function getAccountMetadata(hre: HardhatRuntimeEnvironment) {
  return await getDeployedContract(hre, "AccountMetadata");
}

export async function getAccountImpl(hre: HardhatRuntimeEnvironment) {
  const admin = await getPasskeyAdmin(hre);
  const adminAddr = await admin.getAddress();
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [getEntryPointAddress(), adminAddr]
  );
  return await getDeployedContract(hre, "OpenId3Account", args);
}

export async function getAccountFactory(hre: HardhatRuntimeEnvironment) {
  const proxy = await getAccountProxy(hre);
  const impl = await getAccountImpl(hre);
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "address"],
    [await proxy.getAddress(), await impl.getAddress()]
  );
  return await getDeployedContract(hre, "AccountFactory", args);
}

export async function getEntryPoint(hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.ethers.getNamedSigners();
  return new Contract(
    getEntryPointAddress(),
    await getAbi(hre, "EntryPoint"),
    deployer
  );
}

export const getOpenId3Account = async (
  hre: HardhatRuntimeEnvironment,
  account: string,
  deployer?: HardhatEthersSigner
) => {
  const artifact = await hre.artifacts.readArtifact("OpenId3Account");
  return new Contract(account, artifact.abi, deployer ?? hre.ethers.provider);
};

export function getSigner(hre: HardhatRuntimeEnvironment) {
  const env = JSON.parse(
      fs.readFileSync(process.env.LOCAL_KEYS_PATH!, "utf8"));
  return new hre.ethers.Wallet(env.openid3, hre.ethers.provider);
}
