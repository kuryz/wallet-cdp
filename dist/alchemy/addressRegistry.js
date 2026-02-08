import { ALCHEMY_NOTIFY_BASE_URL, getNotifyHeaders } from "./notifyClient.js";
const webhookId = process.env.ALCHEMY_WEBHOOK_ID;
if (!webhookId) {
    throw new Error("Missing ALCHEMY_WEBHOOK_ID");
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