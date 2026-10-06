import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../Context/AuthContext";

// Pages that need an account: send anyone who isn't signed in to the login
// page, and bring them back to where they were going afterwards. The first
// version rendered the page anyway and redirected from an effect.
export default function ProtectRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}

// The admin: signed-in admins only. Everyone else goes to the admin login. The
// server checks the role on every admin request too; this only avoids showing
// an empty dashboard.
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <>{children}</>;
}
