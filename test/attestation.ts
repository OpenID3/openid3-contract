import { expect } from "chai";
import { Contract } from "ethers";
import * as hre from "hardhat";
import {
  getOpenId3KidRegistry,
  getSocialAttestation,
  getSocialVerification,
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
  validUntil: number;
}

const kid1 = hre.ethers.hexlify(hre.ethers.randomBytes(32));
const kidData1: KidData = {
  provider: 1,
  validUntil: epoch() + 3600,
};
const kid2 = hre.ethers.hexlify(hre.ethers.randomBytes(32));
const kidData2: KidData = {
  provider: 2,
  validUntil: epoch() + 3600,
};

interface AttestationInput {
  kid: string; // bytes32
  accountHash: string; // bytes32
  payload: AttestationPayload;
  iat: number; // uint64
}

interface SocialVerificationData {
  referredBy: string;
  toVerify: string;
  iat: number;
}

const encodeSocialVerificationData = (data: SocialVerificationData) => {
  return hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["address, address, uint64"],
    [data.referredBy, data.toVerify, data.iat]
  );
};

interface AttestationPayload {
  data: string[]; // data
  consumers: string[]; // address[]
}

const encodeAttestationPayload = (payload: AttestationPayload) => {
  return hre.ethers.AbiCoder.defaultAbiCoder().encode(
    ["tuple(address[], address[])"],
    [[payload.data, payload.consumers]]
  );
};

const buildOneInput = (
  kid: string,
  accountHash: string,
  payload: AttestationPayload,
  iat: number
) => {
  const payloadEncoded = encodeAttestationPayload(payload);
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
  let verification: Contract;

  beforeEach(async function () {
    await hre.deployments.fixture(["ATTESTATION"]);
    verifier = await getZkAttestationVerifier(hre);
    registry = await getOpenId3KidRegistry(hre);
    await registry.setKid(kid1, kidData1);
    await registry.setKid(kid2, kidData2);
    attestation = await getSocialAttestation(hre);
    voting = await getSocialVoting(hre);
    verification = await getSocialVerification(hre);
  });

  it("should verify signature", async function () {
    const { deployer, tester1 } = await hre.getNamedAccounts();
    const signature =
      "0x2954992ca33326cfca073166119d8fc5723c6c56029d5d29e2c6b39c60636b781f92a7dc0aba6d781f3723ba689924b188f9d052106bda951338e7afc916540f205618cd320a81823d5689eda81b8378f588b2299968a1115769be7bb897f2640da1a2ebd1a052013dc06d07b7a99ea320c56fdd25ffcde51555ca57858ea4920744a91867a29f03d4dedee08a0677d2ba646845fd2cc4e76ac184696e1eafba2999fe96a7502e6030f23d5732eef67a4487bdd191d81bc6031c3f6af2d576e8238cce5f98a3b1d56148aff7b9182d426c5b326e8d2cc2f00e103d0ba7e67a2c001fbcb8bbfa98353132710c4ff0e6298888fdaf133392c37c98425216a33255092b682177c4f4a95bd71bb95d2f75abf93a280f7914b35e65a9e6f0e9fc10af1d7faa90e92c8f3cf0f68cc6260bec9d2bc0ef668c18e4e3634592ca523f83720ff939174a1df54dd947477c0ed077ace8318197dd36f720f7341322748e5528090866be97da71960f2dd2528c8a28cec32c6902c01b6ea309ae1250d844dc221cd79f5a8b45c5fe70ce76efa0c309a690a19897c24097692b355f6b5ad799e12b9656e6a0d219d2fa8a6a6917b64e9010c6193aff758a28ba95c300f195e2551282ea91a6bbe190f99ffb7b8ceaa1afe2f1629b298af2350dbb2e658e7cf427171f3ecaef599a80bb2d2dc16121758c54d4c88ee250b86f273ee8aab94faa1200ed1586a1e6c25cfcd499d3ce676cdbdb27ee1f826cf9846d6312a1a96a35362d1fc510011ee5cf85852e64964cde556f08a4c0364f1159ed86d7177731d037046457c01773165620ad71240ce29fb3543e3b8391ea9466df8512c5d1bc87e52a9d19eb66574cd1424053d71c1c5f6730047772cff42e62b49f045e28489f9d0611b0becd064e2a7262c34fde62a369a5566814d263e87f1a685001dd47b98e02528792902642608a1a73f33db21dd0fc59e03f4caee1d610c7a7dfbab4b9131263eff79c20e8be41bf0a118a00f04ff8fad68144269829963c32493caa10c4198b6df7a208586c91bfc38d9e68129adc5c8febc35d3699e8645156e5b92f91162c4713896db96a74624d2dc63aeda1b99bad36af484c43684e7634cec8dd282565f5c4b29cb7e9df41dc2347812a073c3cb3c730f9439c4d9228d9a5c9fc7d2a8b58cf0e8cd6ff8fef5d4e8a5c37f3adde537c886b80688552e31478b5234a004fb7d8fba15a6650bbc75f2a1722ecb59666bc3cd3a880742a87f6df4cf40223af9637d25451452b53be083ee8cdfe177175989eb9d26297758372b332dab6";
    const input = new Uint8Array([
      131, 63, 4, 218, 46, 152, 175, 172, 185, 77, 6, 97, 60, 170, 196, 55, 243,
      236, 93, 88, 214, 176, 77, 111, 85, 131, 148, 165, 38, 207, 186, 173, 224,
      149, 144, 10, 8, 192, 207, 121, 148, 57, 20, 137, 243, 139, 214, 93, 71,
      130, 205, 6, 143, 227, 14, 167, 176, 31, 119, 32, 28, 208, 149, 175, 203,
      91, 14, 211, 173, 249, 44, 4, 155, 117, 198, 146, 48, 187, 112, 144, 70,
      161, 145, 139, 217, 81, 166, 97, 154, 239, 165, 235, 117, 216, 115, 88, 0,
      0, 0, 0, 101, 192, 251, 208,
    ]);
    const verifierDigest =
      "0x2874851f7a094dc67dc4cc50e175d74f1a7289e56c98a3e1daf9de093c610348";
    const packedSig = hre.ethers.solidityPacked(
      ["bytes", "bytes"],
      [verifierDigest, signature]
    );
    const verificationData = {
      referredBy: deployer,
      toVerify: tester1,
      iat: epoch(),
    };
    const payload = {
      data: [encodeSocialVerificationData(verificationData)],
      consumers: [await verification.getAddress()],
    };
    await attestation.aggregate(input, [payload], packedSig);
  });

  it("should vote", async function () {
    const { tester1 } = await hre.getNamedAccounts();
    const payload = {
      data: [tester1],
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
        accountHash: keccak256("account1"),
        payload,
        iat: epoch(),
      },
      {
        kid: kid1,
        accountHash: keccak256("account2"),
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
    await attestation.aggregate(
      input,
      [payload, payload, payload, payload],
      "0x"
    );
  });

  it("should vote in the same day", async function () {
    const { tester1, tester2 } = await hre.getNamedAccounts();
    const payload1 = {
      data: [tester1],
      consumers: [await voting.getAddress()],
    };
    const payload2 = {
      data: [tester2],
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
        kid: kid1,
        accountHash: keccak256("account1"),
        payload: payload2,
        iat: epoch(),
      },
    ]);
    await attestation.aggregate(input, [payload1, payload2], "0x");
  });
});
