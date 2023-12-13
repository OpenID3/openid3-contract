import { expect } from "chai";
import {
  getEntryPoint,
  getPasskeyAdmin,
  getAccountFactory,
} from "../lib/utils";
import * as hre from "hardhat";
import { AddressLike, Contract, Interface } from "ethers";
import { getInterface } from "../lib/utils";
import {
  OpenId3Account__factory,
  ERC20ForTest__factory,
  ERC721ForTest__factory,
  ERC1155ForTest__factory,
  AccountManager__factory,
} from "../types";
import {
  genPasskey,
  buildPasskeyAdminData,
  type Passkey,
  callFromPasskey,
  buildPasskeyAdminCallData,
} from "../lib/passkey";
import { genInitCode, callAsAccountManager } from "../lib/userop";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const metadata = hre.ethers.toUtf8Bytes("metadata");

const buildDefaultOperatorData = (operator: HardhatEthersSigner) => {
  const opData = buildOperatorCallData(operator, true);
  return buildOperatorData(hre.ethers.ZeroAddress, opData);
}

const buildOperatorData = (operator: string, data: string) => {
  return hre.ethers.solidityPacked(["address", "bytes"], [operator, data]);
};

const buildOperatorCallData = (
  operator: HardhatEthersSigner,
  enabled: boolean,
  validAfter?: number,
  validUntil?: number
) => {
  return AccountManager__factory.createInterface().encodeFunctionData(
    "grant",
    [operator.address, {
      enabled,
      validAfter: validAfter || 0,
      validUntil: validUntil || 0,
    }]
  );
};

describe("OpenId3Account", function () {
  let entrypoint: Contract;
  let admin: Contract;
  let factory: Contract;
  let accountIface: Interface;
  let passkey: Passkey;

  const deployErc20 = async (supply: number) => {
    const { deployer } = await hre.ethers.getNamedSigners();
    const deployed = await hre.deployments.deploy("ERC20ForTest", {
      from: deployer.address,
      args: ["TestERC20", "TST", supply],
    });
    return ERC20ForTest__factory.connect(deployed.address, deployer);
  };

  const deployErc721 = async () => {
    const { deployer } = await hre.ethers.getNamedSigners();
    const deployed = await hre.deployments.deploy("ERC721ForTest", {
      from: deployer.address,
      args: ["TestErc721", "TST"],
    });
    return ERC721ForTest__factory.connect(deployed.address, deployer);
  };

  const deployErc1155 = async () => {
    const { deployer } = await hre.ethers.getNamedSigners();
    const deployed = await hre.deployments.deploy("ERC1155ForTest", {
      from: deployer.address,
      log: true,
      autoMine: true,
    });
    return ERC1155ForTest__factory.connect(
      deployed.address,
      hre.ethers.provider
    );
  };

  const getAccountAddr = async (admin: Contract, passkey: Passkey) => {
    const { deployer } = await hre.ethers.getNamedSigners();
    const adminData = buildPasskeyAdminData(admin, passkey);
    const accountInitData = accountIface.encodeFunctionData("initialize", [
      adminData,
      hre.ethers.ZeroAddress,
      metadata,
    ]);
    const salt = hre.ethers.keccak256(accountInitData);
    return await factory.predictClonedAddress(salt);
  };

  const deployAccount = async (admin: Contract, passkey: Passkey) => {
    const { deployer } = await hre.ethers.getNamedSigners();
    const adminData = buildPasskeyAdminData(admin, passkey);
    const opCallData = buildOperatorCallData(true);
    const defaultOpData = buildOperatorData(deployer.address, opCallData);
    const accountInitData = accountIface.encodeFunctionData("initialize", [
      adminData,
      defaultOpData,
      metadata,
    ]);
    const salt = hre.ethers.keccak256(accountInitData);
    const cloned = await factory.predictClonedAddress(salt);
    await deposit(deployer, cloned);
    await factory.clone(accountInitData);
    return OpenId3Account__factory.connect(cloned, deployer);
  };

  const deposit = async (from: HardhatEthersSigner, to: AddressLike) => {
    const tx1 = await from.sendTransaction({
      to,
      value: hre.ethers.parseEther("1.0"),
    });
    await tx1.wait();
  };

  beforeEach(async function () {
    await hre.deployments.fixture(["TEST"]);
    entrypoint = await getEntryPoint(hre);
    admin = await getPasskeyAdmin(hre);
    factory = await getAccountFactory(hre);
    accountIface = await getInterface(hre, "OpenId3Account");
    passkey = genPasskey();
  });

  it.only("should deploy account", async function () {
    const { deployer } = await hre.ethers.getNamedSigners();
    const adminData = buildPasskeyAdminData(admin, passkey);
    const accountInitData = accountIface.encodeFunctionData(
      "initialize", [
        adminData,
        buildDefaultOperatorData(),
        metadata,
      ]
    );

    const deployed = await factory.predictDeployedAddress(accountInitData);
    await expect(factory.deploy(accountInitData))
      .to.emit(factory, "AccountDeployed")
      .withArgs(deployed);

    const account = OpenId3Account__factory.connect(deployed, deployer);
    expect(await account.getMode()).to.eq(0);
    expect(await account.getAdmin()).to.eq(await admin.getAddress());
    const manager = AccountManager__factory.connect(
      await account.getOperator(),
      deployer
    );
    expect(
      await manager.getValidationData(deployed, deployer.address)
    ).to.eq([true, 0n, 0n]);

    const keyId = hre.ethers.solidityPackedKeccak256(
      ["uint256", "uint256"],
      [passkey.pubKeyX, passkey.pubKeyY]
    );
    expect(await admin.getPasskeyId(deployed)).to.eq(keyId);
  });

  it("should clone account with admin only", async function () {
    const { deployer } = await hre.ethers.getNamedSigners();
    const adminData = buildPasskeyAdminData(admin, passkey);

    const salt = hre.ethers.keccak256(adminData);
    const cloned = await factory.predictClonedAddress(salt);
    await expect(factory.cloneWithAdminOnly(adminData))
      .to.emit(factory, "AccountDeployed")
      .withArgs(cloned);

    const account = OpenId3Account__factory.connect(cloned, deployer);
    const manager = AccountManager__factory.connect(
      await account.getOperator(),
      deployer
    );
    expect(await account.getMode()).to.eq(0);
    expect(await account.getAdmin()).to.eq(await admin.getAddress());
    expect(await manager.getValidationData(cloned, deployer.address)).to.eq(
      hre.ethers.ZeroHash
    );

    const keyId = hre.ethers.solidityPackedKeccak256(
      ["uint256", "uint256"],
      [passkey.pubKeyX, passkey.pubKeyY]
    );
    expect(await admin.getPasskeyId(cloned)).to.eq(keyId);
  });

  it("should clone account", async function () {
    const { deployer } = await hre.ethers.getNamedSigners();
    const adminData = buildPasskeyAdminData(admin, passkey);
    const accountInitData = accountIface.encodeFunctionData("initialize", [
      adminData,
      deployer.address,
      metadata,
    ]);

    const salt = hre.ethers.keccak256(accountInitData);
    const cloned = await factory.predictClonedAddress(salt);
    await expect(factory.clone(accountInitData))
      .to.emit(factory, "AccountDeployed")
      .withArgs(cloned);

    const account = OpenId3Account__factory.connect(cloned, deployer);
    const manager = AccountManager__factory.connect(
      await account.getOperator(),
      deployer
    );
    expect(await account.getMode()).to.eq(0);
    expect(await account.getAdmin()).to.eq(await admin.getAddress());
    expect(await manager.getValidationData(cloned, deployer.address)).to.eq(
      deployer.address
    );

    const keyId = hre.ethers.solidityPackedKeccak256(
      ["uint256", "uint256"],
      [passkey.pubKeyX, passkey.pubKeyY]
    );
    expect(await admin.getPasskeyId(cloned)).to.eq(keyId);
  });

  it("should clone via eip4337 with eth transfer", async function () {
    const { deployer, tester1 } = await hre.ethers.getNamedSigners();
    const adminData = buildPasskeyAdminData(admin, passkey);
    const accountInitData = accountIface.encodeFunctionData("initialize", [
      adminData,
      deployer.address,
      metadata,
    ]);
    const salt = hre.ethers.keccak256(accountInitData);
    const account = await factory.predictClonedAddress(salt);
    const accountContract = OpenId3Account__factory.connect(account, tester1);
    await deposit(deployer, account);

    const initCode = await genInitCode(
      await factory.getAddress(),
      accountInitData
    );

    // transfer eth
    const setOperatorData = accountIface.encodeFunctionData("execute", [
      tester1.address,
      0,
      "0x",
    ]);
    const accountImpl = OpenId3Account__factory.connect(
      await factory.accountImpl(),
      deployer
    );
    const manager = AccountManager__factory.connect(
      await accountImpl.getOperator(),
      deployer
    );
    await expect(
      callAsAccountManager(
        account,
        deployer,
        initCode,
        setOperatorData,
        tester1
      )
    )
      .to.emit(factory, "AccountDeployed")
      .withArgs(account)
      .to.emit(manager, "Grant")
      .withArgs(account, deployer.address);
  });

  it("should reset operator properly", async function () {
    const { deployer, tester1 } = await hre.ethers.getNamedSigners();
    const account = await deployAccount(admin, passkey);
    const manager = AccountManager__factory.connect(
      await account.getOperator(),
      deployer
    );
    expect(await account.getMode()).to.eq(0); // admin mode
    const accountAddr = await account.getAddress();
    expect(
      await manager.getValidationData(accountAddr, deployer.address)
    ).to.eq(deployer.address);

    const grantData = manager.interface.encodeFunctionData("grant", [
      tester1.address,
    ]);
    // current operator can not set operator directly
    await expect(
      account
        .connect(deployer)
        .execute(await manager.getAddress(), 0, grantData)
    ).to.be.revertedWithCustomError(account, "NotAuthorized");
    expect(await account.getMode()).to.eq(0); // admin mode
    expect(
      await manager.getValidationData(accountAddr, deployer.address)
    ).to.eq(deployer.address);

    // current operator cannot set operator via ERC-4337
    const executeData = account.interface.encodeFunctionData("execute", [
      await manager.getAddress(),
      0,
      grantData,
    ]);
    await expect(
      callAsAccountManager(accountAddr, deployer, "0x", executeData, deployer)
    ).to.emit(entrypoint, "UserOperationRevertReason");
    expect(
      await manager.getValidationData(accountAddr, deployer.address)
    ).to.eq(deployer.address);
    expect(await account.getMode()).to.eq(1); // operator mode

    // admin can set operator
    await expect(
      callFromPasskey(accountAddr, passkey, "0x", executeData, tester1)
    )
      .to.emit(manager, "Grant")
      .withArgs(accountAddr, deployer.address);
    expect(await manager.getValidationData(accountAddr, tester1.address)).to.eq(
      tester1.address
    );
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
    const newAdminData = buildPasskeyAdminCallData(admin, passkey2);
    let setAdminData = accountIface.encodeFunctionData("setAdmin", [
      newAdminData,
    ]);
    const newKeyId = hre.ethers.solidityPackedKeccak256(
      ["uint256", "uint256"],
      [passkey2.pubKeyX, passkey2.pubKeyY]
    );

    // tester cannot set admin
    await expect(
      account.connect(tester1).setAdmin(adminAddr, newAdminData)
    ).to.be.revertedWithCustomError(account, "NotAuthorized");

    // operator can not set admin
    await expect(
      account.connect(tester1).setAdmin(adminAddr, newAdminData)
    ).to.be.revertedWithCustomError(account, "NotAuthorized");

    // operator cannot set admin via EIP-4337, but the mode
    // will be updated since validateSignature is called
    await expect(
      callAsAccountManager(accountAddr, deployer, "0x", setAdminData, tester1)
    ).to.emit(entrypoint, "UserOperationRevertReason");
    expect(await account.getMode()).to.eq(1); // operator mode

    // admin can set admin via EIP-4337
    await expect(
      callFromPasskey(accountAddr, passkey, "0x", setAdminData, deployer)
    )
      .to.emit(admin, "PasskeySet")
      .withArgs(
        accountAddr,
        newKeyId,
        [passkey2.pubKeyX, passkey2.pubKeyY],
        passkey2.id
      );

    // operator cannot set admin via EIP-4337 execute, but the mode
    // will be updated since validateSignature is called
    const adminData = buildPasskeyAdminCallData(admin, passkey);
    setAdminData = accountIface.encodeFunctionData("setAdmin", [
      adminAddr,
      adminData,
    ]);
    const executeData = account.interface.encodeFunctionData("execute", [
      accountAddr,
      0,
      setAdminData,
    ]);
    await expect(
      callAsAccountManager(accountAddr, deployer, "0x", executeData, deployer)
    ).to.emit(entrypoint, "UserOperationRevertReason");
    expect(await account.getMode()).to.eq(1); // operator mode

    // admin can set admin via EIP-4337 execute
    const keyId = hre.ethers.solidityPackedKeccak256(
      ["uint256", "uint256"],
      [passkey.pubKeyX, passkey.pubKeyY]
    );
    await expect(
      callFromPasskey(accountAddr, passkey2, "0x", executeData, deployer)
    )
      .to.emit(admin, "PasskeySet")
      .withArgs(
        accountAddr,
        keyId,
        [passkey.pubKeyX, passkey.pubKeyY],
        passkey.id
      );
  });

  it("should upgrade contract properly", async function () {
    const { deployer } = await hre.ethers.getNamedSigners();
    const account = await deployAccount(admin, passkey);
    const accountAddr = await account.getAddress();
    const oldImpl = await account.implementation();
    const newImpl = (
      await hre.deployments.deploy("OpenId3AccountV2ForTest", {
        from: deployer.address,
        args: [await account.entryPoint()],
      })
    ).address;

    // cannot reinitalize the proxy
    const accountProxy = await hre.ethers.getContractAt(
      "AccountProxy",
      accountAddr
    );
    await expect(
      accountProxy.initProxy(newImpl, "0x")
    ).to.be.revertedWithCustomError(accountProxy, "AlreadyInitiated");

    // cannot upgrade without EIP-4337
    await expect(
      account.connect(deployer).upgradeTo(newImpl)
    ).to.be.revertedWithCustomError(account, "NotAuthorized");

    // operator cannot upgrade
    const upgradeData = account.interface.encodeFunctionData("upgradeTo", [
      newImpl,
    ]);
    const executeData = account.interface.encodeFunctionData("execute", [
      accountAddr,
      0,
      upgradeData,
    ]);
    expect(
      await callAsAccountManager(
        accountAddr,
        deployer,
        "0x",
        executeData,
        deployer
      )
    ).to.emit(entrypoint, "UserOperationRevertReason");
    expect(await account.getMode()).to.eq(1); // operator mode
    expect(await account.implementation()).to.eq(oldImpl); // not upgraded

    // admin can upgrade
    expect(
      await callFromPasskey(accountAddr, passkey, "0x", executeData, deployer)
    )
      .to.emit(account, "Upgraded")
      .withArgs(newImpl);
    expect(await account.getMode()).to.eq(0); // admin mode
    expect(await account.implementation()).to.eq(newImpl); // upgraded
  });

  it("should hold and transfer ERC20 and eth properly", async function () {
    const { deployer, tester1, tester2 } = await hre.ethers.getNamedSigners();
    const accountAddr = await getAccountAddr(admin, passkey);

    // receive erc20 before account created
    const erc20 = await deployErc20(10000);
    const erc20Addr = await erc20.getAddress();
    await erc20.connect(deployer).transfer(accountAddr, 1000);
    expect(await erc20.balanceOf(accountAddr)).to.eq(1000);

    // receive eth before account created
    await deposit(deployer, accountAddr);
    expect(await hre.ethers.provider.getBalance(accountAddr)).to.eq(
      hre.ethers.parseEther("1.0")
    );

    // deploy account
    const account = await deployAccount(admin, passkey);

    // transfer erc20 token
    const erc20Data = erc20.interface.encodeFunctionData("transfer", [
      tester1.address,
      100,
    ]);
    const executeData = account.interface.encodeFunctionData("execute", [
      erc20Addr,
      0,
      erc20Data,
    ]);
    await expect(
      callAsAccountManager(accountAddr, deployer, "0x", executeData, tester1)
    )
      .to.emit(erc20, "Transfer")
      .withArgs(accountAddr, tester1.address, 100);
    expect(await erc20.balanceOf(accountAddr)).to.eq(900);
    expect(await erc20.balanceOf(tester1.address)).to.eq(100);

    // batch erc20 transfer with eth transfer
    const erc20Data2 = erc20.interface.encodeFunctionData("transfer", [
      tester2.address,
      100,
    ]);
    const ethAmount = hre.ethers.parseEther("0.1");
    const executeBatchData = account.interface.encodeFunctionData(
      "executeBatch",
      [
        [erc20Addr, erc20Addr, hre.ethers.ZeroAddress],
        [0, 0, ethAmount],
        [erc20Data, erc20Data2, "0x"],
      ]
    );
    await expect(
      callAsAccountManager(
        accountAddr,
        deployer,
        "0x",
        executeBatchData,
        tester1
      )
    )
      .to.emit(erc20, "Transfer")
      .withArgs(accountAddr, tester1.address, 100)
      .to.emit(erc20, "Transfer")
      .withArgs(accountAddr, tester2.address, 100);
    expect(await erc20.balanceOf(accountAddr)).to.eq(700);
    expect(await erc20.balanceOf(tester1.address)).to.eq(200);
    expect(await erc20.balanceOf(tester2.address)).to.eq(100);
    expect(await hre.ethers.provider.getBalance(hre.ethers.ZeroAddress)).to.eq(
      ethAmount
    );

    // reset operator with expired timestamp
    const epoch = Math.floor(Date.now() / 1000);
    const newOperator = buildOperator(deployer, 0, epoch - 1800);
    const manager = AccountManager__factory.connect(
      await account.getOperator(),
      deployer
    );
    const executeData1 = account.interface.encodeFunctionData("execute", [
      accountAddr,
      0,
      manager.interface.encodeFunctionData("grant", [
        deployer.address,
        newOperator,
      ]),
    ]);
    await expect(
      callFromPasskey(accountAddr, passkey, "0x", executeData1, tester1)
    )
      .to.emit(manager, "Grant")
      .withArgs(accountAddr, newOperator);
    expect(await manager.getValidationData(accountAddr, tester1.address)).to.eq(
      newOperator
    );
    expect(await account.getMode()).to.eq(0); // admin mode
    await expect(
      callAsAccountManager(accountAddr, deployer, "0x", executeData, tester1)
    ).to.be.revertedWithCustomError(entrypoint, "FailedOp");
  });

  it("Should hold and transfer ERC721 successfully", async function () {
    const { deployer, tester1 } = await hre.ethers.getNamedSigners();
    const accountAddr = await getAccountAddr(admin, passkey);

    // receive erc721 before account created
    const erc721 = await deployErc721();
    await expect(
      erc721.connect(deployer).transferFrom(deployer.address, accountAddr, 0)
    )
      .to.emit(erc721, "Transfer")
      .withArgs(deployer.address, accountAddr, 0);
    expect(await erc721.ownerOf(0)).to.eq(accountAddr);

    // deploy account
    const account = await deployAccount(admin, passkey);

    // receive erc721 after account created
    await expect(
      erc721.connect(deployer).transferFrom(deployer.address, accountAddr, 1)
    )
      .to.emit(erc721, "Transfer")
      .withArgs(deployer.address, accountAddr, 1);
    expect(await erc721.ownerOf(1)).to.eq(accountAddr);

    // send erc721
    const erc721Data = erc721.interface.encodeFunctionData("transferFrom", [
      accountAddr,
      tester1.address,
      0,
    ]);
    const executeData = account.interface.encodeFunctionData("execute", [
      await erc721.getAddress(),
      0,
      erc721Data,
    ]);
    await expect(
      callAsAccountManager(accountAddr, deployer, "0x", executeData, tester1)
    )
      .to.emit(erc721, "Transfer")
      .withArgs(accountAddr, tester1.address, 0);
    expect(await erc721.ownerOf(0)).to.eq(tester1.address);
  });

  it("Should hold and transfer ERC1155 successfully", async function () {
    const { deployer, tester1 } = await hre.ethers.getNamedSigners();
    const accountAddr = await getAccountAddr(admin, passkey);

    // receive erc1155 before account created
    const erc1155 = await deployErc1155();
    await expect(
      erc1155
        .connect(deployer)
        .safeTransferFrom(deployer.address, accountAddr, 1, 10, "0x")
    )
      .to.emit(erc1155, "TransferSingle")
      .withArgs(deployer.address, deployer.address, accountAddr, 1, 10);
    expect(await erc1155.balanceOf(accountAddr, 1)).to.eq(10);

    // deploy account
    const account = await deployAccount(admin, passkey);

    // receive erc1155 after account created
    await expect(
      erc1155
        .connect(deployer)
        .safeTransferFrom(deployer.address, accountAddr, 1, 10, "0x")
    )
      .to.emit(erc1155, "TransferSingle")
      .withArgs(deployer.address, deployer.address, accountAddr, 1, 10);
    expect(await erc1155.balanceOf(accountAddr, 1)).to.eq(20);

    // send erc1155
    const erc1155Data = erc1155.interface.encodeFunctionData(
      "safeTransferFrom",
      [accountAddr, tester1.address, 1, 10, "0x"]
    );
    const executeData = account.interface.encodeFunctionData("execute", [
      await erc1155.getAddress(),
      0,
      erc1155Data,
    ]);
    await expect(
      callAsAccountManager(accountAddr, deployer, "0x", executeData, tester1)
    )
      .to.emit(erc1155, "TransferSingle")
      .withArgs(accountAddr, accountAddr, tester1.address, 1, 10);
    expect(await erc1155.balanceOf(accountAddr, 1)).to.eq(10);
    expect(await erc1155.balanceOf(tester1.address, 1)).to.eq(10);
  });
});
