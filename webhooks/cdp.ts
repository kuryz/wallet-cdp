import express, { Request, Response } from "express";
import { db } from "../db.js";
import { logError } from "../logger.js";
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

// Use plain JSON parsing for incoming webhook
router.use("/webhooks/cdp", express.json());

router.post("/cdp", async (req: Request, res: Response) => {
  const event: CdpWebhookEvent = req.body;

  try {
    // Only process deposit events
    if (event.type !== "onchain.activity.detected") {
      return res.sendStatus(200);
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
      "SELECT id FROM deposit_addresses WHERE address = ?",
      [address]
    );

    if (userRows.length === 0) {
      console.warn("No user found for address:", address);
      return res.sendStatus(200);
    }

    const userId = userRows[0]?.id;

    // 3️⃣ Credit user balance (optional)
    // await db.execute(
    //   "UPDATE users SET balance = balance + ? WHERE id = ?",
    //   [amount, userId]
    // );

    // 4️⃣ Mark tx hash as processed
    await db.execute(
      "INSERT INTO processed_transactions (tx_hash, chain, address, amount) VALUES (?, ?, ?, ?)",
      [txHash, chain, address, amount]
    );

    console.log(`Processed deposit of ${amount} on ${chain} to user ${userId} (tx: ${txHash})`);

    res.sendStatus(200);
  } catch (err) {
    console.error("Error processing webhook:", err);
    logError(err, "POST /webhooks/cdp");
    res.sendStatus(500);
  }
});

export default router;
