import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"] as const;

// Orders keep a copy of each item's name, photo and price, so they read the
// same after a product changes or is deleted. Orders from the first version
// (orderStatus, totalAmount) are converted by db/migrate.ts.
const orderSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orderNumber: { type: String, required: true, unique: true },
    customer: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
    },
    items: [
      {
        _id: false,
        productId: String,
        name: String,
        image: { type: String, default: null },
        price: Number,
        quantity: Number,
        color: { type: String, default: null },
        storage: { type: String, default: null },
      },
    ],
    deliveryMethod: { type: String, enum: ["doorstep", "pickup"], required: true },
    paymentMethod: { type: String, enum: ["paystack", "delivery"], required: true },
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    status: { type: String, enum: ORDER_STATUSES, default: "pending" },
    timeline: { type: [{ _id: false, status: { type: String, enum: ORDER_STATUSES }, at: Date }], default: [] },
    // The latest Paystack transaction for this order.
    paystackReference: { type: String, default: null },
    paidAt: { type: Date, default: null },
    deliveryDate: { type: Date, default: null },
    // Set when the items went back into stock, so it only happens once.
    restockedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ paystackReference: 1 }, { sparse: true });

export type OrderFields = InferSchemaType<typeof orderSchema>;
export type OrderDoc = HydratedDocument<OrderFields>;

export const Order = model("Order", orderSchema);
