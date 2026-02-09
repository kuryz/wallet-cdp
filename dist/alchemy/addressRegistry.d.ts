import "dotenv/config";
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
export declare function createWebhook(): Promise<string>;
export declare function createWebhookVariable(webhookId: string, name: string, value: string): Promise<AlchemySuccessResponse>;
export declare function updateWebhookVariable(webhookId: string, name: string, value: string): Promise<AlchemySuccessResponse>;
/**
 * Register wallet addresses to the webhook
 */
export declare function registerAddresses(addresses: string[], webhookID: string): Promise<AddressRegistryResponse>;
export declare function updateWebhookAddresses(payload: UpdateWebhookAddressesPayload): Promise<void>;
/**
 * Remove wallet addresses from the webhook
 */
export declare function unregisterAddresses(addresses: string[]): Promise<AddressRegistryResponse>;
/**
 * List all tracked wallet addresses
 */
export declare function listRegisteredAddresses(): Promise<ListAddressesResponse>;
export interface ListAddressesResponse {
    addresses: string[];
}
export {};
//# sourceMappingURL=addressRegistry.d.ts.map