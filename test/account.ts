import { expect } from "chai";
import {
    getEntryPoint,
    getPasskeyAdmin,
    getAccountFactory
} from "../lib/utils";
import * as hre from "hardhat";
import { AddressLike, Contract, Interface } from "ethers";
import { getInterface } from "../lib/utils";
import { OpenId3Account__factory } from "../types";
import {
  genPasskey,
  buildAdminData,
  callAsOperator,
  type Passkey,
  callAsAdmin,
} from "../lib/admin";
import { genInitCode } from "../lib/userop";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

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

    const deposit = async(from: HardhatEthersSigner, to: AddressLike) => {
      const tx1 = await from.sendTransaction({
        to,
        value: hre.ethers.parseEther("1.0")
      });
      await tx1.wait();
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
        [passkey.pubKeyX, passkey.pubKeyY]
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
        [passkey.pubKeyX, passkey.pubKeyY]
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

    it("should clone with eip4337", async function () {
      const { deployer, tester1 } = await hre.ethers.getNamedSigners();
      const adminData = buildAdminData(admin, passkey);
      const accountInitData = accountIface.encodeFunctionData(
        "initialize", [adminData, deployer.address]);
      const account = await factory.predictClonedAddress(accountInitData);
      const accountContract = OpenId3Account__factory.connect(account, tester1);
      await deposit(deployer, account);

      const initCode = await genInitCode(
        await factory.getAddress(),
        accountInitData
      );

      const newPasskey = genPasskey();
      const newAdminData = buildAdminData(admin, newPasskey);
      const setAdminData = accountIface.encodeFunctionData(
        "setAdmin", [newAdminData]);

      await expect(
        callAsOperator(
          account, deployer, initCode, setAdminData, tester1)
      ).to.emit(entrypoint, "UserOperationRevertReason");
      const keyId = hre.ethers.solidityPackedKeccak256(
        ["uint256", "uint256"],
        [passkey.pubKeyX, passkey.pubKeyY]
      );
      // passkey should not be updated
      expect(await admin.getPasskeyId(account)).to.eq(keyId);

      const setOperatorData = accountIface.encodeFunctionData(
        "setOperator", [tester1.address]);
      await expect(
        callAsOperator(
          account, deployer, "0x", setOperatorData, tester1)
      ).to.emit(accountContract, "NewOperator").withArgs(
        deployer.address, tester1.address);
      expect(await accountContract.getOperator()).to.eq(tester1.address);
    });
});
