import { Contract, ethers, keccak256 } from "ethers";
import * as hre from "hardhat";
import { TestContractFactory, TestContractFactory__factory } from "../types";

describe("TestContractFactory", function () {
  let factory: TestContractFactory;

  const deployFactory = async (supply: number) => {
    const { deployer } = await hre.ethers.getNamedSigners();
    const deployed = await hre.deployments.deploy("TestContractFactory", {
      from: deployer.address,
      args: [],
    });
    return TestContractFactory__factory.connect(deployed.address, deployer);
  };

  beforeEach(async () => {
    factory = await deployFactory(100);
  });


  it("should deploy contract", async function () {
    await factory.deploy(ethers.ZeroHash);
    await factory.deploy(ethers.keccak256(ethers.toUtf8Bytes("hello")));
  });
});
