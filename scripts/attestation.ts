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

const getVerificationContract = async function () {
  const { deployer } = await hre.ethers.getNamedSigners();
  return new hre.ethers.Contract(
    "0x3E2Bd53C96cb0e32D1102229940A7144537F1C0E",
    await getAbi(hre, "SocialVerification"),
    deployer
  );
};

const getAttestationContract = async function () {
  const { deployer } = await hre.ethers.getNamedSigners();
  console.log("deployer is", deployer.address);
  return new hre.ethers.Contract(
    "0xC6DB97Eb9938Ff912fa7023cbC55303e79897849",
    await getAbi(hre, "SocialAttestation"),
    deployer
  );
};

const kid1 = "0x833f04da2e98afacb94d06613caac437f3ec5d58d6b04d6f558394a526cfbaad";
const kidData1 = {
  provider: 1,
  validUntil: 2559422614,
};
const kid2 = "0x781aa49f1e1d2ff7e5dc82282775cee581e11857f79b25c136842d277f7435dc";
const kidData2 = {
  provider: 2,
  validUntil: 2559422614,
};
const kid3 = "0x1d7e0c1f683d214a08b02f5995a2eb8f7ec5b997246ec2f812cff2badc7c6f7c";
const kidData3 = {
  provider: 3,
  validUntil: 2559422614,
};

async function setUpKidRegistry(registry: Contract) {
    const owner = await registry.owner();
    if (await hre.ethers.provider.getBalance(owner) === 0n) {
      const {deployer} = await hre.ethers.getNamedSigners();
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
  // await hre.deployments.fixture(["ATTESTATION"]);
  // const regsitry = await getOpenId3KidRegistry(hre);;
  // await setUpKidRegistry(regsitry);

  const signature =
    "0x05b8bd6cbace1db9b4e4a0d36345f58b2c8980fa981dd2a89aafe8407f4e1771220c0e5885f9ce309fdc4c297a9eb7cd84edacc1e5b16c4a3b71c8b5b4631d1b250aec75a43318cc19abebb618135afb095626dffd084f3794f4a7679e53e5cf0d0f051a76bc9f4be612b972fbc0121217e4a2979751b837103185effeef1abf184d93445e4fcd45008e1ee17cfe65c63c7b5871fc20f47c109ce3e37d2883d906de2f9801786d674951ca3c63a201b4e337e746350f1e195a2f8e23cb6a548e0738cf9a0eac4fcb295038653209f71dd1d96b7b79efc92fed7acc215b73087004a1f3ad0e693cb6ba043cfaf8df2c156f4e6487355eaae696ee4fcdd83d87050dec58eeffa0422c9a3a30b1cdb765bf1ca7fba27871af9b6f5dde4d0634cc1c2fa8e2947762da0551041b792014efa7ea222aac0719b821b789231682e21c05286fd88dab2ef7bbca3b08667dce2134f2de7f76c1781c0769f41f9a6f07dd3c2a35f22aeaf4f62d71d717ebb6830daf5d2331eb26e22c2555f4f3f3fcb8715b1f237ed8d68f68750aacbbb4a3a0e1b445447514a49aa544e824e7f6cabeb5251d3bb13f0111c9a7f0fa428f857447d06baaf09c89fe00b5a5bec161f2ed21631a304feef443f28355fbde10496c7ff526adc626ee3ede6677162f6fddb261f906706791242cc1eae1cf874c96ffaefa7ea3244c42c9019da2d76c07093cf53217947920485ddebff0bc3383323d4601adf9554d53c99d34e1513f4749621f4d16617ead8cebaa2e60a4cee0f8fa9573b233ecb3367137a7d2fef050d8bb0014226076102c8323e9bb759490e9d5c1a15ac5bc4a577e726f92776f858d34d7cf2d26b8a96a10f70f92a85ff29739fff84d60b7873af7c11728be7289c95a486520ef2efbf01e40e09355171fc0dd2b9a97ac87849a835bd99ec190a5e4bf0e110d463d18517be4a858ceee243afa4e8760fc145ab5d9df5c3759eff65efdbf910a49b32f5da00c6bd839a13e3eaa6ef9b64d5acbd3b5a2e114fe523937adba582011463feaf93534b0b75f9a3848a2dd95f80dd5413541098cdbf547ebc61a81008692a5cc403b83770898d8528167ebc7a4e7860c94fa8852495d7c078d4f2d19d022d624a1a7909cc64292eb71a7a21becdb320d0067ed15761c343bb53d6924c9d0f57d985c78b1822f20d7b557eb6349f2fd175599185ce3b7be1c2d12b31abe656df7d3f2acb4da2d2f0c65253a58719de42e8bd6a8ddb57f2d996c0c580339af63f06985c0612ffac5335d0ee2d2f80513973a198602def66a0c994d78";
  const input = new Uint8Array([131,63,4,218,46,152,175,172,185,77,6,97,60,170,196,55,243,236,93,88,214,176,77,111,85,131,148,165,38,207,186,173,224,109,180,106,157,136,211,208,100,119,183,9,2,149,77,232,68,91,219,230,149,111,45,70,245,55,236,111,42,102,154,232,215,165,114,119,154,208,72,161,244,215,6,6,212,49,110,23,62,204,219,150,233,42,251,244,53,208,190,101,166,6,21,249,0,0,0,0,101,196,16,226]);
  const verifierDigest =
    "0x2874851f7a094dc67dc4cc50e175d74f1a7289e56c98a3e1daf9de093c610348";
  const packedSig = hre.ethers.solidityPacked(
    ["bytes", "bytes"],
    [verifierDigest, signature]
  );
  console.log("input is: ", hre.ethers.solidityPacked(["bytes"], [input]));
  console.log("input hash is ", hre.ethers.sha256(input));
  console.log("signature is ", packedSig);

  const toVerify = hre.ethers.getAddress("0x1f6a852b30bfa2363b0e0db4eaf8cefea69215ae");
  const consumer = "0x3E2Bd53C96cb0e32D1102229940A7144537F1C0E";
  const encodeAttestationPayload = (payload: AttestationPayload) => {
    return hre.ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(bytes[], address[])"],
      [[payload.data, payload.consumers]]
    );
  };
  const payload = encodeAttestationPayload({
    data: [
      "0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000001f6a852b30bfa2363b0e0db4eaf8cefea69215ae"
    ],
    consumers: [consumer],
  });
  console.log("encode payload is: ", payload);
  console.log("nonce should be: ", hre.ethers.keccak256(payload));
  console.log(
    "get nonce as: ",
    "0xd7a572779ad048a1f4d70606d4316e173eccdb96e92afbf435d0be65a60615f9"
  );

  const attestation = await getAttestationContract();
  const tx = await attestation.aggregate(input, [payload], packedSig);
  console.log("tx is ", tx);

  const from = hre.ethers.solidityPacked(
    ["uint96", "address"],
    [1, "0x02954de8445bdbe6956f2d46f537ec6f2a669ae8"]
  );
  const verification = await getVerificationContract();
  const result = await verification.getVerificationData(from);
  const totalReffered = await verification.getTotalReferred(toVerify);
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
