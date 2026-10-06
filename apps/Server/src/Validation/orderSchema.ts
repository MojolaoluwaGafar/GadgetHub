import { z } from "zod";
import { emailSchema, nameSchema, objectIdSchema, phoneSchema, text } from "./common";

export const PlaceOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: objectIdSchema,
          quantity: z.number().int().min(1, "Quantity must be at least 1.").max(20, "You can order at most 20 of one item."),
          color: z.string().trim().max(30).nullable().default(null),
          storage: z.string().trim().max(20).nullable().default(null),
        }),
      )
      .min(1, "Your cart is empty.")
      .max(30, "That's a lot of items for one order. Please split it."),
    customer: z.object({
      firstName: nameSchema("first name"),
      lastName: nameSchema("last name"),
      email: emailSchema,
      phone: phoneSchema,
      address: z.string().trim().max(200).default(""),
      city: z.string().trim().max(60).default(""),
      state: z.string().trim().max(60).default(""),
    }),
    deliveryMethod: z.enum(["doorstep", "pickup"], { error: "Choose how to get your order." }),
    paymentMethod: z.enum(["paystack", "delivery"], { error: "Choose how to pay." }),
    saveAddress: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.deliveryMethod !== "doorstep") return;
    const { address, city, state } = value.customer;
    if (address.length < 5) ctx.addIssue({ code: "custom", message: "Enter your delivery address.", path: ["customer", "address"] });
    if (!state) ctx.addIssue({ code: "custom", message: "Pick your state.", path: ["customer", "state"] });
    if (!city) ctx.addIssue({ code: "custom", message: "Pick your city.", path: ["customer", "city"] });
  });

export type PlaceOrderParsed = z.infer<typeof PlaceOrderSchema>;

export const AdminOrderUpdateSchema = z
  .object({
    status: z.enum(["pending", "processing", "shipped", "delivered", "cancelled"]).optional(),
    paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
  })
  .refine((value) => value.status || value.paymentStatus, "Nothing to update.");

export const VerifyPaymentSchema = z.object({
  reference: text("payment reference", 100),
});

export const ReviewSchema = z.object({
  rating: z.number({ error: "Pick a star rating." }).int().min(1, "Pick a star rating.").max(5),
  title: text("title", 80, 2),
  body: text("review", 1500, 10),
});
