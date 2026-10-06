import { lazy, type ComponentType } from "react";

const RELOAD_KEY = "chunkReloadAt";

// React.lazy for route-level pages, with one safety net. Each deploy gives the
// page chunks new file names and removes the old ones, so someone who had the
// app open before a deploy gets a failed import the next time they open a
// page. We reload once to fetch the new build; if that already happened in the
// last minute, the error is real and is passed on.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyPage<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      const page = await load();
      safeStorage(() => sessionStorage.removeItem(RELOAD_KEY));
      return page;
    } catch (error) {
      const last = Number(safeStorage(() => sessionStorage.getItem(RELOAD_KEY)) ?? 0);
      if (Date.now() - last > 60_000) {
        safeStorage(() => sessionStorage.setItem(RELOAD_KEY, String(Date.now())));
        window.location.reload();
        // Keep Suspense showing its fallback while the page reloads.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }
  });
}

// Storage can be blocked (private mode); the reload guard is a nicety.
function safeStorage<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}
