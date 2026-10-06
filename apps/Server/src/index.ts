import express, { type Application, type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import { connectWithRetry, isDbConnected } from "./config/DB";
import { isAllowedOrigin } from "./config/origins";
import { runStartupMigrations } from "./db/migrate";
import ApiRoutes from "./Routes";
import { apiLimiter } from "./middlewares/RateLimiter";
import { errorHandler } from "./Utils/sendError";
import { logger, httpLogger } from "./Utils/logger";
import { emailProvider } from "./Utils/SendMail";
import { isPaystackConfigured } from "./Services/paystackService";

const app: Application = express();

// Render puts one proxy in front of the app; trusting it makes req.ip the real
// client IP, which the rate limiter keys on. Render sets RENDER=true.
app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS ?? (process.env.RENDER ? 1 : 0)));
app.use(httpLogger);
// The raw body is kept for Paystack's webhook signature check.
app.use(
  express.json({
    limit: "200kb",
    verify: (req, _res, buffer) => {
      (req as Request & { rawBody?: Buffer }).rawBody = buffer;
    },
  }),
);

app.use(
  cors({
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (isAllowedOrigin(origin)) return callback(null, true);
      logger.warn({ origin }, "CORS blocked origin");
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Health checks. Render pings "/"; /api/health also says whether the
// database is reachable, which is the first thing to check when the app
// misbehaves.
app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: "GadgetHub API running" });
});
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    db: isDbConnected() ? "connected" : "disconnected",
    email: emailProvider,
    paystack: isPaystackConfigured(),
  });
});

// While the database is still connecting (or has dropped), answer straight
// away with a clear message instead of failing each query separately.
app.use("/api", (_req: Request, res: Response, next: NextFunction) => {
  if (isDbConnected()) return next();
  res.status(503).json({ success: false, message: "GadgetHub is starting up. Please try again in a few seconds." });
});

app.use("/api", apiLimiter);
app.use("/api", ApiRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: "Route not found" });
});
app.use(errorHandler);

// The port opens first and the database connects (and retries) in the
// background. The first version waited for MongoDB before listening, so a
// database problem left Render with no open port and the API looked dead.
const PORT = Number(process.env.PORT) || 5050;
app.listen(PORT, () => {
  logger.info(`GadgetHub API listening on http://localhost:${PORT} (emails via ${emailProvider})`);
});

connectWithRetry(runStartupMigrations);

process.on("unhandledRejection", (error) => {
  logger.error({ err: error }, "Unhandled rejection");
});
