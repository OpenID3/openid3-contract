import { expect } from "chai";
import { getGoogleZkAdmin } from "../lib/utils";
import * as hre from "hardhat";
import { Contract } from "ethers";
import { TestAccount, TestAccount__factory } from "../types";
import { buildZkValidationData } from "../lib/google";
import base64url from "base64url";

const userOpHash = "0x63cfcbcf6b50e4e0ff31bd42dd97e31d241f28df2d873bb1c851d5f9e2f85c9b";
const accountHash = "0x86d8e0c1f273208b3c798c73131e9765c3ba7ca86e06f969225cd43f21921fce";
const jwt = {
    kidSha256: "0x1c21d7977155420d8f58affbc31983f09c956b361d2e9a70df010b3a8a3e3c0f",
    iat: "1699325390",
    signedDataHash: "0x25f75af748312bc41137eef2f2e5c9d337bbb3ea94f8ac2c7606ce9ade811d53",
    signature: "QlH8Kkz0o-ET8_0YIlLJ-tQy8xcKGIB8MxaKi_j-jnQI1RydovLZCEKcSOimgkQfLZ-DnVe9g2eAgYBr1jZ4tz6C6Fx00l1MSPD_IrVG0Ta19bwcokBHRbQo97sRoQiSnskww1DvW99e90lVUM-FFnOuvNiOvOeATH0MTQ5QwWc-uRTCiMlTbICY8qLMyW8mk0QM7zFZVTLNyOM7WEqxIJXgyM7eESsMuIBeniEDiGYQ1N50SMKdoe2w21zfI7JbKqS7KELzT0ybz29H5CTqHc6u75gOyCzkZWiKcRMfHk5EgbWhIcjttb2GHgFXbngbPa6j1ZR2BpFU0nLnFl0mkw",
}

const proof = {
    "input_hash":"0x1636c0c52bd4e175e5f79dc51806734fb36d4e172b75282e81dafb168b7f9a04",
    "output_hash":"0x03b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "verifier_digest":"0x118700c68ddc60b11689a5f6b23425d19259dd26dfa114009d7d53dc6219ee72",
    "proof":"0x2daa4170d775a29579d692d006c1274396fe8fd04ee73ffb59097815ecb0d98016352a6e2d4c88b900f9fb75b66380ac72a52c756619788a613c97b05616c55f301e6df08a23ecd7f28708ca73e0667dba01d5dff876326227c37095f83f3f730466a8ff189a3c125e4fc5b8f1ceb4af8658423007e4a0aa2ccf705f2105a8b12a7f37a654db4bf1e128fb97a3dca382ccad324140af76a64ecdb51144e6dfcf04ceb6da5139b0554d5e1a67db48e0d497b3278618b5718cbd34c6f18f74f37e2900c8d598975c918fb4f1c381ec33875052cebaf64befc06372da5a0e18feed09d55be5423eb4489a4ad48527a75aeca424a2a6a714e1250385992a9fa17f6602302a9ec5cfc745e64c513f1e658b61b250dfad35a437cc880360ef10e3586a1be73069c9d4bf828876da704bec2e09c0e7ad9dc6fed8ab8495cd11e19df9c7294beec8bccc45364217593e36622f33e6d99db09bef0689e5ddb9a06bd0dd4405b081529a5955490e831994ab79da657adeb37e37358cc22b9efb28d37442e72528efdf394bc0de00c880e80ba253a036a087bcbf15d917acb594651e7f98ce17645fd97721c9e13b0428a33789071bca2353fe37801babae58cd608c3c847e25dffd1a6ab0dc069e7464e6a09a7c9bc175dfdaa2a5f8e6a730c2c98f30a25c090a7ef189498d0251e8171bf48a2f12464f388173c615aecb0091bdc072308423c1138f6987e62117db3a16f860f313b394b2c1924fb79c617db49a1cadb68718392fa709aaf4d6797afa15f19205409207ba3ac5fbefdc67b68e2f0bae760d20a7c400f273a1a929f51b11187cb8d45c7ff1076fa100954169a15ca356f24f138a92f265cff2f6e7b8a9604a443aa5df33cfd4a72e2a539f01761cbe835da90ae3a5080e9ac9cbecee8aab9806a0f4998cd0616ef6ba533800fe410628dce618d8ed7348da22120903f60430b94cdd40978c0b4575f493d217489120c0dee520450eb16c47285f63fa9c594eaf6c1e064fe80609d3f5bf58c861495fcd4d3e0bc6ff7c42d0f26a85402e36b99a573c8be108d1dbde1f21e4e08a7a559617672c9dc58db456070770c698d1b7681640fe38f61cdec21c239df39d053414f71015d72306e842344a15fd433869d8730338259ad2cf0ea6e2f86e2e8f352d3ea5024b5582a42fd2b96f3c7b9785aabe71844d57833b249da106071a4736b28011215b2dbeae4168935a9b6d33658456476d3ef1663cd1a5c5f08cf454afca137f2d41ef4c21250f50c46f0b1f821b5c011a285d8e2c6749fa2880e111a56dc539"
};

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

  it("should valiate google zk proof", async function () {
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
