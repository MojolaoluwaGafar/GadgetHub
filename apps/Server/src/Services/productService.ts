import type { Category, CatalogFacets, Paginated, ProductDetail, ProductSort, ProductSummary } from "../types/shared";
import { Product } from "../Models/Product";
import { Review } from "../Models/Review";
import { isOwnImageUrl } from "../config/Cloudinary";
import { escapeRegex } from "../Utils/params";
import type { ProductInputParsed } from "../Validation/productSchema";
import { toProductDetail, toProductSummary } from "./mappers";
import { deleteImage } from "./uploadService";
import { ServiceError } from "./errors";

export interface ListOptions {
  q?: string;
  category?: Category;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  trending?: boolean;
  /** Only these products (wishlist, recently viewed, cart refresh). */
  ids?: string[];
  /** Admin: only products with at most this many left. */
  maxStock?: number;
  sort?: ProductSort;
  page: number;
  limit: number;
}

const SORTS: Record<ProductSort, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  "price-asc": { price: 1, createdAt: -1 },
  "price-desc": { price: -1, createdAt: -1 },
  rating: { ratingAverage: -1, ratingCount: -1, createdAt: -1 },
};

// A sale counts while the original price is higher and its end date (if any)
// hasn't passed. Mirrors isOnSale in mappers.ts.
const onSaleFilter = () => ({
  $expr: { $gt: ["$compareAtPrice", "$price"] },
  $or: [{ saleEndsAt: null }, { saleEndsAt: { $gt: new Date() } }],
});

export async function list(options: ListOptions): Promise<Paginated<ProductSummary>> {
  const and: Record<string, unknown>[] = [];
  if (options.category) and.push({ category: options.category });
  if (options.brands?.length) {
    and.push({ brand: { $in: options.brands.map((brand) => new RegExp(`^${escapeRegex(brand)}$`, "i")) } });
  }
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    and.push({ price: { ...(options.minPrice !== undefined && { $gte: options.minPrice }), ...(options.maxPrice !== undefined && { $lte: options.maxPrice }) } });
  }
  if (options.minRating) and.push({ ratingAverage: { $gte: options.minRating } });
  if (options.inStock) and.push({ stock: { $gt: 0 } });
  if (options.maxStock !== undefined) and.push({ stock: { $lte: options.maxStock } });
  if (options.trending) and.push({ trending: true });
  if (options.onSale) and.push(onSaleFilter());
  if (options.ids) and.push({ _id: { $in: options.ids } });
  const q = options.q?.trim().slice(0, 60);
  if (q) {
    const pattern = { $regex: escapeRegex(q), $options: "i" };
    and.push({ $or: [{ name: pattern }, { brand: pattern }, { subtitle: pattern }, { category: pattern }] });
  }

  const filter = and.length ? { $and: and } : {};
  const [docs, total] = await Promise.all([
    Product.find(filter)
      .sort(SORTS[options.sort ?? "newest"])
      .skip((options.page - 1) * options.limit)
      .limit(options.limit),
    Product.countDocuments(filter),
  ]);
  return { items: docs.map(toProductSummary), total, page: options.page, limit: options.limit };
}

export async function facets(): Promise<CatalogFacets> {
  const [categories, brands] = await Promise.all([
    Product.aggregate<{ _id: Category; count: number }>([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    Product.distinct("brand"),
  ]);
  return {
    categories: categories.map((row) => ({ category: row._id, count: row.count })),
    brands: (brands as string[]).sort((a, b) => a.localeCompare(b)),
  };
}

export async function getDetail(id: string): Promise<ProductDetail> {
  const product = await Product.findById(id);
  if (!product) throw new ServiceError(404, "This product isn't available anymore.");
  return toProductDetail(product);
}

// Same category first, then same brand, then anything; never the product itself.
export async function related(id: string, limit = 4): Promise<ProductSummary[]> {
  const product = await Product.findById(id).select("category brand");
  if (!product) return [];
  const picked = await Product.find({ _id: { $ne: product._id }, category: product.category }).sort({ ratingAverage: -1, createdAt: -1 }).limit(limit);
  if (picked.length < limit) {
    const more = await Product.find({ _id: { $nin: [product._id, ...picked.map((p) => p._id)] } })
      .sort({ trending: -1, createdAt: -1 })
      .limit(limit - picked.length);
    picked.push(...more);
  }
  return picked.map(toProductSummary);
}

// ------------------------------------------------------------------ admin

function assertImages(input: ProductInputParsed, existing: string[] = []) {
  for (const image of input.images) {
    // Photos the product already has (seeded or from the first version) can stay.
    if (!existing.includes(image.url) && !isOwnImageUrl(image.url)) {
      throw new ServiceError(400, "Upload the photos again from this page.", "images");
    }
  }
}

const toFields = (input: ProductInputParsed) => ({
  ...input,
  saleEndsAt: input.saleEndsAt ? new Date(input.saleEndsAt) : null,
});

export async function create(input: ProductInputParsed): Promise<ProductDetail> {
  assertImages(input);
  const product = await Product.create(toFields(input));
  return toProductDetail(product);
}

export async function update(id: string, input: ProductInputParsed): Promise<ProductDetail> {
  const product = await Product.findById(id);
  if (!product) throw new ServiceError(404, "This product doesn't exist anymore.");
  const before = product.images.map((image) => ({ url: image.url, publicId: image.publicId ?? null }));
  assertImages(input, before.map((image) => image.url));

  product.set(toFields(input));
  await product.save();

  // Photos taken off the product are deleted from Cloudinary.
  const kept = new Set(input.images.map((image) => image.url));
  await Promise.all(before.filter((image) => !kept.has(image.url)).map((image) => deleteImage(image.publicId)));
  return toProductDetail(product);
}

// Orders keep their own copy of the product, so deleting it never changes them.
export async function remove(id: string): Promise<void> {
  const product = await Product.findById(id);
  if (!product) throw new ServiceError(404, "This product doesn't exist anymore.");
  await product.deleteOne();
  await Review.deleteMany({ product: product._id });
  await Promise.all(product.images.map((image) => deleteImage(image.publicId)));
}
