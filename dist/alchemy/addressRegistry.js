import { ALCHEMY_NOTIFY_BASE_URL, getNotifyHeaders } from "./notifyClient.js";
import "dotenv/config";
const webhookId = process.env.ALCHEMY_WEBHOOK_EVM_ID;
const webhookSolanaId = process.env.ALCHEMY_WEBHOOK_SOLANA_ID;
if (!webhookId) {
    throw new Error("Missing ALCHEMY_WEBHOOK_ID");
}
export async function createWebhook() {
    const res = await fetch('https://dashboard.alchemy.com/api/create-webhook', {
        method: 'POST',
        headers: getNotifyHeaders(),
        body: JSON.stringify({
            network: 'ETH_MAINNET',
            webhook_type: 'ADDRESS_ACTIVITY',
            webhook_url: 'https://wallet.finplab.com/webhook/cdp',
            name: 'finplab Webhook',
        }),
    });
    if (!res.ok) {
        throw new Error(`Create webhook failed: ${res.statusText}`);
    }
    const json = (await res.json());
    return json.data.id; // wh_***
}
export async function createWebhookVariable(webhookId, name, value) {
    const res = await fetch('https://dashboard.alchemy.com/api/create-webhook-variable', {
        method: 'POST',
        headers: getNotifyHeaders(),
        body: JSON.stringify({
            webhook_id: webhookId,
            name,
            value,
        }),
    });
    if (!res.ok) {
        throw new Error(`Create variable failed: ${res.statusText}`);
    }
    return (await res.json());
}
export async function updateWebhookVariable(webhookId, name, value) {
    const res = await fetch('https://dashboard.alchemy.com/api/update-webhook-variable', {
        method: 'POST',
        headers: getNotifyHeaders(),
        body: JSON.stringify({
            webhook_id: webhookId,
            name,
            value,
        }),
    });
    if (!res.ok) {
        throw new Error(`Update variable failed: ${res.statusText}`);
    }
    return (await res.json());
}
/**
 * Register wallet addresses to the webhook
 */
export async function registerAddresses(addresses) {
    const response = await fetch(`${ALCHEMY_NOTIFY_BASE_URL}/${webhookId}/addresses`, {
        method: "POST",
        headers: getNotifyHeaders(),
        body: JSON.stringify({ addresses })
    });
    if (!response.ok) {
        throw new Error(`Failed to register addresses: ${await response.text()}`);
    }
    const data = (await response.json());
    return data;
}
/**
 * Remove wallet addresses from the webhook
 */
export async function unregisterAddresses(addresses) {
    const response = await fetch(`${ALCHEMY_NOTIFY_BASE_URL}/${webhookId}/addresses`, {
        method: "DELETE",
        headers: getNotifyHeaders(),
        body: JSON.stringify({ addresses })
    });
    if (!response.ok) {
        throw new Error(`Failed to unregister addresses: ${await response.text()}`);
    }
    const data = (await response.json());
    return data;
}
/**
 * List all tracked wallet addresses
 */
export async function listRegisteredAddresses() {
    const response = await fetch(`${ALCHEMY_NOTIFY_BASE_URL}/${webhookId}/addresses`, {
        headers: getNotifyHeaders()
    });
    if (!response.ok) {
        throw new Error(`Failed to list addresses: ${await response.text()}`);
    }
    const data = (await response.json());
    return data;
}
//# sourceMappingURL=addressRegistry.js.map