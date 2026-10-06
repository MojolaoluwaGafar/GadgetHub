import pino from "pino";
import pinoHttp from "pino-http";
import dotenv from "dotenv";
dotenv.config({ quiet: true });

const isProduction = process.env.NODE_ENV === "production";

// Pretty output is for local dev only. pino-pretty is a dev dependency, so a
// server that skipped dev dependencies (or never set NODE_ENV) logs JSON
// instead of crashing at startup.
const canPrettyPrint = (() => {
  if (isProduction || process.env.RENDER) return false;
  try {
    require.resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
})();

export const logger = pino({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  // Login tokens must never reach the logs. Request bodies are not logged at
  // all, since they carry passwords, addresses and phone numbers.
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie", "err.config", "err.request"],
    censor: "[REDACTED]",
  },
  transport: canPrettyPrint
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "SYS:HH:MM:ss", ignore: "pid,hostname" },
      }
    : undefined,
});

// Express strips the mount path from req.url inside app.use("/prefix", ...),
// so prefer originalUrl to log the path the client actually requested.
// Reset tokens travel in the request body, never the URL, so nothing needs
// masking here.
const fullUrl = (req: { url?: string }) => (req as { originalUrl?: string }).originalUrl ?? req.url;

export const httpLogger = pinoHttp({
  logger,
  serializers: {
    req: (req) => ({ id: req.id, method: req.method, url: req.raw?.originalUrl ?? req.url }),
    res: (res) => ({ statusCode: res.statusCode }),
  },
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
  customSuccessMessage: (req, res, responseTime) =>
    `${req.method} ${fullUrl(req)} ${res.statusCode} ${Math.round(responseTime)}ms`,
  customErrorMessage: (req, res, err) => `${req.method} ${fullUrl(req)} ${res.statusCode} ${err.message}`,
});
