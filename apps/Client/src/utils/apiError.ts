import { isAxiosError } from "axios";
import type { ApiErrorResponse } from "../types";

// The message to show for a failed request: the server's own message when it
// sent one, else `fallback`. No response at all means the request never got
// there: offline, or the free server is still waking up.
export function apiErrorMessage(err: unknown, fallback: string): string {
  if (isAxiosError(err)) {
    if (!err.response) {
      return "We couldn't reach GadgetHub. The server may be waking up; try again in a few seconds.";
    }
    const body = err.response.data as ApiErrorResponse | undefined;
    return body?.message ?? body?.errors?.[0]?.message ?? fallback;
  }
  return fallback;
}

// Field-level errors from the server, e.g. { "customer.address": "Enter your delivery address." }.
export function apiFieldErrors(err: unknown): Record<string, string> {
  if (!isAxiosError(err)) return {};
  const list = (err.response?.data as ApiErrorResponse | undefined)?.errors ?? [];
  const byField: Record<string, string> = {};
  for (const item of list) {
    if (!(item.field in byField)) byField[item.field] = item.message;
  }
  return byField;
}
