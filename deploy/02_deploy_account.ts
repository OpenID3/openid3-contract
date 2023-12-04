import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode, getEntryPointAddress } from "../lib/deployer";
import { getArtifact } from "../lib/utils";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const proxy = await deterministicDeploy(
        hre,
        "AccountProxy",
        genBytecode(await getArtifact(hre, "AccountProxy"), "0x"),
        hre.ethers.ZeroHash,
    );

    const accountArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [getEntryPointAddress()]
    );
    const impl = await deterministicDeploy(
        hre,
        "AccountImpl",
        genBytecode(await getArtifact(hre, "OpenId3Account"), accountArgs),
        hre.ethers.ZeroHash,
    );

    const {deployer} = await hre.ethers.getNamedSigners();
    const factoryArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "address"],
        [deployer.address, proxy.address, impl.address]
    );
    await deterministicDeploy(
        hre,
        "AccountFactory",
        genBytecode(await getArtifact(hre, "AccountFactory"), factoryArgs),
        hre.ethers.ZeroHash,
    );
}

export default func;
func.tags = ["PROD", "TEST", "ACCOUNT"];