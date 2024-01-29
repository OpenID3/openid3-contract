import { expect } from "chai";
import { Contract } from "ethers";
import * as hre from "hardhat";
import {
  getOpenId3KidRegistry,
  getSocialAttestation,
  getSocialVoting,
  getZkAttestationVerifier,
} from "../lib/utils";

describe("OpenId3Account", function () {
  let registry: Contract;
  let verifier: Contract;
  let attestation: Contract;
  let voting: Contract;

  beforeEach(async function () {
    await hre.deployments.fixture(["ATTESTATION"]);
    verifier = await getZkAttestationVerifier(hre);
    registry = await getOpenId3KidRegistry(hre);
    attestation = await getSocialAttestation(hre);
    voting = await getSocialVoting(hre);
  });

  it("should vote", async function () {
    
  });

  it("should vote in the same day", async function () {

  });
});
