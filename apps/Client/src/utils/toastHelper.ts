import { toast } from "react-toastify";

let lastToast = { message: "", at: 0 };

// Shows a toast, ignoring an identical one fired within `windowMs` (a double
// tap on a button should not stack two).
export const showToast = (
  message: string,
  type: "success" | "error" | "info" | "warn" = "success",
  windowMs = 700
) => {
  const now = Date.now();
  if (message === lastToast.message && now - lastToast.at < windowMs) return;
  lastToast = { message, at: now };
  toast[type](message);
};
