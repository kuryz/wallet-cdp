export interface AddressRegistryResponse {
    success: boolean;
    data?: unknown;
}
/**
 * Register wallet addresses to the webhook
 */
export declare function registerAddresses(addresses: string[]): Promise<AddressRegistryResponse>;
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
//# sourceMappingURL=addressRegistry.d.ts.map