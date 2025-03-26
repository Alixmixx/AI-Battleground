import { createLogger, format, transports } from "winston";

const isBrowser = typeof window !== "undefined";

// Create a browser-compatible logger
const browserLogger = {
    error: (message: string, meta?: any) => console.error(`[error]: ${message}`, meta || ""),
    warn: (message: string, meta?: any) => console.warn(`[warn]: ${message}`, meta || ""),
    info: (message: string, meta?: any) => console.info(`[info]: ${message}`, meta || ""),
    http: (message: string, meta?: any) => console.log(`[http]: ${message}`, meta || ""),
    verbose: (message: string, meta?: any) => console.log(`[verbose]: ${message}`, meta || ""),
    debug: (message: string, meta?: any) => console.debug(`[debug]: ${message}`, meta || ""),
    silly: (message: string, meta?: any) => console.log(`[silly]: ${message}`, meta || ""),
};

// Create Winston logger only on the server
const serverLogger = createLogger({
    level: "info",
    format: format.combine(format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), format.json()),
    transports: [
        // Always log to console
        new transports.Console({
            format: format.combine(
                format.colorize(),
                format.printf(({ timestamp, level, message, ...metadata }) => {
                    return `${timestamp} [${level}]: ${message} ${Object.keys(metadata).length ? JSON.stringify(metadata) : ""}`;
                })
            ),
        }),
        // Log to file
        new transports.File({ filename: "logs/app.log" }),
    ],
});

// Export the appropriate logger based on environment
const logger = isBrowser ? browserLogger : serverLogger;

logger.info("Logger initialized", { environment: isBrowser ? "browser" : "server" });

export default logger; 
