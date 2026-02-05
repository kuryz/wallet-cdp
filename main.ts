import express from "express";
import type { Request, Response, NextFunction } from "express";
import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";
import { db } from "./db.ts";
import { logError } from "./logger.ts";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Initialize the CDP client, which automatically loads
// the API Key and Wallet Secret from the environment
// variables.
const cdp = new CdpClient();
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
      const account = await cdp.evm.createAccount();
      await storeAddress(account.address, "evm");

      res.json({
        address: account.address,
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