import {HardhatRuntimeEnvironment} from "hardhat/types";
import {DeployFunction} from "hardhat-deploy/types";
import {
    getDeterministicDeployerSigner,
    getEntryPointCreationCode,
    getSignedTxForDeterministicDeployer,
    deterministicDeploy
} from "../lib/deployer";

const func: DeployFunction = async function(hre: HardhatRuntimeEnvironment) {
    const {deployer} = await hre.ethers.getNamedSigners();

    // setup determinsitic deployer deployed at 0x4e59b44847b379578588920ca78fbf26c0b4956c
    if (hre.network.name === 'hardhat') {
        const tx1 = await deployer.sendTransaction({
            to: getDeterministicDeployerSigner(),
            value: hre.ethers.parseEther("1.0")
        });
        await tx1.wait();
        const signedTx = getSignedTxForDeterministicDeployer();
        const tx = await hre.ethers.provider.broadcastTransaction(signedTx);
        await tx.wait();
    }

    // deploy entrypoint contract at 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789
    if (hre.network.name === 'hardhat') {
        await deterministicDeploy(
            hre,
            "EntryPoint",
            getEntryPointCreationCode(),
            hre.ethers.ZeroHash,
        );
    }
}

export default func;
func.tags = ["ADMIN", "ACCOUNT", "ATTESTATION"];