import "dotenv/config";
import { db } from "../db.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { UpdateWebhookAddressesPayload } from "./addressRegistry.js";

interface WebhookData {
    id: string;
    name: string;
    network: string;
    webhook_type: string;
    webhook_url: string;
    is_active: boolean;
    signing_key: string;
    version: string;
    deactivation_reason: string;
    time_created: number;
}

export interface AlchemyWebhookRequest {
  name: string,
  addresses: string[],
  network: "ETH_MAINNET" | "ETH_GOERLI" | string;
  webhook_type: "GRAPHQL" | "ADDRESS_ACTIVITY" | string;
  webhook_url: string;
}

export interface AlchemyWebhookResponse {
  id: string;
  network: string;
  webhook_type: string;
  webhook_url: string;
  [key: string]: any; // extra fields
}

type UpdateWebhookAddressPayload = {
  webhook_id: string;
  addAddresses?: string[];
  removeAddresses?: string[];
};

const ALCHEMY_API_URL = "https://dashboard.alchemy.com/api/create-webhook";
const ALCHEMY_TOKEN = process.env.ALCHEMY_TOKEN!; // must be set in .env

export async function createAlchemyWebhook(
  payload: AlchemyWebhookRequest
): Promise<AlchemyWebhookResponse> {
  const response = await fetch(ALCHEMY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Alchemy-Token": ALCHEMY_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Alchemy API error: ${text}`);
  }
  const data = (await response.json()) as AlchemyWebhookResponse;
  return data;
}

export async function updateAlchemyWebhookAddresses(
  payload: UpdateWebhookAddressesPayload
) {
  const url = "https://dashboard.alchemy.com/api/update-webhook-addresses";
  const response = await fetch(url, {
    method: "PATCH", // important: NOT POST
    headers: {
      "Content-Type": "application/json",
      "X-Alchemy-Token": ALCHEMY_TOKEN,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Alchemy update error: ${text}`);
  }

  const data = (await response.json()) as AlchemyWebhookResponse;
  return data;
}

export async function insertWebhookId(data: WebhookData) {
    await db.execute<ResultSetHeader>(
        `
        INSERT INTO alchemy_webhooks (
          webhook_id,
          name,
          network,
          webhook_type,
          webhook_url,
          is_active,
          signing_key,
          version,
          deactivation_reason,
          time_created_ms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          network = VALUES(network),
          webhook_type = VALUES(webhook_type),
          webhook_url = VALUES(webhook_url),
          is_active = VALUES(is_active),
          signing_key = VALUES(signing_key),
          version = VALUES(version),
          deactivation_reason = VALUES(deactivation_reason),
          time_created_ms = VALUES(time_created_ms)
        `,
        [
          data.id,                   // webhook_id
          data.name,
          data.network,
          data.webhook_type,
          data.webhook_url,
          data.is_active ? 1 : 0,
          data.signing_key,
          data.version,
          data.deactivation_reason,
          data.time_created
        ]
    );
}

export async function getWebhookId(
  network: string,
  selectColumn: "webhook_id" | "network" | "name" | "webhook_url"
) {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT ${selectColumn}
      FROM alchemy_webhooks
      WHERE network = ?
        AND webhook_type = 'ADDRESS_ACTIVITY'
        AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1`,
        [network]
      );
    
      if (rows.length === 0) {
        // throw new Error(`No active webhook configured`);
        return '';
      }
    
      const webhookId = rows[0]?.[selectColumn] as string;
      return webhookId;
}
