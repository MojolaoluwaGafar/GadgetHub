import { Link } from "react-router";
import { Heart, ImageOff, Trash2 } from "lucide-react";
import type { ProductSummary } from "../types";
import { useCart, cartItemFrom } from "../Context/CartContext";
import { useWishlist } from "../Context/WishlistContext";
import { cx, naira } from "../utils/format";
import { Skeleton } from "./index";
import Button from "./Button";

// The design's product tile: photo with a "New" pill and a heart, then name,
// short description, rating, price and Add To Cart.
// `removable`: the wishlist's version, with a bin instead of the heart.
export default function ProductCard({ product, removable }: { product: ProductSummary; removable?: boolean }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const saved = wishlist.has(product.id);

  return (
    <article className="relative flex w-full flex-col rounded-md border border-line bg-white">
      {product.isNew && (
        <span className="absolute left-3 top-3 z-10 flex h-[23px] w-[50px] items-center justify-center rounded-xl bg-danger text-xs text-white">New</span>
      )}
      {removable ? (
        <button
          type="button"
          onClick={() => wishlist.toggle(product.id, product.name)}
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1f1] text-danger"
          aria-label={`Remove ${product.name} from wishlist`}
        >
          <Trash2 className="h-5 w-5" />
        </button>
      ) : (
      <button
        type="button"
        onClick={() => wishlist.toggle(product.id, product.name)}
        className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white"
        aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
        aria-pressed={saved}
      >
        <Heart className={cx("h-5 w-5", saved ? "fill-red-500 text-red-500" : "text-ink")} strokeWidth={1.5} />
      </button>
      )}

      <Link to={`/product/${product.id}`} className="block h-[274px] overflow-hidden rounded-t-md bg-panel">
        {product.image ? (
          <img src={product.image} alt={product.name} loading="lazy" className={cx("h-full w-full object-cover", !product.inStock && "opacity-60")} />
        ) : (
          <span className="flex h-full items-center justify-center text-subtle">
            <ImageOff className="h-10 w-10" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col border-t border-line p-4">
        <Link to={`/product/${product.id}`} className="flex flex-1 flex-col gap-2">
          <p className="line-clamp-2">{product.name}</p>
          {product.subtitle && <p className="line-clamp-1 text-sm text-muted">{product.subtitle}</p>}
          <p className="flex items-center gap-2 text-muted">
            <span>{product.rating ? product.rating.toFixed(1) : 0}</span>
            <span>({product.reviewCount})</span>
          </p>
          <p className="flex items-baseline gap-2">
            <span className={cx("text-lg", product.onSale && "text-sale")}>{naira(product.price)}</span>
            {product.compareAtPrice && <span className="text-xs text-muted line-through">{naira(product.compareAtPrice)}</span>}
          </p>
        </Link>
        <Button
          className="mt-2 h-12 w-full"
          disabled={!product.inStock}
          onClick={() => add(cartItemFrom(product))}
          ariaLabel={product.inStock ? `Add ${product.name} to cart` : `${product.name} is out of stock`}
        >
          {product.inStock ? "Add To Cart" : "Out of Stock"}
        </Button>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="rounded-md border border-line">
      <Skeleton className="h-[274px] rounded-b-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="mt-3 h-12 w-full" />
      </div>
    </div>
  );
}

export function ProductCardSkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// The design's grid: four across on desktop.
export function ProductGrid({
  products,
  loading,
  skeletons = 8,
  className,
}: {
  products: ProductSummary[] | null;
  loading?: boolean;
  skeletons?: number;
  className?: string;
}) {
  return (
    <div className={cx("grid gap-4 py-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", className)}>
      {loading && !products?.length
        ? Array.from({ length: skeletons }, (_, i) => <ProductCardSkeleton key={i} />)
        : products?.map((product) => <ProductCard key={product.id} product={product} />)}
    </div>
  );
}
