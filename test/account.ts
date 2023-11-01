import { expect } from "chai";
import {
    getEntryPoint,
    getPasskeyAdmin,
    getAccountFactory
} from "../lib/utils";
import * as hre from "hardhat";
import { Contract, Interface } from "ethers";
import { getInterface } from "../lib/utils";

interface Passkey {
  pubKeyX: string,
  pubKeyY: string,
}

const PASSKEY : Passkey = {
  pubKeyX: "0x0",
  pubKeyY: "0x0",
}

const buildAdminData = (admin: Contract, passkey: Passkey) => {
  let adminData = admin.interface.encodeFunctionData(
    "setPasskey", ["mypasskey", passkey]
  );
  return hre.ethers.solidityPacked(
    ["address", "bytes"], [admin.target, adminData])
}

describe("OpenId3Account", function () {
    let entrypoint: Contract;
    let admin: Contract;
    let factory: Contract;
    let accountIface: Interface;
  
    beforeEach(async function () {
      await hre.deployments.fixture(["TEST"]);
      entrypoint = await getEntryPoint(hre);
      admin = await getPasskeyAdmin(hre);
      factory = await getAccountFactory(hre);
      accountIface = await getInterface(hre, "OpenId3Account");
    });
  
    it("should deploy account", async function () {
      const { deployer } = await hre.ethers.getNamedSigners();
      const adminData = buildAdminData(admin, PASSKEY);
      const accountInitData = accountIface.encodeFunctionData(
        "initialize", [adminData, deployer.address]);

      const deployed = await factory.predictDeployedAddress(accountInitData);
      await expect(
        factory.deploy(accountInitData)
      ).to.emit(factory, "AccountDeployed").withArgs(deployed);
      console.log("deployed at ", deployed);

      const cloned = await factory.predictClonedAddress(accountInitData);
      await expect(
        factory.clone(accountInitData)
      ).to.emit(factory, "AccountDeployed").withArgs(cloned);
      console.log("cloned at ", cloned);
    });
});
