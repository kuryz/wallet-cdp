declare const router: import("express-serve-static-core").Router;
interface Activity {
    asset: string;
    blockNum: string;
    category: string;
    erc1155Metadata: any | null;
    erc721TokenId: string | null;
    fromAddress: string;
    toAddress: string;
    hash: string;
    typeTraceAddress?: string | null;
    value: number;
    log: {
        address: string;
        blockHash: string;
        blockNumber: string;
        data: string;
        logIndex: string;
        removed: boolean;
        topics: string[];
        transactionHash: string;
        transactionIndex: string;
    };
    rawContract: {
        address: string;
        decimals: number;
        rawValue: string;
    };
}
interface WebhookEventData {
    activity: Activity[];
    network: string;
}
export interface CdpWebhookResponse {
    createdAt: string;
    event: WebhookEventData;
    id: string;
    type: string;
    webhookId: string;
}
export default router;
//# sourceMappingURL=cdp.d.ts.map