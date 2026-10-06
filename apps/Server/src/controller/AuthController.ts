import type { Request, Response } from "express";
import type { AuthRequest } from "../middlewares/Auth";
import {
  AddressSchema,
  DeleteAccountSchema,
  ForgotSchema,
  LoginSchema,
  PasswordSchema,
  ProfileSchema,
  RegisterSchema,
  ResetSchema,
} from "../Validation/authSchema";
import { idParam } from "../Utils/params";
import * as authService from "../Services/authService";

// Validation errors (ZodError) and ServiceErrors thrown here are turned into
// responses by errorHandler (Utils/sendError.ts).

export const register = async (req: Request, res: Response) => {
  const input = RegisterSchema.parse(req.body);
  res.status(201).json({ success: true, ...(await authService.register(input)) });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = LoginSchema.parse(req.body);
  res.status(200).json({ success: true, ...(await authService.login(email, password)) });
};

export const me = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, user: await authService.getMe(req.user!.id) });
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  const input = ProfileSchema.parse(req.body);
  res.status(200).json({ success: true, user: await authService.updateProfile(req.user!.id, input) });
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = PasswordSchema.parse(req.body);
  res.status(200).json({ success: true, ...(await authService.changePassword(req.user!.id, currentPassword, newPassword)) });
};

export const deleteAccount = async (req: AuthRequest, res: Response) => {
  const { password } = DeleteAccountSchema.parse(req.body);
  await authService.deleteAccount(req.user!.id, password);
  res.status(200).json({ success: true, message: "Your account has been deleted." });
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = ForgotSchema.parse(req.body);
  await authService.forgotPassword(email);
  res.status(200).json({
    success: true,
    message: "If that email has an account, a reset link is on its way. Check your inbox and spam folder.",
  });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = ResetSchema.parse(req.body);
  res.status(200).json({ success: true, ...(await authService.resetPassword(token, password)) });
};

export const addAddress = async (req: AuthRequest, res: Response) => {
  const input = AddressSchema.parse(req.body);
  res.status(201).json({ success: true, user: await authService.addAddress(req.user!.id, input) });
};

export const updateAddress = async (req: AuthRequest, res: Response) => {
  const input = AddressSchema.parse(req.body);
  res.status(200).json({ success: true, user: await authService.updateAddress(req.user!.id, idParam(req), input) });
};

export const removeAddress = async (req: AuthRequest, res: Response) => {
  res.status(200).json({ success: true, user: await authService.removeAddress(req.user!.id, idParam(req)) });
};
