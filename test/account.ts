import {
    getEntryPoint,
    getPasskeyAdmin,
    getAccountFactory
} from "../lib/utils";
import * as hre from "hardhat";
import { Contract } from "ethers";

describe("OpenId3Account", function () {
    let entrypoint: Contract;
    let admin: Contract;
    let factory: Contract;
  
    beforeEach(async function () {
      await hre.deployments.fixture(["TEST"]);
      entrypoint = await getEntryPoint(hre);
      admin = await getPasskeyAdmin(hre);
      factory = await getAccountFactory(hre);
    });
  
    it("should deploy account", async function () {
      const { deployer } = await hre.ethers.getNamedSigners();
    });
});
