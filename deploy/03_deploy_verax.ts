import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode } from "../lib/deployer";
import * as fs from "fs";
import { ethers } from "ethers";

function getSigner(hre: HardhatRuntimeEnvironment) {
    if (hre.network.name === "linea" || hre.network.name === "linea_test") {
        const env = JSON.parse(
            fs.readFileSync(process.env.LOCAL_KEYS_PATH!, "utf8"));
        return new hre.ethers.Wallet(env.openid3, hre.ethers.provider);
    } else {
        return 
    }
}

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
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
        feeData.maxFeePerGas!,
    );
}

export default func;
func.tags = ["VERAX"];