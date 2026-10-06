// The shapes the API sends and accepts come from packages/shared (copied into
// types/shared.ts by `npm run sync:shared`), so the Client and Server can't
// drift apart. Import them from here.
export type * from "./shared";
export { CATEGORY_LABELS, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "./shared";

import type { Category } from "./shared";

// What a failed request's body looks like.
export interface ApiErrorResponse {
  success: false;
  message?: string;
  errors?: { field: string; message: string }[];
}

/** A line in the cart, kept in the browser. Price is refreshed from the API. */
export interface CartItem {
  /** productId, colour and storage together: the same phone in two colours is two lines. */
  key: string;
  productId: string;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  color: string | null;
  storage: string | null;
  /** Units left when last checked; caps the quantity. */
  stock: number;
}

export const CATEGORIES: Category[] = ["smartphones", "laptops", "wearables", "gaming", "accessories", "smart-home"];
