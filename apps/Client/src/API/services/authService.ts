import api from "../index";
import type { AuthResponse, User } from "../../types";

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface AddressInput {
  label: string;
  address: string;
  city: string;
  state: string;
  isDefault: boolean;
}

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/register", input);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/login", { email, password });
    return data;
  },

  async me(): Promise<User> {
    const { data } = await api.get<{ user: User }>("/api/auth/me");
    return data.user;
  },

  async updateProfile(input: { firstName: string; lastName: string; phoneNumber: string }): Promise<User> {
    const { data } = await api.patch<{ user: User }>("/api/auth/me", input);
    return data.user;
  },

  // Signs out every other device; returns a new login for this one.
  async changePassword(currentPassword: string, newPassword: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/password", { currentPassword, newPassword });
    return data;
  },

  async deleteAccount(password: string): Promise<void> {
    await api.delete("/api/auth/me", { data: { password } });
  },

  async forgotPassword(email: string): Promise<string> {
    const { data } = await api.post<{ message: string }>("/api/auth/forgot-password", { email });
    return data.message;
  },

  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const { data } = await api.post<AuthResponse>("/api/auth/reset-password", { token, password });
    return data;
  },

  async addAddress(input: AddressInput): Promise<User> {
    const { data } = await api.post<{ user: User }>("/api/auth/addresses", input);
    return data.user;
  },

  async updateAddress(id: string, input: AddressInput): Promise<User> {
    const { data } = await api.patch<{ user: User }>(`/api/auth/addresses/${id}`, input);
    return data.user;
  },

  async removeAddress(id: string): Promise<User> {
    const { data } = await api.delete<{ user: User }>(`/api/auth/addresses/${id}`);
    return data.user;
  },
};
