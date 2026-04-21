type CreateWebhookParams = {
    network: string;
    name: string;
    addresses: string[];
    webhook_type: string;
    webhook_url: string;
};
type Token = "USDC" | "USDT";
type Network = "base" | "polygon" | "arbitrum" | "optimism" | "avalanche";
declare const CONTRACT_TOKENS: any;
declare const NETWORK_CONFIG: {
    readonly base: {
        readonly paymasterUrl: "https://api.developer.coinbase.com/rpc/v1/base/LCT7r5ZaPObDm4t7oDDhe8fSJQgAJNEe";
    };
    readonly polygon: {
        readonly paymasterUrl: "https://api.pimlico.io/v2/137/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P";
    };
    readonly arbitrum: {
        readonly paymasterUrl: "https://api.pimlico.io/v2/42161/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P";
    };
    readonly optimism: {
        readonly paymasterUrl: "https://api.pimlico.io/v2/10/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P";
    };
    readonly avalanche: {
        readonly paymasterUrl: "https://api.pimlico.io/v2/43114/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P";
    };
};
export declare function registerWebhook(params: CreateWebhookParams): Promise<{
    success: boolean;
    data: any;
}>;
export declare function registerAddressWebhook(address: string, network: string): Promise<any>;
export declare function encodeTransfer(to: `0x${string}`, amount: string): `0x${string}`;
export declare function getTokenAndPaymaster(token: keyof typeof CONTRACT_TOKENS, network: keyof typeof NETWORK_CONFIG): {
    tokenAddress: any;
    paymasterUrl: "https://api.developer.coinbase.com/rpc/v1/base/LCT7r5ZaPObDm4t7oDDhe8fSJQgAJNEe" | "https://api.pimlico.io/v2/137/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P" | "https://api.pimlico.io/v2/42161/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P" | "https://api.pimlico.io/v2/10/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P" | "https://api.pimlico.io/v2/43114/rpc?apikey=pim_eMsyu12RYuDfnEQSuj1C9P";
};
export declare function isToken(x: any): x is Token;
export declare function isNetwork(x: any): x is Network;
export {};
//# sourceMappingURL=webhookHelper.d.ts.map