import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/Auth";
import { PlaceOrderSchema, VerifyPaymentSchema } from "../Validation/orderSchema";
import { idParam } from "../Utils/params";
import { returnBase } from "../config/origins";
import { logger } from "../Utils/logger";
import * as orderService from "../Services/orderService";
import * as paystack from "../Services/paystackService";

export const place = async (req: AuthRequest, res: Response) => {
  const input = PlaceOrderSchema.parse(req.body);
  res.status(201).json({ success: true, ...(await orderService.place(req.user!.id, input, returnBase(req.headers.origin))) });
};

export const mine = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, orders: await orderService.listMine(req.user!.id) });
};

export const detail = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, order: await orderService.getMine(req.user!.id, idParam(req)) });
};

export const cancel = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, order: await orderService.cancelMine(req.user!.id, idParam(req)) });
};

export const pay = async (req: AuthRequest, res: Response) => {
  const paymentUrl = await orderService.retryPayment(req.user!.id, idParam(req), returnBase(req.headers.origin));
  res.status(200).json({ success: true, paymentUrl });
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  const { reference } = VerifyPaymentSchema.parse(req.body);
  res.status(200).json({ success: true, order: await orderService.verifyPayment(req.user!.id, reference) });
};

// Paystack calls this after each event. It answers 200 quickly whatever
// happens to the order, or Paystack keeps retrying; problems are logged.
export const paystackWebhook = async (req: Request, res: Response) => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!paystack.isValidSignature(rawBody, req.headers["x-paystack-signature"] as string | undefined)) {
    logger.warn("Paystack webhook with a bad signature");
    return res.sendStatus(401);
  }
  try {
    await orderService.handleWebhook(req.body);
  } catch (error) {
    logger.error({ err: error }, "Paystack webhook failed");
  }
  res.sendStatus(200);
};
