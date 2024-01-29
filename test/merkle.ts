import { expect } from "chai";
import * as hre from "hardhat";
import { Contract, ethers, sha256 } from "ethers";
import { StandardMerkleTree } from "merkle-tree";

function hash(value: string) {
  return sha256(ethers.toUtf8Bytes(value));
}

const values = [
  ["0x1111111111111111111111111111111111111111", hash("1")],
  ["0x2222222222222222222222222222222222222222", hash("2")],
  ["0x0000000000000000000000000000000000000003", hash("3")],
  ["0x401c196454c5541c6c63713f14db2967fcc0b38a", hash("input")],
  ["0x0000000000000000000000000000000000000004", hash("4")],
  ["0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF", hash("5")],
];

describe("OpenId3Account", function () {
  let verifier: Contract;

  beforeEach(async function () {
    const { deployer } = await hre.ethers.getNamedSigners();
    const deployed = await hre.deployments.deploy("MerkleVerifier", {
      from: deployer.address,
      args: [],
    });
    const artifact = await hre.artifacts.readArtifact("MerkleVerifier");
    verifier = new Contract(deployed.address, artifact.abi, deployer);
  });

  it("should gen and verify merkle", async function () {
    const tree = StandardMerkleTree.of(values, ["address", "uint256"]);
    let proof: string[] = [];
    for (const [i, v] of tree.entries()) {
      if (v[0] === "0x401c196454c5541c6c63713f14db2967fcc0b38a") {
        proof = tree.getProof(i);
      }
    }
    expect(
      await verifier.verify(
        tree.root,
        proof,
        "0x401c196454c5541c6c63713f14db2967fcc0b38a",
        hash("input")
      )
    ).to.be.true;

    expect(
      await verifier.verify(
        tree.root,
        proof,
        "0x401c196454c5541c6c63713f14db2967fcc0b38a",
        hash("1")
      )
    ).to.be.false;
  });
});
