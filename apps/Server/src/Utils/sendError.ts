import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { isServiceError } from "../Services/errors";
import { logger } from "./logger";

// The JSON error shape used by every route:
// { success: false, message, errors?: [{ field, message }] }.
// Expected failures (ServiceError, invalid input) keep their status; anything
// else is logged and becomes a 500 without internal details.
export function sendError(req: Request, res: Response, error: unknown) {
  if (isServiceError(error)) {
    return res.status(error.status).json({
      success: false,
      message: error.message,
      ...(error.field ? { errors: [{ field: error.field, message: error.message }] } : {}),
    });
  }

  if (error instanceof ZodError) return sendValidationError(res, error);

  if (error instanceof MulterError) {
    const message = error.code === "LIMIT_FILE_SIZE" ? "That photo is too large. The limit is 5 MB." : "That upload didn't work.";
    return res.status(400).json({ success: false, message });
  }

  // A malformed JSON body (express.json() marks these with `body`).
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({ success: false, message: "The request couldn't be read." });
  }

  logger.error({ err: error }, `${req.method} ${req.originalUrl} failed`);
  return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
}

export function sendValidationError(res: Response, error: ZodError) {
  const errors = error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
  return res.status(400).json({ success: false, message: errors[0]?.message ?? "Please check the form.", errors });
}

// Express 5 passes errors thrown in async handlers here, so controllers don't
// need their own try/catch.
export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;
  sendError(req, res, error);
}
