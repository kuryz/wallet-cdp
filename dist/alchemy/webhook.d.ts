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
    [key: string]: any;
}
export declare function createAlchemyWebhook(payload: AlchemyWebhookRequest): Promise<AlchemyWebhookResponse>;
//# sourceMappingURL=webhook.d.ts.map