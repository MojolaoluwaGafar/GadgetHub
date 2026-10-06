import { Suspense, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Bell, ChevronDown, LayoutGrid, LogOut, Menu, Search, Settings, UserRound, X } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { PageLoader } from "../Components";
import { ConfirmDialog } from "../Components/Modal";
import { cx, initials } from "../utils/format";
import logo from "../assets/logo.png";
import ordersIcon from "../assets/icons/orders.png";
import ordersActiveIcon from "../assets/icons/orders-active.png";
import productsIcon from "../assets/icons/products.png";
import productsActiveIcon from "../assets/icons/products-active.png";

type NavItem = { to: string; label: string; end?: boolean; icon: (active: boolean) => ReactNode };

const NAV: NavItem[] = [
  { to: "/admin", label: "Dashboard", end: true, icon: () => <LayoutGrid className="h-5 w-5" /> },
  { to: "/admin/orders", label: "Orders", icon: (active) => <img src={active ? ordersActiveIcon : ordersIcon} alt="" className="h-5 w-5" /> },
  { to: "/admin/products", label: "Products", icon: (active) => <img src={active ? productsActiveIcon : productsIcon} alt="" className="h-5 w-5" /> },
  { to: "/admin/customers", label: "Customers", icon: () => <UserRound className="h-5 w-5" /> },
  { to: "/admin/settings", label: "Account Settings", icon: () => <Settings className="h-5 w-5" /> },
];

// The design's sidebar.
function SideNav({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div className="flex h-full flex-col py-5">
      <Link to="/admin" className="ml-5">
        <img src={logo} alt="GadgetHub admin" className="h-[34px] w-[134px] object-contain" />
      </Link>
      <nav className="w-full pt-6" aria-label="Admin">
        {NAV.map(({ to, label, end, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cx("flex h-11 items-center gap-2 pl-5 font-semibold", isActive ? "border-r-[3px] border-brand bg-brand-soft text-brand" : "text-subtle hover:text-ink")}
          >
            {({ isActive }) => (
              <>
                {icon(isActive)} {label}
              </>
            )}
          </NavLink>
        ))}
        <button type="button" onClick={onSignOut} className="flex h-11 w-full items-center gap-2 pl-5 pt-8 font-semibold text-[#e60e0e]">
          <LogOut className="h-5 w-5" /> Sign Out
        </button>
      </nav>
    </div>
  );
}

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
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

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f7fa]" aria-hidden="true">
        <Bell className="h-5 w-5" />
      </span>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2">
        <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{initials(user?.firstName, user?.lastName)}</span>
        <span className="hidden text-left sm:block">
          <span className="block text-sm font-semibold">Admin {user?.firstName}</span>
          <span className="block text-sm">{user?.email}</span>
        </span>
        <ChevronDown className={cx("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 flex w-[185px] flex-col gap-1 rounded-md bg-white p-3 shadow-float motion-safe:animate-fade-in">
          <Link to="/admin/settings" className="py-1 hover:text-brand">
            Account Settings
          </Link>
          <Link to="/" className="py-1 hover:text-brand">
            View store
          </Link>
          <button type="button" onClick={onSignOut} className="py-1 text-left text-[#e60e0e]">
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

// "Search orders, products...": goes to the products list from Products,
// otherwise to orders.
function TopSearch() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [q, setQ] = useState("");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const base = pathname.startsWith("/admin/products") ? "/admin/products" : "/admin/orders";
    navigate(q.trim() ? `${base}?q=${encodeURIComponent(q.trim())}` : base);
    setQ("");
  };
  return (
    <form onSubmit={submit} className="relative hidden h-11 w-1/2 max-w-md md:block" role="search">
      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink" aria-hidden="true" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search orders, products..."
        aria-label="Search orders or products"
        className="h-11 w-full rounded-md border border-[#d4d1d1] pl-10 pr-3 focus:border-brand focus:outline-none"
      />
    </form>
  );
}

export default function AdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="sticky top-0 hidden h-screen w-[250px] shrink-0 border-r border-[#e6e3e3] shadow-md lg:block">
        <SideNav onSignOut={() => setConfirm(true)} />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-[90] bg-black/50 lg:hidden" onMouseDown={() => setMenuOpen(false)}>
          <aside className="relative h-full w-[270px] bg-white shadow-float" onMouseDown={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setMenuOpen(false)} className="absolute right-3 top-4 rounded-md p-2 hover:bg-panel" aria-label="Close menu">
              <X className="h-5 w-5" />
            </button>
            <SideNav onSignOut={() => setConfirm(true)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-[#e6eff5] px-5 py-5">
          <button type="button" onClick={() => setMenuOpen(true)} className="-ml-2 rounded-md p-2 lg:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </button>
          <TopSearch />
          <UserMenu onSignOut={() => setConfirm(true)} />
        </header>
        <main className="flex-1 px-5 py-4">
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          signOut();
          navigate("/admin/login");
        }}
        icon={<LogOut />}
        title="Confirm Sign Out"
        text="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
      />
    </div>
  );
}

// The title row at the top of each admin page.
export function AdminHeading({ title, text, action }: { title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-2">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {action}
    </div>
  );
}
