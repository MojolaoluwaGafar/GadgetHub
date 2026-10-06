import { PackageOpen } from "lucide-react";
import { productService } from "../API/services/productService";
import { useApiQuery } from "../Hooks/Api/useApiQuery";
import { EmptyState, ErrorState } from "../Components";
import { ProductGrid } from "../Components/ProductCard";
import HeroSlider from "../Components/Home/HeroSlider";
import FlashDeals from "../Components/Home/FlashDeals";
import { Brands, CategoryRail, SectionHeading, ServiceStrip, ViewAll } from "../Components/Home/Sections";

// The design's home page: hero, promises, trending, categories, flash deals, brands.
export default function HomePage() {
  const trending = useApiQuery(() => productService.list({ trending: true, limit: 8 }), [], "We couldn't load trending products.");
  // Until the admin marks products as trending, the newest ones show here.
  const latest = useApiQuery(() => productService.list({ sort: "newest", limit: 8 }), [], "We couldn't load products.");
  const deals = useApiQuery(() => productService.list({ onSale: true, limit: 4 }), [], "");
  const facets = useApiQuery(() => productService.facets(), [], "");

  const featured = trending.data?.items.length ? trending : latest;
  const emptyStore = !latest.loading && latest.data?.total === 0;

  return (
    <>
      <HeroSlider />
      <ServiceStrip />

      <section className="container-page">
        <SectionHeading title="Trending This Week" text="Most popular gadgets right now" action={<ViewAll to={trending.data?.items.length ? "/products?trending=1" : "/products"} />} />
        {featured.error ? (
          <ErrorState message={featured.error} onRetry={featured.refetch} />
        ) : emptyStore ? (
          <EmptyState icon={<PackageOpen />} title="New stock is on its way" text="Check back soon for the latest phones, laptops and accessories." />
        ) : (
          <ProductGrid products={featured.data?.items ?? null} loading={featured.loading} />
        )}
      </section>

      <CategoryRail facets={facets.data} />
      <FlashDeals products={deals.data?.items ?? null} loading={deals.loading} onEnd={deals.refetch} />
      <Brands />
    </>
  );
}
