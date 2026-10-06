import type { Request, Response } from "express";
import { isValidObjectId } from "mongoose";
import type { Category, ProductSort } from "../types/shared";
import type { AuthRequest } from "../middlewares/Auth";
import { CATEGORIES } from "../Validation/common";
import { ReviewSchema } from "../Validation/orderSchema";
import { idParam, queryInt, queryText } from "../Utils/params";
import * as productService from "../Services/productService";
import * as reviewService from "../Services/reviewService";
import { isPaystackConfigured } from "../Services/paystackService";
import { env } from "../config/env";

const SORTS: ProductSort[] = ["newest", "price-asc", "price-desc", "rating"];

// A non-negative number from the query string, or undefined.
const queryNumber = (req: Request, name: string) => {
  const value = Number(queryText(req, name));
  return queryText(req, name) !== undefined && Number.isFinite(value) && value >= 0 ? value : undefined;
};

const queryList = (req: Request, name: string) =>
  queryText(req, name)
    ?.split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 50);

const queryFlag = (req: Request, name: string) => queryText(req, name) === "1";

export const listOptions = (req: Request) => {
  const category = queryText(req, "category");
  const sort = queryText(req, "sort") as ProductSort;
  return {
    q: queryText(req, "q"),
    category: CATEGORIES.includes(category as Category) ? (category as Category) : undefined,
    brands: queryList(req, "brand"),
    minPrice: queryNumber(req, "minPrice"),
    maxPrice: queryNumber(req, "maxPrice"),
    minRating: queryNumber(req, "minRating"),
    inStock: queryFlag(req, "inStock"),
    onSale: queryFlag(req, "onSale"),
    trending: queryFlag(req, "trending"),
    ids: queryList(req, "ids")?.filter((id) => isValidObjectId(id)),
    sort: SORTS.includes(sort) ? sort : "newest",
    page: queryInt(req, "page", 1),
    limit: queryInt(req, "limit", 12, 48),
  };
};

export const list = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, ...(await productService.list(listOptions(req))) });
};

export const facets = async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, ...(await productService.facets()) });
};

export const detail = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, product: await productService.getDetail(idParam(req)) });
};

export const related = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, products: await productService.related(idParam(req)) });
};

export const reviews = async (req: AuthRequest, res: Response) => {
  const result = await reviewService.list(idParam(req), req.user?.id, queryInt(req, "page", 1), queryInt(req, "limit", 5, 20));
  res.status(200).json({ success: true, ...result });
};

export const addReview = async (req: AuthRequest, res: Response) => {
  const input = ReviewSchema.parse(req.body);
  res.status(201).json({ success: true, review: await reviewService.create(req.user!.id, idParam(req), input) });
};

// What the shop needs to know about the server's setup.
export const config = async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, paystackEnabled: isPaystackConfigured(), deliveryFee: env.deliveryFee() });
};
