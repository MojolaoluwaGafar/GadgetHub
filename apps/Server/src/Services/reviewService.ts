import { Types } from "mongoose";
import type { Review as ReviewDto, ReviewList } from "../types/shared";
import { Order } from "../Models/Order";
import { Product } from "../Models/Product";
import { Review } from "../Models/Review";
import { User } from "../Models/User";
import { shortName, toReviewDto } from "./mappers";
import { ServiceError } from "./errors";

const hasReceived = (userId: string, productId: string) =>
  Order.exists({ user: userId, status: "delivered", "items.productId": productId });

export async function list(productId: string, viewerId: string | undefined, page: number, limit: number): Promise<ReviewList> {
  const product = new Types.ObjectId(productId);
  const [docs, stats, mine, received] = await Promise.all([
    Review.find({ product }).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Review.aggregate<{ _id: number; count: number }>([{ $match: { product } }, { $group: { _id: "$rating", count: { $sum: 1 } } }]),
    viewerId ? Review.exists({ product, user: viewerId }) : null,
    viewerId ? hasReceived(viewerId, productId) : null,
  ]);

  const breakdown = [5, 4, 3, 2, 1].map((stars) => stats.find((row) => row._id === stars)?.count ?? 0);
  const count = breakdown.reduce((sum, n) => sum + n, 0);
  const average = count ? stats.reduce((sum, row) => sum + row._id * row.count, 0) / count : 0;
  return {
    items: docs.map(toReviewDto),
    average: Math.round(average * 10) / 10,
    count,
    breakdown,
    canReview: Boolean(received && !mine),
  };
}

// Keeps the product's rating fields (used for sorting and cards) in step.
async function refreshRating(productId: Types.ObjectId) {
  const [row] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { product: productId } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne({ _id: productId }, { ratingAverage: row?.average ?? 0, ratingCount: row?.count ?? 0 });
}

export async function create(userId: string, productId: string, input: { rating: number; title: string; body: string }): Promise<ReviewDto> {
  const product = await Product.findById(productId).select("_id");
  if (!product) throw new ServiceError(404, "This product isn't available anymore.");
  if (!(await hasReceived(userId, productId))) {
    throw new ServiceError(403, "You can review this once an order with it has been delivered to you.");
  }
  if (await Review.exists({ product: product._id, user: userId })) {
    throw new ServiceError(409, "You've already reviewed this product.");
  }
  const user = await User.findById(userId).select("firstName lastName");
  if (!user) throw new ServiceError(401, "Please sign in again.");

  const review = await Review.create({ ...input, product: product._id, user: userId, author: shortName(user.firstName, user.lastName) });
  await refreshRating(product._id);
  return toReviewDto(review);
}
