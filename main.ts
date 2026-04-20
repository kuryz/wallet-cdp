import express from "express";
import type { Request, Response, NextFunction } from "express";
import { CdpClient } from "@coinbase/cdp-sdk";
// const { generateJwt } = require("@coinbase/cdp-sdk/auth");
import "dotenv/config";
import crypto from "crypto";
import { db } from "./db.js";
import { logError } from "./logger.js";
// import { RowDataPacket } from "mysql2";
import webhookRouter from "./webhooks/cdp.js";
import { registerAddresses, createWebhook, updateWebhookAddresses } from './alchemy/addressRegistry.js';
import { createAlchemyWebhook, getWebhookId, insertWebhookId } from './alchemy/webhook.js'
import { encodeTransfer, registerAddressWebhook, registerWebhook } from "./helpers/webhookHelper.js";
import { ethers } from "ethers";
// dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

interface CdpWebhookResponse {
  id: string;
  description: string;
  eventTypes: string[];
  target: { url: string; method: string };
  labels: Record<string, string>;
  isEnabled: boolean;
  metadata?: { secret: string };
  [key: string]: any; // for extra fields returned by API
}

type WebhookRow = {
  webhook_id: string;
};

// Initialize the CDP client, which automatically loads
// the API Key and Wallet Secret from the environment
// variables.
function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variables: ${name}`);
  }
  return value;
}

const cdp = new CdpClient({
  apiKeyId: requiredEnv("CDP_API_KEY_ID"),
  apiKeySecret: requiredEnv("CDP_API_KEY_SECRET"),
  walletSecret: requiredEnv("CDP_WALLET_SECRET"),
});
app.use(express.json());

/**
 * API key authentication middleware
 */
function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
    const apiKey = req.header("x-api-key");
  
    if (!apiKey || apiKey !== API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    next();
}

async function storeAddress(userId: string, address: string, smart: string, chain: "evm" | "solana") {

  if (smart == '') {
    await db.execute(
      `INSERT IGNORE INTO deposit_addresses (user_id, address, chain)
       VALUES (?, ?, ?)`,
      [userId, address, chain]
    );
  }else{
    await db.execute(
      `INSERT IGNORE INTO deposit_addresses (user_id, address, smart_address, chain)
       VALUES (?, ?, ?, ?)`,
      [userId, address, smart, chain]
    );
  }
    
}

function generateCdpApiToken() {
  const apiKeyId = requiredEnv("CDP_API_KEY_ID");
  const apiKeySecret = requiredEnv("CDP_API_KEY_SECRET");

  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    iss: apiKeyId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60, // valid 60s
  };

  const base64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const encodedHeader = base64url(header);
  const encodedPayload = base64url(payload);

  const signature = crypto
    .createHmac("sha256", apiKeySecret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

async function getWalletTokenBalances(chainnetwork: any, wallet_address: any) {
	const firstPage = await cdp.evm.listTokenBalances({
    address: wallet_address,
		network: chainnetwork,
  	pageSize: 10,
	});
  return firstPage;
}


// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

// Create EVM account
app.post(
  "/accounts/evm",
  apiKeyAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { user } = _req.body;
      // const firstOwner = await cdp.evm.getOrCreateAccount({
      //   name: "Finp_user"
      // });
      const owner = await cdp.evm.createAccount();
      const account = await cdp.evm.createSmartAccount({
        owner
      });
      await storeAddress(user, owner.address, account.address, "evm");
      
      /**
       * register by the specified networks 
       * ETH_MAINNET, BSC, polygon, base
       */

      await Promise.all([
        registerAddressWebhook(owner.address, 'ETH_MAINNET'),
        registerAddressWebhook(owner.address, 'BNB_MAINNET'),
        registerAddressWebhook(owner.address, 'POLYGON_MAINNET'),
        registerAddressWebhook(owner.address, 'BASE_MAINNET'),
      ])
      
      res.json({
        address: account.address,
        "Owner EOA": owner.address,
        "Smart wallet": account.address,
        "Type": account.type
      });
    } catch (err) {
      console.error(err);
      logError(err, "POST /accounts/evm");
      res.status(500).json({ error: "Failed to create EVM account" });
    }
  }
);

app.post("/add-wallet/evm", apiKeyAuth, async (_req, res) => {
  let { wallet_address, network } = _req.body;
  // const webhookId = await createWebhook();
  switch (network) {
    case 'ethereum':
      network = "ETH_MAINNET"
      break;
  
    default:
      break;
  }

  const webhook_id = await getWebhookId(network,'webhook_id');
  // const data = await registerAddresses(wallet_address, webhook_id);
  const data = await updateWebhookAddresses({
    addresses_to_add: [wallet_address],
    webhook_id: webhook_id,
    addresses_to_remove: [],
  });
  console.log('Webhook address data:', data)
  res.json({
    "id" : webhook_id,
    "addr": data
  });
});


app.post(
  "/accounts/solana",
  apiKeyAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const { user } = _req.body;
      const account = await cdp.solana.createAccount();
      await storeAddress(user, account.address, '', "solana");

      // await registerAddresses([
      //   account.address
      // ]);

      res.json({
        address: account.address,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create Solana account" });
    }
});

//get balance
app.post("/get-token-balance", apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const { address, network = "base" } = req.body;

    if (!address) {
      return res.status(400).json({ error: "address is required" });
    }

    const token = generateCdpApiToken();

    const balances = await getWalletTokenBalances(
      network,
      address
    );

    res.json({
      address,
      network,
      balances,
    });
  } catch (err: any) {
    console.error("Balance fetch failed:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * withdrawal logic
 */
app.post("/cdp-withdraw-process", apiKeyAuth, async (req: Request, res: Response) => {
  try {
    const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";
    const usdc_account ="0x9C7f69a7963257a34193e689a935649F4e25D2aa";

    const destinationAddress = "0xfF4ADfc8Dd4285aCae4390cABb6Cc7991C2f14D5";
    const amountToSend = '0.05';
    const accountsResult = await cdp.evm.listAccounts();
    const owner = accountsResult.accounts[8];
    if (!owner) throw new Error('No owner account found')

      const smartAccountsResult = await cdp.evm.listSmartAccounts();
      const smartAccount = smartAccountsResult.accounts[3]; // index 3 as you wanted
      if (!smartAccount) throw new Error('Smart account not found');

      const smartAccountSDK = await cdp.evm.getSmartAccount({
        address: smartAccount.address, // already `0x${string}`
        owner: owner,                  // owner account object
      });

    const txResult = await cdp.evm.sendUserOperation({
      network: "base",
      smartAccount: smartAccountSDK,
      paymasterUrl: "https://api.developer.coinbase.com/rpc/v1/base/LCT7r5ZaPObDm4t7oDDhe8fSJQgAJNEe",
      calls: [{
        to: USDC_BASE,
        data: encodeTransfer(destinationAddress, amountToSend),
      }],
    });

    console.log(`\n✅ Transfer submitted!`);
    console.log(`   Transaction Hash: ${txResult}`);
  } catch (err) {
    console.error("Error occured:", err);
    res.status(500).json({ error: `Failed to process.` });
  }
});

app.post("cdp/get-address", apiKeyAuth, async (req: Request, res: Response) =>{
  
});

// Webhook endpoint
// Mount your webhook route
app.use("/webhooks", webhookRouter);

// Route to register CDP webhook
app.post("/register-webhook", apiKeyAuth, async (req: Request, res: Response) => {
  try {
    // const response = await registerCdpWebhook();
    // res.json({ status: "ok", message: "CDP webhook registration triggered",  webhooksec: response?.metadata?.secret});
    const result = await registerWebhook({
      network: "BNB_MAINNET",
      name: "Finp",
      addresses: ["0x5B7D9715b19003eA821d75c35f338C1fC716f888"],
      webhook_type: "ADDRESS_ACTIVITY",
      webhook_url: "https://wallet.finplab.com/webhooks/cdp",
    });

    res.json({
      status: "ok",
      message: "Webhook registered successfully",
      data: result.data,
    });
  } catch (err) {
    console.error("Error registering CDP webhook:", err);
    res.status(500).json({ error: `Failed to register webhook.` });
  }
});

/**
 * Register webhook with CDP programmatically
 */
/* async function registerCdpWebhook() {
  const url = "https://api.cdp.coinbase.com/platform/v2/data/webhooks/subscriptions";
  const body = {
    description: "Deposit notifications",
    eventTypes: ["onchain.activity.detected"],
    target: { url: "https://wallet.finplab.com/webhooks/cdp", method: "POST" },
    labels: {},
    isEnabled: true,
  };

  // Sign request
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${timestamp}POST/platform/v2/data/webhooks/subscriptions${JSON.stringify(body)}`;
  const signature = crypto
    .createHmac("sha256", requiredEnv("CDP_API_KEY_SECRET"))
    .update(payload)
    .digest("hex");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "CB-ACCESS-KEY": requiredEnv("CDP_API_KEY_ID"),
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": String(timestamp),
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json()) as CdpWebhookResponse;
    console.log("CDP webhook registration response:", data);

    // Save webhook secret to .env or DB
    if (data?.metadata?.secret) {
      console.log("Save this CDP_WEBHOOK_SECRET:", data.metadata.secret);
    }
    return data;
  } catch (err) {
    console.error("Failed to register CDP webhook:", err);
    logError(err, 'webhook');
  }
} */

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});