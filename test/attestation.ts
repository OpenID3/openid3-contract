import { Contract } from "ethers";
import * as hre from "hardhat";
import {
  getOpenId3KidRegistry,
  getSocialAttestation,
  getSocialVerification,
  getSocialVoting,
} from "../lib/utils";
import { expect } from "chai";

const keccak256 = (value: string) => {
  return hre.ethers.keccak256(hre.ethers.toUtf8Bytes(value));
};

const epoch = () => {
  return Math.floor(new Date().getTime() / 1000);
};

interface KidData {
  // 0: invalid
  // 1: google
  // 2: twitter
  // 3: github
  provider: number;
  validUntil: number;
}

const kid1 = "0x833f04da2e98afacb94d06613caac437f3ec5d58d6b04d6f558394a526cfbaad";
const kidData1: KidData = {
  provider: 1,
  validUntil: epoch() + 864000000,
};
const kid2 = "0x781aa49f1e1d2ff7e5dc82282775cee581e11857f79b25c136842d277f7435dc";
const kidData2: KidData = {
  provider: 2,
  validUntil: epoch() + 864000000,
};
const kid3 = "0x1d7e0c1f683d214a08b02f5995a2eb8f7ec5b997246ec2f812cff2badc7c6f7c";
const kidData3: KidData = {
  provider: 3,
  validUntil: epoch() + 864000000,
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
}

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

describe("Social Attestation", function () {
  let registry: Contract;
  let attestation: Contract;
  let voting: Contract;
  let verification: Contract;

  beforeEach(async function () {
    await hre.deployments.fixture(["ATTESTATION"]);
    registry = await getOpenId3KidRegistry(hre);
    await registry.setKid(kid1, kidData1);
    await registry.setKid(kid2, kidData2);
    await registry.setKid(kid3, kidData3);
    attestation = await getSocialAttestation(hre);
    voting = await getSocialVoting(hre);
    verification = await getSocialVerification(hre);
  });

  it.only("should verify signature", async function () {
    const signature =
      "0x27e88dbe89774a43068ff8ab7584ed866667344bdaf2c60fe75cdd98a6ebc0c827085ea1a1ee5505c5081a0728624219a1add80043a9f1cac583f38b868dce6826fde3ed1bb025b0f7340a18009fd2293095b2fbae824115784f5a5ab70059d21440286ac9dad6486153e04dcb26bc4c1bd4be92e9a7927af1671b3eb99241aa221d3e37793747f625bff083a27913e5c8a1ef1597089fa282eb7b15c36e2e6f0f495eed30f30faf9740b363f627eeef34851b9b13812b24b57bc05dd1dfe5b11de95aa91f1914e63e071ce42deeb5e12c5e5d11771362ce9316be30190dec7f078bb61257101b8cfd8a87bff20bbf951487d4b0d363ca6618423184faa641c92986aa74e34a0f61ff7214c6cda5340c6d42cfd7fa9408030a9fdaed714185840d5ed8d30d846666fc36c8c4a882bb6683910293f38d9eb214bdf7693633d4332239f390bb01eb83dfa8220dc8e61c413c4abbbab924181e96ec6e42f4cc41c7142d9fb988303e80985abeab7315a276aa80a4524384ceb4028e9169de6eb3252c15391d30dcf0d8a5c9f5c20f53ba8b1da53fac2ccbbc7543b5929770fc08a714895b881fdb87fa86c7d93c0e773c1e8ca36734740ec1001af768e59c66ca2204a910f7b6dea65054179ec1e00527b6ef1fcce3cf25b21ba2754603dece9261195a38bf1b00ddf36116ad7fdba4900cdc6853eff10aadc14ea78faeba0f633c2743d5fe0a0980f2e4509f92ff75822b747b759929f640905e68aa9b2ad54f5d0bb02a6b9257558b694e99a43ac050fe56ee0594ef174e5d38065dbcb634a7660ccc4b08bf4454a9b9482e0c708ddd4afd0b6ae8718c1889558c7f4fc42a5cdf2052d467ce8f91fc3e1679e1ac06c8d8cca510ed9757a985fdad4de347d26d6d2dc545356ecb4bc520e2df3906065b44fabe67d18219876d7d63f4c315882c16011504fabe13895956c1f376c94f15e9d9abcdccd6518e08e4eb397ebe9d1dcf18a647307aa5a40ec8a60e7b6306c203906dbaaf69b095e784a23fa2657bc2ac187f9ee766b3c69bfd8b6bc3f1ef6d2f0916cc95ce8a3bc08cd41ae3247ebeab1227ea1455df9d410b5ae69259ed237f7f35ab0a590b7ad9381695c9e31ab1d424d85ccf26331a2da27c7e927bfe5c39c3ab66235bc480048e4d03fc482f028c21a139554136326ee4461951fa13fdc98d7a7f39cb75bc3c8b21a42b68ee9203216cec9f700de08403a99b901b78861c7fd3968598ce8e2d32404920efa7aa541ee6796ac1f00990534ab15a79ab1a871e373423df709612b2885af6410fe8be";
    const input = new Uint8Array([131,63,4,218,46,152,175,172,185,77,6,97,60,170,196,55,243,236,93,88,214,176,77,111,85,131,148,165,38,207,186,173,131,108,17,103,123,218,183,255,186,111,189,60,144,137,33,50,50,110,66,165,69,37,161,174,194,175,66,226,97,141,211,154,60,156,12,154,97,214,232,58,102,71,138,221,221,243,218,25,169,51,129,129,143,170,98,78,255,46,196,50,255,202,196,80,0,0,0,0,101,195,198,158]);
    const verifierDigest =
      "0x2874851f7a094dc67dc4cc50e175d74f1a7289e56c98a3e1daf9de093c610348";
    const packedSig = hre.ethers.solidityPacked(
      ["bytes", "bytes"],
      [verifierDigest, signature]
    );
    console.log("input is: ", hre.ethers.solidityPacked(["bytes"], [input]));
    console.log("input hash is ", hre.ethers.sha256(input));

    const encodeSocialVerificationData = (data: SocialVerificationData) => {
      return hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "address"],
        [data.referredBy, data.toVerify]
      );
    };
    const toVerify = "0xa4b368e3a9d49ff15b58f70fb976724a98b6d149";
    const verificationData = {
      referredBy: toVerify,
      toVerify,
    };
    const data = encodeSocialVerificationData(verificationData);
    const consumer = "0x0Ce34e57E002BBb541f6c08d78D4cF6de82e3829";
    const encodeAttestationPayload = (payload: AttestationPayload) => {
      return hre.ethers.AbiCoder.defaultAbiCoder().encode(
        ["tuple(bytes[], address[])"],
        [[payload.data, payload.consumers]],
      );
    };
    const payload = {
      data: ["0x0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000a4b368e3a9d49ff15b58f70fb976724a98b6d149"],
      consumers: [consumer],
    };
    const encoded = encodeAttestationPayload(payload);
    console.log("nonce should be: ", hre.ethers.keccak256(encoded));
    console.log("get nonce as: ", "3c9c0c9a61d6e83a66478addddf3da19a93381818faa624eff2ec432ffcac450");

    const from = hre.ethers.solidityPacked(
      ["uint96", "address"],
      [1, "0x90892132326e42a54525a1aec2af42e2618dd39a"]
    );
    const iat = hre.ethers.toBigInt("0x0000000065c0fbd0");

    await expect(
      attestation.aggregate(input, [payload], packedSig)
    ).to.emit(attestation, "NewAttestationEvent").withArgs(
      consumer,
      [
        from,
        data,
        iat,
      ]
    ).to.emit(verification, "NewVerification").withArgs(
      from, toVerify, iat
    ).to.emit(verification, "NewReferral").withArgs(
      from, toVerify
    );
    const [verified, verifiedAt] = await verification.getVerificationData(from);
    expect(verified).to.equal(toVerify);
    expect(verifiedAt).to.equal(iat);
    expect(
      await verification.getTotalReferred(toVerify)
    ).to.equal(1);

    // const toVerify2 = "0x7363A50A76437e29b145001c5cEF86F41b3C71A2";
    // const verificationData2 = {
    //   referredBy: toVerify2,
    //   toVerify: toVerify2,
    // };
    // const data2 = encodeSocialVerificationData(verificationData2);
    // const payload2 = {
    //   data: [data2],
    //   consumers: [consumer],
    // };
    // await expect(
    //   attestation.aggregate(input, [payload2], packedSig)
    // ).to.emit(attestation, "NewAttestationEvent").withArgs(
    //   consumer,
    //   [
    //     from,
    //     data2,
    //     iat,
    //   ]
    // ).to.emit(verification, "NewVerification").withArgs(
    //   from, toVerify2, iat
    // );
    // const [verified2, verifiedAt2] = await verification.getVerificationData(from);
    // expect(verified2).to.equal(toVerify2);
    // expect(verifiedAt2).to.equal(iat);
    // expect(
    //   await verification.getTotalReferred(toVerify)
    // ).to.equal(1);
    // expect(
    //   await verification.getTotalReferred(toVerify2)
    // ).to.equal(0);
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
