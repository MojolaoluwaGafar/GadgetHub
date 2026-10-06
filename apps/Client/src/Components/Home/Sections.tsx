import { Fragment, type ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import type { CatalogFacets, Category } from "../../types";
import { CATEGORY_LABELS } from "../../types";
import packageIcon from "../../assets/icons/package.png";
import headphonesIcon from "../../assets/icons/headphones.png";
import trophyIcon from "../../assets/icons/trophy.png";
import cardIcon from "../../assets/icons/credit-card.png";
import apple from "../../assets/brands/apple.png";
import bose from "../../assets/brands/bose.png";
import hp from "../../assets/brands/hp.png";
import oraimo from "../../assets/brands/oraimo.png";
import samsung from "../../assets/brands/samsung.png";
import sony from "../../assets/brands/sony.png";
import wearables from "../../assets/categories/wearables.png";
import laptops from "../../assets/categories/laptops.png";
import smartphones from "../../assets/categories/smartphones.png";
import accessories from "../../assets/categories/accessories.png";
import gaming from "../../assets/categories/gaming.jpg";
import smartHome from "../../assets/categories/smart-home.jpg";

export function SectionHeading({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between py-5 lg:py-8">
      <div>
        <h2 className="text-[22px] font-bold lg:text-[28px]">{title}</h2>
        {text && <p className="text-base text-muted lg:text-lg">{text}</p>}
      </div>
      {action}
    </div>
  );
}

export function ViewAll({ to, className }: { to: string; className?: string }) {
  return (
    <Link to={to} className={`flex items-center gap-2 font-semibold text-brand ${className ?? ""}`}>
      View All <ArrowRight className="h-6 w-6" />
    </Link>
  );
}

const SERVICES = [
  { icon: packageIcon, title: "Fast Delivery", text: "Delivery in 24/H" },
  { icon: headphonesIcon, title: "Support 24/7", text: "Live contact/message" },
  { icon: trophyIcon, title: "24 Hours Return", text: "100% money-back guarantee" },
  { icon: cardIcon, title: "Secure Payment", text: "Your money is safe" },
];

// The four promises in a white bar on the dark strip, as in the design.
export function ServiceStrip() {
  return (
    <section className="hidden bg-night-soft px-5 py-6 my-2 lg:flex">
      <div className="container-page flex h-[108px] items-center justify-around rounded-[4px] bg-white">
        {SERVICES.map((service, index) => (
          <Fragment key={service.title}>
            <div className="flex items-center gap-2">
              <img src={service.icon} alt="" className="h-6 w-6" />
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{service.title}</h3>
                <p className="text-sm text-gray-500">{service.text}</p>
              </div>
            </div>
            {index < SERVICES.length - 1 && <span className={index === 1 ? "invisible" : "h-15 w-0.5 bg-gray-300"} aria-hidden="true" />}
          </Fragment>
        ))}
      </div>
    </section>
  );
}

// The design's order and pictures.
const CATEGORY_TILES: { category: Category; image: string; cover?: boolean }[] = [
  { category: "wearables", image: wearables },
  { category: "laptops", image: laptops },
  { category: "smartphones", image: smartphones },
  { category: "accessories", image: accessories },
  { category: "gaming", image: gaming, cover: true },
  { category: "smart-home", image: smartHome, cover: true },
];

export function CategoryRail({ facets }: { facets: CatalogFacets | null }) {
  const count = (category: Category) => facets?.categories.find((row) => row.category === category)?.count ?? 0;
  const label = (category: Category) => (facets ? `Discover ${count(category)} Products` : " ");

  return (
    <section className="container-page py-5 lg:py-20">
      <div className="flex justify-between">
        <div>
          <h2 className="text-[22px] font-bold lg:text-[28px]">Shop By Categories</h2>
          <p className="text-base text-muted lg:text-lg">Find exactly what you're looking for</p>
        </div>
        <ViewAll to="/products" className="lg:hidden" />
      </div>

      <div className="relative mt-6 hidden justify-between lg:flex">
        {CATEGORY_TILES.map(({ category, image, cover }) => (
          <Link key={category} to={`/products?category=${category}`} className="group flex flex-col items-center text-center">
            <span className="flex h-[188px] w-[188px] items-center justify-center overflow-hidden rounded-full bg-[#e3e3e3] transition group-hover:ring-4 group-hover:ring-brand">
              <img src={image} alt="" loading="lazy" className={cover ? "h-full w-full object-cover" : "h-[70%] w-[70%] object-contain"} />
            </span>
            <span className="mt-2 py-2 font-semibold">{CATEGORY_LABELS[category]}</span>
            <span className="text-sm text-gray-500">{label(category)}</span>
          </Link>
        ))}
        <Link to="/products" aria-label="All categories" className="absolute right-4 top-[70px] flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white">
          <ArrowRight className="h-7 w-7" />
        </Link>
      </div>

      <div className="flex snap-x snap-mandatory gap-6 overflow-x-auto py-4 no-scrollbar lg:hidden">
        {CATEGORY_TILES.map(({ category, image, cover }) => (
          <Link key={category} to={`/products?category=${category}`} className="flex shrink-0 snap-start flex-col items-center py-2 text-center">
            <span className="flex h-[80px] w-[80px] items-center justify-center overflow-hidden rounded-full bg-[#e3e3e3] sm:h-[100px] sm:w-[100px] md:h-[120px] md:w-[120px]">
              <img src={image} alt="" loading="lazy" className={cover ? "h-full w-full object-cover" : "h-[70%] w-[70%] object-contain"} />
            </span>
            <span className="mt-2 py-2 text-xs font-semibold sm:text-sm">{CATEGORY_LABELS[category]}</span>
            <span className="text-[10px] text-gray-500 sm:text-xs">{label(category)}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// Logo sizes from the design.
const BRANDS = [
  { name: "Sony", logo: sony, style: { width: 138 } },
  { name: "Apple", logo: apple, style: { height: 75 } },
  { name: "Samsung", logo: samsung, style: { width: 158 } },
  { name: "Oraimo", logo: oraimo, style: { width: 110 } },
  { name: "HP", logo: hp, style: { height: 74 } },
  { name: "Bose", logo: bose, style: { width: 159 } },
];

export function Brands() {
  return (
    <section className="container-page hidden flex-col py-10 lg:flex">
      <h2 className="text-[28px] font-semibold">Trusted Brands</h2>
      <p className="text-lg">We partner with the world's leading technology brands</p>
      <div className="mt-6 flex items-center justify-between gap-5">
        {BRANDS.map((brand) => (
          <Link key={brand.name} to={`/products?q=${brand.name}`} aria-label={`Shop ${brand.name}`}>
            <img src={brand.logo} alt={brand.name} loading="lazy" style={brand.style} className="object-contain" />
          </Link>
        ))}
      </div>
    </section>
  );
}
