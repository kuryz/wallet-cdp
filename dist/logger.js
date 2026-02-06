import fs from "fs";
import path from "path";
const logDir = path.resolve("logs");
const logFile = path.join(logDir, "error.log");
// Ensure logs directory exists
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}
export function logError(err, context) {
    const timestamp = new Date().toISOString();
    const message = err instanceof Error
        ? `${err.message}\n${err.stack}`
        : JSON.stringify(err);
    const logEntry = `
[${timestamp}]
${context ? `Context: ${context}\n` : ""}${message}
----------------------------------------
`;
    fs.appendFile(logFile, logEntry, (e) => {
        if (e) {
            console.error("Failed to write error log:", e);
        }
    });
}
//# sourceMappingURL=logger.js.map