import { useEffect, useState } from "react";
import { cx } from "../../utils/format";
import Button from "../Button";
import iphoneBlue from "../../assets/hero/iphone-15-pro-max.png";
import iphonePink from "../../assets/hero/iphone-pink.png";
import iphoneMobile from "../../assets/hero/iphone-mobile.png";
import flipbuds from "../../assets/hero/flipbuds-pro.png";
import pixel from "../../assets/hero/pixel.png";
import xiaomi from "../../assets/hero/xiaomi.png";

// The design's banners. They are marketing, not products, so they stay in
// code; each "Shop Now" opens the matching part of the real catalog.
const SLIDES = [
  {
    gradient: "from-[#870f1c] via-[#e842a7] to-[#e37cdc]",
    phone: iphonePink,
    mobilePhone: iphonePink,
    flash: { title: ["Xiaomi Mi 11", "Ultra", "12GB+256GB"], image: xiaomi },
  },
  {
    gradient: "from-[#0d1a56] via-[#4a5dab] to-[#b4c6f7]",
    phone: iphoneBlue,
    mobilePhone: iphoneMobile,
    flash: { title: ["New Google", "Pixel 6 Pro"], image: pixel },
  },
  {
    gradient: "from-[#0d1a56] via-[#4a5dab] to-[#b4c6f7]",
    phone: iphoneBlue,
    mobilePhone: iphoneMobile,
    flash: { title: ["Xiaomi Mi 11", "Ultra", "12GB+256GB"], image: xiaomi },
  },
];

const AUTOPLAY_MS = 6000;

export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const slide = SLIDES[index]!;
  const dots = (
    <div className="mt-3 flex justify-center gap-3">
      {SLIDES.map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => setIndex(i)}
          aria-label={`Show banner ${i + 1}`}
          aria-current={i === index}
          className={cx("h-3 w-3 rounded-full border border-[#707070] transition-colors", i === index ? "bg-[#707070]" : "bg-white")}
        />
      ))}
    </div>
  );

  return (
    <section className="container-page lg:py-5" aria-roledescription="carousel" aria-label="Offers" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {/* Tablet and desktop */}
      <div className="hidden md:block">
        <div key={index} className="flex items-center justify-between motion-safe:animate-fade-in">
          <div className={cx("relative flex h-[560px] w-full flex-col items-center justify-center rounded-2xl bg-gradient-to-b text-white lg:w-2/3", slide.gradient)}>
            <div className="absolute left-[75px] w-[70%]">
              <p className="text-2xl">Iphone 15 Pro Max</p>
              <h1 className="py-1 text-[38px]">FROM ₦1,000,000</h1>
              <p>
                A17 Pro chip with 6-core GPU Pro camera <br /> system with 48MP main
              </p>
              <Button to="/products?category=smartphones" className="mt-2 h-12 w-[118px]">
                Shop Now
              </Button>
            </div>
            <img src={slide.phone} alt="" className="absolute bottom-0 right-0 h-[500px] w-[45%] object-contain object-bottom" />
          </div>

          <div className="ml-5 hidden h-[560px] w-1/3 flex-col justify-between lg:flex">
            <div className="flex h-[248px] items-center justify-center gap-3 rounded-md bg-[#e8e6e6] p-5">
              <img src={flipbuds} alt="" className="h-[160px] w-[160px] object-contain" />
              <div className="w-[40%]">
                <h2 className="text-2xl font-semibold">
                  Oriamo <br /> FlipBuds Pro
                </h2>
                <Button to="/products?q=oraimo" className="mt-2 h-12 w-[100px] bg-night hover:bg-black">
                  Shop Now
                </Button>
              </div>
            </div>

            <div className="relative h-[248px] overflow-hidden rounded-md bg-night">
              <div className="absolute left-10 top-10 z-10 w-[50%]">
                <p className="text-sm text-[#ebc80c]">FLASH SALES</p>
                <h2 className="text-2xl font-semibold text-white">
                  {slide.flash.title.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </h2>
                <Button to="/products?onSale=1" className="mt-2 h-12 w-[100px]">
                  Shop Now
                </Button>
              </div>
              <span className="absolute right-10 top-10 z-10 flex h-[35px] w-[90px] items-center justify-center rounded-xs bg-highlight font-semibold">15% OFF</span>
              <img src={slide.flash.image} alt="" className="absolute -right-4 bottom-0 h-[190px] w-[45%] object-contain object-bottom" />
            </div>
          </div>
        </div>
        {dots}
      </div>

      {/* Phones */}
      <div className="md:hidden">
        <div key={index} className={cx("flex items-center justify-between rounded-lg bg-gradient-to-b px-8 py-5 motion-safe:animate-fade-in", slide.gradient)}>
          <div className="text-white">
            <p className="text-sm">Iphone 15 Pro Max</p>
            <h1 className="text-xl">FROM ₦1,000,000</h1>
            <p className="text-[10px]">
              A17 Pro chip with 6-core GPU Pro camera <br /> system with 48MP main
            </p>
            <Button to="/products?category=smartphones" size="sm" className="mt-2 h-7 px-3 text-[11px]">
              Shop Now
            </Button>
          </div>
          <img src={slide.mobilePhone} alt="" className="h-[150px] w-auto max-w-[40%] object-contain" />
        </div>
        {dots}
      </div>
    </section>
  );
}
