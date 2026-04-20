import "dotenv/config";
import { db } from "../db.js";
const ALCHEMY_API_URL = "https://dashboard.alchemy.com/api/create-webhook";
const ALCHEMY_TOKEN = process.env.ALCHEMY_TOKEN; // must be set in .env
export async function createAlchemyWebhook(payload) {
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
    const data = (await response.json());
    return data;
}
export async function updateAlchemyWebhookAddresses(payload) {
    const response = await fetch(`${ALCHEMY_API_URL}/updateWebhookAddresses`, {
        method: "PATCH", // important: NOT POST
        headers: {
            "Content-Type": "application/json",
            "X-Alchemy-Token": ALCHEMY_TOKEN,
        },
        body: JSON.stringify({
            webhook_id: payload.webhook_id,
            addAddresses: payload.addAddresses || [],
            removeAddresses: payload.removeAddresses || [],
        }),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Alchemy update error: ${text}`);
    }
    const data = (await response.json());
    return data;
}
export async function insertWebhookId(data) {
    await db.execute(`
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
        `, [
        data.id, // webhook_id
        data.name,
        data.network,
        data.webhook_type,
        data.webhook_url,
        data.is_active ? 1 : 0,
        data.signing_key,
        data.version,
        data.deactivation_reason,
        data.time_created
    ]);
}
export async function getWebhookId(network, selectColumn) {
    const [rows] = await db.execute(`SELECT ${selectColumn}
      FROM alchemy_webhooks
      WHERE network = ?
        AND webhook_type = 'ADDRESS_ACTIVITY'
        AND is_active = TRUE
      ORDER BY created_at DESC
      LIMIT 1`, [network]);
    if (rows.length === 0) {
        throw new Error(`No active webhook configured`);
    }
    const webhookId = rows[0]?.[selectColumn];
    return webhookId;
}
//# sourceMappingURL=webhook.js.map