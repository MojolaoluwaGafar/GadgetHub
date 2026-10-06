import type { Request } from "express";
import { isValidObjectId } from "mongoose";
import { ServiceError } from "../Services/errors";

// A MongoDB id route parameter such as /products/:id. Anything that isn't a
// valid id is treated as "not found" rather than a server error.
export function idParam(req: Request, name = "id"): string {
  const value = req.params[name];
  if (typeof value !== "string" || !isValidObjectId(value)) throw new ServiceError(404, "Not found.");
  return value;
}

// A single query-string value (?q=...). Repeated keys take the first.
export function queryText(req: Request, name: string): string | undefined {
  const value = req.query[name];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

// A positive whole number from the query string, capped at `max`.
export function queryInt(req: Request, name: string, fallback: number, max = Number.MAX_SAFE_INTEGER): number {
  const value = Number(queryText(req, name));
  if (!Number.isInteger(value) || value < 1) return fallback;
  return Math.min(value, max);
}

// For building case-insensitive search patterns from what people type.
export const escapeRegex = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
