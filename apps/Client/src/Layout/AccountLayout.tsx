import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router";
import { Heart, LogOut, Package, Settings, UserRound } from "lucide-react";
import { useAuth } from "../Context/AuthContext";
import { ConfirmDialog } from "../Components/Modal";
import { cx } from "../utils/format";

const TABS = [
  { to: "/account", label: "My Info", icon: UserRound, end: true },
  { to: "/account/orders", label: "My Orders", icon: Package, end: false },
  { to: "/account/wishlist", label: "Wishlist", icon: Heart, end: true },
  { to: "/account/settings", label: "Account Settings", icon: Settings, end: true },
];

// "Hello Ada", a menu on the left (a scrolling row on phones), the page on the right.
export default function AccountLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirm, setConfirm] = useState(false);

  return (
    <div className="container-page py-6 lg:py-10">
      <div className="grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-10">
        <aside>
          <h1 className="text-[28px] font-semibold">Hello {user?.firstName}</h1>
          <p className="text-subtle">Welcome to your account</p>
          <nav className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 no-scrollbar lg:mx-0 lg:flex-col lg:gap-1 lg:rounded-md lg:border lg:border-[#cdcaca] lg:p-3" aria-label="Account">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    "flex shrink-0 items-center gap-3 whitespace-nowrap rounded-md px-4 py-2.5 font-semibold transition-colors lg:rounded-none lg:border-l-2 lg:text-lg",
                    isActive ? "bg-brand-soft text-ink lg:border-brand" : "text-subtle hover:text-ink lg:border-transparent",
                  )
                }
              >
                <Icon className="h-5 w-5 lg:h-6 lg:w-6" /> {label}
              </NavLink>
            ))}
            <button type="button" onClick={() => setConfirm(true)} className="flex shrink-0 items-center gap-3 px-4 py-2.5 font-semibold text-danger lg:mt-2 lg:text-lg">
              <LogOut className="h-5 w-5 lg:h-6 lg:w-6" /> Sign Out
            </button>
          </nav>
        </aside>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={() => {
          signOut();
          navigate("/");
        }}
        icon={<LogOut />}
        title="Confirm Sign Out"
        text="Are you sure you want to sign out of your account?"
        confirmLabel="Sign Out"
      />
    </div>
  );
}
