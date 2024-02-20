import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode } from "../lib/deployer";
import { ethers } from "ethers";
import { getSigner } from "../lib/utils";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    if (hre.network.name === "linea" || hre.network.name === "linea_test") {
        const deployer = getSigner(hre);
        const args = ethers.AbiCoder.defaultAbiCoder().encode(
            ["address"],
            ["0xf3b4e49Fd77A959B704f6a045eeA92bd55b3b571"]
        );
        const feeData = await hre.ethers.provider.getFeeData();
        await deterministicDeploy(
            hre,
            "OpenId3TeeModule",
            genBytecode(await hre.artifacts.readArtifact("OpenId3TeeModule"), args),
            hre.ethers.ZeroHash,
            deployer,
            feeData.gasPrice!,
        );
    } else {
        console.log("Skipping verax deploy on unsupported network");
    }
}

export default func;
func.tags = ["VERAX"];