import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { readJson, writeJson } from "../utils/storage";
import { showToast } from "../utils/toastHelper";

const WISHLIST_KEY = "gadgethub.wishlist";
const RECENT_KEY = "gadgethub.recentlyViewed";

interface WishlistContextType {
  /** Product ids, newest first. */
  ids: string[];
  has: (id: string) => boolean;
  toggle: (id: string, name: string) => void;
  remove: (id: string) => void;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

// Saved in the browser as product ids; the wishlist page loads the products,
// so prices and stock there are always current.
export function WishlistProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => readJson<string[]>(WISHLIST_KEY, []));

  useEffect(() => writeJson(WISHLIST_KEY, ids), [ids]);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string, name: string) => {
      if (ids.includes(id)) {
        setIds((current) => current.filter((existing) => existing !== id));
        showToast(`${name} removed from your wishlist`, "info");
      } else {
        setIds((current) => [id, ...current.filter((existing) => existing !== id)].slice(0, 48));
        showToast(`${name} saved to your wishlist`);
      }
    },
    [ids],
  );

  const remove = useCallback((id: string) => setIds((current) => current.filter((existing) => existing !== id)), []);

  const value = useMemo(() => ({ ids, has, toggle, remove }), [ids, has, toggle, remove]);
  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) throw new Error("useWishlist must be used inside WishlistProvider");
  return context;
}

// Recently viewed products, newest first (shown on the cart page).
export const recentlyViewed = {
  ids: () => readJson<string[]>(RECENT_KEY, []),
  add: (id: string) => writeJson(RECENT_KEY, [id, ...readJson<string[]>(RECENT_KEY, []).filter((existing) => existing !== id)].slice(0, 8)),
};
