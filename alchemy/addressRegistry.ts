import {
    ALCHEMY_NOTIFY_BASE_URL,
    getNotifyHeaders
  } from "./notifyClient.js";
  import "dotenv/config";
  
  const webhookId = process.env.ALCHEMY_WEBHOOK_EVM_ID;
  
  
  if (!webhookId) {
    throw new Error("Missing ALCHEMY_WEBHOOK_ID");
  }

  type CreateWebhookResponse = {
    data: {
      id: string;
      network: string;
      webhook_type: string;
    };
  };
  
  type AlchemySuccessResponse = {
    success: boolean;
  };

  export interface UpdateWebhookAddressesPayload {
    webhook_id: string;
    addresses_to_add: string[];
    addresses_to_remove: string[];
  }
  
  
  export interface AddressRegistryResponse {
    success: boolean;
    data?: unknown;
  }
  
  export async function createWebhook(): Promise<string> {
    const res = await fetch(
      'https://dashboard.alchemy.com/api/create-webhook',
      {
        method: 'POST',
        headers: getNotifyHeaders(),
        body: JSON.stringify({
          network: 'ETH_MAINNET',
          webhook_type: 'GRAPHQL',
          webhook_url: 'https://wallet.finplab.com/webhook/cdp',
          name: 'finplab Webhook',
        }),
      }
    );
  
    if (!res.ok) {
      throw new Error(`Create webhook failed: ${res.statusText}`);
    }
  
    const json = (await res.json()) as CreateWebhookResponse;
    return json.data.id; // wh_***
  }

  export async function createWebhookVariable(
    webhookId: string,
    name: string,
    value: string
  ): Promise<AlchemySuccessResponse> {
    const res = await fetch(
      'https://dashboard.alchemy.com/api/create-webhook-variable',
      {
        method: 'POST',
        headers: getNotifyHeaders(),
        body: JSON.stringify({
          webhook_id: webhookId,
          name,
          value,
        }),
      }
    );
  
    if (!res.ok) {
      throw new Error(`Create variable failed: ${res.statusText}`);
    }
  
    return (await res.json()) as AlchemySuccessResponse;
  }

  export async function updateWebhookVariable(
    webhookId: string,
    name: string,
    value: string
  ): Promise<AlchemySuccessResponse> {
    const res = await fetch(
      'https://dashboard.alchemy.com/api/update-webhook-variable',
      {
        method: 'POST',
        headers: getNotifyHeaders(),
        body: JSON.stringify({
          webhook_id: webhookId,
          name,
          value,
        }),
      }
    );
  
    if (!res.ok) {
      throw new Error(`Update variable failed: ${res.statusText}`);
    }
  
    return (await res.json()) as AlchemySuccessResponse;
  }
  
  /**
   * Register wallet addresses to the webhook
   */
  export async function registerAddresses(
    addresses: string[],
    webhookID: string
  ): Promise<AddressRegistryResponse> {
    const response = await fetch(
      `${ALCHEMY_NOTIFY_BASE_URL}/${webhookID}/addresses`,
      {
        method: "POST",
        headers: getNotifyHeaders(),
        body: JSON.stringify({ addresses })
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Failed to register addresses: ${await response.text()}`
      );
    }
    
    const data = (await response.json()) as AddressRegistryResponse;
    return data;
  }

  export async function updateWebhookAddresses(
    payload: UpdateWebhookAddressesPayload
  ): Promise<void> {
    const url = "https://dashboard.alchemy.com/api/update-webhook-addresses";
  
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "X-Alchemy-Token": process.env.ALCHEMY_TOKEN!, // must be set in .env
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Failed to update webhook addresses: ${text}`);
    }
  
    const data = await response.json();
    console.log("Webhook updated successfully:", data);
  }
  
  /**
   * Remove wallet addresses from the webhook
   */
  export async function unregisterAddresses(
    addresses: string[]
  ): Promise<AddressRegistryResponse> {
    const response = await fetch(
      `${ALCHEMY_NOTIFY_BASE_URL}/${webhookId}/addresses`,
      {
        method: "DELETE",
        headers: getNotifyHeaders(),
        body: JSON.stringify({ addresses })
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Failed to unregister addresses: ${await response.text()}`
      );
    }
    const data = (await response.json()) as AddressRegistryResponse;
    return data;
  }
  
  /**
   * List all tracked wallet addresses
   */
  export async function listRegisteredAddresses(): Promise<ListAddressesResponse> {
    const response = await fetch(
      `${ALCHEMY_NOTIFY_BASE_URL}/${webhookId}/addresses`,
      {
        headers: getNotifyHeaders()
      }
    );
  
    if (!response.ok) {
      throw new Error(
        `Failed to list addresses: ${await response.text()}`
      );
    }
    
    const data = (await response.json()) as ListAddressesResponse;
    return data;
  }
  
  export interface ListAddressesResponse {
    addresses: string[];
  }