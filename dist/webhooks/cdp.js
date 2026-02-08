import express from "express";
import { db } from "../db.js";
const router = express.Router();
// Use plain JSON parsing for incoming webhook
router.use("/webhooks/cdp", express.json());
/* router.post("/cdp", async (req: Request, res: Response) => {
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
}); */
router.post("/cdp", async (req, res) => {
    const webhookEvent = req.body;
    try {
        // Only process "ADDRESS_ACTIVITY" events
        if (webhookEvent.type !== "ADDRESS_ACTIVITY") {
            return res.sendStatus(200);
        }
        console.log("Received webhook of type:", webhookEvent.type);
        const { activity, network } = webhookEvent.event;
        for (const tx of activity) {
            const { toAddress: address, hash: txHash, value: amount } = tx;
            // 1️⃣ Idempotency check
            const [processedRows] = await db.execute("SELECT tx_hash FROM processed_transactions WHERE tx_hash = ?", [txHash]);
            if (processedRows.length > 0)
                continue;
            // 2️⃣ Lookup user
            const [userRows] = await db.execute("SELECT id FROM deposit_addresses WHERE address = ?", [address]);
            if (userRows.length === 0)
                continue;
            const userId = userRows[0]?.id;
            // 3️⃣ Credit user balance (optional)
            // await db.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId]);
            // 4️⃣ Mark tx as processed
            await db.execute("INSERT INTO processed_transactions (tx_hash, chain, address, amount) VALUES (?, ?, ?, ?)", [txHash, network, address, amount]);
            console.log(`Processed deposit of ${amount} on ${network} to user ${userId} (tx: ${txHash})`);
        }
        res.sendStatus(200);
    }
    catch (err) {
        console.error("Error processing webhook:", err);
        res.sendStatus(500);
    }
});
export default router;
//# sourceMappingURL=cdp.js.map