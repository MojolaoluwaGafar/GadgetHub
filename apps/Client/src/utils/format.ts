// Joins class names, skipping false/null/undefined.
export const cx = (...classes: (string | false | null | undefined)[]): string => classes.filter(Boolean).join(" ");

const nairaFormat = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 });

// "₦1,200,000".
export const naira = (amount: number) => nairaFormat.format(amount);

export const plural = (count: number, word: string, many = `${word}s`) => `${count.toLocaleString()} ${count === 1 ? word : many}`;

// "6 Oct 2026".
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });

// "6 Oct 2026, 14:05".
export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

// "Tuesday, 8 October".
export const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" });

// How much is saved on a sale, as a whole percentage.
export const percentOff = (price: number, compareAtPrice: number | null) =>
  compareAtPrice && compareAtPrice > price ? Math.round((1 - price / compareAtPrice) * 100) : 0;

// Initials for the avatar circle: "Ada Obi" -> "AO".
export const initials = (...names: (string | null | undefined)[]) =>
  names
    .map((name) => name?.trim()[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
