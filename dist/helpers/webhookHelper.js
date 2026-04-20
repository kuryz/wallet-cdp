import { createAlchemyWebhook, getWebhookId, insertWebhookId, updateAlchemyWebhookAddresses } from "../alchemy/webhook.js";
export async function registerWebhook(params) {
    try {
        const webhookData = await createAlchemyWebhook(params);
        const data = webhookData.data;
        await insertWebhookId(data);
        console.log("Webhook created:", webhookData);
        return {
            success: true,
            data,
        };
    }
    catch (error) {
        console.error("Error creating webhook:", error);
        throw error;
    }
}
export async function registerAddressWebhook(address, network) {
    const existingWebhook = await getWebhookId(network, 'webhook_id');
    if (!existingWebhook) {
        const webhookData = await createAlchemyWebhook({
            network, // e.g. "ETH_MAINNET", "BNB_MAINNET"
            name: `wallet-activity-${network}`,
            addresses: [address],
            webhook_type: "ADDRESS_ACTIVITY",
            webhook_url: "https://wallet.finplab.com/webhooks/cdp",
        });
        await insertWebhookId(webhookData.data);
        return webhookData.data;
    }
    // Append address to existing webhook
    const webhookData = await updateAlchemyWebhookAddresses({
        webhook_id: existingWebhook,
        addAddresses: [address],
    });
    await insertWebhookId(webhookData.data);
    return webhookData.data;
}
//# sourceMappingURL=webhookHelper.js.map