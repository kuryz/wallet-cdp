const ALCHEMY_API_URL = "https://dashboard.alchemy.com/api/create-webhook";
const ALCHEMY_TOKEN = process.env.ALCHEMY_TOKEN; // must be set in .env
export async function createAlchemyWebhook(payload) {
    const response = await fetch(ALCHEMY_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Alchemy-Token": ALCHEMY_TOKEN,
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Alchemy API error: ${text}`);
    }
    const data = (await response.json());
    return data;
}
//# sourceMappingURL=webhook.js.map