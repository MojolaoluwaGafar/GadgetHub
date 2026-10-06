import api from "../index";
import { toParams, type ProductQuery } from "./productService";
import type {
  AdminCustomer,
  AdminStats,
  Order,
  OrderStatus,
  Paginated,
  PaymentStatus,
  ProductDetail,
  ProductInput,
  ProductSummary,
  UploadResponse,
} from "../../types";

export type StockFilter = "" | "in" | "low" | "out";

export const adminService = {
  async stats(): Promise<AdminStats> {
    const { data } = await api.get<{ stats: AdminStats }>("/api/admin/stats");
    return data.stats;
  },

  async products(query: ProductQuery & { stock?: StockFilter }): Promise<Paginated<ProductSummary>> {
    const { stock, ...rest } = query;
    const { data } = await api.get<Paginated<ProductSummary>>("/api/admin/products", {
      params: { ...toParams(rest), stock: stock || undefined },
    });
    return data;
  },

  async product(id: string): Promise<ProductDetail> {
    const { data } = await api.get<{ product: ProductDetail }>(`/api/admin/products/${id}`);
    return data.product;
  },

  async createProduct(input: ProductInput): Promise<ProductDetail> {
    const { data } = await api.post<{ product: ProductDetail }>("/api/admin/products", input);
    return data.product;
  },

  async updateProduct(id: string, input: ProductInput): Promise<ProductDetail> {
    const { data } = await api.put<{ product: ProductDetail }>(`/api/admin/products/${id}`, input);
    return data.product;
  },

  async deleteProduct(id: string): Promise<void> {
    await api.delete(`/api/admin/products/${id}`);
  },

  async uploadImage(file: File): Promise<UploadResponse> {
    const form = new FormData();
    form.append("image", file);
    const { data } = await api.post<UploadResponse>("/api/admin/uploads", form, {
      // Let the browser set multipart/form-data with its boundary.
      headers: { "Content-Type": undefined },
    });
    return data;
  },

  async orders(query: { q?: string; status?: OrderStatus | ""; payment?: PaymentStatus | ""; page?: number }): Promise<Paginated<Order>> {
    const { data } = await api.get<Paginated<Order>>("/api/admin/orders", {
      params: {
        q: query.q?.trim() || undefined,
        status: query.status || undefined,
        payment: query.payment || undefined,
        page: query.page,
      },
    });
    return data;
  },

  async order(id: string): Promise<Order> {
    const { data } = await api.get<{ order: Order }>(`/api/admin/orders/${id}`);
    return data.order;
  },

  async updateOrder(id: string, input: { status?: OrderStatus; paymentStatus?: PaymentStatus }): Promise<Order> {
    const { data } = await api.patch<{ order: Order }>(`/api/admin/orders/${id}`, input);
    return data.order;
  },

  async checkPayment(id: string): Promise<Order> {
    const { data } = await api.post<{ order: Order }>(`/api/admin/orders/${id}/check-payment`);
    return data.order;
  },

  async customers(query: { q?: string; page?: number }): Promise<Paginated<AdminCustomer>> {
    const { data } = await api.get<Paginated<AdminCustomer>>("/api/admin/customers", {
      params: { q: query.q?.trim() || undefined, page: query.page },
    });
    return data;
  },
};
