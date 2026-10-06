import dotenv from "dotenv";
dotenv.config({ quiet: true });

// Settings read in more than one place. The live Render service was set up for
// the first version, so each also accepts that version's name for it
// (MONGO_URL, JWT_SECRET, FRONTEND_URL, CLOUD_NAME).

const read = (...names: string[]) => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return undefined;
};

export const env = {
  mongoUri: () => read("MONGO_URI", "MONGO_URL"),
  jwtSecret: () => read("JWT_SECRET_KEY", "JWT_SECRET"),
  cloudName: () => read("CLOUDINARY_CLOUD_NAME", "CLOUD_NAME"),
  paystackSecret: () => read("PAYSTACK_SECRET_KEY"),
  // Doorstep delivery fee in naira. Pickup is free.
  deliveryFee: () => Number(read("DELIVERY_FEE") ?? 3000),
};

// The web app's public URL, without a trailing slash, for links in emails and
// Paystack's return address. A bare host gets https:// added.
export const clientUrl = () => {
  const url = read("CLIENT_URL", "FRONTEND_URL")?.replace(/\/+$/, "");
  if (!url) return "https://gadget-hub-psi.vercel.app";
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
};
