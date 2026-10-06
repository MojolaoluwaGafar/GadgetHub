import { removeKey } from "./storage";

export const TOKEN_KEY = "gadgethub.authToken";
export const USER_KEY = "gadgethub.user";

// The first version stored these under plain "token" and "user", with mock
// product ids in "cart", "likes" and "recentlyViewed" that no longer exist.
export const LEGACY_KEYS = ["token", "user", "cart", "likes", "recentlyViewed"];

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearAuth(): void {
  removeKey(TOKEN_KEY);
  removeKey(USER_KEY);
}
