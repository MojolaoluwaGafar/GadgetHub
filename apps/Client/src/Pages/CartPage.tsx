import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../Context/CartContext";
import { recentlyViewed } from "../Context/WishlistContext";
import { productService } from "../API/services/productService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { EmptyState, Notice, QuantityStepper } from "../Components";
import { ProductGrid } from "../Components/ProductCard";
import { SectionHeading } from "../Components/Home/Sections";
import Button from "../Components/Button";
import { naira } from "../utils/format";
import banner from "../assets/banner-pattern.png";

export default function CartPage() {
  const { items, subtotal, setQuantity, remove, refresh } = useCart();
  const [notes, setNotes] = useState<string[]>([]);
  const recentIds = recentlyViewed.ids();
  const recent = useApiQuery(() => productService.byIds(recentIds), [], "");

  // Prices and stock may have changed since things went in the cart.
  useEffect(() => {
    refresh().then(setNotes).catch(() => undefined);
  }, [refresh]);

  return (
    <>
      <div
        className="flex h-36 items-center justify-center bg-brand-soft bg-cover bg-center text-3xl font-medium sm:h-48 sm:text-[32px]"
        style={{ backgroundImage: `url(${banner})` }}
      >
        <h1>Shopping Cart</h1>
      </div>

      <div className="container-page py-8">
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart />}
            title="Your Cart Is Empty!"
            text="Browse all categories and discover our new arrivals."
            action={<Button to="/products">Start Shopping</Button>}
          />
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div>
              {notes.length > 0 && (
                <Notice tone="warning" className="mb-4">
                  <p className="font-semibold">Your cart was updated</p>
                  <ul className="mt-1 list-disc pl-5">
                    {notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </Notice>
              )}
              <ul className="divide-y divide-line rounded-md border border-line">
                {items.map((item) => (
                  <li key={item.key} className="flex gap-4 p-4">
                    <Link to={`/product/${item.productId}`} className="h-24 w-20 shrink-0 overflow-hidden rounded-sm bg-panel sm:w-24">
                      {item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}
                    </Link>
                    <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                      <div className="flex justify-between gap-4">
                        <div>
                          <Link to={`/product/${item.productId}`} className="font-medium hover:text-brand">
                            {item.name}
                          </Link>
                          {(item.color || item.storage) && <p className="text-sm text-muted">{[item.color, item.storage].filter(Boolean).join(" • ")}</p>}
                          <p className="text-sm text-success">{item.stock <= 5 ? `Only ${item.stock} left` : "In stock"}</p>
                        </div>
                        <p className="shrink-0 text-lg font-semibold sm:text-[22px]">{naira(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <button type="button" onClick={() => remove(item.key)} className="flex items-center gap-2 text-sm text-[#950101] hover:underline">
                          <Trash2 className="h-4.5 w-4.5" /> Remove Item
                        </button>
                        <QuantityStepper value={item.quantity} max={Math.min(item.stock, 20)} onChange={(n) => setQuantity(item.key, n)} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <aside className="self-start rounded-md border border-line p-5">
              <h2 className="font-semibold">Order Summary</h2>
              <div className="mt-4 flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold">{naira(subtotal)}</span>
              </div>
              <p>Delivery Fees not included yet</p>
              <Button to="/checkout" block className="mt-2 h-12">
                Proceed to checkout
              </Button>
            </aside>
          </div>
        )}
      </div>

      {Boolean(recent.data?.length) && (
        <section className="container-page mt-8">
          <SectionHeading title="Recently Viewed" />
          <ProductGrid products={recent.data!.slice(0, 4)} />
        </section>
      )}
    </>
  );
}
