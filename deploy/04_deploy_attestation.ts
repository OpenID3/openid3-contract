import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import { deterministicDeploy, genBytecode } from "../lib/deployer";
import { getArtifact } from "../lib/utils";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const verifier = await deterministicDeploy(
        hre,
        "PlonkVerifier",
        genBytecode(await hre.artifacts.readArtifact("PlonkVerifier"), "0x"),
        hre.ethers.ZeroHash,
    );
    const verifierArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [verifier.address],
    );
    const zkverifier = await deterministicDeploy(
        hre,
        "ZkAttestationVerifier",
        genBytecode(await getArtifact(hre, "ZkAttestationVerifier"), verifierArgs),
        hre.ethers.ZeroHash,
    );

    const {deployer} = await hre.ethers.getNamedSigners();
    const registryArgs = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [deployer.address],
    );
    const registry = await deterministicDeploy(
        hre,
        "OpenId3KidRegistry",
        genBytecode(await getArtifact(hre, "OpenId3KidRegistry"), registryArgs),
        hre.ethers.ZeroHash,
    );

    const args = hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [registry.address, zkverifier.address],
    );
    await deterministicDeploy(
        hre,
        "SocialAttestation",
        genBytecode(await getArtifact(hre, "SocialAttestation"), args),
        hre.ethers.ZeroHash,
    );

    await deterministicDeploy(
        hre,
        "SocialVoting",
        genBytecode(await getArtifact(hre, "SocialVoting"), args),
        hre.ethers.ZeroHash,
    );
}

export default func;
func.tags = ["ATTESTATION"];