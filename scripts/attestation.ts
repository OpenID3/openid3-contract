import * as hre from "hardhat";
import { getAbi, getOpenId3KidRegistry } from "../lib/utils";
import { Contract } from "ethers";

interface SocialVerificationData {
  referredBy: string;
  toVerify: string;
}

interface AttestationPayload {
  data: string[]; // data
  consumers: string[]; // address[]
}

// const verification = "0x78133A0340b3dD68eea0E2258b980e7719B10ce7";
// const attestation = "0x8E2d598E62435Eda8db693d0557898dC7884bE00";

const verification = "0x486859108878250F4d1a7e2405B8B6b6C3f3e1ee";
const attestation = "0xA200Cbd1f65B343248e858CAF0CeA006C4B300d2";

const getVerificationContract = async function () {
  const { deployer } = await hre.ethers.getNamedSigners();
  return new hre.ethers.Contract(
    verification,
    await getAbi(hre, "SocialVerification"),
    deployer
  );
};

const getAttestationContract = async function () {
  const { deployer } = await hre.ethers.getNamedSigners();
  console.log("deployer is", deployer.address);
  return new hre.ethers.Contract(
    attestation,
    await getAbi(hre, "SocialAttestation"),
    deployer
  );
};

const kid1 =
//   "0x833f04da2e98afacb94d06613caac437f3ec5d58d6b04d6f558394a526cfbaad";
     "0xff19657c8d6da163c5c8480ce73a0d0efc81fde38900c20c01c0fce5f4e1a5f2";
const kidData1 = {
  provider: 1,
  validUntil: 2559422614,
};
const kid2 =
  "0x781aa49f1e1d2ff7e5dc82282775cee581e11857f79b25c136842d277f7435dc";
const kidData2 = {
  provider: 2,
  validUntil: 2559422614,
};
const kid3 =
  "0x1d7e0c1f683d214a08b02f5995a2eb8f7ec5b997246ec2f812cff2badc7c6f7c";
const kidData3 = {
  provider: 3,
  validUntil: 2559422614,
};

export async function setUpKidRegistry(registry: Contract) {
  const owner = await registry.owner();
  if ((await hre.ethers.provider.getBalance(owner)) === 0n) {
    const { deployer } = await hre.ethers.getNamedSigners();
    const tx = await deployer.sendTransaction({
      to: owner,
      value: hre.ethers.parseEther("1"),
    });
    await tx.wait();
  }
  await registry.setKid(kid1, kidData1);
  await registry.setKid(kid2, kidData2);
  await registry.setKid(kid3, kidData3);
}

const main = async function () {
  await hre.deployments.fixture(["ATTESTATION"]);
  const regsitry = await getOpenId3KidRegistry(hre);
  await setUpKidRegistry(regsitry);

  const signature =
    "0x11b7312de47cc10502ce4f31f77b582fb3618822f91d47a7f128c5a4f63ba5db26f9d61a88c41371ec47f46fa74df35512b3c29459c60c23e19d3f0367c685ce2bc6fb8a110443ddaac9746112db0e377bc201a865f15c9dd3a76a4a434e5d4302c0e7382178817597460c4dfe2b7feb6feb018475de04acf695eefe983756580d541a76111bad50a4a67cdcbcadbf9275219aaccf2b4441d20c10fa61e09db826059663be64507c4d6647a954fd42f74359ee7f5b821e2ddf122d4f7a9b29a90406dfb4fb0de5a8b0f69cb82b93c9ee2344988ffb579fc3a4ce1633ec9bcbdc2cd8156ef25368676f6ddf4a6a563b6c2c7cb882ed0015e9cc01da8d6dc8eae00b09c0a695eda65bcb70c0042571f083935adf65588ca2267ea9c4d4c4c05a7f2310b3fb57cad0e18297c28d37216aaf442bbb8549f22a90c555bcf3d6e817f31a6b54eedb3eaf0bc5c49471fa9ede331cb7ef687a8c3a3b7c09a1247a370d81048072274895d31e40b82a1c5dd54114dca7e864ed2fb23568ec42589559803a181568d155991db55820151f153ff1c15223c3b3d3193230f98637e7cad2803e08f3ec03297fd62778306ace261d44f2ed6b03fc29a28e9557691ce71281761e2e3781bdf7e0f094b47a3aab4cb9b8320672582664a1ea1a70fda8439b139cdd1f4d5d6a1a9105e8a67f468c723b068062b4b8fbb11ea832dcede4713a5da4eb020f773bf20c878e1895272f4498a60e942edd1071e8a1004f068669457280c50a7cb385259f718e2bffb06bc1adb01fff8b22ab7ed267d604f12925fe720ef00eb79cf6d33c505ba0185363cfb782f1628031df91dac3d6943305cf42e1f3a11755ee2f4801043e91f07fc1d1df1ecafb6f63bf4fea6b48b073fc06406a387322257ee93f7465b83a9da08e54cadf1f87d1257cf2a4c1b3cc2ec9211ecc81c72fd8af51a2419a6b7ab4887a5f44ebcc76acddaee27cf2c85d2e8e297b1678d60a00d663eb1f6510a4fdfd68f34ec4ad9e207ecbfb0c7d9b17dd5c996d77784e0c3ef778cf5941ab0351c6011b6842bca40d5fd9966bf65bb0d8b5127bb151d704b5adcf03f2c7f935cea8b96693328ed82bac3b5e9a2f1a0780dbc73dfff1d10bff63aa2ad62fdf3d43231e9f7dfefb71288a7a8c9a5fba92220f9f7f9840932dd01c85bf078fe5f632b29369afa7fb46fe4680b1d4cc7889055f4723980fea12717b77806fdbc7b6d6367107c9e515daf5082bba5593daed89ee2b06a617932d5ddc7d43452c66fba54328747da3b0009ea1cbfd105513974319f0bb9a5b93";
  const input = new Uint8Array([
    255, 25, 101, 124, 141, 109, 161, 99, 197, 200, 72, 12, 231, 58, 13, 14,
    252, 129, 253, 227, 137, 0, 194, 12, 1, 192, 252, 229, 244, 225, 165, 242,
    75, 0, 173, 240, 125, 48, 71, 91, 179, 25, 105, 233, 132, 59, 172, 102, 97,
    136, 82, 101, 184, 154, 21, 220, 241, 39, 116, 73, 121, 100, 163, 182, 227,
    0, 63, 162, 197, 226, 111, 142, 22, 22, 190, 8, 63, 222, 210, 97, 187, 203,
    199, 223, 72, 204, 174, 168, 151, 61, 52, 222, 147, 27, 36, 43, 121, 142,
    213, 101, 0, 0, 0, 0,
  ]);
  const verifierDigest =
    "0x013cfebee472ad31250f66b444930cb9763c3350da2fc8e9d46388cafa1aeb4a";
  const packedSig = hre.ethers.solidityPacked(
    ["bytes", "bytes"],
    [verifierDigest, signature]
  );
  console.log("input is: ", hre.ethers.solidityPacked(["bytes"], [input]));
  console.log("input hash is ", hre.ethers.sha256(input));
  console.log("signature is ", packedSig);

  const toVerify = hre.ethers.getAddress(
    "0x92ed18cb1840b5f2f0496b6362b108d84a191eba"
  );
  const encodeAttestationPayload = (payload: AttestationPayload) => {
    return hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(bytes[], address[])"],
      [[payload.data, payload.consumers]]
    );
  };
  const payload = encodeAttestationPayload({
    data: [
      "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000092ed18cb1840b5f2f0496b6362b108d84a191eba",
    ],
    consumers: [verification],
  });
  console.log("encode payload is: ", payload);
  console.log("nonce should be: ", hre.ethers.keccak256(payload));
  console.log(
    "get nonce as: ",
    "e3003fa2c5e26f8e1616be083fded261bbcbc7df48ccaea8973d34de931b242b"
  );

  const attestation = await getAttestationContract();
  const tx = await attestation.aggregate(input, [payload], packedSig);
  console.log("tx is ", tx);

  const from = hre.ethers.solidityPacked(
    ["uint96", "address"],
    [1, "0x02954de8445bdbe6956f2d46f537ec6f2a669ae8"]
  );
  const verificationContract = await getVerificationContract();
  const result = await verificationContract.getVerificationData(attestation, from);
  const totalReffered = await verificationContract.getTotalReferred(attestation, toVerify);
  console.log("verified: ", result);
  console.log("totalReffered: ", totalReffered);

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
};

main();
