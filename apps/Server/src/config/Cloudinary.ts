import { v2 as cloudinary } from "cloudinary";
import { env } from "./env";

const cloudName = env.cloudName();

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  secure: true,
});

export const isCloudinaryConfigured = () =>
  Boolean(cloudName && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Product photos must come from our own Cloudinary account, so a product can't
// point at an arbitrary site (tracking pixels, hotlinked images that vanish).
export const isOwnImageUrl = (url: string) =>
  cloudName ? url.startsWith(`https://res.cloudinary.com/${cloudName}/`) : /^https:\/\//.test(url);

export default cloudinary;
