import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem, ProductSummary } from "../types";
import { productService } from "../API/services/productService";
import { readJson, writeJson } from "../utils/storage";
import { showToast } from "../utils/toastHelper";
import { naira } from "../utils/format";

const CART_KEY = "gadgethub.cart";

export type AddToCart = Omit<CartItem, "key" | "quantity"> & { quantity?: number };

interface CartContextType {
  items: CartItem[];
  /** Units across every line, for the header badge. */
  count: number;
  subtotal: number;
  add: (item: AddToCart) => void;
  setQuantity: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Re-reads prices and stock from the API. Returns what changed, for a notice. */
  refresh: () => Promise<string[]>;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | null>(null);

const keyOf = (item: { productId: string; color: string | null; storage: string | null }) =>
  [item.productId, item.color ?? "", item.storage ?? ""].join("|");

// What the add-to-cart buttons on cards send.
export const cartItemFrom = (product: ProductSummary): AddToCart => ({
  productId: product.id,
  name: product.name,
  image: product.image,
  price: product.price,
  color: null,
  storage: null,
  stock: product.stock,
});

// The cart lives in the browser (no account needed to fill it). Prices shown
// here are a guide: the server prices the order from the database, and the
// cart and checkout pages refresh prices and stock before ordering.
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => readJson<CartItem[]>(CART_KEY, []));
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => writeJson(CART_KEY, items), [items]);

  // Another tab changed the cart.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY) setItems(readJson<CartItem[]>(CART_KEY, []));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const add = useCallback((item: AddToCart) => {
    if (item.stock <= 0) {
      showToast(`${item.name} is out of stock`, "error");
      return;
    }
    const key = keyOf(item);
    const wanted = item.quantity ?? 1;
    setItems((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, ...item, key, quantity: Math.min(line.quantity + wanted, item.stock, 20) } : line,
        );
      }
      return [...current, { ...item, key, quantity: Math.min(wanted, item.stock, 20) }];
    });
    showToast(`${item.name} added to cart`);
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    setItems((current) =>
      current.flatMap((line) => {
        if (line.key !== key) return [line];
        if (quantity <= 0) return [];
        return [{ ...line, quantity: Math.min(quantity, Math.max(line.stock, 1), 20) }];
      }),
    );
  }, []);

  const remove = useCallback((key: string) => setItems((current) => current.filter((line) => line.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  const refresh = useCallback(async () => {
    const current = readJson<CartItem[]>(CART_KEY, []);
    if (!current.length) return [];
    const products = new Map((await productService.byIds([...new Set(current.map((line) => line.productId))])).map((p) => [p.id, p]));
    const notes: string[] = [];
    const next = current.flatMap((line) => {
      const product = products.get(line.productId);
      if (!product) {
        notes.push(`${line.name} isn't sold anymore and was removed.`);
        return [];
      }
      if (product.stock <= 0) {
        notes.push(`${product.name} is out of stock and was removed.`);
        return [];
      }
      if (product.price !== line.price) notes.push(`${product.name} is now ${naira(product.price)}.`);
      if (line.quantity > product.stock) notes.push(`Only ${product.stock} ${product.name} left; your quantity was lowered.`);
      return [{ ...line, name: product.name, image: product.image, price: product.price, stock: product.stock, quantity: Math.min(line.quantity, product.stock) }];
    });
    setItems(next);
    return notes;
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);
    return { items, count, subtotal, add, setQuantity, remove, clear, refresh, drawerOpen, setDrawerOpen };
  }, [items, add, setQuantity, remove, clear, refresh, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
