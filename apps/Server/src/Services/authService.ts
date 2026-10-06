import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { AuthResponse, User as UserDto } from "../types/shared";
import { User, type UserDoc } from "../Models/User";
import { Order } from "../Models/Order";
import { jwtSecret, type JWTPayLoad } from "../middlewares/Auth";
import { escapeRegex } from "../Utils/params";
import { logger } from "../Utils/logger";
import { resetPasswordEmail, welcomeEmail } from "../emails/templates";
import { notify, notifyNow } from "./notifyService";
import { toUserDto } from "./mappers";
import { ServiceError } from "./errors";

const TOKEN_LIFETIME = "7d";
const RESET_LIFETIME_MS = 30 * 60 * 1000;
const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown, so a wrong email takes as long
// to reject as a wrong password (and can't be used to find accounts). The
// first version answered "User not found".
const DUMMY_HASH = "$2b$12$CwTycUXWue0Thq9StjUM0uJ8yJ1Xc0Yy9oQH1d5rN0l8mXvZ3s3aK";

function signToken(user: UserDoc): string {
  const payload: JWTPayLoad = { id: String(user._id), v: user.tokenVersion ?? 0 };
  return jwt.sign(payload, jwtSecret(), { expiresIn: TOKEN_LIFETIME });
}

const authResponse = (user: UserDoc): AuthResponse => ({ token: signToken(user), user: toUserDto(user) });

const hashResetToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

// Emails are stored lower-case, but check case-insensitively too in case an
// older account wasn't.
async function findByEmail(email: string, withSecrets = false): Promise<UserDoc | null> {
  const select = withSecrets ? "+password" : "";
  const exact = await User.findOne({ email }).select(select);
  if (exact) return exact;
  return User.findOne({ email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } }).select(select);
}

export async function loadUser(id: string, withPassword = false): Promise<UserDoc> {
  const user = await User.findById(id).select(withPassword ? "+password" : "");
  if (!user) throw new ServiceError(401, "Please sign in again.");
  return user;
}

async function assertPhoneFree(phoneNumber: string, exceptId?: string) {
  const taken = await User.exists({ phoneNumber, ...(exceptId ? { _id: { $ne: exceptId } } : {}) });
  if (taken) throw new ServiceError(409, "Another account already uses this phone number.", "phoneNumber");
}

export async function register(input: {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}): Promise<AuthResponse> {
  if (await findByEmail(input.email)) {
    throw new ServiceError(409, "An account with this email already exists. Sign in instead.", "email");
  }
  await assertPhoneFree(input.phoneNumber);
  const user = await User.create({ ...input, password: await bcrypt.hash(input.password, BCRYPT_ROUNDS) });
  notify(user.email, welcomeEmail(user.firstName));
  return authResponse(user);
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await findByEmail(email, true);
  const matches = await bcrypt.compare(password, user?.password || DUMMY_HASH).catch(() => false);
  if (!user || !matches) throw new ServiceError(401, "That email or password isn't right.");
  return authResponse(user);
}

export async function getMe(id: string): Promise<UserDto> {
  return toUserDto(await loadUser(id));
}

export async function updateProfile(id: string, input: { firstName: string; lastName: string; phoneNumber: string }): Promise<UserDto> {
  const user = await loadUser(id);
  if (input.phoneNumber !== user.phoneNumber) await assertPhoneFree(input.phoneNumber, id);
  user.set(input);
  await user.save();
  return toUserDto(user);
}

// Signs out every other device and returns a fresh login for this one.
export async function changePassword(id: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
  const user = await loadUser(id, true);
  const matches = await bcrypt.compare(currentPassword, user.password).catch(() => false);
  if (!matches) throw new ServiceError(400, "Your current password isn't right.", "currentPassword");
  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  await user.save();
  return authResponse(user);
}

// Always answers the same way, whether or not the email has an account, so
// the form can't be used to find out who shops here.
export async function forgotPassword(email: string): Promise<void> {
  const user = await findByEmail(email);
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  await User.updateOne(
    { _id: user._id },
    { resetTokenHash: hashResetToken(token), resetTokenExpires: new Date(Date.now() + RESET_LIFETIME_MS) },
  );
  const sent = await notifyNow(user.email, resetPasswordEmail(user.firstName, token));
  if (!sent) logger.warn({ userId: String(user._id) }, "Reset email was not sent");
}

// Sets the new password, signs out every device, and signs this one in.
export async function resetPassword(token: string, password: string): Promise<AuthResponse> {
  const user = await User.findOne({ resetTokenHash: hashResetToken(token), resetTokenExpires: { $gt: new Date() } }).select(
    "+password",
  );
  if (!user) throw new ServiceError(400, "This reset link has expired or was already used. Ask for a new one.");

  user.password = await bcrypt.hash(password, BCRYPT_ROUNDS);
  user.tokenVersion = (user.tokenVersion ?? 0) + 1;
  user.set({ resetTokenHash: undefined, resetTokenExpires: undefined });
  await user.save();
  return authResponse(user);
}

// Orders stay (the shop needs them for its books) with the customer details
// they were placed with; reviews keep their author's short name.
export async function deleteAccount(id: string, password: string): Promise<void> {
  const user = await loadUser(id, true);
  if (user.role === "admin" && (await User.countDocuments({ role: "admin" })) <= 1) {
    throw new ServiceError(400, "You're the only admin, so this account can't be deleted.");
  }
  const matches = await bcrypt.compare(password, user.password).catch(() => false);
  if (!matches) throw new ServiceError(400, "That password isn't right.", "password");
  const open = await Order.exists({ user: user._id, status: { $in: ["pending", "processing", "shipped"] } });
  if (open) throw new ServiceError(409, "You have an order on its way. You can delete your account once it's delivered or cancelled.");
  await user.deleteOne();
}

// ------------------------------------------------------------------ addresses

type AddressInput = { label: string; address: string; city: string; state: string; isDefault?: boolean };

// The first address is the default; making another one the default unsets the rest.
function applyDefault(user: UserDoc, defaultId: string | null) {
  const addresses = user.addresses;
  if (!addresses.length) return;
  const target = defaultId ?? String((addresses.find((a) => a.isDefault) ?? addresses[0])!._id);
  for (const address of addresses) address.isDefault = String(address._id) === target;
}

export async function addAddress(id: string, input: AddressInput): Promise<UserDto> {
  const user = await loadUser(id);
  if (user.addresses.length >= 10) throw new ServiceError(400, "You can save up to 10 addresses.");
  user.addresses.push({ label: input.label, address: input.address, city: input.city, state: input.state, isDefault: false });
  const added = user.addresses[user.addresses.length - 1]!;
  applyDefault(user, input.isDefault ? String(added._id) : null);
  await user.save();
  return toUserDto(user);
}

export async function updateAddress(id: string, addressId: string, input: AddressInput): Promise<UserDto> {
  const user = await loadUser(id);
  const address = user.addresses.id(addressId);
  if (!address) throw new ServiceError(404, "That address doesn't exist anymore.");
  address.set({ label: input.label, address: input.address, city: input.city, state: input.state });
  applyDefault(user, input.isDefault ? addressId : null);
  await user.save();
  return toUserDto(user);
}

export async function removeAddress(id: string, addressId: string): Promise<UserDto> {
  const user = await loadUser(id);
  const address = user.addresses.id(addressId);
  if (!address) throw new ServiceError(404, "That address doesn't exist anymore.");
  address.deleteOne();
  applyDefault(user, null);
  await user.save();
  return toUserDto(user);
}

// From checkout's "save this address": skipped when it's already saved.
export async function rememberAddress(id: string, input: Omit<AddressInput, "label" | "isDefault">): Promise<void> {
  const user = await loadUser(id);
  const same = (a: { address: string; city: string; state: string }) =>
    a.address.toLowerCase() === input.address.toLowerCase() && a.city === input.city && a.state === input.state;
  if (user.addresses.some(same) || user.addresses.length >= 10) return;
  await addAddress(id, { ...input, label: user.addresses.length ? "Other" : "Home" });
}
