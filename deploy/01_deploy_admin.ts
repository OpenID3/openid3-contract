import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode } from "../lib/deployer";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    await deterministicDeploy(
        hre,
        "PasskeyAdmin",
        genBytecode(await hre.artifacts.readArtifact("PasskeyAdmin"), "0x"),
        hre.ethers.ZeroHash,
    );

    const deployed = await deterministicDeploy(
        hre,
        "PlonkVerifier",
        genBytecode(await hre.artifacts.readArtifact("PlonkVerifier"), "0x"),
        hre.ethers.ZeroHash,
    );

    const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [deployed.address],
    );
    const artifact = await hre.artifacts.readArtifact("GoogleZkAdmin");
    await deterministicDeploy(
        hre,
        "GoogleZkAdmin",
        genBytecode(artifact, args),
        hre.ethers.ZeroHash,
    );
}

export default func;
func.tags = ["PROD", "TEST", "ADMIN"];