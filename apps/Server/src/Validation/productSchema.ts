import { z } from "zod";
import { categorySchema, nairaSchema, text } from "./common";

const imageSchema = z.object({
  url: z.url("Upload the photo again."),
  publicId: z.string().max(200).nullable(),
});

// Only these fields can be set by the admin form; ratings and timestamps are
// the server's.
export const ProductSchema = z
  .object({
    name: text("product name", 100, 2),
    brand: text("brand", 40),
    category: categorySchema,
    subtitle: z.string().trim().max(80, "Keep the short description under 80 characters.").default(""),
    description: z.string().trim().max(2000, "Keep the description under 2,000 characters.").default(""),
    price: nairaSchema("price").refine((value) => value > 0, "Enter the price."),
    compareAtPrice: nairaSchema("original price").nullable().default(null),
    saleEndsAt: z.iso.datetime({ error: "Pick a valid end date." }).nullable().default(null),
    stock: z.coerce
      .number({ error: "Enter how many are in stock." })
      .int("Stock must be a whole number.")
      .min(0, "Stock can't be negative.")
      .max(100_000, "That stock level looks too large."),
    trending: z.boolean().default(false),
    images: z.array(imageSchema).min(1, "Add at least one photo.").max(6, "Use at most 6 photos."),
    colors: z
      .array(
        z.object({
          name: text("colour name", 30),
          hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a colour."),
        }),
      )
      .max(10, "Use at most 10 colours.")
      .default([]),
    storageOptions: z.array(text("storage option", 20)).max(8, "Use at most 8 storage options.").default([]),
    specs: z
      .array(z.object({ label: text("spec name", 40), value: text("spec value", 120) }))
      .max(30, "Use at most 30 specifications.")
      .default([]),
  })
  .refine((value) => value.compareAtPrice === null || value.compareAtPrice > value.price, {
    message: "The original price must be higher than the selling price.",
    path: ["compareAtPrice"],
  });

export type ProductInputParsed = z.infer<typeof ProductSchema>;
