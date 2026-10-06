import { z } from "zod";
import { isValidObjectId } from "mongoose";

// Mirrors Category in packages/shared.
export const CATEGORIES = ["smartphones", "laptops", "wearables", "gaming", "accessories", "smart-home"] as const;

export const categorySchema = z.enum(CATEGORIES, { error: "Pick a category." });

export const objectIdSchema = z.string().refine((value) => isValidObjectId(value), "Not found.");

export const emailSchema = z
  .string({ error: "Enter your email address." })
  .trim()
  .toLowerCase()
  .pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string({ error: "Enter a password." })
  .min(8, "Use at least 8 characters.")
  .max(128, "Use at most 128 characters.");

export const nameSchema = (label: string) =>
  z
    .string({ error: `Enter your ${label}.` })
    .trim()
    .min(1, `Enter your ${label}.`)
    .max(50, `Your ${label} can be at most 50 characters.`);

// Nigerian numbers in any common format: 0803..., +234 803..., 234803...
export const phoneSchema = z
  .string({ error: "Enter your phone number." })
  .trim()
  .regex(/^\+?[\d\s()-]{10,20}$/, "Enter a valid phone number.");

export const text = (label: string, max: number, min = 1) =>
  z
    .string({ error: `Enter the ${label}.` })
    .trim()
    .min(min, min === 1 ? `Enter the ${label}.` : `The ${label} needs at least ${min} characters.`)
    .max(max, `The ${label} can be at most ${max} characters.`);

// Naira amounts: whole numbers, up to ₦100 million.
export const nairaSchema = (label: string) =>
  z.coerce
    .number({ error: `Enter the ${label}.` })
    .int(`The ${label} must be a whole number of naira.`)
    .min(0, `The ${label} can't be negative.`)
    .max(100_000_000, `That ${label} looks too large.`);
