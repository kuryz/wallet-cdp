import express from "express";
import { CdpClient } from "@coinbase/cdp-sdk";
// const { generateJwt } = require("@coinbase/cdp-sdk/auth");
import "dotenv/config";
import crypto from "crypto";
import { db } from "./db.js";
import { logError } from "./logger.js";
// import { RowDataPacket } from "mysql2";
import webhookRouter from "./webhooks/cdp.js";
// dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.API_KEY;
// Initialize the CDP client, which automatically loads
// the API Key and Wallet Secret from the environment
// variables.
function requiredEnv(name) {
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
function apiKeyAuth(req, res, next) {
    const apiKey = req.header("x-api-key");
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(401).json({ error: "Unauthorized" });
    }
    next();
}
async function storeAddress(address, chain) {
    await db.execute(`INSERT IGNORE INTO deposit_addresses (address, chain)
         VALUES (?, ?)`, [address, chain]);
}
// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});
// Create EVM account
app.post("/accounts/evm", apiKeyAuth, async (_req, res) => {
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
    }
    catch (err) {
        console.error(err);
        logError(err, "POST /accounts/evm");
        res.status(500).json({ error: "Failed to create EVM account" });
    }
});
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
app.post("/accounts/solana", apiKeyAuth, async (_req, res) => {
    try {
        const account = await cdp.solana.createAccount();
        await storeAddress(account.address, "solana");
        res.json({
            address: account.address,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create Solana account" });
    }
});
//webhook
// app.post("/webhooks/cdp", express.json(), (req, res) => {
//   const event = req.body;
//   console.log("CDP webhook:", event);
//   logError(event, "POST /webhooks");
//   // 1. Verify webhook signature (IMPORTANT)
//   // 2. Check event type (deposit)
//   // 3. Match address in your DB
//   // 4. Credit user balance
//   // 5. Mark tx hash as processed (idempotency)
//   res.sendStatus(200);
// });
// Webhook endpoint
// Mount your webhook route
app.use("/webhooks", webhookRouter);
// Route to register CDP webhook
app.post("/register-webhook", apiKeyAuth, async (req, res) => {
    try {
        await registerCdpWebhook();
        res.json({ status: "ok", message: "CDP webhook registration triggered" });
    }
    catch (err) {
        console.error("Error registering CDP webhook:", err);
        res.status(500).json({ error: "Failed to register webhook" });
    }
});
/**
 * Register webhook with CDP programmatically
 */
async function registerCdpWebhook() {
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
        const data = (await res.json());
        console.log("CDP webhook registration response:", data);
        // Save webhook secret to .env or DB
        if (data?.metadata?.secret) {
            console.log("Save this CDP_WEBHOOK_SECRET:", data.metadata.secret);
        }
    }
    catch (err) {
        console.error("Failed to register CDP webhook:", err);
    }
}
app.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
//# sourceMappingURL=main.js.map