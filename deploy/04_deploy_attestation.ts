import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode } from "../lib/deployer";
import { getArtifact } from "../lib/utils";

const allowedNetworks = ["scroll", "scroll_sepolia", "hardhat", "sepolia"];
const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    if (!allowedNetworks.includes(hre.network.name)) {
        console.log("skipping attestation deployment on network " + hre.network.name);
        return;
    }

    const registryArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [process.env.OPENID3_OWNER],
    );
    const registry = await deterministicDeploy(
        hre,
        "OpenId3KidRegistry",
        genBytecode(await getArtifact(hre, "OpenId3KidRegistry"), registryArgs),
        hre.ethers.ZeroHash,
    );

    const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [registry.address],
    );
    const attestation = await deterministicDeploy(
        hre,
        "SocialAttestation",
        genBytecode(await getArtifact(hre, "SocialAttestation"), args),
        hre.ethers.ZeroHash,
    );

    const consumerArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [attestation.address],
    );
    await deterministicDeploy(
        hre,
        "SocialVoting",
        genBytecode(await getArtifact(hre, "SocialVoting"), consumerArgs),
        hre.ethers.ZeroHash,
    );

    await deterministicDeploy(
        hre,
        "SocialVerification",
        genBytecode(await getArtifact(hre, "SocialVerification"), consumerArgs),
        hre.ethers.ZeroHash,
    );
}

export default func;
func.tags = ["ATTESTATION"];