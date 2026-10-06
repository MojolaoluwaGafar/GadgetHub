import { Router } from "express";
import { optionalAuth, requireAdmin, requireAuth } from "../middlewares/Auth";
import { authLimiter, orderLimiter, resetLimiter, uploadLimiter } from "../middlewares/RateLimiter";
import { imageUpload } from "../middlewares/Upload";
import * as auth from "../controller/AuthController";
import * as products from "../controller/ProductController";
import * as orders from "../controller/OrderController";
import * as admin from "../controller/AdminController";

// Every route, mounted under /api in index.ts.
const router = Router();

// ---------------------------------------------------------------- accounts
router.post("/auth/register", authLimiter, auth.register);
router.post("/auth/login", authLimiter, auth.login);
router.post("/auth/forgot-password", resetLimiter, auth.forgotPassword);
router.post("/auth/reset-password", authLimiter, auth.resetPassword);
router.get("/auth/me", requireAuth, auth.me);
router.patch("/auth/me", requireAuth, auth.updateProfile);
router.delete("/auth/me", requireAuth, authLimiter, auth.deleteAccount);
router.post("/auth/password", requireAuth, authLimiter, auth.changePassword);
router.post("/auth/addresses", requireAuth, auth.addAddress);
router.patch("/auth/addresses/:id", requireAuth, auth.updateAddress);
router.delete("/auth/addresses/:id", requireAuth, auth.removeAddress);

// ---------------------------------------------------------------- catalog
// "/products/facets" must come before "/products/:id", or ":id" swallows it.
router.get("/config", products.config);
router.get("/products", products.list);
router.get("/products/facets", products.facets);
router.get("/products/:id", products.detail);
router.get("/products/:id/related", products.related);
router.get("/products/:id/reviews", optionalAuth, products.reviews);
router.post("/products/:id/reviews", requireAuth, products.addReview);

// ---------------------------------------------------------------- orders & payments
router.post("/orders", requireAuth, orderLimiter, orders.place);
router.get("/orders/mine", requireAuth, orders.mine);
router.get("/orders/:id", requireAuth, orders.detail);
router.post("/orders/:id/cancel", requireAuth, orders.cancel);
router.post("/orders/:id/pay", requireAuth, orderLimiter, orders.pay);
router.post("/payments/paystack/verify", requireAuth, orders.verifyPayment);
// The first version's webhook addresses too, in case Paystack still points there.
router.post(["/payments/paystack/webhook", "/payments/webhook", "/webhooks/paystack"], orders.paystackWebhook);

// ---------------------------------------------------------------- admin
router.get("/admin/stats", requireAdmin, admin.stats);
router.get("/admin/products", requireAdmin, admin.products);
router.get("/admin/products/:id", requireAdmin, admin.product);
router.post("/admin/products", requireAdmin, admin.createProduct);
router.put("/admin/products/:id", requireAdmin, admin.updateProduct);
router.delete("/admin/products/:id", requireAdmin, admin.deleteProduct);
router.post("/admin/uploads", requireAdmin, uploadLimiter, imageUpload, admin.upload);
router.get("/admin/orders", requireAdmin, admin.orders);
router.get("/admin/orders/:id", requireAdmin, admin.order);
router.patch("/admin/orders/:id", requireAdmin, admin.updateOrder);
router.post("/admin/orders/:id/check-payment", requireAdmin, admin.checkPayment);
router.get("/admin/customers", requireAdmin, admin.customers);

export default router;
