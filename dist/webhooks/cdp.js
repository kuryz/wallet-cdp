import express from "express";
import { db } from "../db.js";
const router = express.Router();
const callbackUrl = process.env.FINPESA_CALLBACK_URL;
// Use plain JSON parsing for incoming webhook
router.use("/webhooks/cdp", express.json());
router.post("/cdp", async (req, res) => {
    const webhookEvent = req.body;
    if (!webhookEvent || !webhookEvent.type) {
        console.warn("Received invalid webhook:", webhookEvent);
        return res.sendStatus(400);
    }
    try {
        // Only process "ADDRESS_ACTIVITY" events
        if (webhookEvent.type !== "ADDRESS_ACTIVITY") {
            return res.sendStatus(200);
        }
        console.log("Received webhook of type:", webhookEvent);
        const { activity, network } = webhookEvent.event;
        if (!Array.isArray(activity))
            return;
        for (const tx of activity) {
            const { toAddress: address, hash: txHash, value: amount } = tx;
            console.log("address:", address);
            // 1️⃣ Idempotency check
            const [processedRows] = await db.execute("SELECT tx_hash FROM processed_transactions WHERE tx_hash = ?", [txHash]);
            if (processedRows.length > 0)
                continue;
            // 2️⃣ Lookup user
            const [userRows] = await db.execute("SELECT user_id FROM deposit_addresses WHERE address = ? OR smart_address = ?", [address, address]);
            if (userRows.length === 0)
                continue;
            const userId = userRows[0]?.id;
            // Credit user balance (optional)
            // await db.execute("UPDATE users SET balance = balance + ? WHERE id = ?", [amount, userId]);
            // filter data
            const result = {
                asset: tx.asset,
                category: tx.category,
                value: `${tx.value} ${tx.asset}`,
                from: tx.fromAddress,
                to: tx.toAddress,
                txHash: tx.hash,
                blockNum: parseInt(tx.blockNum, 16), // hex → decimal
                network,
                contract: tx.rawContract?.address,
            };
            // Mark tx as processed
            await db.execute("INSERT INTO processed_transactions (tx_hash, chain, address, amount, sd_data, meta_data) VALUES (?, ?, ?, ?, ?, ?)", [txHash, network, address, amount, JSON.stringify(result), JSON.stringify(webhookEvent)]);
            // ✅ 5️⃣ PLACE FETCH HERE
            if (!callbackUrl) {
                console.error("FINPESA_CALLBACK_URL is not set");
            }
            else {
                fetch(callbackUrl, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": process.env.API_KEY || "",
                    },
                    body: JSON.stringify({
                        userId,
                        amount,
                        address,
                        network,
                        txHash,
                        data: result,
                    }),
                })
                    .then(async (res) => {
                    if (!res.ok) {
                        console.error(`Callback failed (${res.status}):`, await res.text());
                    }
                    else {
                        console.log(`Callback sent for tx: ${txHash}`);
                    }
                })
                    .catch((err) => {
                    console.error("Callback error:", err);
                });
            }
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