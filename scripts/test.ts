import { ethers } from "ethers";
import * as hre from "hardhat";
import { AccountFactory__factory, ERC20__factory, OpenId3Account__factory } from "../types";
import { getEntryPoint } from "../lib/utils";
import { UserOperationStruct, genUserOpHash } from "../lib/userop";

const TO = "0x271f70ed8b8154010d06ce809d78f8a2665efed9";
const FACTORY = "0xB95FDc1ade5F16B78e8944914Fed678fd41F2B24";
export async function deployAccount() {
    const {deployer} = await hre.ethers.getNamedSigners();
    const factory = AccountFactory__factory.connect(FACTORY, deployer);
    const adminData = ethers.solidityPacked(
        ["address", "bytes"],
        [deployer.address, "0x"]
    );
    const accountData = OpenId3Account__factory.createInterface().encodeFunctionData(
        "initialize",
        [adminData, deployer.address, ""]
    )
    const tx = await factory.clone(accountData);
    await tx.wait();
    const salt = ethers.keccak256(ethers.getBytes(accountData));
    const accountAddr = await factory.predictClonedAddress(salt);
    console.log("Account deployed at: ", accountAddr);

    const account = OpenId3Account__factory.connect(accountAddr, deployer);
    console.log("Admin is ", await account.getAdmin());
    console.log("Operator is ", await account.getOperator());
    await deployer.sendTransaction({
        to: account,
        value: hre.ethers.parseEther("0.1")
    });
}

export async function checkAccount(accountAddr: string) {
    const {deployer} = await hre.ethers.getNamedSigners();
    const account = OpenId3Account__factory.connect(accountAddr, deployer);
    console.log("Admin is ", await account.getAdmin());
    console.log("Operator is ", await account.getOperator());
    await deployer.sendTransaction({
        to: account,
        value: hre.ethers.parseEther("0.1")
    });
}

export async function callHandlerOps(accountAddr: string) {
    const signer = new hre.ethers.Wallet("0x4700701e3cdd5484487bd9b3d0e7d26af5b310a57bfe994a60cf18dc0aaca149");
    const {deployer} = await hre.ethers.getNamedSigners();
    console.log("Deployer is: ", signer.address);

    const account = OpenId3Account__factory.connect(accountAddr, signer);
    const entrypoint = await getEntryPoint(hre);
    const usdt = "0x7439E9Bb6D8a84dd3A23fe621A30F95403F87fB9";
    const erc20CallData = ERC20__factory.createInterface().encodeFunctionData(
        "transfer",
        [TO, ethers.parseEther("0.1")]
    );
    const callData = OpenId3Account__factory.createInterface().encodeFunctionData(
        "execute",
        [usdt, 0, erc20CallData]
    );
    const feeData = await hre.ethers.provider.getFeeData();
    const op = {
        sender: accountAddr,
        nonce: await account.getNonce(),
        initCode: "0x",
        callData,
        callGasLimit: 500000,
        verificationGasLimit: 500000,
        preVerificationGas: 50000,
        maxFeePerGas: feeData.maxFeePerGas,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        paymasterAndData: "0x",
        signature: "",
    } as UserOperationStruct;
    const userOpHash = await genUserOpHash(op);
    const signature = await signer.signMessage(ethers.getBytes(userOpHash));
    const signedOp = {
        ...op,
        signature: ethers.solidityPacked(["uint8", "bytes"], [1, signature])
    }
    await entrypoint.handleOps([signedOp], deployer.address);
}

// deployAccount();
checkAccount("0x74c085703e68148e114b90c074710f20f9ccad23");
// callHandlerOps("0x74c085703e68148e114b90c074710f20f9ccad23");