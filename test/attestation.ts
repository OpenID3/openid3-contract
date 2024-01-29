import { expect } from "chai";
import { Contract } from "ethers";
import * as hre from "hardhat";
import {
  getOpenId3KidRegistry,
  getSocialAttestation,
  getSocialVoting,
  getZkAttestationVerifier,
} from "../lib/utils";

const keccak256 = (value: string) => {
  return hre.ethers.keccak256(hre.ethers.toUtf8Bytes(value));
};

const epoch = () => {
  return Math.floor(new Date().getTime() / 1000);
};

interface KidData {
  provider: number;
  validUtil: number;
}

const kid1 = hre.ethers.hexlify(hre.ethers.randomBytes(32));
const kidData1: KidData = {
  provider: 1,
  validUtil: epoch() + 3600,
};
const kid2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));
const kidData2: KidData = {
  provider: 2,
  validUtil: epoch() + 3600,
};

interface AttestationInput {
  kid: string; // bytes32
  accountHash: string; // bytes32
  payload: AttestationPayload;
  iat: number; // uint64
}

interface AttestationPayload {
  to: string; // address
  statement: string; // bytes32
  consumers: string[]; // address[]
}

const buildOneInput = (
  kid: string,
  accountHash: string,
  payload: AttestationPayload,
  iat: number
) => {
  const payloadEncoded = hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address, bytes32, address[])"],
    [[payload.to, payload.statement, payload.consumers]]
  );
  const payloadHash = hre.ethers.keccak256(payloadEncoded);
  return hre.ethers.solidityPacked(
    ["bytes32", "bytes32", "bytes32", "uint64"],
    [kid, accountHash, payloadHash, iat]
  );
};

const buildInputs = (inputs: AttestationInput[]) => {
  const encoded = inputs.map((input) => {
    return buildOneInput(
      input.kid,
      input.accountHash,
      input.payload,
      input.iat
    );
  });
  return hre.ethers.solidityPacked(
    encoded.map(() => "bytes"),
    encoded
  );
};

describe("OpenId3Account", function () {
  let registry: Contract;
  let verifier: Contract;
  let attestation: Contract;
  let voting: Contract;

  beforeEach(async function () {
    await hre.deployments.fixture(["ATTESTATION"]);
    verifier = await getZkAttestationVerifier(hre);
    registry = await getOpenId3KidRegistry(hre);
    await registry.setKid(kid1, kidData1);
    await registry.setKid(kid2, kidData2);
    attestation = await getSocialAttestation(hre);
    voting = await getSocialVoting(hre);
  });

  it("should vote", async function () {
    const { tester1 } = await hre.getNamedAccounts();
    const payload = {
      to: tester1,
      statement: keccak256("vote"),
      consumers: [await voting.getAddress()],
    };
    const input = buildInputs([
      {
        kid: kid1,
        accountHash: keccak256("account1"),
        payload,
        iat: epoch(),
      },
      {
        kid: kid2,
        accountHash: keccak256("account2"),
        payload,
        iat: epoch(),
      },
    ]);
    await attestation.aggregate(input, [payload, payload], "0x");
  });

  it("should vote in the same day", async function () {
    const { tester1, tester2 } = await hre.getNamedAccounts();
    const payload1 = {
      to: tester1,
      statement: keccak256("vote"),
      consumers: [await voting.getAddress()],
    };
    const payload2 = {
      to: tester2,
      statement: keccak256("vote"),
      consumers: [await voting.getAddress()],
    };
    const input = buildInputs([
      {
        kid: kid1,
        accountHash: keccak256("account1"),
        payload: payload1,
        iat: epoch(),
      },
      {
        kid: kid2,
        accountHash: keccak256("account1"),
        payload: payload2,
        iat: epoch(),
      },
    ]);
    await attestation.aggregate(input, [payload1, payload2], "0x");
  });
});
