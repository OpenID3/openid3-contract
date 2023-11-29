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

const SCHEMA = "string provider, string account";
const SCHEMA_ID = "0x44a18728bda7ce4b5891c75a6e6d316f8d9020453bdf55754e63c1d3a85acee9";

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
    const tx = await schemaRegistry.createSchema(
        "openid3",
        "",
        "",
        SCHEMA,
        // {
        //     gasPrice: ethers.parseUnits("2.7", "gwei"),
        // }
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
const TEE_MODULE_ADDRESS = "0x457E4220342D086eEC0C70731d2128C1DC936796";
export async function registerModule() {
    const signer = getSigner();
    const contracts = getContracts();
    const moduleRegistry = new ethers.Contract(
        contracts.module_registry,
        MODULE_REGISTRY_ABI,
        signer,
    );
    const tx = await moduleRegistry.register(
        "openid3",
        "",
        TEE_MODULE_ADDRESS,
        // {
        //     gasPrice: ethers.parseUnits("2.7", "gwei"),
        // }
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
// tx: 0xffbd32152e5b019bf1a1324792d28638bceb4d086605397c213ed6fee5bc8a29
// portal address: 0x899a09E88a0aB7df0A8D4893E20830632656637e

// Linea mainnet:
// tx: 0x0d9617a6e0e72ce80b31a7113ab2b8b3aba31872ca9888442eaac0a2ab856954
// portal address: 0x9C6a396103763E18406E324dCf30d6013D336b4A

export async function registerPortal() {
    const signer = getSigner();
    const contracts = getContracts();
    console.log("Portal Registry: ", contracts.portal_registry);
    const portalRegistry = new ethers.Contract(
        contracts.portal_registry,
        PORTAL_REGISTRY_ABI,
        signer,
    );
    const tx = await portalRegistry.deployDefaultPortal(
        [TEE_MODULE_ADDRESS],
        "openid3-portal",
        "openid3-portal",
        true,
        "openid3",
        // {
        //     gasPrice: ethers.parseUnits("2.7", "gwei"),
        // }
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
// registerPortal();