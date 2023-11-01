import { expect } from "chai";
import {
    getEntryPoint,
    getPasskeyAdmin,
    getAccountFactory
} from "../lib/utils";
import * as hre from "hardhat";
import { AddressLike, Contract, Interface } from "ethers";
import { getInterface } from "../lib/utils";
import crypto from "crypto";
import * as secp from "@lionello/secp256k1-js";
import { type BN } from "bn.js";
import { OpenId3Account__factory } from "../types";

interface Passkey {
  privKey: Uint8Array,
  pubKeyX: typeof BN,
  pubKeyY: typeof BN,
}

const genPasskey = () : Passkey => {
  const privKeyBuf = crypto.randomBytes(32);
  const privKey = secp.uint256(privKeyBuf, 16);
  const pubKey = secp.generatePublicKeyFromPrivateKeyData(privKey);
  const pubKeyX = secp.uint256(pubKey.x, 16)
  const pubKeyY = secp.uint256(pubKey.y, 16)
  return { privKey, pubKeyX, pubKeyY };
}

const buildAdminData = (
  admin: Contract,
  key: Passkey
) => {
  let adminData = admin.interface.encodeFunctionData(
    "setPasskey", [
      "mypasskey",
      {
        pubKeyX: key.pubKeyX.toString(),
        pubKeyY: key.pubKeyY.toString()
      }
    ]
  );
  return hre.ethers.solidityPacked(
    ["address", "bytes"], [admin.target, adminData])
}

describe("OpenId3Account", function () {
    let entrypoint: Contract;
    let admin: Contract;
    let factory: Contract;
    let accountIface: Interface;
    let passkey: Passkey;

    const deployAccount = async(
      admin: Contract,
      passkey: Passkey,
      operator: AddressLike
    ) => {
      const adminData = buildAdminData(admin, passkey);
      const accountInitData = accountIface.encodeFunctionData(
        "initialize", [adminData, operator]);
      const deployed = await factory.predictClonedAddress(accountInitData);
      await factory.clone(accountInitData);
      return deployed;
    }
  
    beforeEach(async function () {
      await hre.deployments.fixture(["TEST"]);
      entrypoint = await getEntryPoint(hre);
      admin = await getPasskeyAdmin(hre);
      factory = await getAccountFactory(hre);
      accountIface = await getInterface(hre, "OpenId3Account");
      passkey = genPasskey();
    });
  
    it("should deploy account", async function () {
      const { deployer } = await hre.ethers.getNamedSigners();
      const adminData = buildAdminData(admin, passkey);
      const accountInitData = accountIface.encodeFunctionData(
        "initialize", [adminData, deployer.address]);

      const deployed = await factory.predictDeployedAddress(accountInitData);
      await expect(
        factory.deploy(accountInitData)
      ).to.emit(factory, "AccountDeployed").withArgs(deployed);
    
      const account = OpenId3Account__factory.connect(deployed, deployer);
      expect(await account.getMode()).to.eq(0);
      expect(await account.getAdmin()).to.eq(await admin.getAddress());
      expect(await account.getOperator()).to.eq(deployer.address);

      const keyId = hre.ethers.solidityPackedKeccak256(
        ["uint256", "uint256"],
        [passkey.pubKeyX.toString(), passkey.pubKeyY.toString()]
      );
      expect(await admin.getPasskeyId(deployed)).to.eq(keyId);
    });

    it("should clone account", async function () {
      const { deployer } = await hre.ethers.getNamedSigners();
      const adminData = buildAdminData(admin, passkey);
      const accountInitData = accountIface.encodeFunctionData(
        "initialize", [adminData, deployer.address]);

      const cloned = await factory.predictClonedAddress(accountInitData);
      await expect(
        factory.clone(accountInitData)
      ).to.emit(factory, "AccountDeployed").withArgs(cloned);

      const account = OpenId3Account__factory.connect(cloned, deployer);
      expect(await account.getMode()).to.eq(0);
      expect(await account.getAdmin()).to.eq(await admin.getAddress());
      expect(await account.getOperator()).to.eq(deployer.address);

      const keyId = hre.ethers.solidityPackedKeccak256(
        ["uint256", "uint256"],
        [passkey.pubKeyX.toString(), passkey.pubKeyY.toString()]
      );
      expect(await admin.getPasskeyId(cloned)).to.eq(keyId);
    });

    it("should reset operator", async function () {
      const { deployer, tester1 } = await hre.ethers.getNamedSigners();
      const accountAddr = await deployAccount(admin, passkey, deployer.address);

      let account = OpenId3Account__factory.connect(accountAddr, tester1);
      await expect(
        account.setOperator(tester1.address)
      ).to.be.revertedWithCustomError(account, "NotAuthorized");
    
      account = OpenId3Account__factory.connect(accountAddr, deployer);
      expect(await account.getMode()).to.eq(0); // admin mode
      await expect(
        account.setOperator(tester1.address)
      ).to.emit(account, "NewOperator").withArgs(deployer.address, tester1.address);
      expect(await account.getMode()).to.eq(1); // operator mode
    });
});
