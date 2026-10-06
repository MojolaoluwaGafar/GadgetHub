import { useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { ShoppingCart, Trash2, X } from "lucide-react";
import { useCart } from "../Context/CartContext";
import { naira } from "../utils/format";
import { EmptyState, QuantityStepper } from "./index";
import Button from "./Button";

// The cart, sliding in from the right when the header's cart icon is clicked.
export default function CartDrawer() {
  const { items, count, subtotal, setQuantity, remove, drawerOpen, setDrawerOpen } = useCart();
  const navigate = useNavigate();
  const close = () => setDrawerOpen(false);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen, setDrawerOpen]);

  if (!drawerOpen) return null;
  const go = (to: string) => {
    close();
    navigate(to);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/50 motion-safe:animate-fade-in" onMouseDown={close}>
      <aside
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-float motion-safe:animate-slide-in"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-semibold">
            Shopping Cart <span className="text-muted">({count})</span>
          </h2>
          <button type="button" onClick={close} className="-mr-2 rounded-md p-2 text-muted hover:bg-panel hover:text-ink" aria-label="Close cart">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart />}
            title="Your cart is empty!"
            text="Browse all categories and discover our new arrivals."
            action={<Button onClick={() => go("/products")}>Start shopping</Button>}
          />
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
              {items.map((item) => (
                <li key={item.key} className="flex gap-3 py-4">
                  <Link to={`/product/${item.productId}`} onClick={close} className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-panel">
                    {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link to={`/product/${item.productId}`} onClick={close} className="line-clamp-2 text-sm font-medium hover:text-brand">
                        {item.name}
                      </Link>
                      <button type="button" onClick={() => remove(item.key)} className="text-danger/80 hover:text-danger" aria-label={`Remove ${item.name}`}>
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                    {(item.color || item.storage) && <p className="text-xs text-muted">{[item.color, item.storage].filter(Boolean).join(" • ")}</p>}
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityStepper size="sm" value={item.quantity} max={Math.min(item.stock, 20)} onChange={(n) => setQuantity(item.key, n)} />
                      <span className="text-sm font-semibold">{naira(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-3 border-t border-line px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Sub-Total:</span>
                <span className="font-semibold">{naira(subtotal)}</span>
              </div>
              <Button block onClick={() => go("/checkout")}>
                Checkout Now
              </Button>
              <Button block variant="outline" onClick={() => go("/cart")}>
                View Cart
              </Button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
