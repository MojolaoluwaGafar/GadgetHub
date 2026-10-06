import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { Heart, ImageOff, Minus, PackageX, Plus, Share2, Star } from "lucide-react";
import type { ProductDetail, Review } from "../types";
import { CATEGORY_LABELS } from "../types";
import { productService } from "../API/services/productService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { useAuth } from "../Context/AuthContext";
import { useCart } from "../Context/CartContext";
import { recentlyViewed, useWishlist } from "../Context/WishlistContext";
import { Breadcrumbs, EmptyState, ErrorState, Field, PageLoader, Stars, TextArea, TextInput } from "../Components";
import { ProductGrid } from "../Components/ProductCard";
import { ServiceStrip } from "../Components/Home/Sections";
import Modal from "../Components/Modal";
import Button from "../Components/Button";
import { apiErrorMessage, apiFieldErrors } from "../utils/apiError";
import { showToast } from "../utils/toastHelper";
import { cx, formatDate, naira } from "../utils/format";

function ProductInfo({ product }: { product: ProductDetail }) {
  const { add } = useCart();
  const wishlist = useWishlist();
  const navigate = useNavigate();
  const [image, setImage] = useState(product.images[0]?.url ?? null);
  const [color, setColor] = useState(product.colors[0]?.name ?? null);
  const [storage, setStorage] = useState(product.storageOptions[0] ?? null);
  const [quantity, setQuantity] = useState(1);
  const saved = wishlist.has(product.id);
  const max = Math.min(product.stock, 20);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text: `Check out this product: ${product.name} by ${product.brand}.`, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!");
      }
    } catch {
      // Closing the share sheet throws; nothing to do.
    }
  };

  const addToCart = () =>
    add({ productId: product.id, name: product.name, image: product.images[0]?.url ?? null, price: product.price, color, storage, stock: product.stock, quantity });

  return (
    <section className="w-full py-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="w-full lg:w-[520px] lg:shrink-0">
          <div className="relative flex aspect-square w-full items-center justify-center rounded-md border border-line bg-white">
            {image ? <img src={image} alt={product.name} className="h-full w-full rounded-md object-contain" /> : <ImageOff className="h-12 w-12 text-subtle" />}
            <button type="button" onClick={share} className="absolute right-14 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow" aria-label="Share">
              <Share2 className="h-[18px] w-[18px]" />
            </button>
            <button
              type="button"
              onClick={() => wishlist.toggle(product.id, product.name)}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow"
              aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={saved}
            >
              <Heart className={cx("h-5 w-5", saved && "fill-red-500 text-red-500")} strokeWidth={1.5} />
            </button>
          </div>
          {product.images.length > 1 && (
            <div className="my-4 flex items-center gap-2 lg:gap-3">
              {product.images.map((img, index) => (
                <button key={img.url} type="button" onClick={() => setImage(img.url)} className="h-28 w-[120px] overflow-hidden rounded-md" aria-label={`Show photo ${index + 1}`}>
                  <img src={img.url} alt="" className={cx("h-full w-full rounded-md object-cover", image === img.url ? "border border-brand" : "border border-line")} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col justify-between gap-6">
          <div className="flex flex-col gap-5">
            <p className="text-sm text-gray-400">{product.brand}</p>
            <h1 className="-mt-3 text-[32px] font-semibold leading-tight">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>{product.rating ? product.rating.toFixed(1) : 0}</span>
              <span className="text-gray-400">({product.reviewCount} Reviews)</span>
              {product.inStock ? (
                <span className="flex items-center gap-1 text-success">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  {product.stock <= 5 ? `Only ${product.stock} left` : "In Stock"}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-danger">
                  <span className="h-2 w-2 rounded-full bg-danger" /> Out of Stock
                </span>
              )}
            </div>
            {product.description && <p className="whitespace-pre-line text-lg text-gray-400 lg:text-[21px]">{product.description}</p>}
            <p className="flex flex-wrap items-baseline gap-3">
              <span className={cx("text-[28px] font-semibold", product.onSale && "text-sale")}>{naira(product.price)}</span>
              {product.compareAtPrice && <span className="text-lg text-muted line-through">{naira(product.compareAtPrice)}</span>}
              {product.onSale && product.saleEndsAt && <span className="text-sm text-sale">Sale ends {formatDate(product.saleEndsAt)}</span>}
            </p>

            {product.colors.length > 0 && (
              <div>
                <p className="mb-2 text-sm">
                  Color: <span className="font-medium">{color}</span>
                </p>
                <div className="flex gap-3" role="radiogroup" aria-label="Color">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      role="radio"
                      aria-checked={color === c.name}
                      aria-label={c.name}
                      title={c.name}
                      onClick={() => setColor(c.name)}
                      className={cx("h-8 w-8 rounded-full border transition", color === c.name ? "border-brand ring-2 ring-brand ring-offset-2" : "border-line")}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>
            )}

            {product.storageOptions.length > 0 && (
              <div>
                <p className="mb-2 text-sm">Storage</p>
                <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Storage">
                  {product.storageOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={storage === size}
                      onClick={() => setStorage(size)}
                      className={cx("h-[35px] min-w-[70px] rounded-md border px-3 text-sm", storage === size ? "border-brand bg-brand-soft text-brand" : "border-gray-500 text-gray-400")}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.inStock && (
              <div>
                <p className="mb-2 text-sm">Quantity</p>
                <div className="flex h-[39px] w-[145px] items-center rounded-md border border-line">
                  <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="flex h-full w-10 items-center justify-center border-r border-line disabled:text-line" aria-label="Decrease quantity">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="flex-1 text-center" aria-live="polite">
                    {quantity}
                  </span>
                  <button type="button" onClick={() => setQuantity(Math.min(max, quantity + 1))} disabled={quantity >= max} className="flex h-full w-10 items-center justify-center border-l border-line disabled:text-line" aria-label="Increase quantity">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button
              className="h-12 w-full"
              disabled={!product.inStock}
              onClick={() => {
                addToCart();
                navigate("/cart");
              }}
            >
              Buy Now
            </Button>
            <Button className="h-12 w-full border border-brand" variant="white" disabled={!product.inStock} onClick={addToCart}>
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewForm({ productId, open, onClose, onDone }: { productId: string; open: boolean; onClose: () => void; onDone: () => void }) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!rating) return setErrors({ rating: "Pick a star rating." });
    setSaving(true);
    try {
      await productService.addReview(productId, { rating, title, body });
      showToast("Thanks for your review!");
      onDone();
      onClose();
    } catch (err) {
      setErrors(apiFieldErrors(err));
      showToast(apiErrorMessage(err, "Your review wasn't saved."), "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Write a Review"
      footer={
        <Button onClick={() => submit()} loading={saving}>
          Post review
        </Button>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-1.5 text-sm font-semibold">Your rating</p>
          <div className="flex gap-1" role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} stars`} onClick={() => setRating(n)}>
                <Star className={cx("h-7 w-7", n <= rating ? "fill-star text-star" : "text-line")} />
              </button>
            ))}
          </div>
          {errors.rating && <p className="mt-1 text-xs font-medium text-danger">{errors.rating}</p>}
        </div>
        <Field label="Title" htmlFor="review-title" error={errors.title}>
          <TextInput id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Worth Every Penny" maxLength={80} hasError={Boolean(errors.title)} />
        </Field>
        <Field label="Review" htmlFor="review-body" error={errors.body}>
          <TextArea id="review-body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={1500} hasError={Boolean(errors.body)} />
        </Field>
      </form>
    </Modal>
  );
}

function Reviews({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuth();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<Review[]>([]);
  const [writing, setWriting] = useState(false);
  const { data, error, refetch } = useApiQuery(() => productService.reviews(productId, page), [productId, page, isAuthenticated], "We couldn't load reviews.");

  // "Load More" adds the next page under the ones already shown.
  useEffect(() => {
    if (data) setItems((current) => (page === 1 ? data.items : [...current, ...data.items.filter((r) => !current.some((c) => c.id === r.id))]));
  }, [data, page]);

  const write = () => {
    if (!isAuthenticated) return showToast("Sign in to review a product you bought.", "info");
    if (!data?.canReview) return showToast("You can review this once an order with it has been delivered to you.", "info");
    setWriting(true);
  };

  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <div>
      <div className="flex items-center justify-between py-5">
        <h2 className="text-xl font-semibold">Customer Reviews</h2>
        <Button className="h-12 w-[178px]" onClick={write}>
          Write a Review
        </Button>
      </div>
      {!data && <PageLoader />}
      {data && items.length === 0 && <p className="my-4 rounded-md bg-panel p-5 text-center text-muted">No reviews yet.</p>}
      {items.map((review) => (
        <article key={review.id} className="my-4 w-full rounded-md bg-panel p-5">
          <div className="flex items-center gap-4 py-3">
            <span className="flex h-[35px] w-[35px] items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{review.author[0]}</span>
            <div>
              <p>{review.author}</p>
              <div className="flex items-center gap-2">
                <Stars rating={review.rating} />
                <span>{review.rating.toFixed(1)}</span>
              </div>
            </div>
          </div>
          <h3 className="text-lg font-bold">{review.title}</h3>
          <p className="py-3 text-sm text-muted">{review.body}</p>
          <p className="text-muted">{formatDate(review.createdAt)}</p>
        </article>
      ))}
      {data && items.length < data.count && (
        <button type="button" onClick={() => setPage((p) => p + 1)} className="mx-auto my-2 flex text-sm text-info">
          Load More...
        </button>
      )}
      <ReviewForm
        productId={productId}
        open={writing}
        onClose={() => setWriting(false)}
        onDone={() => {
          setPage(1);
          refetch();
        }}
      />
    </div>
  );
}

function Tabs({ product }: { product: ProductDetail }) {
  const [tab, setTab] = useState<"specs" | "reviews">("specs");
  return (
    <section className="my-10">
      <div className="flex gap-8 border-b border-line" role="tablist">
        {(["specs", "reviews"] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cx("-mb-px border-b-2 pb-3 text-[22px] font-semibold", tab === id ? "border-brand text-brand" : "border-transparent text-gray-400")}
          >
            {id === "specs" ? "Specifications" : `Reviews (${product.reviewCount})`}
          </button>
        ))}
      </div>
      {tab === "specs" ? (
        product.specs.length ? (
          <div className="mt-8 grid grid-cols-1 gap-x-12 text-sm md:grid-cols-2">
            {product.specs.map((spec) => (
              <div key={spec.label} className="flex justify-between gap-4 border-b border-line-soft py-4">
                <span className="text-base text-muted">{spec.label}</span>
                <span className="text-right text-lg font-semibold text-ink">{spec.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-muted">No specifications listed yet.</p>
        )
      ) : (
        <Reviews productId={product.id} />
      )}
    </section>
  );
}

export default function ProductPage() {
  const { id = "" } = useParams();
  const product = useApiQuery(() => productService.get(id), [id], "We couldn't load this product.");
  const related = useApiQuery(() => productService.related(id), [id], "");

  useEffect(() => {
    if (product.data) {
      recentlyViewed.add(product.data.id);
      document.title = `${product.data.name} | GadgetHub`;
    }
    return () => {
      document.title = "GadgetHub | Phones, laptops and gadgets in Nigeria";
    };
  }, [product.data]);

  if (product.loading && !product.data) return <PageLoader />;
  if (product.error || !product.data) {
    return <EmptyState icon={<PackageX />} title="Product not found" text={product.error ?? undefined} action={<Button to="/products">Browse products</Button>} />;
  }
  const p = product.data;

  return (
    <>
      <div className="container-page py-2">
        <Breadcrumbs
          items={[
            { label: "Home", to: "/" },
            { label: CATEGORY_LABELS[p.category], to: `/products?category=${p.category}` },
            { label: p.name },
          ]}
        />
        {/* Remount when the product changes, so picks reset. */}
        <ProductInfo key={p.id} product={p} />
        <Tabs key={`tabs-${p.id}`} product={p} />
      </div>

      {Boolean(related.data?.length) && (
        <section className="container-page py-5">
          <h2 className="text-[28px] font-semibold">You May Also Like</h2>
          <ProductGrid products={related.data} />
        </section>
      )}
      <ServiceStrip />
    </>
  );
}

