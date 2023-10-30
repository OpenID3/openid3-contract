import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode } from "../lib/deployer";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const artifact = await hre.artifacts.readArtifact("PasskeyAdmin");
    await deterministicDeploy(
        hre,
        "PasskeyAdmin",
        genBytecode(artifact, "0x"),
        hre.ethers.ZeroHash,
    );
}

export default func;
func.tags = ["PROD", "TEST", "ADMIN"];