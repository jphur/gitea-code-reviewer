import winston from "winston";

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ level, message, timestamp }) => {
            const d = new Date(String(timestamp));
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const hours = String(d.getHours()).padStart(2, "0");
            const minutes = String(d.getMinutes()).padStart(2, "0");
            const seconds = String(d.getSeconds()).padStart(2, "0");
            const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
            return `[${formattedTimestamp}][${level}]: ${message}`;
        }),
    ),
    transports: [new winston.transports.Console()],
});

export default logger;
