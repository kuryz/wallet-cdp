import express from "express";
import type { Request, Response, NextFunction } from "express";
import { CdpClient } from "@coinbase/cdp-sdk";
// const { generateJwt } = require("@coinbase/cdp-sdk/auth");
import "dotenv/config";
import { db } from "./db.js";
import { logError } from "./logger.js";

// dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

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

async function storeAddress(address: string, chain: "evm" | "solana") {
    await db.execute(
        `INSERT IGNORE INTO deposit_addresses (address, chain)
         VALUES (?, ?)`,
        [address, chain]
    );
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
      // const firstOwner = await cdp.evm.getOrCreateAccount({
      //   name: "Finp_user"
      // });
      const owner = await cdp.evm.createAccount();
      const account = await cdp.evm.createSmartAccount({
        owner
      });
      await storeAddress(account.address, "evm");
      
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

// app.post("/accounts/solana", apiKeyAuth, async (_req, res) => {
//     try {
//       const account = await cdp.solana.createAccount();
//       await storeAddress(account.address, "solana");
//       res.json({
//         address: account.address,
//       });
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ error: "Failed to create Solana account" });
//     }
// });
app.post(
  "/accounts/solana",
  apiKeyAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const account = await cdp.solana.createAccount();
      await storeAddress(account.address, "solana");

      res.json({
        address: account.address,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create Solana account" });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});