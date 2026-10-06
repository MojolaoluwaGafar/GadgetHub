import "./App.css";
import { Suspense, type ReactNode } from "react";
import { Navigate, Route, Routes, useParams } from "react-router";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// The pages most visits start on ship in the main bundle. Checkout, the
// account, the auth forms and the whole admin are separate chunks.
import AppLayout from "./Layout/AppLayout";
import HomePage from "./Pages/HomePage";
import ShopPage from "./Pages/ShopPage";
import ProductPage from "./Pages/ProductPage";
import ProtectRoute, { AdminRoute } from "./Components/ProtectRoute";
import ScrollToTop from "./Components/ScrollToTop";
import { PageLoader } from "./Components";
import { lazyPage } from "./utils/lazyPage";

const CartPage = lazyPage(() => import("./Pages/CartPage"));
const CheckoutPage = lazyPage(() => import("./Pages/CheckoutPage"));
const WishlistPage = lazyPage(() => import("./Pages/WishlistPage"));
const AccountWishlistPage = lazyPage(() => import("./Pages/WishlistPage").then((m) => ({ default: m.AccountWishlistPage })));
const InfoPage = lazyPage(() => import("./Pages/InfoPage"));
const NotFoundPage = lazyPage(() => import("./Pages/NotFoundPage"));
const LoginPage = lazyPage(() => import("./Pages/Auth/LoginPage"));
const RegisterPage = lazyPage(() => import("./Pages/Auth/RegisterPage"));
const ForgotPasswordPage = lazyPage(() => import("./Pages/Auth/PasswordPages").then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazyPage(() => import("./Pages/Auth/PasswordPages").then((m) => ({ default: m.ResetPasswordPage })));
const AccountLayout = lazyPage(() => import("./Layout/AccountLayout"));
const ProfilePage = lazyPage(() => import("./Pages/Account/ProfilePage"));
const MyOrdersPage = lazyPage(() => import("./Pages/Account/OrdersPage"));
const MyOrderPage = lazyPage(() => import("./Pages/Account/OrderDetailPage"));
const AccountSettingsPage = lazyPage(() => import("./Pages/Account/SettingsPage"));
const AdminLayout = lazyPage(() => import("./Layout/AdminLayout"));
const DashboardPage = lazyPage(() => import("./Pages/Admin/DashboardPage"));
const AdminProductsPage = lazyPage(() => import("./Pages/Admin/ProductsPage"));
const AdminOrdersPage = lazyPage(() => import("./Pages/Admin/OrdersPage"));
const AdminOrderPage = lazyPage(() => import("./Pages/Admin/OrderDetailPage"));
const CustomersPage = lazyPage(() => import("./Pages/Admin/CustomersPage"));
const AdminSettingsPage = lazyPage(() => import("./Pages/Admin/SettingsPage"));

const protect = (page: ReactNode) => <ProtectRoute>{page}</ProtectRoute>;

// /resetPassword/:token from emails the first version sent.
function LegacyReset() {
  const { token } = useParams();
  return <Navigate to={`/reset-password/${token}`} replace />;
}

function App() {
  return (
    <>
      {/* Pages outside AppLayout (auth, admin) load inside this. */}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ShopPage />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/info/:slug" element={<InfoPage />} />

          <Route path="/account" element={protect(<AccountLayout />)}>
            <Route index element={<ProfilePage />} />
            <Route path="orders" element={<MyOrdersPage />} />
            <Route path="orders/:id" element={<MyOrderPage />} />
            <Route path="wishlist" element={<AccountWishlistPage />} />
            <Route path="settings" element={<AccountSettingsPage />} />
          </Route>

          {/* Addresses from the first version of the app. */}
          <Route path="/cartpage" element={<Navigate to="/cart" replace />} />
          <Route path="/profile" element={<Navigate to="/account" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Checkout has its own header, as in the design. */}
        <Route path="/checkout" element={protect(<CheckoutPage />)} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/signup" element={<Navigate to="/register" replace />} />
        <Route path="/forgotpassword" element={<Navigate to="/forgot-password" replace />} />
        <Route path="/emailconfirmation" element={<Navigate to="/forgot-password" replace />} />
        <Route path="/resetPassword/:token" element={<LegacyReset />} />

        <Route path="/admin/login" element={<LoginPage admin />} />
        <Route path="/adminLogin" element={<Navigate to="/admin/login" replace />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          {/* Add and edit open a modal over the list. */}
          <Route path="products" element={<AdminProductsPage />}>
            <Route path="new" element={null} />
            <Route path=":id/edit" element={null} />
          </Route>
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
      </Suspense>

      <ToastContainer position="top-center" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnHover={false} draggable limit={3} />
      <ScrollToTop />
    </>
  );
}

export default App;
