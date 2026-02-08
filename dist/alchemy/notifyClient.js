export const ALCHEMY_NOTIFY_BASE_URL = "https://dashboard.alchemy.com/api/v1/notify";
export function getNotifyHeaders() {
    const apiKey = process.env.ALCHEMY_API_KEY;
    if (!apiKey) {
        throw new Error("Missing ALCHEMY_API_KEY");
    }
    return {
        "Content-Type": "application/json",
        "X-Alchemy-Token": apiKey
    };
}
//# sourceMappingURL=notifyClient.js.map