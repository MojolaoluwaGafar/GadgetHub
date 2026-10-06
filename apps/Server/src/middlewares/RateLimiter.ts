import rateLimit from "express-rate-limit";

const limiter = (windowMinutes: number, limit: number, message: string) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message },
  });

// A generous ceiling for everything under /api, mostly to slow down scrapers.
export const apiLimiter = limiter(1, 300, "Too many requests. Please slow down.");

// Password guessing and account creation.
export const authLimiter = limiter(15, 20, "Too many attempts. Try again in 15 minutes.");

// Reset emails: stops someone flooding an inbox.
export const resetLimiter = limiter(15, 5, "Too many reset requests. Try again in 15 minutes.");

// Placing orders reserves stock and sends emails.
export const orderLimiter = limiter(60, 30, "You've placed a lot of orders. Please wait a while before placing more.");

// Product photos use Cloudinary storage.
export const uploadLimiter = limiter(60, 120, "Too many uploads. Please wait a while.");
