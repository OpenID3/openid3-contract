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
    ) => {
      const { deployer } = await hre.ethers.getNamedSigners();
      const adminData = buildAdminData(admin, passkey, "passkey1");
      const accountInitData = accountIface.encodeFunctionData(
        "initialize", [adminData, deployer.address]);
      const cloned = await factory.predictClonedAddress(accountInitData);
      await deposit(deployer, cloned);
      await factory.clone(accountInitData);
      return OpenId3Account__factory.connect(cloned, deployer);
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
      const adminData = buildAdminData(admin, passkey, "passkey1");
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
      const adminData = buildAdminData(admin, passkey, "passkey1");
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

    it("should clone via eip4337 with eth transfer", async function () {
      const { deployer, tester1 } = await hre.ethers.getNamedSigners();
      const adminData = buildAdminData(admin, passkey, "passkey1");
      const accountInitData = accountIface.encodeFunctionData(
        "initialize", [adminData, deployer.address]);
      const account = await factory.predictClonedAddress(accountInitData);
      const accountContract = OpenId3Account__factory.connect(account, tester1);
      await deposit(deployer, account);

      const initCode = await genInitCode(
        await factory.getAddress(),
        accountInitData
      );

      // transfer eth
      const setOperatorData = accountIface.encodeFunctionData(
        "execute", [tester1.address, 0, "0x"]);
      await expect(
        callAsOperator(
          account, deployer, initCode, setOperatorData, tester1)
      ).to.emit(factory, "AccountDeployed").withArgs(account)
      .to.emit(accountContract, "NewOperator").withArgs(
        hre.ethers.ZeroAddress, deployer.address)
      .to.emit(accountContract, "NewAdmin").withArgs(
        hre.ethers.ZeroAddress, await admin.getAddress());
    });

    it("should reset operator properly", async function () {
      const { deployer, tester1 } = await hre.ethers.getNamedSigners();
      const account = await deployAccount(admin, passkey);
      expect(await account.getMode()).to.eq(0); // admin mode
      expect(await account.getOperator()).to.eq(deployer.address);

      // tester cannot set operator since it's neither operator nor admin
      await expect(
        account.connect(tester1).setOperator(tester1.address)
      ).to.be.revertedWithCustomError(account, "NotAuthorized");
      expect(await account.getMode()).to.eq(0); // admin mode
      // operator should not be updated
      expect(await account.getOperator()).to.eq(deployer.address);

      // operator can not set operator directly
      await expect(
        account.connect(deployer).setOperator(tester1.address)
      ).to.be.revertedWithCustomError(account, "NotAuthorized");
      expect(await account.getMode()).to.eq(0); // admin mode
      expect(await account.getOperator()).to.eq(deployer.address);

      // now deployer is operator, let's set it tester1 via EIP-4337
      const accountAddr = await account.getAddress();
      const setOperatorData1 = accountIface.encodeFunctionData(
        "setOperator", [tester1.address]);
      await expect(
        callAsOperator(
          accountAddr, deployer, "0x", setOperatorData1, deployer)
      ).to.emit(account, "NewOperator").withArgs(
        deployer.address, tester1.address);
      expect(await account.getOperator()).to.eq(tester1.address);
      expect(await account.getMode()).to.eq(1); // operator mode

      // now tester1 is operator, admin can set it to deployer
      const setOperatorData2 = accountIface.encodeFunctionData(
        "setOperator", [deployer.address]);
      await expect(
        callAsAdmin(
          accountAddr, passkey, "0x", setOperatorData2, deployer)
      ).to.emit(account, "NewOperator").withArgs(
        tester1.address, deployer.address);
      expect(await account.getOperator()).to.eq(deployer.address);
      expect(await account.getMode()).to.eq(0); // admin mode

      // now deployer is operator, let's set it to tester1 via EIP-4337 execute
      const executeData1 = account.interface.encodeFunctionData(
        "execute", [accountAddr, 0, setOperatorData1]);
      await expect(
        callAsOperator(
          accountAddr, deployer, "0x", executeData1, tester1)
      ).to.emit(account, "NewOperator").withArgs(
        deployer.address, tester1.address);
      expect(await account.getOperator()).to.eq(tester1.address);
      expect(await account.getMode()).to.eq(1); // operator mode

      // now tester1 is operator, let's set it to deployer via EIP-4337 execute
      const executeData2 = account.interface.encodeFunctionData(
        "execute", [accountAddr, 0, setOperatorData2]);
      await expect(
        callAsAdmin(
          accountAddr, passkey, "0x", executeData2, tester1)
      ).to.emit(account, "NewOperator").withArgs(
        tester1.address, deployer.address);
      expect(await account.getOperator()).to.eq(deployer.address);
      expect(await account.getMode()).to.eq(0); // admin mode
    });

    it("should reset admin properly", async function () {
      const { deployer, tester1 } = await hre.ethers.getNamedSigners();
      const account = await deployAccount(admin, passkey);
      const accountAddr = await account.getAddress();
      const adminAddr = await admin.getAddress();
      expect(await account.getMode()).to.eq(0); // admin mode
      expect(await account.getAdmin()).to.eq(adminAddr);

      const passkey2 = genPasskey();
      const newAdminData = buildAdminData(admin, passkey2, "passkey2");
      let setAdminData = accountIface.encodeFunctionData(
        "setAdmin", [newAdminData]);
      const newKeyId = hre.ethers.solidityPackedKeccak256(
        ["uint256", "uint256"],
        [passkey2.pubKeyX, passkey2.pubKeyY]
      );

      // tester cannot set admin
      await expect(
        account.connect(tester1).setAdmin(newAdminData)
      ).to.be.revertedWithCustomError(account, "NotAuthorized");

      // operator can not set admin
      await expect(
        account.connect(tester1).setAdmin(newAdminData)
      ).to.be.revertedWithCustomError(account, "NotAuthorized");

      // operator cannot set admin via EIP-4337, but the mode
      // will be updated since validateSignature is called
      await expect(
        callAsOperator(
          accountAddr, deployer, "0x", setAdminData, tester1)
      ).to.emit(entrypoint, "UserOperationRevertReason");
      expect(await account.getMode()).to.eq(1); // operator mode

      // admin can set admin via EIP-4337
      await expect(
        callAsAdmin(
          accountAddr, passkey, "0x", setAdminData, deployer)
      ).to.emit(admin, "PasskeySet").withArgs(
        accountAddr, newKeyId, "passkey2", [passkey2.pubKeyX, passkey2.pubKeyY]);

      // operator cannot set admin via EIP-4337 execute, but the mode
      // will be updated since validateSignature is called
      const adminData = buildAdminData(admin, passkey, "passkey1");
      setAdminData = accountIface.encodeFunctionData(
        "setAdmin", [adminData]);
      const executeData = account.interface.encodeFunctionData(
        "execute", [accountAddr, 0, setAdminData]);
      await expect(
        callAsOperator(
          accountAddr, deployer, "0x", executeData, deployer)
      ).to.emit(entrypoint, "UserOperationRevertReason")
      expect(await account.getMode()).to.eq(1); // operator mode

      // admin can set admin via EIP-4337 execute
      const keyId = hre.ethers.solidityPackedKeccak256(
        ["uint256", "uint256"],
        [passkey.pubKeyX, passkey.pubKeyY]
      );
      await expect(
        callAsAdmin(
          accountAddr, passkey2, "0x", executeData, deployer)
      ).to.emit(admin, "PasskeySet").withArgs(
        accountAddr, keyId, "passkey1", [passkey.pubKeyX, passkey.pubKeyY]);
    });

    it("should upgrade contract properly", async function () {
      const { deployer, tester1 } = await hre.ethers.getNamedSigners();
      const account = await deployAccount(admin, passkey);
      const accountAddr = await account.getAddress();
      const oldImpl = await account.implementation();
      const newImpl = (await hre.deployments.deploy(
        "OpenId3AccountV2ForTest",
        {
          from: deployer.address,
          args: [await account.entryPoint()],
        }
      )).address;

      // cannot reinitalize the proxy
      const accountProxy = await hre.ethers.getContractAt(
        "AccountProxy",
        accountAddr
      );
      await expect(
        accountProxy.initProxy(newImpl, '0x')
      ).to.be.revertedWithCustomError(accountProxy, "AlreadyInitiated");
  
      // cannot upgrade without EIP-4337
      await expect(
        account.connect(deployer).upgradeTo(newImpl)
      ).to.be.revertedWithCustomError(account, "NotAuthorized");
  
      // operator cannot upgrade
      const upgradeData = account.interface.encodeFunctionData(
        "upgradeTo", [newImpl]);
      const executeData = account.interface.encodeFunctionData(
        "execute", [accountAddr, 0, upgradeData]);
      expect(
        await callAsOperator(
          accountAddr, deployer, "0x", executeData, deployer)
      ).to.emit(entrypoint, "UserOperationRevertReason");
      expect(await account.getMode()).to.eq(1); // operator mode
      expect(await account.implementation()).to.eq(oldImpl); // not upgraded

      // admin can upgrade
      expect(
        await callAsAdmin(
          accountAddr, passkey, "0x", executeData, deployer)
      ).to.emit(account, "Upgraded").withArgs(newImpl);
      expect(await account.getMode()).to.eq(0); // admin mode
      expect(await account.implementation()).to.eq(newImpl); // upgraded
    });
});
