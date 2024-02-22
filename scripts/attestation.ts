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

const verification = "0x7264E75648E27E2959eC3D245304D8B27Fb96e5f";
const attestation = "0x5154BfAa4827d6e884BFd55497536f0DE12c50c8";
const plonkVerifier = "0xeb7C2A5674bd11AB10cD07f990B20c686E532707";

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
  // await hre.deployments.fixture(["ATTESTATION"]);
  // const regsitry = await getOpenId3KidRegistry(hre);
  // await setUpKidRegistry(regsitry);

  const signature =
    "0x0410816c196d3115a25f30e99584ef3c85d58f39dae53ff9cf36d986980c1f800811a8f59011a37f818909bcd609ba8dd821cffbe6ff7c62a51fa36ad9f51141116d0627a1b3ac1520d6b1eac29997eeaa276ae5da0950a14b8bac34e4092b3921873390706e8fef0b0f2bd9777ef8186d7fc805610a13f3680c19e5605ee80616389407f6220ffb2023bd8639b6f8a9f05c9efd9d50948b7817a700468cdd2f0238e44a6093b0416d59ff442e4a4d969de3a08e682bb7a00ad1e72e88f73dd7110f43835f6cb1587734ebffe44f726bf978be397a6d318200214aff313df6ca00c8ad7c5a99d4303da814c69454038e8c7e2245b75e061862c7d9c9e715faab00ce23408d75e39d8f4ad4594ab3ad4ff40c6ba75c19cfcb2c0a735c00fca7352edcf59bbe6554d57dbfd72d7a824463f6e945cdf9d1768305368393bb7325f11a6a6d8509238972021644d5ebae45ef25bea7fbe4b91a17cafa5de4258cf54d169d6ba04464ffa34313598a94122844619979ccfef1ef23d00d53a4b82c89a91aeead92c655c178965a16151ab48d596ca4a2588d6e8879606fecb5e9d1a18518ae9813e69162160c661d71a6eed230518b356f15f6bff7de598a87d807ebca06ef8c9a1e71c1d04030ae3d01ae2047939f0e900abbc6ddfce4486c09b5c27614d54fe1d3b2328b463573507deb4e4edce1fed3a711eff9c9b36c765331b677251a75bdf729aca93d134c1107d7ae738ec47e5989306b5eb7384bc52ce839f02538338b1bf7974afcc61ece733c3e4900f91d7017ccdaa6f4a494e67624858f21c66730cbca6e5d798eb3437ec35b3e8854e4bfe850584d12d27dd4d6074415219137a5b9c810c71e0a4c472a597029455014c40ce57d71b6910bf2a1e49afb2bebf98c75d3aa0d56f312dc4f0269b0bde91942839d7dfa3e36bba805e277ee0c31d7443b410b9a8e6fec2943c64e1f45d98d899242533bb9ceddea07cc8deb230b9dfd7170a6fb17a7a8c65dd15c7fb032aa9ffe7b59705d0c5079e58862cd1a9955a64f36087b1115de635d54b100542ea5d891774014d909e1721edfb55d252e3638253d6ef7fc6dfb60568d995a5d1e123dc618abfe2ec374d6d801484a1b2193ec635f33fae555a3dad73e0d2ea08cf428294e5f7f25c8520335db93632f7df66141da21311442e385d1822aba86f610bde42d5e8006d9f9479926dd7f2a433a0920ad5e8cacfedf3118c260970bcff687b70779b1b53eebc04e33fdcb1d77810521a9068d847d11ba518f40d3fba481021713d8bb49fe9776bec21385";
  const input = new Uint8Array([
    255, 25, 101, 124, 141, 109, 161, 99, 197, 200, 72, 12, 231, 58, 13, 14,
    252, 129, 253, 227, 137, 0, 194, 12, 1, 192, 252, 229, 244, 225, 165, 242,
    75, 0, 173, 240, 125, 48, 71, 91, 179, 25, 105, 233, 132, 59, 172, 102, 97,
    136, 82, 101, 184, 154, 21, 220, 241, 39, 116, 73, 121, 100, 163, 182, 129,
    206, 14, 93, 24, 25, 185, 186, 6, 209, 155, 113, 26, 253, 197, 125, 14, 223,
    154, 252, 27, 186, 255, 90, 178, 121, 170, 109, 79, 227, 218, 11, 75, 105,
    214, 101, 0, 0, 0, 0,
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
    "430d93e4faa876e422aad7b273d8fe23da662a8d756d1b8a61669380bde66c32"
  );

  const attestation = await getAttestationContract();
  const tx = await attestation.aggregate(input, [payload], packedSig);
  console.log("tx is ", tx);
  await tx.wait();

  const from = hre.ethers.solidityPacked(
    ["uint96", "address"],
    [1, "0x843bac6661885265b89a15dcf12774497964a3b6"]
  );
  const verificationContract = await getVerificationContract();
  const result = await verificationContract.getVerificationData(
    attestation,
    from
  );
  const totalReffered = await verificationContract.getTotalReferred(
    attestation,
    toVerify
  );
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

// const getPlonkVerifier = async function () {
//   const { deployer } = await hre.ethers.getNamedSigners();
//   return new hre.ethers.Contract(
//     plonkVerifier,
//     await getAbi(hre, "PlonkVerifier"),
//     deployer
//   );
// };

// const verify = async function () {
//   await hre.deployments.fixture(["ATTESTATION"]);
//   const verifier = await getPlonkVerifier();
//   const signature = "0x0410816c196d3115a25f30e99584ef3c85d58f39dae53ff9cf36d986980c1f800811a8f59011a37f818909bcd609ba8dd821cffbe6ff7c62a51fa36ad9f51141116d0627a1b3ac1520d6b1eac29997eeaa276ae5da0950a14b8bac34e4092b3921873390706e8fef0b0f2bd9777ef8186d7fc805610a13f3680c19e5605ee80616389407f6220ffb2023bd8639b6f8a9f05c9efd9d50948b7817a700468cdd2f0238e44a6093b0416d59ff442e4a4d969de3a08e682bb7a00ad1e72e88f73dd7110f43835f6cb1587734ebffe44f726bf978be397a6d318200214aff313df6ca00c8ad7c5a99d4303da814c69454038e8c7e2245b75e061862c7d9c9e715faab00ce23408d75e39d8f4ad4594ab3ad4ff40c6ba75c19cfcb2c0a735c00fca7352edcf59bbe6554d57dbfd72d7a824463f6e945cdf9d1768305368393bb7325f11a6a6d8509238972021644d5ebae45ef25bea7fbe4b91a17cafa5de4258cf54d169d6ba04464ffa34313598a94122844619979ccfef1ef23d00d53a4b82c89a91aeead92c655c178965a16151ab48d596ca4a2588d6e8879606fecb5e9d1a18518ae9813e69162160c661d71a6eed230518b356f15f6bff7de598a87d807ebca06ef8c9a1e71c1d04030ae3d01ae2047939f0e900abbc6ddfce4486c09b5c27614d54fe1d3b2328b463573507deb4e4edce1fed3a711eff9c9b36c765331b677251a75bdf729aca93d134c1107d7ae738ec47e5989306b5eb7384bc52ce839f02538338b1bf7974afcc61ece733c3e4900f91d7017ccdaa6f4a494e67624858f21c66730cbca6e5d798eb3437ec35b3e8854e4bfe850584d12d27dd4d6074415219137a5b9c810c71e0a4c472a597029455014c40ce57d71b6910bf2a1e49afb2bebf98c75d3aa0d56f312dc4f0269b0bde91942839d7dfa3e36bba805e277ee0c31d7443b410b9a8e6fec2943c64e1f45d98d899242533bb9ceddea07cc8deb230b9dfd7170a6fb17a7a8c65dd15c7fb032aa9ffe7b59705d0c5079e58862cd1a9955a64f36087b1115de635d54b100542ea5d891774014d909e1721edfb55d252e3638253d6ef7fc6dfb60568d995a5d1e123dc618abfe2ec374d6d801484a1b2193ec635f33fae555a3dad73e0d2ea08cf428294e5f7f25c8520335db93632f7df66141da21311442e385d1822aba86f610bde42d5e8006d9f9479926dd7f2a433a0920ad5e8cacfedf3118c260970bcff687b70779b1b53eebc04e33fdcb1d77810521a9068d847d11ba518f40d3fba481021713d8bb49fe9776bec21385";
//   const publicInput0 = 560081862490298699054938704503107639641048735116641318329800131685350304586n;
//   const publicInput1 = 220513391788771175147129336030711777973545736543133530921084510840178367843n;
//   const result = await verifier.Verify(
//     signature,
//     [publicInput0, publicInput1]
//   );
//   console.log("verification result is: ", result);
// };

// verify();
