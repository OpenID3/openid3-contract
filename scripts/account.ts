import * as hre from "hardhat";
import { Passkey, buildPasskeyAdminData, genPasskey } from "../lib/passkey";
import { AddressLike, Contract } from "ethers";
import {
  getAccountFactory,
  getInterface,
  getOpenId3Account,
  getPasskeyAdmin,
} from "../lib/utils";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { callAsOperators, genInitCode } from "../lib/userop";
import { isContract } from "../lib/deployer";
import { secp256r1 } from "@noble/curves/p256";

const metadataUrl = "https://example.com/metadata.json";
const usdt = "0xf321DF3295620b80699f30Be9B97535cf35cAedf";
const passkey = genPasskey();

export const getPasskey = (id: string, privateKey: string): Passkey => {
  const privKey = Buffer.from(privateKey, "hex");
  const pubKey = secp256r1.getPublicKey(privKey);
  const point = secp256r1.ProjectivePoint.fromPrivateKey(privKey);
  return { privKey, pubKey, pubKeyX: point.x, pubKeyY: point.y, id };
};

const deposit = async (from: HardhatEthersSigner, to: AddressLike) => {
  const tx1 = await from.sendTransaction({
    to,
    value: hre.ethers.parseEther("1.0"),
  });
  await tx1.wait();
};

const deployAccount = async (
  admin: Contract,
  passkey: Passkey,
  operators?: string
) => {
  const accountIface = await getInterface(hre, "OpenId3Account");
  const factory = await getAccountFactory(hre);
  const { deployer } = await hre.ethers.getNamedSigners();
  const adminData = buildPasskeyAdminData(admin, passkey);
  const accountInitData = accountIface.encodeFunctionData("initialize", [
    adminData,
    operators,
    metadataUrl,
  ]);
  const salt = hre.ethers.keccak256(accountInitData);
  const cloned = await factory.predictClonedAddress(salt);
  await deposit(deployer, cloned);
  const tx = await factory.clone(accountInitData);
  await tx.wait();
  return getOpenId3Account(hre, cloned, deployer);
};

export async function deploy() {
  const { deployer, tester } = await hre.ethers.getNamedSigners();
  console.log("Deployer is: ", deployer.address);
  console.log("Tester is: ", tester.address);

  const operators = hre.ethers.solidityPacked(
    ["address", "address"],
    [deployer.address, tester.address]
  );
  const admin = await getPasskeyAdmin(hre);
  const account = await deployAccount(admin, passkey, operators);
  console.log("Account deployed at: ", account.address);
}

export async function transfer(account: string) {
  const { deployer, tester } = await hre.ethers.getNamedSigners();
  const accountIface = await getInterface(hre, "OpenId3Account");

  const artifact = await hre.artifacts.readArtifact("ERC20ForTest");
  const erc20 = new Contract(usdt, artifact.abi, deployer);
  const erc20Data = erc20.interface.encodeFunctionData("transfer", [
    tester.address,
    100,
  ]);
  const executeData = accountIface.encodeFunctionData("execute", [
    usdt,
    0,
    erc20Data,
  ]);

  const admin = await getPasskeyAdmin(hre);
  const adminData = buildPasskeyAdminData(admin, passkey);
  const accountInitData = accountIface.encodeFunctionData("initialize", [
    adminData,
    [deployer, tester],
    metadataUrl,
  ]);
  const factory = await getAccountFactory(hre);
  let initCode = "0x";
  if (await isContract(hre, account)) {
    initCode = await genInitCode(await factory.getAddress(), accountInitData);
  }
  await callAsOperators(
    account,
    [deployer, tester],
    initCode,
    executeData,
    deployer
  );
}

genPasskey();
