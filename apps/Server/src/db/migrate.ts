import { Product } from "../Models/Product";
import { Order } from "../Models/Order";
import { User } from "../Models/User";
import { logger } from "../Utils/logger";

// Brings data from the first version of the app into the current shape. Runs
// on every start; each step only touches documents still in the old shape, so
// running it again changes nothing.

// The first version's category names, as its admin form saved them.
const LEGACY_CATEGORIES: Record<string, string> = {
  smartphones: "smartphones",
  smartphone: "smartphones",
  phones: "smartphones",
  laptops: "laptops",
  laptop: "laptops",
  wearables: "wearables",
  accessories: "accessories",
  gaming: "gaming",
  smarthomes: "smart-home",
  smarthome: "smart-home",
};

// Products: one `image` -> `images`, `isInStock` -> a stock count,
// `specifications` map -> `specs` list, and the new category names.
async function migrateProducts(): Promise<number> {
  const legacy = await Product.collection.find({ images: { $exists: false } }).toArray();
  for (const doc of legacy) {
    const image = doc.image as { url?: string; public_id?: string } | undefined;
    const specifications = (doc.specifications ?? {}) as Record<string, string>;
    const category = LEGACY_CATEGORIES[String(doc.category ?? "").toLowerCase().replace(/[\s_-]/g, "")] ?? "accessories";
    await Product.collection.updateOne(
      { _id: doc._id },
      {
        $set: {
          images: image?.url ? [{ url: image.url, publicId: image.public_id ?? null }] : [],
          // The first version had no stock count; in-stock products start at 20
          // and the admin can correct it.
          stock: doc.isInStock === false ? 0 : 20,
          specs: Object.entries(specifications).map(([label, value]) => ({ label, value: String(value) })),
          category,
          subtitle: "",
          compareAtPrice: null,
          saleEndsAt: null,
          trending: false,
          colors: [],
          storageOptions: [],
          ratingAverage: 0,
          ratingCount: 0,
        },
        $unset: { image: "", isInStock: "", specifications: "" },
      },
    );
  }
  return legacy.length;
}

// Orders: orderStatus -> status, totalAmount -> total (they had no delivery
// fee), and the payment methods the shop still offers.
async function migrateOrders(): Promise<number> {
  const result = await Order.collection.updateMany({ status: { $exists: false }, orderStatus: { $exists: true } }, [
    {
      $set: {
        status: "$orderStatus",
        total: { $ifNull: ["$totalAmount", 0] },
        subtotal: { $ifNull: ["$totalAmount", 0] },
        deliveryFee: 0,
        paymentMethod: { $cond: [{ $eq: ["$paymentMethod", "delivery"] }, "delivery", "paystack"] },
        timeline: [{ status: "pending", at: "$createdAt" }],
        paystackReference: null,
        restockedAt: null,
      },
    },
    { $unset: ["orderStatus", "totalAmount"] },
  ]);
  return result.modifiedCount;
}

// Users: the first version kept reset tokens (JWTs) in plain text.
async function migrateUsers(): Promise<number> {
  const result = await User.collection.updateMany(
    { $or: [{ resetToken: { $exists: true } }, { resetTokenExpiry: { $exists: true } }] },
    { $unset: { resetToken: "", resetTokenExpiry: "" } },
  );
  return result.modifiedCount;
}

export async function runStartupMigrations(): Promise<void> {
  try {
    const [products, orders, users] = [await migrateProducts(), await migrateOrders(), await migrateUsers()];
    if (products || orders || users) logger.info({ products, orders, users }, "Migrated records from the first version");
  } catch (error) {
    // The app works without it; the next start tries again.
    logger.error({ err: error }, "Startup migration failed");
  }
}
