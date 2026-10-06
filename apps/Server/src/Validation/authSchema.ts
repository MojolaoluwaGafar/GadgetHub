import { z } from "zod";
import { emailSchema, nameSchema, passwordSchema, phoneSchema, text } from "./common";

export const RegisterSchema = z.object({
  firstName: nameSchema("first name"),
  lastName: nameSchema("last name"),
  email: emailSchema,
  phoneNumber: phoneSchema,
  password: passwordSchema,
});

export const LoginSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Enter your password." }).min(1, "Enter your password."),
});

export const ForgotSchema = z.object({ email: emailSchema });

export const ResetSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/, "This reset link isn't valid. Ask for a new one."),
  password: passwordSchema,
});

export const ProfileSchema = z.object({
  firstName: nameSchema("first name"),
  lastName: nameSchema("last name"),
  phoneNumber: phoneSchema,
});

export const PasswordSchema = z.object({
  currentPassword: z.string({ error: "Enter your current password." }).min(1, "Enter your current password."),
  newPassword: passwordSchema,
});

export const DeleteAccountSchema = z.object({
  password: z.string({ error: "Enter your password to confirm." }).min(1, "Enter your password to confirm."),
});

export const AddressSchema = z.object({
  label: z.string().trim().max(30, "Keep the label short.").optional().default("Home"),
  address: text("street address", 200, 5),
  city: text("city", 60),
  state: text("state", 60),
  isDefault: z.boolean().optional(),
});
