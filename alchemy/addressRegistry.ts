import {
    ALCHEMY_NOTIFY_BASE_URL,
    getNotifyHeaders
  } from "./notifyClient.js";
  
  const webhookId = process.env.ALCHEMY_WEBHOOK_ID;
  
  if (!webhookId) {
    throw new Error("Missing ALCHEMY_WEBHOOK_ID");
  }
  
  export interface AddressRegistryResponse {
    success: boolean;
    data?: unknown;
  }
  
  /**
   * Register wallet addresses to the webhook
   */
  export async function registerAddresses(
    addresses: string[]
  ): Promise<AddressRegistryResponse> {
    const response = await fetch(
      `${ALCHEMY_NOTIFY_BASE_URL}/${webhookId}/addresses`,
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