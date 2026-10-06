import { Link } from "react-router";
import type { ProductSummary } from "../../types";
import { naira } from "../../utils/format";
import { Skeleton } from "../index";
import Button from "../Button";
import Countdown from "../Countdown";
import salesIcon from "../../assets/icons/sales.png";

// Products the admin has put on sale, with a countdown to the first sale that
// ends. Hidden when nothing is on sale.
export default function FlashDeals({ products, loading, onEnd }: { products: ProductSummary[] | null; loading: boolean; onEnd: () => void }) {
  if (!loading && !products?.length) return null;

  const endsAt = (products ?? [])
    .map((p) => p.saleEndsAt)
    .filter((d): d is string => Boolean(d))
    .sort()[0];

  return (
    <section className="bg-sale-soft px-5 py-8">
      <div className="container-page">
        <div className="flex items-center gap-3 p-4">
          <img src={salesIcon} alt="" className="h-16 w-16" />
          <div>
            <h2 className="text-[28px]">Flash Deals</h2>
            <p className="text-lg">Limited time offers - grab them before they're gone!</p>
          </div>
        </div>

        <div className="flex w-full flex-col items-center justify-between lg:flex-row lg:gap-10">
          <div className="grid w-full gap-5 md:grid-cols-2 lg:w-2/3">
            {loading && !products
              ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-[126px] bg-white" />)
              : products!.slice(0, 4).map((product) => (
                  <Link key={product.id} to={`/product/${product.id}`} className="flex h-[126px] items-center gap-6 rounded-md bg-white p-4 hover:shadow-card">
                    <span className="h-[90px] w-[90px] shrink-0 overflow-hidden border border-[#e3e3e3]">
                      {product.image && <img src={product.image} alt="" loading="lazy" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-1 font-semibold">{product.name}</span>
                      <span className="line-clamp-1 text-sm text-muted">{product.subtitle}</span>
                      <span className="flex items-center gap-5">
                        <span className="text-lg font-semibold text-sale">{naira(product.price)}</span>
                        {product.compareAtPrice && <span className="text-xs text-muted line-through">{naira(product.compareAtPrice)}</span>}
                      </span>
                    </span>
                  </Link>
                ))}
          </div>

          <div className="mt-6 flex h-[275px] w-full max-w-[350px] flex-col items-center justify-center gap-3 rounded-md bg-gradient-to-b from-[#5e4aea] via-[#6b44ea] to-[#7b3dea] p-3 text-center text-white lg:mt-0 lg:w-1/3 lg:max-w-none">
            <div>
              <p>Flash Sales Ends in</p>
              <p className="text-sm">Don't miss out on these deals!</p>
            </div>
            {endsAt && <Countdown endsAt={endsAt} onEnd={onEnd} />}
            <Button to="/products?onSale=1" variant="white" className="h-12 w-[80%]">
              View All Deals
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
