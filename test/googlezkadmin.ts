import { expect } from "chai";
import { getGoogleZkAdmin } from "../lib/utils";
import * as hre from "hardhat";
import { Contract } from "ethers";
import { TestAccount, TestAccount__factory } from "../types";
import { buildZkValidationData } from "../lib/google";
import base64url from "base64url";
import crypto from "crypto";

const userOpHash = "0x63cfcbcf6b50e4e0ff31bd42dd97e31d241f28df2d873bb1c851d5f9e2f85c9b";
const accountHash = "0x86d8e0c1f273208b3c798c73131e9765c3ba7ca86e06f969225cd43f21921fce";
const jwt = {
    kidSha256: "0x1c21d7977155420d8f58affbc31983f09c956b361d2e9a70df010b3a8a3e3c0f",
    iat: "1699325390",
    signedDataHash: "0x25f75af748312bc41137eef2f2e5c9d337bbb3ea94f8ac2c7606ce9ade811d53",
    signature: "QlH8Kkz0o-ET8_0YIlLJ-tQy8xcKGIB8MxaKi_j-jnQI1RydovLZCEKcSOimgkQfLZ-DnVe9g2eAgYBr1jZ4tz6C6Fx00l1MSPD_IrVG0Ta19bwcokBHRbQo97sRoQiSnskww1DvW99e90lVUM-FFnOuvNiOvOeATH0MTQ5QwWc-uRTCiMlTbICY8qLMyW8mk0QM7zFZVTLNyOM7WEqxIJXgyM7eESsMuIBeniEDiGYQ1N50SMKdoe2w21zfI7JbKqS7KELzT0ybz29H5CTqHc6u75gOyCzkZWiKcRMfHk5EgbWhIcjttb2GHgFXbngbPa6j1ZR2BpFU0nLnFl0mkw",
}
const proof = {
    "input_hash":"0x083b6a8da23fe6bc252c459430bfef5765e6a2389317a4353dd636f363974b93",
    "output_hash":"0x03b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "verifier_digest":"0x118700c68ddc60b11689a5f6b23425d19259dd26dfa114009d7d53dc6219ee72",
    "proof":"0x2c2a753e9b2c4eca87793041f87383d2a8fb35abff44dd1d0ac10a42fc93f181262605e29cbb4591c0f1733ac6e7ca343cb9a9a6f6efb68c175b2e39b66703da1d013714de185ebc46efea81c449a02d1a3e33caf896e9690dade644b1cfb093082d329d0d26fe3203cd0d64f15aaa7818a7c05a97a26ac0c98b5d0076161e1524d1df318b6c2b6643bb45cc8edd6f0f50c7449f38b6354d6f9bd91e6493afe32315ff3f8c2a7b1b96da0d1898c9197388735990216ef17ab2d1579f3e0ab7a324afe3de6bacdfaad11fa3ad7aa41d0bcebb14af9982121cbda199c5c31d590a1b9cb98ac241283334ff6cde3c0db8aafca8921c284afd107ab4621106a9925417096078c0d30243bc0c1909c66696a91ba8cd248177a692d7ec732ca7946d840920fe4f80a6394638458f366a633347d1b6b850ccf0682ae0c8aa42bd3447fe1df79968d693c6ffc3dadea6f813b863ec80793afb30e455b1ba1f7ad76a27711778c0839f06be4fdde3f07b18efff14a7aa9f07b8a43de0ad0b2195f59ec80e0e6d9d18e95f54a682f50ff71bbfaa29ecd817f693afb4d190e3fabd82341fbb040efb38b3602e140003a2480b730f134e01cc8516221506686317c11aea37fa1131fdc20eb2dc4c99e1a640cf375f044bacf6484dae00ec83f04352afa9483c05d66369cef3d067f22117e74a0c933fa1d332328db38fd25f8db580a7a2d7af268202310c648a58c35be36e664a2991753b793b52b90b0ea8f43d7477f880710dfae6af26ba5e612fd51270a20c751321175fe4d35c749675e3c4e4e7416db70e786450c9213b53ac9cd0565659ffb06320351c7f5a3ba92695fbde2032a9ef0f7de7bd7b12acf7199ce1596d762d2eb626e013caf1b5a819cca25f0c653368058e85c85067e1310ecdca3b80390810aa943e48506f735352cdc26fea35208a223cb179c8d3d728ad63718e775a0cf0e95a740c15448d4679415f627ae16756112e132702edf66ecc46cf1b2de4cacacf5f7ad9ce74c7ee38d03bf6973cde4c120d8d9c41701bb6fd099fe408e778c75adb98e0789d606f5250f10855cfdeff2ab9d6d29949f0f6cd44a3b122f730e3bf14751ba2c496a8c8b80c883747900c2d390b5ef89de82c63df50585b4302b6ecd64522338193415b9b38d2da2df1e90be9b51c6eacbe5dbe728c390bed17ce142d4f95ca7926779d5fb83092a480cd19fdcb328265a6496d83c187b52f747af7617f81b1d43e2787d9a9f364f6856112bd11404f52ca5bc1df74e995a021f87b507ef0d9753d66c75fbc1ba5a156cc",
}

const sha256 = (input: string | Buffer) : Buffer => {
    return crypto.createHash("sha256").update(input).digest();
}

describe("OpenId3Account", function () {
  let admin: Contract;
  let account: TestAccount;

  const deployTestAccount = async () => {
    const {deployer} = await hre.ethers.getNamedSigners();
    const deployed = await hre.deployments.deploy(
        "TestAccount", {
            from: deployer.address,
            args: [],
            log: true,
        }
    );
    return TestAccount__factory.connect(deployed.address, deployer);
  }

  beforeEach(async function () {
    await hre.deployments.fixture(["TEST"]);
    admin = await getGoogleZkAdmin(hre);
    account = await deployTestAccount();
  });

  it.only("should deploy account", async function () {
    const jwtSignature = "0x" + base64url.toBuffer(
        jwt.signature).toString("hex");
    const data = admin.interface.encodeFunctionData(
        "linkAccount", [accountHash]
    );
    const accountAddr = await account.getAddress();
    await expect(
        account.execute(await admin.getAddress(), 0, data)
    ).emit(admin, "AccountLinked").withArgs(accountAddr, accountHash);

    expect(
        await admin.getLinkedAccountHash(accountAddr)
    ).to.eq(accountHash);

    const kidHash = sha256("f5f4bf46e52b31d9b6249f7309ad0338400680cd");
    console.log("kid hash: ", kidHash.toString("hex"));
    const issHash = sha256("https://accounts.google.com");
    console.log("iss hash: ", issHash.toString("hex"));
    const audHash = sha256("11980183890-ppa16i4601t9jf53ea2u2j77rig9mkrc.apps.googleusercontent.com");
    console.log("aud hash: ", audHash.toString("hex"));
    const nonceHash = sha256("63cfcbcf6b50e4e0ff31bd42dd97e31d241f28df2d873bb1c851d5f9e2f85c9b");
    console.log("nonce hash: ", nonceHash.toString("hex"));
    const iatHash = sha256("1699325390");
    console.log("iat hash: ", iatHash.toString("hex"));
    const subHash = sha256("105017222000589780480");
    console.log("sub hash: ", subHash.toString("hex"));
    const jwtAndPayloadHash = Buffer.from("25f75af748312bc41137eef2f2e5c9d337bbb3ea94f8ac2c7606ce9ade811d53", "hex");
    console.log("jwt hash: ", jwtAndPayloadHash.toString("hex"));
    const outputHash = sha256(Buffer.from([]));
    console.log("output hash: ", outputHash.toString("hex"));
    const combinedHash = Buffer.concat([
        jwtAndPayloadHash, kidHash, issHash, audHash, nonceHash, iatHash, subHash,
    ]);
    console.log("with jwt hash: ");
    console.log(combinedHash.toString("hex"));
    console.log(sha256(combinedHash).toString("hex"));

    const validatonData = buildZkValidationData({
        jwt: {
            kidSha256: jwt.kidSha256,
            iat: jwt.iat,
            jwtHeaderAndPayloadHash: jwt.signedDataHash,
            jwtSignature,
        },
        circuitDigest: proof.verifier_digest,
        proof: proof.proof,
    });
    const validateData = admin.interface.encodeFunctionData(
        "validateSignature", [userOpHash, validatonData]
    );
    await account.execute(await admin.getAddress(), 0, validateData);
  });
});
