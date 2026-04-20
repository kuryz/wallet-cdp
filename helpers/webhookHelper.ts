import { ethers } from "ethers";
import { createAlchemyWebhook, getWebhookId, insertWebhookId, updateAlchemyWebhookAddresses } from "../alchemy/webhook.js";

type CreateWebhookParams = {
  network: string;
  name: string;
  addresses: string[];
  webhook_type: string;
  webhook_url: string;
};

export async function registerWebhook(params: CreateWebhookParams) {
  try {
    const webhookData = await createAlchemyWebhook(params);
    const data = webhookData.data;

    await insertWebhookId(data);

    console.log("Webhook created:", webhookData);

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error creating webhook:", error);
    throw error;
  }
}
export async function registerAddressWebhook(address: string, network: string) {
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
    addresses_to_add: [address],
    addresses_to_remove: []
  });
  // await insertWebhookId(webhookData.data);
  return webhookData.data;
}

export function encodeTransfer(
  to: `0x${string}`,
  amount: string
): `0x${string}` {
  const iface = new ethers.Interface([
    "function transfer(address to, uint256 amount)"
  ]);

  const data = iface.encodeFunctionData("transfer", [
    to,
    ethers.parseUnits(amount.toString(), 6),
  ]);

  return data as `0x${string}`;
}