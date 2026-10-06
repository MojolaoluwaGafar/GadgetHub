import { readFileSync } from "fs";
import { join } from "path";
import mongoose from "mongoose";
import { connectDB } from "../config/DB";
import { isCloudinaryConfigured } from "../config/Cloudinary";
import { Product } from "../Models/Product";
import { uploadImage } from "../Services/uploadService";
import type { ProductInput } from "../types/shared";

// A starter catalog, from the products the first version showed as mock data.
// Photos are uploaded to Cloudinary, exactly as the admin form does. Products
// whose name already exists are skipped, so it is safe to run twice.
//
//   npm run seed:catalog
//
// Afterwards, manage everything from the admin (/admin/products).

type SeedProduct = Omit<ProductInput, "images" | "saleEndsAt"> & { photos: string[]; saleDays?: number };

const PRODUCTS: SeedProduct[] = [
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    category: "smartphones",
    subtitle: "256GB • Titanium Gray",
    description:
      "Forged in titanium and featuring the A17 Pro chip, a customisable Action button, and the most powerful iPhone camera system yet. USB-C with USB 3 speeds and all-day battery life.",
    price: 1_850_000,
    compareAtPrice: null,
    stock: 14,
    trending: true,
    colors: [
      { name: "Titanium Gray", hex: "#D6D7D8" },
      { name: "Blue Titanium", hex: "#9EC0FF" },
      { name: "Black Titanium", hex: "#191C1F" },
      { name: "White Titanium", hex: "#FBFDFF" },
    ],
    storageOptions: ["256GB", "512GB", "1TB"],
    specs: [
      { label: "Display", value: "6.7″ Super Retina XDR OLED" },
      { label: "Processor", value: "A17 Pro chip" },
      { label: "RAM", value: "8GB" },
      { label: "Main camera", value: "48MP + 12MP + 12MP" },
      { label: "Front camera", value: "12MP TrueDepth" },
      { label: "Battery", value: "4,422 mAh" },
      { label: "Charging", value: "USB-C, MagSafe, Qi" },
      { label: "Water resistance", value: "IP68" },
      { label: "Weight", value: "221g" },
    ],
    photos: ["iphone-15-pro-max.jpg", "iphone-15-pro-max-2.jpg", "iphone-15-pro-max-3.jpg"],
  },
  {
    name: "PlayStation 5 Slim",
    brand: "Sony",
    category: "gaming",
    subtitle: "Digital Edition • 1TB",
    description: "Next-gen gaming with lightning-fast load times, haptic feedback, adaptive triggers and 3D audio, in a slimmer design.",
    price: 780_000,
    compareAtPrice: null,
    stock: 9,
    trending: true,
    colors: [],
    storageOptions: ["1TB"],
    specs: [
      { label: "Processor", value: "AMD Ryzen Zen 2, 8 cores" },
      { label: "GPU", value: "AMD RDNA 2, 10.3 TFLOPS" },
      { label: "Storage", value: "1TB SSD" },
      { label: "Output", value: "Up to 4K 120Hz" },
    ],
    photos: ["ps5.jpg"],
  },
  {
    name: "Apple Watch Ultra 2",
    brand: "Apple",
    category: "wearables",
    subtitle: "49mm Titanium • GPS + Cellular",
    description: "Built for endurance, exploration and adventure, with the brightest Apple display yet, precision dual-frequency GPS and up to 36 hours of battery.",
    price: 1_250_000,
    compareAtPrice: null,
    stock: 6,
    trending: true,
    colors: [{ name: "Natural Titanium", hex: "#C8C2B6" }],
    storageOptions: [],
    specs: [
      { label: "Display", value: "49mm Always-On Retina, 3,000 nits" },
      { label: "Battery", value: "Up to 36 hours" },
      { label: "Water resistance", value: "100m, EN13319 dive certified" },
    ],
    photos: ["apple-watch-ultra-2.jpg"],
  },
  {
    name: "MacBook Pro 16",
    brand: "Apple",
    category: "laptops",
    subtitle: "M3 Max • 36GB RAM",
    description: "Extreme performance with the M3 Max chip, a Liquid Retina XDR display and up to 22 hours of battery life.",
    price: 5_400_000,
    compareAtPrice: null,
    stock: 4,
    trending: true,
    colors: [
      { name: "Space Black", hex: "#2E2C2F" },
      { name: "Silver", hex: "#E3E4E5" },
    ],
    storageOptions: ["1TB", "2TB"],
    specs: [
      { label: "Processor", value: "Apple M3 Max, 14-core CPU" },
      { label: "Memory", value: "36GB unified memory" },
      { label: "Display", value: "16.2″ Liquid Retina XDR" },
      { label: "Battery", value: "Up to 22 hours" },
    ],
    photos: ["macbook-pro-16.jpg"],
  },
  {
    name: "Samsung Galaxy Watch 6 Classic",
    brand: "Samsung",
    category: "wearables",
    subtitle: "47mm • Rotating bezel",
    description: "A classic design with a rotating bezel, sleep coaching and advanced health tracking.",
    price: 420_000,
    compareAtPrice: null,
    stock: 12,
    trending: true,
    colors: [
      { name: "Black", hex: "#191C1F" },
      { name: "Silver", hex: "#D9D9D9" },
    ],
    storageOptions: [],
    specs: [
      { label: "Display", value: "1.5″ Super AMOLED" },
      { label: "Battery", value: "425 mAh, up to 40 hours" },
    ],
    photos: ["galaxy-watch-6-classic.png"],
  },
  {
    name: "Google Nest Hub Max",
    brand: "Google",
    category: "smart-home",
    subtitle: "10″ display • Smart home hub",
    description: "A smart display to control your whole home, make video calls and show your photos.",
    price: 310_000,
    compareAtPrice: null,
    stock: 7,
    trending: false,
    colors: [{ name: "Chalk", hex: "#F1F1EF" }],
    storageOptions: [],
    specs: [
      { label: "Display", value: "10″ HD touchscreen" },
      { label: "Camera", value: "6.5MP with auto-framing" },
    ],
    photos: ["nest-hub-max.jpg"],
  },
  {
    name: "Sony WH-1000XM5",
    brand: "Sony",
    category: "accessories",
    subtitle: "Noise cancelling • 30h battery",
    description: "Industry-leading noise cancellation, exceptional call quality and 30 hours of battery.",
    price: 520_000,
    compareAtPrice: null,
    stock: 15,
    trending: true,
    colors: [
      { name: "Black", hex: "#191C1F" },
      { name: "Silver", hex: "#D8D6D1" },
    ],
    storageOptions: [],
    specs: [
      { label: "Battery", value: "Up to 30 hours" },
      { label: "Charging", value: "USB-C, 3 min for 3 hours" },
      { label: "Weight", value: "250g" },
    ],
    photos: ["sony-wh-1000xm5.jpg"],
  },
  {
    name: "AirPods Pro (2nd generation)",
    brand: "Apple",
    category: "accessories",
    subtitle: "USB-C • Adaptive Audio",
    description: "Up to twice the active noise cancellation, Adaptive Audio and a USB-C MagSafe case.",
    price: 380_000,
    compareAtPrice: null,
    stock: 20,
    trending: true,
    colors: [],
    storageOptions: [],
    specs: [
      { label: "Battery", value: "Up to 6 hours (30 with case)" },
      { label: "Water resistance", value: "IP54" },
    ],
    photos: ["airpods-pro-2.jpg"],
  },
  {
    name: "Dell XPS 15",
    brand: "Dell",
    category: "laptops",
    subtitle: "Core i7 • 16GB RAM • 512GB",
    description: "A reliable performance laptop for work and creativity, with a 15.6″ InfinityEdge display.",
    price: 2_300_000,
    compareAtPrice: null,
    stock: 5,
    trending: false,
    colors: [{ name: "Platinum Silver", hex: "#C9CBCD" }],
    storageOptions: ["512GB", "1TB"],
    specs: [
      { label: "Processor", value: "Intel Core i7-13700H" },
      { label: "Memory", value: "16GB DDR5" },
      { label: "Display", value: "15.6″ FHD+" },
    ],
    photos: ["dell-xps-15.png"],
  },
  {
    name: "iPhone 15 Clear Case with MagSafe",
    brand: "Apple",
    category: "accessories",
    subtitle: "Clear • MagSafe",
    description: "A thin, clear case that shows off your iPhone and snaps onto MagSafe chargers.",
    price: 45_000,
    compareAtPrice: null,
    stock: 40,
    trending: false,
    colors: [],
    storageOptions: [],
    specs: [],
    photos: ["iphone-case.png"],
  },
  {
    name: "Oraimo FlipBuds Pro",
    brand: "Oraimo",
    category: "accessories",
    subtitle: "ANC • 40h playtime",
    description: "True wireless earbuds with active noise cancellation and up to 40 hours of playtime with the case.",
    price: 38_000,
    compareAtPrice: 52_000,
    stock: 30,
    trending: false,
    colors: [],
    storageOptions: [],
    specs: [{ label: "Battery", value: "Up to 40 hours with case" }],
    photos: ["oraimo-flipbuds-pro.png"],
    saleDays: 10,
  },
  {
    name: "Samsung Galaxy Buds 2 Pro (Black)",
    brand: "Samsung",
    category: "accessories",
    subtitle: "Graphite • Hi-Fi 24-bit audio",
    description: "Intelligent ANC, 360 audio and a comfortable, ergonomic fit.",
    price: 145_000,
    compareAtPrice: 185_000,
    stock: 11,
    trending: false,
    colors: [],
    storageOptions: [],
    specs: [{ label: "Battery", value: "Up to 29 hours with case" }],
    photos: ["galaxy-buds-2-pro-black.jpg"],
    saleDays: 10,
  },
  {
    name: "Samsung Galaxy Buds 2 Pro (White)",
    brand: "Samsung",
    category: "accessories",
    subtitle: "White • Hi-Fi 24-bit audio",
    description: "Intelligent ANC, 360 audio and a comfortable, ergonomic fit.",
    price: 145_000,
    compareAtPrice: 185_000,
    stock: 8,
    trending: false,
    colors: [],
    storageOptions: [],
    specs: [{ label: "Battery", value: "Up to 29 hours with case" }],
    photos: ["galaxy-buds-2-pro-white.jpg"],
    saleDays: 10,
  },
  {
    name: "Wireless RGB Gaming Mouse",
    brand: "Logitech",
    category: "gaming",
    subtitle: "USB-C • RGB lighting",
    description: "A lightweight wireless mouse with a 25K sensor, RGB lighting and USB-C charging.",
    price: 65_000,
    compareAtPrice: 85_000,
    stock: 18,
    trending: false,
    colors: [],
    storageOptions: [],
    specs: [{ label: "Sensor", value: "25,600 DPI" }],
    photos: ["wireless-mouse.jpg"],
    saleDays: 10,
  },
  {
    name: "20,000mAh Power Bank",
    brand: "Oraimo",
    category: "accessories",
    subtitle: "22.5W fast charge • 3 ports",
    description: "Charges a phone four to five times over, with fast charging and three outputs.",
    price: 28_000,
    compareAtPrice: 36_000,
    stock: 25,
    trending: false,
    colors: [],
    storageOptions: [],
    specs: [{ label: "Capacity", value: "20,000 mAh" }],
    photos: ["power-bank.jpg"],
    saleDays: 10,
  },
];

async function main() {
  if (!isCloudinaryConfigured()) throw new Error("Set the Cloudinary keys first: the photos are uploaded there.");
  await connectDB();

  let created = 0;
  for (const { photos, saleDays, ...product } of PRODUCTS) {
    if (await Product.exists({ name: product.name })) continue;
    const images = [];
    for (const photo of photos) {
      images.push(await uploadImage(readFileSync(join(__dirname, "images", photo))));
    }
    await Product.create({
      ...product,
      images,
      saleEndsAt: saleDays ? new Date(Date.now() + saleDays * 86_400_000) : null,
    });
    created += 1;
    console.log(`Added ${product.name}`);
  }
  console.log(`${created} products added, ${PRODUCTS.length - created} already there.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
