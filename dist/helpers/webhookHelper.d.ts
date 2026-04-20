type CreateWebhookParams = {
    network: string;
    name: string;
    addresses: string[];
    webhook_type: string;
    webhook_url: string;
};
export declare function registerWebhook(params: CreateWebhookParams): Promise<{
    success: boolean;
    data: any;
}>;
export declare function registerAddressWebhook(address: string, network: string): Promise<any>;
export declare function encodeTransfer(to: `0x${string}`, amount: string): `0x${string}`;
export {};
//# sourceMappingURL=webhookHelper.d.ts.map