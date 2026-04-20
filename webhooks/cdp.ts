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

// Represents a single token transfer activity
interface Activity {
  asset: string;                     // e.g., "USDC"
  blockNum: string;                  // e.g., "0xdf34a3"
  category: string;                  // e.g., "token"
  erc1155Metadata: any | null;       // optional, null for ERC20
  erc721TokenId: string | null;      // optional, null for ERC20
  fromAddress: string;               // sender address
  toAddress: string;                 // receiver address
  hash: string;                      // transaction hash
  typeTraceAddress?: string | null;   // optional
  value: number;                     // numeric value of tokens
  log: {
    address: string;
    blockHash: string;
    blockNumber: string;
    data: string;
    logIndex: string;
    removed: boolean;
    topics: string[];
    transactionHash: string;
    transactionIndex: string;
  };
  rawContract: {
    address: string;
    decimals: number;
    rawValue: string;
  };
}

// Represents the "event" object in the payload
interface WebhookEventData {
  activity: Activity[];
  network: string; // e.g., "ETH_MAINNET"
}

// Top-level webhook payload
export interface CdpWebhookResponse {
  createdAt: string;        // timestamp string
  event: WebhookEventData;  // the main event data
  id: string;               // webhook event id
  type: string;             // e.g., "ADDRESS_ACTIVITY"
  webhookId: string;        // id of the webhook
}


// Use plain JSON parsing for incoming webhook
router.use("/webhooks/cdp", express.json());


router.post("/cdp", async (req: Request, res: Response) => {
  const webhookEvent: CdpWebhookResponse = req.body;

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
    
    if (!Array.isArray(activity)) return;

    for (const tx of activity) {
      const { toAddress: address, hash: txHash, value: amount } = tx;
      console.log("address:", address);
      // 1️⃣ Idempotency check
      const [processedRows] = await db.execute<ProcessedTxRow[]>(
        "SELECT tx_hash FROM processed_transactions WHERE tx_hash = ?",
        [txHash]
      );
      if (processedRows.length > 0) continue;

      // 2️⃣ Lookup user
      const [userRows] = await db.execute<DepositAddressRow[]>(
        "SELECT id FROM deposit_addresses WHERE address = ? OR smart_address = ?",
        [address, address]
      );
      if (userRows.length === 0) continue;

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
      await db.execute(
        "INSERT INTO processed_transactions (tx_hash, chain, address, amount, sd_data, meta_data) VALUES (?, ?, ?, ?, ?, ?)",
        [txHash, network, address, amount, JSON.stringify(result), JSON.stringify(webhookEvent)]
      );

      console.log(`Processed deposit of ${amount} on ${network} to user ${userId} (tx: ${txHash})`);
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error processing webhook:", err);
    res.sendStatus(500);
  }
});


export default router;
