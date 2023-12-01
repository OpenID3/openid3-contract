import { ethers } from "ethers";
import * as hre from "hardhat";
import * as fs from "fs";

const LINEA_TEST_CONTRACTS = {
    "schema_registry": "0xB2c4Da1f8F08A0CA25862509E5431289BE2b598B",
    "module_registry": "0x1a20b2CFA134686306436D2c9f778D7eC6c43A43",
    "portal_registry": "0x506f88a5Ca8D5F001f2909b029738A40042e42a6",
    "attestation_reader": "0x65c8294C7aF0f0bDDe51eF92AF850613bb629fc6",
};

const LINEA_CONTRACTS = {
    "schema_registry": "0x0f95dCec4c7a93F2637eb13b655F2223ea036B59",
    "module_registry": "0xf851513A732996F22542226341748f3C9978438f",
    "portal_registry": "0xd5d61e4ECDf6d46A63BfdC262af92544DFc19083",
    "attestation_reader": "0x40871e247CF6b8fd8794c9c56bB5c2b8a4FA3B6c",
};

const schema = "tuple(string,string,string,string)";
const SCHEMA_REGISTRY_ABI = [
    "function createSchema(string, string, string, string)",
    "function getIdFromSchemaString(string memory schema) public pure returns (bytes32)",
    `function getSchema(bytes32 schemaId) public view returns (${schema} memory)`
];

const SCHEMA = "bytes32 providerHash, bytes32 accountHash";
const SCHEMA_ID = "0x912214269b9b891a0d7451974030ba13207d3bf78e515351609de9dd8a339686";

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
    const env = JSON.parse(
        fs.readFileSync(process.env.LOCAL_KEYS_PATH!, "utf8"));
    return new ethers.Wallet(env.openid3, hre.ethers.provider);
}

export async function registerSchema() {
    const signer = getSigner();
    console.log("Signer: ", signer.address);
    const contracts = getContracts();
    const schemaRegistry = new ethers.Contract(
        contracts.schema_registry,
        SCHEMA_REGISTRY_ABI,
        signer,
    );
    const feeData = await hre.ethers.provider.getFeeData();
    const tx = await schemaRegistry.createSchema(
        "openid3",
        "",
        "",
        SCHEMA,
        {gasPrice: feeData.gasPrice!}
    );
    console.log("Registering schema: tx=", tx.hash);
    await tx.wait();
    console.log("Schema Registered");
    const id = await schemaRegistry.getIdFromSchemaString(SCHEMA);
    console.log("Schema ID", id);
    console.log("Expected schema ID: ", SCHEMA_ID);
}

const MODULE_REGISTRY_ABI = [
    "function register(string, string, address)"
];
// the address is deterministic across all chains
const TEE_MODULE_ADDRESS = "0x401C196454C5541c6C63713F14Db2967Fcc0B38A";
export async function registerModule() {
    const signer = getSigner();
    const contracts = getContracts();
    const moduleRegistry = new ethers.Contract(
        contracts.module_registry,
        MODULE_REGISTRY_ABI,
        signer,
    );
    const feeData = await hre.ethers.provider.getFeeData();
    const tx = await moduleRegistry.register(
        "openid3",
        "",
        TEE_MODULE_ADDRESS,
        {gasPrice: feeData.gasPrice}
    );
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
        signer,
    );
    const feeData = await hre.ethers.provider.getFeeData();
    const tx = await portalRegistry.deployDefaultPortal(
        [TEE_MODULE_ADDRESS],
        "openid3-portal",
        "openid3-portal",
        true,
        "openid3",
        {gasPrice: feeData.gasPrice}
    );
    console.log("Registering portal: tx=", tx.hash);
    const receipt = await tx.wait();
    console.log("Portal Registered: ", receipt);
    receipt.logs.forEach((log: any) => {
        console.log("Log: ", portalRegistry.interface.parseLog(log));
    });
}

const EASAttestation = "tuple(bytes32,bytes32,uint64,uint64,uint64,bytes32,address,address,bool,bytes)";
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
        signer,
    );
    const attestation = await attestationReader.getAttestation(
        "0x0000000000000000000000000000000000000000000000000000000000001627");
    console.log("Attestation: ", attestation);
}

export async function checkIssuer() {
    const signer = getSigner();
    const contracts = getContracts();
    console.log("Portal Registry: ", contracts.portal_registry);
    const portalRegistry = new ethers.Contract(
        contracts.portal_registry,
        PORTAL_REGISTRY_ABI,
        signer,
    );
    const isIssuer = await portalRegistry.isIssuer(signer.address);
    console.log(`Is Issuer: ${signer.address}=${isIssuer}`);
}

// registerSchema();
// registerModule();
// registerPortal();
// getAttestation();
// checkIssuer();
