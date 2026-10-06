import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Stored, not looked up, so a review still has a name after its author
    // deletes their account.
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

// One review per customer per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, createdAt: -1 });

export type ReviewFields = InferSchemaType<typeof reviewSchema>;
export type ReviewDoc = HydratedDocument<ReviewFields>;

export const Review = model("Review", reviewSchema);
