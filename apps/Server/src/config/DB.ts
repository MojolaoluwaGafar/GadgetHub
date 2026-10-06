import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../Utils/logger";

// Queries fail straight away while the database is unreachable instead of
// queueing for 10 seconds; the API answers 503 meanwhile (see index.ts).
mongoose.set("bufferCommands", false);
mongoose.set("strictQuery", true);

export const isDbConnected = () => mongoose.connection.readyState === 1;

export async function connectDB(): Promise<void> {
  const uri = env.mongoUri();
  if (!uri) throw new Error("MONGO_URI is not defined");

  await mongoose.connect(uri, {
    // Only needed when the connection string doesn't name a database.
    dbName: process.env.MONGO_DB_NAME?.trim() || undefined,
    serverSelectionTimeoutMS: 10_000,
  });
}

// Keeps trying in the background, so a slow or paused database never stops
// the server from binding its port (Render then reports the service as down
// and the real error is hard to find). `onConnected` runs once.
export function connectWithRetry(onConnected: () => Promise<void>, delayMs = 5_000): void {
  const attempt = async () => {
    try {
      await connectDB();
      logger.info("MongoDB connected");
      await onConnected();
    } catch (error) {
      logger.error({ err: error }, `MongoDB connection failed; retrying in ${delayMs / 1000}s`);
      setTimeout(attempt, delayMs);
    }
  };
  void attempt();
}

mongoose.connection.on("disconnected", () => logger.warn("MongoDB disconnected"));
