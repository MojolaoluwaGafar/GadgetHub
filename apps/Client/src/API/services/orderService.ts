import api from "../index";
import type { Order, PlaceOrderInput, PlaceOrderResponse } from "../../types";

export const orderService = {
  async place(input: PlaceOrderInput): Promise<PlaceOrderResponse> {
    const { data } = await api.post<PlaceOrderResponse>("/api/orders", input);
    return data;
  },

  async mine(): Promise<Order[]> {
    const { data } = await api.get<{ orders: Order[] }>("/api/orders/mine");
    return data.orders;
  },

  async get(id: string): Promise<Order> {
    const { data } = await api.get<{ order: Order }>(`/api/orders/${id}`);
    return data.order;
  },

  async cancel(id: string): Promise<Order> {
    const { data } = await api.post<{ order: Order }>(`/api/orders/${id}/cancel`);
    return data.order;
  },

  /** A fresh Paystack checkout link for an unpaid order. */
  async pay(id: string): Promise<string> {
    const { data } = await api.post<{ paymentUrl: string }>(`/api/orders/${id}/pay`);
    return data.paymentUrl;
  },

  async verifyPayment(reference: string): Promise<Order> {
    const { data } = await api.post<{ order: Order }>("/api/payments/paystack/verify", { reference });
    return data.order;
  },
};
