

export interface AlchemyWebhookRequest {
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
