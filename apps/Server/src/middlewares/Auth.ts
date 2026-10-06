import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "../types/shared";
import { env } from "../config/env";
import { User } from "../Models/User";

export interface JWTPayLoad {
  id: string;
  /** The account's tokenVersion when this login was issued. */
  v?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const jwtSecret = (): string => {
  const secret = env.jwtSecret();
  if (!secret) throw new Error("JWT_SECRET_KEY is not defined");
  return secret;
};

// Returns the signed-in user for a request, or null. The account is looked up
// every time, so a login stops working when the account is deleted, its
// password changes (which bumps tokenVersion) or its role changes. The first
// version trusted the role written into the token.
async function readUser(req: Request): Promise<AuthUser | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  let decoded: JWTPayLoad;
  try {
    decoded = jwt.verify(header.slice(7), jwtSecret()) as unknown as JWTPayLoad;
  } catch {
    return null;
  }

  const user = await User.findById(decoded.id).select("email role tokenVersion").lean();
  if (!user || (user.tokenVersion ?? 0) !== (decoded.v ?? 0)) return null;
  return { id: String(user._id), email: user.email, role: (user.role ?? "user") as Role };
}

// 401 tells the client to sign out and show the login page.
export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await readUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Please sign in to continue." });
  req.user = user;
  next();
};

export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = await readUser(req);
  if (!user) return res.status(401).json({ success: false, message: "Please sign in to continue." });
  if (user.role !== "admin") return res.status(403).json({ success: false, message: "Only admins can do that." });
  req.user = user;
  next();
};

// For public pages that show more to a signed-in viewer (whether they can
// review a product). A missing or stale login just means "anonymous".
export const optionalAuth = async (req: AuthRequest, _res: Response, next: NextFunction) => {
  req.user = (await readUser(req)) ?? undefined;
  next();
};
