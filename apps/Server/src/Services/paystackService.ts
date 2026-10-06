import crypto from "crypto";
import { env } from "../config/env";
import { logger } from "../Utils/logger";
import { ServiceError } from "./errors";

// Paystack takes card, bank transfer and USSD payments on its own checkout
// page. We start a transaction, send the shopper there, and confirm it two
// ways: the shopper's return (verify) and Paystack's webhook. Either one is
// enough; whichever arrives second finds the order already paid.

const API = "https://api.paystack.co";

export const isPaystackConfigured = () => Boolean(env.paystackSecret());

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = env.paystackSecret();
  if (!secret) throw new ServiceError(503, "Online payment isn't available right now. Choose pay on delivery.");
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    signal: AbortSignal.timeout(15_000),
  });
  const body = (await response.json().catch(() => null)) as { status?: boolean; message?: string; data?: T } | null;
  if (!response.ok || !body?.status || !body.data) {
    logger.error({ path, status: response.status, message: body?.message }, "Paystack request failed");
    throw new ServiceError(502, "We couldn't reach Paystack. Please try again in a moment.");
  }
  return body.data;
}

export async function initialize(input: {
  email: string;
  /** In naira; Paystack wants kobo. */
  amount: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
}): Promise<string> {
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  return data.authorization_url;
}

export interface VerifiedTransaction {
  reference: string;
  status: string;
  /** In kobo. */
  amount: number;
  currency: string;
}

export async function verify(reference: string): Promise<VerifiedTransaction> {
  return call<VerifiedTransaction>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

// Paystack signs each webhook body with our secret key (HMAC SHA-512). The
// first version's /api/payments/webhook accepted any request.
export function isValidSignature(rawBody: Buffer | undefined, signature: string | undefined): boolean {
  const secret = env.paystackSecret();
  if (!secret || !rawBody || !signature) return false;
  const expected = crypto.createHmac("sha512", secret).update(rawBody).digest("hex");
  return expected.length === signature.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}
