import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const addressSchema = new Schema({
  label: { type: String, default: "Home", trim: true },
  address: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  isDefault: { type: Boolean, default: false },
});

// Field names match the first version of the app, so its accounts carry over.
const userSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    // bcrypt hash.
    password: { type: String, required: true, select: false },
    addresses: { type: [addressSchema], default: [] },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    // Bumped when the password changes or is reset: older logins stop working.
    tokenVersion: { type: Number, default: 0 },
    // SHA-256 of the emailed reset token, never the token itself.
    resetTokenHash: { type: String, select: false },
    resetTokenExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

export type UserFields = InferSchemaType<typeof userSchema>;
export type UserDoc = HydratedDocument<UserFields>;

export const User = model("User", userSchema);
