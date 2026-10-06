import type { Request, Response } from "express";
import type { OrderStatus, PaymentStatus } from "../types/shared";
import { ProductSchema } from "../Validation/productSchema";
import { AdminOrderUpdateSchema } from "../Validation/orderSchema";
import { idParam, queryInt, queryText } from "../Utils/params";
import { listOptions } from "./ProductController";
import * as adminService from "../Services/adminService";
import * as productService from "../Services/productService";
import * as orderService from "../Services/orderService";
import { uploadImage } from "../Services/uploadService";
import { ServiceError } from "../Services/errors";

const ORDER_STATUSES: OrderStatus[] = ["pending", "processing", "shipped", "delivered", "cancelled"];
const PAYMENT_STATUSES: PaymentStatus[] = ["pending", "paid", "failed"];

export const stats = async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, stats: await adminService.stats() });
};

// ---------------------------------------------------------------- products

export const products = async (req: Request, res: Response) => {
  const stock = queryText(req, "stock");
  const options = {
    ...listOptions(req),
    inStock: stock === "in",
    maxStock: stock === "low" ? 5 : stock === "out" ? 0 : undefined,
    limit: queryInt(req, "limit", 20, 100),
  };
  res.status(200).json({ success: true, ...(await productService.list(options)) });
};

export const product = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, product: await productService.getDetail(idParam(req)) });
};

export const createProduct = async (req: Request, res: Response) => {
  const input = ProductSchema.parse(req.body);
  res.status(201).json({ success: true, product: await productService.create(input) });
};

export const updateProduct = async (req: Request, res: Response) => {
  const input = ProductSchema.parse(req.body);
  res.status(200).json({ success: true, product: await productService.update(idParam(req), input) });
};

export const deleteProduct = async (req: Request, res: Response) => {
  await productService.remove(idParam(req));
  res.status(200).json({ success: true, message: "Product deleted." });
};

export const upload = async (req: Request, res: Response) => {
  if (!req.file) throw new ServiceError(400, "Choose a photo to upload.");
  res.status(201).json({ success: true, ...(await uploadImage(req.file.buffer)) });
};

// ---------------------------------------------------------------- orders

export const orders = async (req: Request, res: Response) => {
  const status = queryText(req, "status") as OrderStatus;
  const payment = queryText(req, "payment") as PaymentStatus;
  const result = await orderService.adminList({
    q: queryText(req, "q"),
    status: ORDER_STATUSES.includes(status) ? status : undefined,
    paymentStatus: PAYMENT_STATUSES.includes(payment) ? payment : undefined,
    page: queryInt(req, "page", 1),
    limit: queryInt(req, "limit", 20, 100),
  });
  res.status(200).json({ success: true, ...result });
};

export const order = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, order: await orderService.adminGet(idParam(req)) });
};

export const updateOrder = async (req: Request, res: Response) => {
  const input = AdminOrderUpdateSchema.parse(req.body);
  res.status(200).json({ success: true, order: await orderService.adminUpdate(idParam(req), input) });
};

export const checkPayment = async (req: Request, res: Response) => {
  res.status(200).json({ success: true, order: await orderService.adminCheckPayment(idParam(req)) });
};

// ---------------------------------------------------------------- customers

export const customers = async (req: Request, res: Response) => {
  const result = await adminService.customers({
    q: queryText(req, "q"),
    page: queryInt(req, "page", 1),
    limit: queryInt(req, "limit", 20, 100),
  });
  res.status(200).json({ success: true, ...result });
};
