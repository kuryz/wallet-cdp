// main.js
import express from "express";
import { CdpClient } from "@coinbase/cdp-sdk";
import dotenv from "dotenv";
import { db } from "./db.js"; // Use .js for ES module

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;

// Initialize CDP client (reads API key and secret from env)
const cdp = new CdpClient();

app.use(express.json());

/**
 * API key authentication middleware
 */
function apiKeyAuth(req, res, next) {
  const apiKey = req.header("x-api-key");

  if (!apiKey || apiKey !== API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  next();
}

/**
 * Store address in database
 */
async function storeAddress(address, chain) {
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
app.post("/accounts/evm", apiKeyAuth, async (_req, res) => {
  try {
    const account = await cdp.evm.createAccount();
    await storeAddress(account.address, "evm");
    res.json({ address: account.address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create EVM account" });
  }
});

// Create Solana account
app.post("/accounts/solana", apiKeyAuth, async (_req, res) => {
  try {
    const account = await cdp.solana.createAccount();
    await storeAddress(account.address, "solana");
    res.json({ address: account.address });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Solana account" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
