import { Suspense, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from "react-router";
import { ChevronDown, Heart, Menu, Search, ShoppingCart, UserRound, X } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { useCart } from "../Context/CartContext";
import { useWishlist } from "../Context/WishlistContext";
import { CATEGORIES, CATEGORY_LABELS } from "../types";
import { cx, initials } from "../utils/format";
import { showToast } from "../utils/toastHelper";
import { PageLoader } from "../Components";
import Button from "../Components/Button";
import CartDrawer from "../Components/CartDrawer";
import logo from "../assets/logo.png";

const CATEGORY_LINKS = [{ to: "/products", label: "All Categories" }, ...CATEGORIES.map((c) => ({ to: `/products?category=${c}`, label: CATEGORY_LABELS[c] }))];

function Badge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

// The top strip: opening hours, showroom and phone.
export function TopBar() {
  return (
    <div className="hidden bg-night text-white lg:block">
      <div className="container-page flex h-[60px] items-center justify-between">
        <span>
          <span className="text-[#acacac]">Mon-Sat:</span> 9:00 AM - 5:30 PM
        </span>
        <span className="text-[#acacac]">Visit our showroom in 12 Street Address City, Lagos</span>
        <a href="tel:+2340123456781">Call Us: (+234) 01234 5678</a>
      </div>
    </div>
  );
}

function SearchBox({ className }: { className?: string }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { pathname } = useLocation();
  const [query, setQuery] = useState(pathname === "/products" ? (params.get("q") ?? "") : "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  };

  return (
    <form onSubmit={submit} role="search" className={cx("relative", className)}>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search for anything..."
        aria-label="Search products"
        className="h-[52px] w-full rounded-md border border-[#acacac] bg-white pl-4 pr-14 text-ink placeholder:text-subtle focus:border-brand focus:outline-none"
      />
      <button type="submit" className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center text-ink hover:text-brand" aria-label="Search">
        <Search className="h-6 w-6" />
      </button>
    </form>
  );
}

// "Hello Ada" with a dropdown, as in the first version.
function UserMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => !ref.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!user) return null;
  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex items-center gap-2">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{initials(user.firstName, user.lastName)}</span>
        <span className="hidden text-lg font-semibold xl:inline">Hello {user.firstName}</span>
        <ChevronDown className={cx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 flex w-[185px] flex-col gap-1 rounded-md bg-white p-3 shadow-float motion-safe:animate-fade-in">
          <Link to="/account" className="py-1 hover:text-brand">
            Profile
          </Link>
          <Link to="/account/orders" className="py-1 hover:text-brand">
            My Orders
          </Link>
          {isAdmin && (
            <Link to="/admin" className="py-1 hover:text-brand">
              Admin Dashboard
            </Link>
          )}
          <button
            type="button"
            onClick={() => {
              signOut();
              showToast("You've signed out", "info");
              navigate("/login");
            }}
            className="py-1 text-left text-[#e60e0e]"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function Header() {
  const { isAuthenticated } = useAuth();
  const { count, setDrawerOpen } = useCart();
  const { ids } = useWishlist();
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname, search]);

  const isActive = (to: string) => {
    const [path, query = ""] = to.split("?");
    if (pathname !== path) return false;
    return query ? search.includes(query) : !search.includes("category=");
  };

  const wishlistTo = isAuthenticated ? "/account/wishlist" : "/wishlist";

  return (
    <header className="relative z-40 flex w-full flex-col bg-white">
      <TopBar />

      <div className="container-page flex h-[76px] items-center justify-between gap-4 lg:h-[100px] lg:gap-16">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setMenuOpen(true)} className="-ml-2 rounded-md p-2 lg:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <Link to="/" className="shrink-0" aria-label="GadgetHub home">
            <img src={logo} alt="GadgetHub" className="h-[39px] w-[152px] object-contain" width={152} height={39} />
          </Link>
        </div>
        <SearchBox className="hidden max-w-[556px] flex-1 lg:block" />
        <div className="flex items-center gap-5">
          <button type="button" onClick={() => setDrawerOpen(true)} className="relative" aria-label={`Cart, ${count} items`}>
            <ShoppingCart className="h-7 w-7" />
            <Badge count={count} />
          </button>
          <Link to={wishlistTo} className="relative" aria-label={`Wishlist, ${ids.length} items`}>
            <Heart className="h-7 w-7" />
            <Badge count={ids.length} />
          </Link>
          {isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <Link to="/login" className="lg:hidden" aria-label="Login">
                <UserRound className="h-7 w-7" />
              </Link>
              <Button to="/login" className="hidden h-12 w-[84px] lg:inline-flex">
                Login
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="container-page pb-3 lg:hidden">
        <SearchBox />
      </div>

      <nav className="mt-1 hidden bg-night text-white lg:block" aria-label="Categories">
        <div className="container-page flex h-[65px] items-center gap-8 text-lg">
          {CATEGORY_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className={cx("whitespace-nowrap transition-colors", isActive(link.to) ? "text-brand-tint" : "hover:text-brand-tint")}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {menuOpen && (
        <div className="fixed inset-0 z-[90] bg-black/50 motion-safe:animate-fade-in lg:hidden" onMouseDown={() => setMenuOpen(false)}>
          <nav className="absolute inset-y-0 left-0 flex w-[80%] max-w-sm flex-col overflow-y-auto bg-white p-5 shadow-float" onMouseDown={(event) => event.stopPropagation()} aria-label="Menu">
            <div className="mb-6 flex items-center justify-between">
              <img src={logo} alt="GadgetHub" className="h-[39px] w-[152px] object-contain" />
              <button type="button" onClick={() => setMenuOpen(false)} className="rounded-md p-2 hover:bg-panel" aria-label="Close menu">
                <X className="h-6 w-6" />
              </button>
            </div>
            {CATEGORY_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={cx("rounded-md px-3 py-2.5", isActive(link.to) ? "bg-brand-soft font-semibold text-brand" : "hover:bg-panel")}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-6 border-t border-line pt-4">
              {isAuthenticated ? (
                <Link to="/account" className="block rounded-md px-3 py-2.5 hover:bg-panel">
                  My Account
                </Link>
              ) : (
                <Button to="/login" block>
                  Login
                </Button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export const QUICK_LINKS = [
  { label: "My Wishlist", to: "/wishlist" },
  { label: "Discount", to: "/products?onSale=1" },
  { label: "Refund & Returns", to: "/info/returns" },
  { label: "Privacy Policy", to: "/info/privacy" },
  { label: "Faqs", to: "/info/faqs" },
  { label: "Warranty", to: "/info/warranty" },
  { label: "Contact Us", to: "/info/contact" },
  { label: "Our Story", to: "/info/our-story" },
];

export function Footer() {
  const [email, setEmail] = useState("");
  const subscribe = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return showToast("Enter a valid email address", "error");
    showToast("Thanks for subscribing!");
    setEmail("");
  };

  return (
    <footer className="pt-10 text-center">
      <div className="container-page">
        <h2 className="text-[28px] font-semibold">Stay Updated on Latest Gadgets</h2>
        <p className="py-3 text-muted">
          Subscribe to our newsletter and be the first to know about new arrivals, exclusive deals, <br className="hidden lg:inline" />
          and tech news
        </p>
        <form onSubmit={subscribe} className="flex items-center justify-center gap-3 py-3 lg:gap-5">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Enter your email"
            aria-label="Email address"
            className="h-12 w-[449px] min-w-0 rounded-md border border-[#d4d1d1] bg-[#f2f2f2] px-3 focus:border-brand focus:outline-none"
          />
          <Button type="submit" className="h-12 w-[150px] shrink-0">
            Subscribe
          </Button>
        </form>
        <p>
          We respect your privacy. Unsubscribe at any time.{" "}
          <Link to="/info/privacy" className="text-blue-400 hover:underline">
            Privacy Policy
          </Link>
        </p>
      </div>
      <div className="mt-28 flex flex-col bg-deep py-5 text-center text-white">
        <p>Quick Links</p>
        <div className="container-page flex flex-row flex-wrap justify-center gap-5 pt-2 lg:flex-nowrap lg:justify-between lg:px-10">
          {QUICK_LINKS.map((link) => (
            <Link key={link.label} to={link.to} className="text-sm hover:text-brand-tint lg:text-lg">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
