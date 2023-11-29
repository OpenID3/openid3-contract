import { expect } from "chai";
import { getGoogleZkAdmin } from "../lib/utils";
import * as hre from "hardhat";
import { Contract } from "ethers";
import { TestAccount, TestAccount__factory } from "../types";
import { buildZkValidationData } from "../lib/google";
import base64url from "base64url";

const userOpHash = "0xaa3bcefdd5c1349d61419ce9ae495ded01a026577652b3ab594d95637801996d";
// sha256(iss+aud+sub)
const accountHash = "0x8857748d93da4bf00a063961c5d3b993c47389e64b6feb621998bc1898387368";
const jwt = {
    kidSha256: "0xe2de8d1d8b4e64dfcba1ec07baca750c9b1eeac480a050316055f37fae14bf7a",
    iat: "1700542500",
    signedDataHash: "0xcb394658fd95be4b6fe84eed732a8e4761a7570177fa49cc6e49af32b1dd74e6",
    signature: "c27y1sbEOkdg-2w-fftfRmXZt7mHJJWa1WE1nGSciMv5opvqP_AZ6hHMNWCJlIZeNPRAYK6qAbL9YUhctiOMp_NZ-fe4qqvfQUNIchjIaiKuQ_wsEXnqh7djWqjH5AI25ssu6KSOYyBv248qOOnHqR6A51B9FbPBA87WjO4RYQxp7Mk_QMs0vl2VTpVoTZB2nyDn2wwD7tpCADWAa5aGb_MNHxZwv-VLzjDI9dA9tSQbu7xT3qEDnA6ND5h5bg4THwoJx-AHnX7kxVCXxb_UoNqXMSmki389Oxy7MG4IPQE0h2NoKjtyz1iK4_kSuInDaDIrNTbQ0l156SdfgHnUdQ",
};

const proof = {
    "verifier_digest":"0x000ed19c6d8bf05b40365780553f4a35164fdde2205196362b91ac7b4073551d",
    "proof":"0x1ab11d53bf87c9c269f6268c894c0031fb0885d2546a29f650277d1a095ea4c20e7427a5c8ae98d5eff99724799f22f4123b963fb9a270979f686bec7c497ff9174bc08c708bee0f1df6a91dee07dea6300dba9895d8413dedeae58e539a91b41de5f4a51d5c4acd4b88959a2a1dc7ceadbcb7b878e75a421a3de0cab966098204b0a82ce1964d953cecdd32318ca778798348f134db3395c74a6d461a9aba870773a9bb935a3118c9468c3d867e42d3aed74a9e73d255b9bf8be946cb7b27eb04ba12287936c6f06f1da5db3afe5e86830efaeb43093a7063a2aef17e1a4ad70f6ebd19443ad10f30abf975328aa1d22b042919697ea64f9d45453671e68c09011550481f015fadb7e23d62295830bc3df3b8c7fee2a233210b3adba8d588db02b2928b87c3c290fbb58bda34a302dfdf6d1e6b782e245a811692d840475d4702c317d9fac6ded334df5f6c65aa4f44c95fff594b12328f360b413b1d2b036f0f976891681a4fa4d070024d3d8b860ab3fb14ad57f0fa8a224d687e8311526f18f700c0d9cf967d17903e5584989e705e33e064fe42a9883707bcb98bb6076823b25e3aa226aeab1710df41318abc131b1fdd2f64244f82925c5ac1dac0e7660635ef24761c167c703d8d37b073fee09998aaec3aff3ec0a7dccf7e873a769f056cbd21371caf1bc5a09a76e37a3dba291e080e5cc53121a2cbbbaa71f8673025eff66f06e9aab3aa909f82374287dbdcbb8858e395c553fb24fa981fc81fad10aece420fb8b968e9527fb004968753006df9359fde377c546a49ab1cf43ebc28b920e5cafa35d6b7396d7ff9c3999aeabbf19f8854defcf9cefaff163d25451b264850489b9eae6c16295f890f20453df30ff910af50e68dbae261744763121bf43d47ea69e5934a729d4eaf24c6085964df253a581fd71af3727a23089873048c9bd3e9bd886dbc21e58bef480184e74bf00e4685b46d9833e0ac3ed84a97112e07748677989bf9ba509c4a5b11c163421ee041732f7fbfbddd6edb8c4e0201d9a7a371b35ead329e03307de0388a8828f72fc1eb1f8b3396f415a89711281bdaac53cb66934fdef7880b5a2b364aded63440653a44c4eae00253cdba99f31144a796f06de2b9cbbd59c52e8f2df26e6a97d66dff614eb9bc6876629d02602dfb3676463843ea528de47cc5df3231eb4fcfe728f484471a1e7a6da30a07f6027a4dd8f63e1c8d7abcd7c4656ca332a99ecfd45e54c27769b299f707a30d6a19894c7cabce2f21dd2eadf01734b8c5a225caeacc1508443c89969eb33b8cbd"
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
