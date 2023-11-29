import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode } from "../lib/deployer";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    await deterministicDeploy(
        hre,
        "OpenId3TeeModule",
        genBytecode(await hre.artifacts.readArtifact("OpenId3TeeModule"), "0x"),
        hre.ethers.ZeroHash,
    );
}

export default func;
func.tags = ["PROD", "TEST", "VERAX"];