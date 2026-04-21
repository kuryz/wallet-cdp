import { ethers } from "ethers";
import { createAlchemyWebhook, getWebhookId, insertWebhookId, updateAlchemyWebhookAddresses } from "../alchemy/webhook.js";

type CreateWebhookParams = {
  network: string;
  name: string;
  addresses: string[];
  webhook_type: string;
  webhook_url: string;
};
type Token = "USDC" | "USDT";

type Network =
  | "base"
  | "polygon"
  | "arbitrum"
  | "optimism"
  | "avalanche";

const CONTRACT_TOKENS = {
  USDT: {
    polygon: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F",
    arbitrum: "0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9",
    optimism: "0x94b008aA00579c1307B0EF2c499aD98a8ce58e58",
    avalanche: "0x9702230a8ea53601f5cd2dc00fdbc13d4df4a8c7",
  },

  USDC: {
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // 
    polygon: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    optimism: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607",
  }
} as any;

const NETWORK_CONFIG = {
  base: {
    paymasterUrl: "https://api.developer.coinbase.com/rpc/v1/base/LCT7r5ZaPObDm4t7oDDhe8fSJQgAJNEe",
  },
  polygon: {
    paymasterUrl:"https://api.pimlico.io/v2/137/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P",
  },
  arbitrum: {
    paymasterUrl:"https://api.pimlico.io/v2/42161/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P",
  },
  optimism: {
    paymasterUrl:"https://api.pimlico.io/v2/10/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P",
  },
  avalanche: {
    paymasterUrl:"https://api.pimlico.io/v2/43114/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P",
  },
} as const;

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

export function getTokenAndPaymaster(
  token: keyof typeof CONTRACT_TOKENS, 
  network: keyof typeof NETWORK_CONFIG) 
{
  const tokenMap = CONTRACT_TOKENS[token];
  const tokenAddress = CONTRACT_TOKENS[token]?.[network];
  const paymasterUrl = NETWORK_CONFIG[network]?.paymasterUrl;

  if (!tokenAddress) {
    throw new Error(`No token ${token as string} on ${network}`);
  }

  if (!paymasterUrl) {
    throw new Error(`No paymaster configured for ${network}`);
  }

  return {
    tokenAddress,
    paymasterUrl,
  };
}