import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";
import { CATEGORIES } from "../Validation/common";

// Products added in the first version stored one `image`, an `isInStock` flag
// and a `specifications` map; db/migrate.ts converts them to these fields.
const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: { type: String, required: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
    subtitle: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null },
    saleEndsAt: { type: Date, default: null },
    stock: { type: Number, default: 0, min: 0 },
    trending: { type: Boolean, default: false },
    images: {
      type: [{ _id: false, url: { type: String, required: true }, publicId: { type: String, default: null } }],
      default: [],
    },
    colors: { type: [{ _id: false, name: String, hex: String }], default: [] },
    storageOptions: { type: [String], default: [] },
    specs: { type: [{ _id: false, label: String, value: String }], default: [] },
    // Kept up to date by reviewService, so lists can sort by rating.
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, createdAt: -1 });
productSchema.index({ trending: 1, createdAt: -1 });

export type ProductFields = InferSchemaType<typeof productSchema>;
export type ProductDoc = HydratedDocument<ProductFields>;

export const Product = model("Product", productSchema);
