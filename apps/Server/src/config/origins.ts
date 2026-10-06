import { clientUrl } from "./env";

// Browser origins allowed to call the API: CLIENT_URL (or the first version's
// FRONTEND_URL) and CORS_ORIGINS (comma separated), localhost for
// development, and the Vercel site with its preview deployments. A bare host
// ("gadgethub.example.com") gets https:// added.
const withScheme = (origin: string) => (/^https?:\/\//i.test(origin) ? origin : `https://${origin}`);

const configuredOrigins = () =>
  [process.env.CORS_ORIGINS || "", clientUrl()]
    .join(",")
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean)
    .map(withScheme);

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  const local = ["http://localhost:5173", "http://localhost:4173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"];
  if ([...configuredOrigins(), ...local].includes(origin)) return true;

  // Phones on the same Wi-Fi testing the dev server (http://192.168.x.x:5173).
  if (process.env.NODE_ENV !== "production" && /^http:\/\/(192\.168|10)\.\d+\.\d+(\.\d+)?:\d+$/.test(origin)) return true;

  return /^https:\/\/gadget-hub(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
}

// Where to send a shopper back to after paying: the site they ordered from
// (so a local test returns to localhost), else the public site.
export const returnBase = (origin: string | undefined) => (origin && isAllowedOrigin(origin) ? origin : clientUrl());
