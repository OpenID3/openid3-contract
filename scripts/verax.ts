import { ethers } from "ethers";
import * as hre from "hardhat";
import * as fs from "fs";
import { OpenId3TeeModule__factory } from "../types";

const LINEA_TEST_CONTRACTS = {
  schema_registry: "0xB2c4Da1f8F08A0CA25862509E5431289BE2b598B",
  module_registry: "0x1a20b2CFA134686306436D2c9f778D7eC6c43A43",
  portal_registry: "0x506f88a5Ca8D5F001f2909b029738A40042e42a6",
  attestation_reader: "0x65c8294C7aF0f0bDDe51eF92AF850613bb629fc6",
};

const LINEA_CONTRACTS = {
  schema_registry: "0x0f95dCec4c7a93F2637eb13b655F2223ea036B59",
  module_registry: "0xf851513A732996F22542226341748f3C9978438f",
  portal_registry: "0xd5d61e4ECDf6d46A63BfdC262af92544DFc19083",
  attestation_reader: "0x40871e247CF6b8fd8794c9c56bB5c2b8a4FA3B6c",
};

const schema = "tuple(string,string,string,string)";
const SCHEMA_REGISTRY_ABI = [
  "function createSchema(string, string, string, string)",
  "function getIdFromSchemaString(string memory schema) public pure returns (bytes32)",
  `function getSchema(bytes32 schemaId) public view returns (${schema} memory)`,
];

const SCHEMA = "bytes32 providerHash, bytes32 accountHash";
const SCHEMA_ID =
  "0x912214269b9b891a0d7451974030ba13207d3bf78e515351609de9dd8a339686";

function getContracts() {
  if (hre.network.name === "linea_test") {
    return LINEA_TEST_CONTRACTS;
  }
  if (hre.network.name === "linea") {
    return LINEA_CONTRACTS;
  }
  throw new Error("Unsupported network");
}

function getSigner() {
  const env = JSON.parse(fs.readFileSync(process.env.LOCAL_KEYS_PATH!, "utf8"));
  return new ethers.Wallet(env.openid3, hre.ethers.provider);
}

export async function registerSchema() {
  const signer = getSigner();
  console.log("Signer: ", signer.address);
  const contracts = getContracts();
  const schemaRegistry = new ethers.Contract(
    contracts.schema_registry,
    SCHEMA_REGISTRY_ABI,
    signer
  );
  const feeData = await hre.ethers.provider.getFeeData();
  const tx = await schemaRegistry.createSchema("openid3", "", "", SCHEMA, {
    gasPrice: feeData.gasPrice!,
  });
  console.log("Registering schema: tx=", tx.hash);
  await tx.wait();
  console.log("Schema Registered");
  const id = await schemaRegistry.getIdFromSchemaString(SCHEMA);
  console.log("Schema ID", id);
  console.log("Expected schema ID: ", SCHEMA_ID);
}

const MODULE_REGISTRY_ABI = ["function register(string, string, address)"];
// the address is deterministic across all chains
const TEE_MODULE_ADDRESS = "0x401C196454C5541c6C63713F14Db2967Fcc0B38A";
export async function registerModule() {
  const signer = getSigner();
  const contracts = getContracts();
  const moduleRegistry = new ethers.Contract(
    contracts.module_registry,
    MODULE_REGISTRY_ABI,
    signer
  );
  const feeData = await hre.ethers.provider.getFeeData();
  const tx = await moduleRegistry.register("openid3", "", TEE_MODULE_ADDRESS, {
    gasPrice: feeData.gasPrice,
  });
  console.log("Registering module: tx=", tx.hash);
  await tx.wait();
  console.log("Module Registered as ", TEE_MODULE_ADDRESS);
}

const PORTAL_REGISTRY_ABI = [
  "event PortalRegistered(string name, string description, address portalAddress)",
  "function deployDefaultPortal(address[], string, string, bool, string)",
  "function isIssuer(address) public view returns (bool)",
];

// Linea testnet:
// tx: 0x9a5f4a48a1ea59fee07e211cee46d1b27f308d991fb9a5a3c8081294196f2768
// portal address: 0x035F33fbC1b96A3356169f498D4689dcb7079927

export async function registerPortal() {
  const signer = getSigner();
  const contracts = getContracts();
  console.log("Portal Registry: ", contracts.portal_registry);
  const portalRegistry = new ethers.Contract(
    contracts.portal_registry,
    PORTAL_REGISTRY_ABI,
    signer
  );
  const feeData = await hre.ethers.provider.getFeeData();
  const tx = await portalRegistry.deployDefaultPortal(
    [TEE_MODULE_ADDRESS],
    "openid3-portal",
    "openid3-portal",
    true,
    "openid3",
    { gasPrice: feeData.gasPrice }
  );
  console.log("Registering portal: tx=", tx.hash);
  const receipt = await tx.wait();
  console.log("Portal Registered: ", receipt);
  receipt.logs.forEach((log: any) => {
    console.log("Log: ", portalRegistry.interface.parseLog(log));
  });
}

const EASAttestation =
  "tuple(bytes32,bytes32,uint64,uint64,uint64,bytes32,address,address,bool,bytes)";
const ATTESTATION_READER_ABI = [
  `function getAttestation(bytes32 uid) public view returns (${EASAttestation})`,
];
export async function getAttestation() {
  const signer = getSigner();
  const contracts = getContracts();
  console.log("Attestation reader: ", contracts.attestation_reader);
  const attestationReader = new ethers.Contract(
    contracts.attestation_reader,
    ATTESTATION_READER_ABI,
    signer
  );
  const attestation = await attestationReader.getAttestation(
    "0x0000000000000000000000000000000000000000000000000000000000001627"
  );
  console.log("Attestation: ", attestation);
}

export async function checkIssuer() {
  const signer = getSigner();
  const contracts = getContracts();
  console.log("Portal Registry: ", contracts.portal_registry);
  const portalRegistry = new ethers.Contract(
    contracts.portal_registry,
    PORTAL_REGISTRY_ABI,
    signer
  );
  const isIssuer = await portalRegistry.isIssuer(signer.address);
  console.log(`Is Issuer: ${signer.address}=${isIssuer}`);
}

// const ATTESTATION_PAYLOAD = "tuple(bytes32,uint64,bytes,bytes)";
// const PORTAL_ABI = [
//     `function getModules() external view returns (address[] memory)`,
//     `function attest(${ATTESTATION_PAYLOAD} memory attestationPayload, bytes[] memory validationPayloads) public payable`,
// ]

const PORTAL_ABI = [{
  inputs: [
      {
          components: [
              {
                  internalType: "bytes32",
                  name: "schemaId",
                  type: "bytes32",
              },
              {
                  internalType: "uint64",
                  name: "expirationDate",
                  type: "uint64",
              },
              {
                  internalType: "bytes",
                  name: "subject",
                  type: "bytes",
              },
              {
                  internalType: "bytes",
                  name: "attestationData",
                  type: "bytes",
              },
          ],
          internalType: "struct AttestationPayload",
          name: "attestationPayload",
          type: "tuple",
      },
      {
          internalType: "bytes[]",
          name: "validationPayloads",
          type: "bytes[]",
      },
  ],
  name: "attest",
  outputs: [],
  stateMutability: "payable",
  type: "function",
}];

export async function searchAttestation() {
  const attestationData =
    "0x8f2f90d8304f6eb382d037c47a041d8c8b4d18bdd8b082fa32828e016a584ca79d93f7420b0ef9d8eb5f63f7e598589a104391da5f89cd6553a6014f02ed513e";
  const signature =
    "0xe0122c9f2095b5c2499b17cafd935e52a7cc817d4823a684affbce1d372f83fd5d673eea7136e04b1cca64c95ac4e000166bbc404761627e283096d343f8ca4c1c";
  const topic =
    "0x1c978da31d5a734f3dd3b88a7801d344b522301e6d07006e51520330e6c0795d";
  let message = ethers.solidityPackedKeccak256(
    ["bytes", "bytes"],
    [attestationData, "0x09C08f46d523822cC9D18A077e2e3BDE5BC07a0b"]
  );
  const expectedSigner = ethers.verifyMessage(ethers.getBytes(message), signature);
  console.log("Signer: ", expectedSigner);
  const logs = await hre.ethers.provider.getLogs({
    fromBlock: 1036373,
    toBlock: "latest",
    address: "0x401c196454c5541c6c63713f14db2967fcc0b38a",
    topics: [topic, ethers.keccak256(attestationData)],
  });
  if (logs.length == 0) {
    console.log("no log found");
    return;
  }
  const iface = OpenId3TeeModule__factory.createInterface();
  const event = iface.parseLog({
    topics: Array.from(logs[0].topics),
    data: logs[0].data,
  });
  console.log("Event: ", event);
}

// registerSchema();
// registerModule();
// registerPortal();
// getAttestation();
// checkIssuer();
// searchAttestation();
