import type {
  Address,
  Category,
  Order as OrderDto,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductDetail,
  ProductSummary,
  Review as ReviewDto,
  Role,
  User as UserDto,
} from "../types/shared";
import type { ProductDoc, ProductFields } from "../Models/Product";
import type { OrderDoc } from "../Models/Order";
import type { ReviewDoc } from "../Models/Review";
import type { UserDoc } from "../Models/User";

// How documents become the JSON the Client gets (types in packages/shared).

const NEW_FOR_MS = 30 * 86_400_000;

type ProductLike = (ProductDoc | (ProductFields & { _id: unknown })) & { createdAt?: Date | null };

export const isOnSale = (product: { price: number; compareAtPrice?: number | null; saleEndsAt?: Date | null }, now = new Date()) =>
  Boolean(product.compareAtPrice && product.compareAtPrice > product.price && (!product.saleEndsAt || product.saleEndsAt > now));

export function toProductSummary(doc: ProductLike): ProductSummary {
  const createdAt = doc.createdAt ?? new Date(0);
  const onSale = isOnSale(doc);
  return {
    id: String(doc._id),
    name: doc.name,
    brand: doc.brand,
    category: doc.category as Category,
    subtitle: doc.subtitle ?? "",
    price: doc.price,
    // A sale that ended shows the plain price.
    compareAtPrice: onSale ? (doc.compareAtPrice ?? null) : null,
    saleEndsAt: onSale && doc.saleEndsAt ? doc.saleEndsAt.toISOString() : null,
    onSale,
    image: doc.images?.[0]?.url ?? null,
    inStock: (doc.stock ?? 0) > 0,
    stock: doc.stock ?? 0,
    trending: Boolean(doc.trending),
    isNew: Date.now() - createdAt.getTime() < NEW_FOR_MS,
    rating: Math.round((doc.ratingAverage ?? 0) * 10) / 10,
    reviewCount: doc.ratingCount ?? 0,
    createdAt: createdAt.toISOString(),
  };
}

export function toProductDetail(doc: ProductLike): ProductDetail {
  return {
    ...toProductSummary(doc),
    description: doc.description ?? "",
    images: (doc.images ?? []).map((image) => ({ url: image.url, publicId: image.publicId ?? null })),
    colors: (doc.colors ?? []).map((color) => ({ name: color.name ?? "", hex: color.hex ?? "#000000" })),
    storageOptions: [...(doc.storageOptions ?? [])],
    specs: (doc.specs ?? []).map((spec) => ({ label: spec.label ?? "", value: spec.value ?? "" })),
  };
}

export function toAddress(doc: { _id: unknown; label?: string | null; address: string; city: string; state: string; isDefault?: boolean | null }): Address {
  return {
    id: String(doc._id),
    label: doc.label || "Home",
    address: doc.address,
    city: doc.city,
    state: doc.state,
    isDefault: Boolean(doc.isDefault),
  };
}

export function toUserDto(user: UserDoc): UserDto {
  return {
    id: String(user._id),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: (user.role ?? "user") as Role,
    addresses: (user.addresses ?? []).map(toAddress),
    createdAt: (user.createdAt ?? user._id.getTimestamp()).toISOString(),
  };
}

export function toOrderDto(doc: OrderDoc): OrderDto {
  const createdAt = (doc.createdAt ?? doc._id.getTimestamp()).toISOString();
  const status = doc.status as OrderStatus;
  return {
    id: String(doc._id),
    orderNumber: doc.orderNumber,
    customer: {
      firstName: doc.customer?.firstName ?? "",
      lastName: doc.customer?.lastName ?? "",
      email: doc.customer?.email ?? "",
      phone: doc.customer?.phone ?? "",
      address: doc.customer?.address ?? "",
      city: doc.customer?.city ?? "",
      state: doc.customer?.state ?? "",
    },
    items: doc.items.map((item) => ({
      productId: item.productId ?? "",
      name: item.name ?? "Item",
      image: item.image ?? null,
      price: item.price ?? 0,
      quantity: item.quantity ?? 1,
      color: item.color ?? null,
      storage: item.storage ?? null,
    })),
    deliveryMethod: doc.deliveryMethod as OrderDto["deliveryMethod"],
    paymentMethod: doc.paymentMethod as PaymentMethod,
    subtotal: doc.subtotal,
    deliveryFee: doc.deliveryFee ?? 0,
    total: doc.total,
    paymentStatus: doc.paymentStatus as PaymentStatus,
    status,
    timeline: doc.timeline.length
      ? doc.timeline.map((step) => ({ status: step.status as OrderStatus, at: (step.at ?? new Date()).toISOString() }))
      : [{ status: "pending", at: createdAt }],
    estimatedDelivery: doc.deliveryDate ? doc.deliveryDate.toISOString() : null,
    createdAt,
  };
}

export function toReviewDto(doc: ReviewDoc): ReviewDto {
  return {
    id: String(doc._id),
    author: doc.author,
    rating: doc.rating,
    title: doc.title,
    body: doc.body,
    createdAt: doc.createdAt.toISOString(),
  };
}

// "Ada O." from first and last name.
export const shortName = (firstName: string, lastName: string) =>
  `${firstName.trim()}${lastName.trim() ? ` ${lastName.trim()[0]!.toUpperCase()}.` : ""}`;
