import type { UploadApiResponse } from "cloudinary";
import type { UploadResponse } from "../types/shared";
import cloudinary, { isCloudinaryConfigured } from "../config/Cloudinary";
import { logger } from "../Utils/logger";
import { ServiceError } from "./errors";

const FOLDER = "gadgethub/products";
// Where the first version's uploads went, so their photos can be cleaned up too.
const LEGACY_FOLDER = "gadgetHub/uploads";

// Streams the photo to Cloudinary. Cloudinary shrinks it to at most 1600px and
// picks the best format per browser.
export async function uploadImage(buffer: Buffer): Promise<UploadResponse> {
  if (!isCloudinaryConfigured()) throw new ServiceError(503, "Photo uploads aren't set up yet (Cloudinary keys missing).");

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: "image",
        transformation: [{ width: 1600, height: 1600, crop: "limit" }],
      },
      (error, response) => (error || !response ? reject(error ?? new Error("Empty Cloudinary response")) : resolve(response)),
    );
    stream.end(buffer);
  });

  // f_auto,q_auto in the delivery URL: WebP/AVIF where supported, sensible quality.
  const url = result.secure_url.replace("/image/upload/", "/image/upload/f_auto,q_auto/");
  return { url, publicId: result.public_id };
}

// Best effort: a photo left behind in Cloudinary costs a little storage, which
// is no reason to fail deleting a product.
export async function deleteImage(publicId: string | null | undefined): Promise<void> {
  if (!publicId || !(publicId.startsWith(FOLDER) || publicId.startsWith(LEGACY_FOLDER)) || !isCloudinaryConfigured()) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.warn({ err: error, publicId }, "Could not delete image from Cloudinary");
  }
}
