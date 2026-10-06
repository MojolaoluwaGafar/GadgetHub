// Types shared by apps/Client and apps/Server. The Server imports from here
// with `import type` only (it runs as CommonJS and does not build this
// package). Lists of allowed values the Server validates against live in
// apps/Server/src/Validation; the constants at the bottom are for the Client.

// ------------------------------------------------------------------ catalog

export type Category = "smartphones" | "laptops" | "wearables" | "gaming" | "accessories" | "smart-home";

export interface ProductImage {
  url: string;
  /** Cloudinary id, so the image can be deleted with the product. */
  publicId: string | null;
}

/** A colour a product comes in, shown as a swatch. */
export interface ColorOption {
  name: string;
  /** CSS colour, e.g. "#9EC0FF". */
  hex: string;
}

export interface Spec {
  label: string;
  value: string;
}

/** What a product card needs. */
export interface ProductSummary {
  id: string;
  name: string;
  brand: string;
  category: Category;
  /** The short line under the name, e.g. "256GB • Titanium Gray". */
  subtitle: string;
  /** Selling price in naira. */
  price: number;
  /**
   * The price before the sale, when the product is on sale. A product is on
   * sale while this is above `price` and `saleEndsAt` (if set) is in the future.
   */
  compareAtPrice: number | null;
  saleEndsAt: string | null;
  onSale: boolean;
  image: string | null;
  inStock: boolean;
  /** Units left. */
  stock: number;
  trending: boolean;
  /** Added in the last 30 days. */
  isNew: boolean;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface ProductDetail extends ProductSummary {
  description: string;
  images: ProductImage[];
  colors: ColorOption[];
  storageOptions: string[];
  specs: Spec[];
}

export type ProductSort = "newest" | "price-asc" | "price-desc" | "rating";

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/** What the shop's filters can offer, from the products that exist. */
export interface CatalogFacets {
  categories: { category: Category; count: number }[];
  brands: string[];
}

/**
 * Only customers who received the product (a delivered order) can review it,
 * so every review is from a verified buyer.
 */
export interface Review {
  id: string;
  /** First name and last initial, e.g. "Ada O." */
  author: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface ReviewList {
  items: Review[];
  average: number;
  count: number;
  /** How many reviews gave 5, 4, 3, 2 and 1 stars, in that order. */
  breakdown: number[];
  /** Whether the signed-in viewer can review: they received it and haven't yet. */
  canReview: boolean;
}

// ------------------------------------------------------------------ accounts

export type Role = "user" | "admin";

export interface Address {
  id: string;
  label: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  role: Role;
  addresses: Address[];
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ------------------------------------------------------------------ orders

export type DeliveryMethod = "doorstep" | "pickup";

/** "paystack" covers card, bank transfer and USSD through Paystack's checkout. */
export type PaymentMethod = "paystack" | "delivery";

/**
 * An order's life: pending (placed) -> processing (being packed) -> shipped
 * -> delivered. It can be cancelled while pending or processing, which puts
 * its items back in stock.
 */
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

export interface OrderItem {
  productId: string;
  name: string;
  image: string | null;
  /** The price when the order was placed. */
  price: number;
  quantity: number;
  color: string | null;
  storage: string | null;
}

export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: Customer;
  items: OrderItem[];
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  /** When each status was reached, for the tracking timeline. */
  timeline: { status: OrderStatus; at: string }[];
  estimatedDelivery: string | null;
  createdAt: string;
}

/** What the checkout sends. Prices come from the database, never the cart. */
export interface PlaceOrderInput {
  items: { productId: string; quantity: number; color: string | null; storage: string | null }[];
  customer: Omit<Customer, "email"> & { email: string };
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  /** Save the address to the account for next time. */
  saveAddress: boolean;
}

export interface PlaceOrderResponse {
  order: Order;
  /** For Paystack: where to send the customer to pay. */
  paymentUrl: string | null;
}

/** What the shop needs to know about the server's setup. */
export interface StoreConfig {
  paystackEnabled: boolean;
  deliveryFee: number;
}

// ------------------------------------------------------------------ admin

export interface AdminStats {
  revenue: number;
  ordersCount: number;
  pendingOrders: number;
  productsCount: number;
  lowStock: ProductSummary[];
  customersCount: number;
  /** Paid revenue and order count per day, oldest first, for the last 14 days. */
  daily: { date: string; revenue: number; orders: number }[];
  recentOrders: Order[];
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  ordersCount: number;
  totalSpent: number;
  joinedAt: string;
}

/** The admin product form, as sent to the API. */
export interface ProductInput {
  name: string;
  brand: string;
  category: Category;
  subtitle: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  saleEndsAt: string | null;
  stock: number;
  trending: boolean;
  images: ProductImage[];
  colors: ColorOption[];
  storageOptions: string[];
  specs: Spec[];
}

export interface UploadResponse {
  url: string;
  publicId: string;
}

// ------------------------------------------------------------------ client constants

// Names as the design shows them.

export const CATEGORY_LABELS: Record<Category, string> = {
  smartphones: "Smart Phones",
  laptops: "Laptops",
  wearables: "Wearables",
  gaming: "Gaming",
  accessories: "Accessories",
  "smart-home": "Smart Homes",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "Unpaid",
  paid: "Paid",
  failed: "Failed",
};
