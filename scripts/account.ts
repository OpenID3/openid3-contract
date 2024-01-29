import * as hre from "hardhat";
import { OpenId3Account__factory } from "../types";

export async function inspect(accountAddr: string) {
  const { deployer } = await hre.ethers.getNamedSigners();
  console.log("Deployer is: ", deployer.address);

  const account = OpenId3Account__factory.connect(accountAddr, deployer);
  const admin = await account.getAdmin();
  const operator = await account.getOperatorHash();
  console.log("Admin is: ", admin);
  console.log("Operator is: ", operator);

  const sig = "0xad613449e654d86878d3ae6666c00c748c3d9eb0ba2c495b83602a535ee783303628159ae32228dd53b514bd837e9ca3fbadef4f155afe88e31ac0b074748a151c";
  const uoHash = "0xD1B7C980BF81496114B95F8532E04A68847B2D69FB1D1B641020226655A8912A";
  const verified = hre.ethers.verifyMessage(hre.ethers.getBytes(uoHash), sig);
  console.log("Verified: ", verified);
}

inspect("0x9c1904e6823c3ee85c6b75d206e42edec02debef");
