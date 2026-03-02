type LogLevel = "info" | "warn" | "error";

const LOG_LEVEL: LogLevel = (process.env.LOG_LEVEL as LogLevel) || "info";

const levels: Record<LogLevel, number> = {
  info: 0,
  warn: 1,
  error: 2,
};

function shouldLog(level: LogLevel): boolean {
  return levels[level] >= levels[LOG_LEVEL];
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("info")) {
      console.log(JSON.stringify({ level: "info", message, ...meta }));
    }
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("warn")) {
      console.warn(JSON.stringify({ level: "warn", message, ...meta }));
    }
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (shouldLog("error")) {
      console.error(JSON.stringify({ level: "error", message, ...meta }));
    }
  },
};

/** Event shape for analytics; log and/or send to pipeline later */
export function logEvent(event: string, properties?: Record<string, unknown>) {
  logger.info(`event:${event}`, properties);
}
