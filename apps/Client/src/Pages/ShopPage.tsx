import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router";
import { ChevronDown, SearchX, SlidersHorizontal, X } from "lucide-react";
import type { Category, ProductSort } from "../types";
import { CATEGORIES, CATEGORY_LABELS } from "../types";
import { productService } from "../API/services/productService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { Breadcrumbs, EmptyState, ErrorState, Pagination, SelectInput } from "../Components";
import { ProductGrid } from "../Components/ProductCard";
import { ServiceStrip } from "../Components/Home/Sections";
import Button from "../Components/Button";
import { cx, naira } from "../utils/format";

const PAGE_SIZE = 12;

const PRICE_RANGES = [
  { id: "0-200000", label: `Under ${naira(200_000)}` },
  { id: "200000-1000000", label: `${naira(200_000)} - ${naira(1_000_000)}` },
  { id: "1000000-", label: `${naira(1_000_000)} and above` },
];

const RATINGS = [4.5, 4, 3.5];

const SORTS: { value: ProductSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

// Every filter lives in the URL, so a filtered page can be shared, refreshed
// or reached with the back button.
function useFilters() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") as Category | null;
  const price = params.get("price") ?? "";
  const [minPrice, maxPrice] = price.split("-").map((value) => (value ? Number(value) : undefined));
  const filters = {
    q: params.get("q") ?? "",
    category: (category && CATEGORIES.includes(category) ? category : "") as Category | "",
    brands: params.get("brand")?.split(",").filter(Boolean) ?? [],
    price,
    minPrice,
    maxPrice,
    minRating: Number(params.get("rating")) || undefined,
    inStock: params.get("inStock") === "1",
    onSale: params.get("onSale") === "1",
    trending: params.get("trending") === "1",
    sort: (params.get("sort") as ProductSort) || "newest",
    page: Math.max(1, Number(params.get("page")) || 1),
  };

  const update = (changes: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    if (!keepPage) next.delete("page");
    setParams(next);
  };

  return { filters, update, clear: () => setParams(filters.q ? { q: filters.q } : {}) };
}

function FilterGroup({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-line py-4 last:border-0">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between font-semibold" aria-expanded={open}>
        {title}
        <ChevronDown className={cx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-3 space-y-2.5">{children}</div>}
    </div>
  );
}

function Option({ type, checked, onChange, label }: { type: "radio" | "checkbox"; checked: boolean; onChange: () => void; label: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted hover:text-ink">
      <input type={type} checked={checked} onChange={onChange} className="h-4 w-4 accent-brand" />
      {label}
    </label>
  );
}

function Filters({ brands }: { brands: string[] }) {
  const { filters, update } = useFilters();
  return (
    <div>
      <FilterGroup title="Category" defaultOpen={Boolean(filters.category)}>
        <Option type="radio" checked={!filters.category} onChange={() => update({ category: null })} label="All categories" />
        {CATEGORIES.map((category) => (
          <Option key={category} type="radio" checked={filters.category === category} onChange={() => update({ category })} label={CATEGORY_LABELS[category]} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price Range" defaultOpen={Boolean(filters.price)}>
        <Option type="radio" checked={!filters.price} onChange={() => update({ price: null })} label="Any price" />
        {PRICE_RANGES.map((range) => (
          <Option key={range.id} type="radio" checked={filters.price === range.id} onChange={() => update({ price: range.id })} label={range.label} />
        ))}
      </FilterGroup>
      {brands.length > 0 && (
        <FilterGroup title="Brand" defaultOpen={filters.brands.length > 0}>
          {brands.map((brand) => {
            const on = filters.brands.includes(brand);
            const next = on ? filters.brands.filter((b) => b !== brand) : [...filters.brands, brand];
            return <Option key={brand} type="checkbox" checked={on} onChange={() => update({ brand: next.join(",") || null })} label={brand} />;
          })}
        </FilterGroup>
      )}
      <FilterGroup title="Ratings" defaultOpen={Boolean(filters.minRating)}>
        <Option type="radio" checked={!filters.minRating} onChange={() => update({ rating: null })} label="Any rating" />
        {RATINGS.map((rating) => (
          <Option key={rating} type="radio" checked={filters.minRating === rating} onChange={() => update({ rating: String(rating) })} label={`${rating} stars & up`} />
        ))}
      </FilterGroup>
      <FilterGroup title="Availability" defaultOpen={filters.inStock || filters.onSale || filters.trending}>
        <Option type="checkbox" checked={filters.inStock} onChange={() => update({ inStock: filters.inStock ? null : "1" })} label="In stock only" />
        <Option type="checkbox" checked={filters.onSale} onChange={() => update({ onSale: filters.onSale ? null : "1" })} label="On sale" />
        <Option type="checkbox" checked={filters.trending} onChange={() => update({ trending: filters.trending ? null : "1" })} label="Trending" />
      </FilterGroup>
    </div>
  );
}

export default function ShopPage() {
  const { filters, update, clear } = useFilters();
  const [drawer, setDrawer] = useState(false);
  const facets = useApiQuery(() => productService.facets(), [], "");
  const { data, loading, error, refetch } = useApiQuery(
    () => productService.list({ ...filters, limit: PAGE_SIZE }),
    [JSON.stringify(filters)],
    "We couldn't load products.",
  );

  const title = filters.q
    ? `Search results for “${filters.q}”`
    : filters.category
      ? CATEGORY_LABELS[filters.category]
      : filters.onSale
        ? "Deals"
        : filters.trending
          ? "Trending"
          : "All Categories";
  const activeCount =
    Number(Boolean(filters.category)) + Number(Boolean(filters.price)) + filters.brands.length + Number(Boolean(filters.minRating)) + Number(filters.inStock) + Number(filters.onSale) + Number(filters.trending);
  const first = data && data.total ? (data.page - 1) * data.limit + 1 : 0;
  const last = data ? Math.min(data.page * data.limit, data.total) : 0;

  return (
    <>
      <div className="container-page">
        <Breadcrumbs items={[{ label: "Home", to: "/" }, { label: filters.q ? "Search" : title }]} />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[24px] font-semibold">{title}</h1>
            <p className="text-[15px]">{data ? (data.total ? `Showing ${first} - ${last} of ${data.total}` : "No products") : " "}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="border border-line lg:hidden" onClick={() => setDrawer(true)}>
              <SlidersHorizontal className="h-4 w-4" /> Filters{activeCount ? ` (${activeCount})` : ""}
            </Button>
            <label className="flex items-center gap-2 text-sm">
              <span className="hidden sm:inline">Sort by</span>
              <SelectInput id="sort" value={filters.sort} onChange={(e) => update({ sort: e.target.value === "newest" ? null : e.target.value })} className="w-48 font-semibold">
                {SORTS.map((sort) => (
                  <option key={sort.value} value={sort.value}>
                    {sort.label}
                  </option>
                ))}
              </SelectInput>
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-8 lg:grid-cols-[289px_1fr]">
          <aside className="hidden self-start rounded-md border border-[#d7d7d7] p-4 text-lg lg:block">
            <div className="flex items-center justify-between border-b border-line py-3">
              <h2 className="font-semibold">Filter</h2>
              {activeCount > 0 && (
                <button type="button" onClick={clear} className="text-sm font-semibold text-brand hover:underline">
                  Clear all
                </button>
              )}
            </div>
            <Filters brands={facets.data?.brands ?? []} />
          </aside>

          <div>
            {error ? (
              <ErrorState message={error} onRetry={refetch} />
            ) : data && data.total === 0 ? (
              <EmptyState
                icon={<SearchX />}
                title="No products found"
                text={filters.q ? "Try a different search, or fewer filters." : "Try removing a filter or two."}
                action={
                  <Button onClick={() => (filters.q ? update({ q: null }) : clear())} variant="outline">
                    {filters.q ? "Clear search" : "Clear filters"}
                  </Button>
                }
              />
            ) : (
              <>
                <ProductGrid products={data?.items ?? null} loading={loading} skeletons={6} className="xl:grid-cols-3" />
                <div className="mt-10">
                  <Pagination
                    page={filters.page}
                    total={data?.total ?? 0}
                    limit={PAGE_SIZE}
                    onChange={(page) => {
                      update({ page: page > 1 ? String(page) : null }, true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[90] bg-black/50 motion-safe:animate-fade-in lg:hidden" onMouseDown={() => setDrawer(false)}>
          <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col bg-white shadow-float" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label="Filters">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="text-lg font-semibold">Filter</h2>
              <button type="button" onClick={() => setDrawer(false)} className="rounded-md p-2 hover:bg-panel" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <Filters brands={facets.data?.brands ?? []} />
            </div>
            <div className="grid grid-cols-2 gap-3 border-t border-line p-4">
              <Button variant="ghost" className="border border-line" onClick={clear}>
                Clear all
              </Button>
              <Button onClick={() => setDrawer(false)}>Show {data?.total ?? ""} results</Button>
            </div>
          </div>
        </div>
      )}

      <ServiceStrip />
    </>
  );
}
