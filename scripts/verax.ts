import { ethers } from "ethers";
import * as hre from "hardhat";
import * as fs from "fs";

const LINEA_TEST_CONTRACTS = {
    "schema_registry": "0xB2c4Da1f8F08A0CA25862509E5431289BE2b598B",
    "module_registry": "0x1a20b2CFA134686306436D2c9f778D7eC6c43A43",
    "portal_registry": "0x506f88a5Ca8D5F001f2909b029738A40042e42a6",
};

const LINEA_CONTRACTS = {
    "schema_registry": "0x0f95dCec4c7a93F2637eb13b655F2223ea036B59",
    "module_registry": "0xf851513A732996F22542226341748f3C9978438f",
    "portal_registry": "0xd5d61e4ECDf6d46A63BfdC262af92544DFc19083",
};

const SCHEMA_REGISTRY_ABI = [
    "function createSchema(string, string, string, string)",
    "function getIdFromSchemaString(string memory schema) public pure returns (bytes32)",
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
        {gasPrice: feeData.maxFeePerGas}
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
const TEE_MODULE_ADDRESS = "0x8670Ea7305f28A2106f4AF9dad04ADA50fFD3307";
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
        {gasPrice: feeData.maxFeePerGas}
    );
    console.log("Registering module: tx=", tx.hash);
    await tx.wait();
    console.log("Module Registered as ", TEE_MODULE_ADDRESS);
}

const PORTAL_REGISTRY_ABI = [
    "event PortalRegistered(string name, string description, address portalAddress)",
    "function deployDefaultPortal(address[], string, string, bool, string)",
];

// Linea testnet:
// tx: 0x7156f9788390ea06cd4ad1a0ea4ff08f3c6e088cb4bad257d14a1e914885ffe8
// portal address: 0x600866576bc0beBA463854F4B9DBE1DA07aF2567

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
        {gasPrice: feeData.maxFeePerGas}
    );
    console.log("Registering portal: tx=", tx.hash);
    const receipt = await tx.wait();
    console.log("Portal Registered: ", receipt);
    receipt.logs.forEach((log: any) => {
        console.log("Log: ", portalRegistry.interface.parseLog(log));
    });
}

// registerSchema();
// registerModule();
registerPortal();
