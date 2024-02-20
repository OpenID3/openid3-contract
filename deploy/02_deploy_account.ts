import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode, getEntryPointAddress } from "../lib/deployer";
import { getArtifact, getPasskeyAdmin, getSigner } from "../lib/utils";

const getOwner = async function(hre: HardhatRuntimeEnvironment) {
    if (hre.network.name !== "hardhat") {
        return "0x8785578E922B01e25c39Fe88a485225c310d97bC";
    }
    const {deployer} = await hre.ethers.getNamedSigners();
    return deployer.address;
}

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const proxy = await deterministicDeploy(
        hre,
        "AccountProxy",
        genBytecode(await getArtifact(hre, "AccountProxy"), "0x"),
        hre.ethers.ZeroHash,
    );

    const metadata = await deterministicDeploy(
        hre,
        "AccountEventIndexer",
        genBytecode(await getArtifact(hre, "AccountEventIndexer"), "0x"),
        hre.ethers.ZeroHash,
    );

    const passkeyAdmin = await (await getPasskeyAdmin(hre)).getAddress();
    const accountArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address", "address"],
        [getEntryPointAddress(), passkeyAdmin, metadata.address]
    );
    const impl = await deterministicDeploy(
        hre,
        "AccountImpl",
        genBytecode(await getArtifact(hre, "OpenId3Account"), accountArgs),
        hre.ethers.ZeroHash,
    );

    const factoryArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [proxy.address, impl.address]
    );
    await deterministicDeploy(
        hre,
        "AccountFactory",
        genBytecode(await getArtifact(hre, "AccountFactory"), factoryArgs),
        hre.ethers.ZeroHash,
    );

    const entryPoint = getEntryPointAddress();
    const paymasterArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [entryPoint, process.env.OPENID3_OWNER]
    );
    await deterministicDeploy(
        hre,
        "SimplePaymaster",
        genBytecode(await getArtifact(hre, "SimplePaymaster"), paymasterArgs),
        hre.ethers.ZeroHash,
    );
}

export default func;
func.tags = ["ACCOUNT"];