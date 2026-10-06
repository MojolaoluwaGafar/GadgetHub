import { Heart } from "lucide-react";
import { useWishlist } from "../Context/WishlistContext";
import { productService } from "../API/services/productService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { Breadcrumbs, EmptyState, ErrorState } from "../Components";
import ProductCard, { ProductCardSkeletonGrid } from "../Components/ProductCard";
import Button from "../Components/Button";

// Saved products, loaded fresh so prices and stock are current; deleted
// products simply don't come back. Shown as an account tab (as in the first
// version) and at /wishlist for shoppers who aren't signed in.
export function WishlistContent() {
  const { ids } = useWishlist();
  const { data, loading, error, refetch } = useApiQuery(() => productService.byIds(ids), [ids.join(",")], "We couldn't load your wishlist.");

  return (
    <div>
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      {ids.length > 0 && <p>{ids.length} items saved for later</p>}
      <div className="my-6">
        {ids.length === 0 ? (
          <EmptyState icon={<Heart />} title="No products in wishlist" text="Tap the heart on any product to save it here." action={<Button to="/products">Discover products</Button>} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : loading && !data ? (
          <ProductCardSkeletonGrid count={Math.min(ids.length, 6)} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data?.map((product) => (
              <ProductCard key={product.id} product={product} removable />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <div className="container-page">
      <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: "Wishlist" }]} />
      <WishlistContent />
    </div>
  );
}

export function AccountWishlistPage() {
  return <WishlistContent />;
}
