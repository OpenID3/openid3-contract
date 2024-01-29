import * as hre from "hardhat";
import { Contract, ethers } from "ethers";
import { expect } from "chai";

const GOOGLE = ethers.keccak256(ethers.toUtf8Bytes("google"));
const GITHUB = ethers.keccak256(ethers.toUtf8Bytes("github"));
const accountHash = ethers.keccak256(
  ethers.toUtf8Bytes("103782812893820927451")
);
const SCHEMA_ID =
  "0x912214269b9b891a0d7451974030ba13207d3bf78e515351609de9dd8a339686";
const expirationDate = 0;

describe("OpenId3TeeModule", function () {
  let veraxModule: Contract;

  beforeEach(async function () {
    const { deployer } = await hre.ethers.getNamedSigners();
    const deployed = await hre.deployments.deploy("OpenId3TeeModule", {
      from: deployer.address,
      args: [deployer.address],
      log: true,
    });
    const artifact = hre.artifacts.readArtifactSync("OpenId3TeeModule");
    veraxModule = new Contract(deployed.address, artifact.abi, deployer);
  });

  it("should test module", async function () {
    const { deployer, tester1 } = await hre.ethers.getNamedSigners();

    const attestationData = ethers.solidityPacked(
      ["bytes32", "bytes32"],
      [GOOGLE, accountHash]
    );
    const accAndTypeHash = ethers.keccak256(attestationData);
    const subject = deployer.address;

    const signedMessage = ethers.solidityPackedKeccak256(
      ["bytes32", "bytes32", "bytes20"],
      [GOOGLE, accountHash, subject]
    );
    const signature = await deployer.signMessage(
      ethers.getBytes(signedMessage)
    );

    await expect(
      veraxModule.run(
        {
          schemaId: hre.ethers.ZeroHash,
          expirationDate,
          subject,
          attestationData,
        },
        signature,
        hre.ethers.ZeroAddress,
        0
      )
    ).to.be.revertedWithCustomError(veraxModule, "InvalidSchemaId");

    const invalidAttestationData = ethers.solidityPacked(
      ["bytes32", "bytes32"],
      [GITHUB, accountHash]
    );
    await expect(
      veraxModule.run(
        {
          schemaId: SCHEMA_ID,
          expirationDate,
          subject,
          attestationData: invalidAttestationData,
        },
        signature,
        hre.ethers.ZeroAddress,
        0
      )
    ).to.be.revertedWithCustomError(veraxModule, "UnsupportedProvider");

    const invalidSubject = tester1.address;
    await expect(
      veraxModule.run(
        {
          schemaId: SCHEMA_ID,
          expirationDate,
          subject: invalidSubject,
          attestationData,
        },
        signature,
        hre.ethers.ZeroAddress,
        0
      )
    ).to.be.revertedWithCustomError(veraxModule, "InvalidSignature");

    await expect(
      veraxModule.run(
        {
          schemaId: SCHEMA_ID,
          expirationDate,
          subject,
          attestationData,
        },
        signature,
        hre.ethers.ZeroAddress,
        0
      )
    )
      .to.emit(veraxModule, "Attested")
      .withArgs(accAndTypeHash, subject.toLowerCase());

    await expect(
      veraxModule.run(
        {
          schemaId: SCHEMA_ID,
          expirationDate,
          subject,
          attestationData,
        },
        signature,
        hre.ethers.ZeroAddress,
        0
      )
    ).to.be.revertedWithCustomError(veraxModule, "AlreadyAttested");
  });
});
