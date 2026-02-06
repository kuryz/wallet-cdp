import express, { Request, Response, NextFunction } from "express";
import { db } from "../db.js";
import { logError } from "../logger.js";
import crypto from "crypto";
import { RowDataPacket } from "mysql2";

const router = express.Router();
interface DepositAddressRow extends RowDataPacket {
    user_id: number;
  }
  
  interface ProcessedTxRow extends RowDataPacket {
    tx_hash: string;
  }
  
  interface CdpWebhookEvent {
    type: string;
    data: {
      address: string;
      txHash: string;
      amount: number;
      chain: string;
    };
  }
  
  // Middleware to verify CDP webhook signature
  function verifyCdpSignature(req: Request, res: Response, next: NextFunction) {
    const signatureHeader = req.header("X-Hook-Signature");
    const secret = process.env.CDP_WEBHOOK_SECRET;
  
    if (!signatureHeader || !secret) return res.status(400).send("Missing signature");
  
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");
  
    if (expectedSignature !== signatureHeader) return res.status(401).send("Invalid signature");
  
    next();
}
// ... all the webhook code from before, but replace `app.post` with `router.post`
router.post("/cdp", async (req: Request, res: Response) => {
  // webhook logic here
  const event: CdpWebhookEvent = req.body;

  try {
    if (event.type !== "onchain.activity.detected") {
      return res.sendStatus(200); // ignore other events
    }

    const { address, txHash, amount, chain } = event.data;

    // 1️⃣ Check idempotency
    const [processedRows] = await db.execute<ProcessedTxRow[]>(
      "SELECT tx_hash FROM processed_transactions WHERE tx_hash = ?",
      [txHash]
    );

    if (processedRows.length > 0) {
      console.log("Transaction already processed:", txHash);
      return res.sendStatus(200);
    }

    // 2️⃣ Lookup user by deposit address
    const [userRows] = await db.execute<DepositAddressRow[]>(
      "SELECT id as user_id FROM deposit_addresses WHERE address = ?",
      [address]
    );

    if (userRows.length === 0) {
      console.warn("No user found for address:", address);
      return res.sendStatus(200);
    }

    const userId = userRows[0]?.user_id;

    // 3️⃣ Credit user balance
    // await db.execute(
    //   "UPDATE users SET balance = balance + ? WHERE id = ?",
    //   [amount, userId]
    // );

    // 4️⃣ Mark tx hash as processed
    await db.execute(
      "INSERT INTO processed_transactions (tx_hash, chain, address, amount) VALUES (?, ?, ?, ?)",
      [txHash, chain, address, amount]
    );

    console.log(`Credited ${amount} to user ${userId} for tx ${txHash}`);

    res.sendStatus(200);
  } catch (err) {
    console.error("Error processing webhook:", err);
    logError(err, "POST /webhooks/cdp");
    res.sendStatus(500);
  }
});

export default router;
