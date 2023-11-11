import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { Contract } from 'ethers';
import {
  getDeterministicDeployer,
  getEntryPointAddress,
  genBytecode
} from './deployer';
import { AUD_SHA256 } from './google';

export async function getAbi(
    hre: HardhatRuntimeEnvironment,
    contract: string
) {
    const artifact = await hre.artifacts.readArtifact(contract);
    return  artifact.abi;
}

export async function getArtifact(hre: HardhatRuntimeEnvironment, contract: string) {
  return await hre.artifacts.readArtifact(contract);
}

export async function getInterface(hre: HardhatRuntimeEnvironment, contract: string) {
  const artifact = await getArtifact(hre, contract);
  return new hre.ethers.Interface(artifact.abi);
}

export async function getDeployedContract(
  hre: HardhatRuntimeEnvironment,
  contract: string,
  args?: string
) {
  const bytecode = genBytecode(await getArtifact(hre, contract), args ?? "0x")
  const admin = hre.ethers.getCreate2Address(
    getDeterministicDeployer(),
    hre.ethers.ZeroHash,
    hre.ethers.keccak256(hre.ethers.getBytes(bytecode))
  );
  const { deployer } = await hre.ethers.getNamedSigners();
  return new Contract(
    admin,
    await getAbi(hre, contract),
    deployer
  );
}

export async function getPasskeyAdmin(hre: HardhatRuntimeEnvironment) {
  return await getDeployedContract(hre, "PasskeyAdmin");
}

export async function getPlonkVerifier(hre: HardhatRuntimeEnvironment) {
  return await getDeployedContract(hre, "PlonkVerifier");
}

export async function getGoogleZkAdmin(hre: HardhatRuntimeEnvironment) {
  const verifier = await getPlonkVerifier(hre);
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address", "bytes32"],
    [await verifier.getAddress(), AUD_SHA256]
  );
  return await getDeployedContract(hre, "GoogleZkAdmin", args);
}

export async function getAccountProxy(hre: HardhatRuntimeEnvironment) {
  return await getDeployedContract(hre, "AccountProxy");
}

export async function getAccountImpl(hre: HardhatRuntimeEnvironment) {
  const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address"],
    [getEntryPointAddress()]
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
