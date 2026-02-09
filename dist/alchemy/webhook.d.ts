import "dotenv/config";
interface WebhookData {
    id: string;
    name: string;
    network: string;
    webhook_type: string;
    webhook_url: string;
    is_active: boolean;
    signing_key: string;
    version: string;
    deactivation_reason: string;
    time_created: number;
}
export interface AlchemyWebhookRequest {
    name: string;
    addresses: string[];
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
export declare function insertWebhookId(data: WebhookData): Promise<void>;
export declare function getWebhookId(network: string): Promise<string>;
export {};
//# sourceMappingURL=webhook.d.ts.map