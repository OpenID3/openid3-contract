import { HardhatRuntimeEnvironment } from 'hardhat/types';
import * as config from '../config.json';
import { Contract } from 'ethers';
import { getEntryPointAddress } from './deployer';

export async function getAbi(
    hre: HardhatRuntimeEnvironment,
    contract: string
) {
    const artifact = await hre.artifacts.readArtifact(contract);
    return  artifact.abi;
}

export function loadConfig(hre: HardhatRuntimeEnvironment, key: string) : string {
    return (config as any)[key];
  }

export async function getPasskeyAdmin(hre: HardhatRuntimeEnvironment) {
    let admin = loadConfig(hre, "passkeyAdmin");
    const { deployer } = await hre.ethers.getNamedSigners();
    return new Contract(
      admin,
      await getAbi(hre, "PasskeyAdmin"),
      deployer
    );
}

export async function getEntryPoint(hre: HardhatRuntimeEnvironment) {
    const { deployer } = await hre.ethers.getNamedSigners();
    return new Contract(
      getEntryPointAddress(),
      await getAbi(hre, "EntryPoint"),
      deployer
    );
}

export async function getAccountFactory(hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.ethers.getNamedSigners();
  return new Contract(
    getEntryPointAddress(),
    await getAbi(hre, "AccountFactory"),
    deployer
  );
}
