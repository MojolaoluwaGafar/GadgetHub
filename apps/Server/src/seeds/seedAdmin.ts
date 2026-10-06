import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { connectDB } from "../config/DB";
import { User } from "../Models/User";

// Creates the admin account, or promotes an existing account and sets its
// password. Credentials come from the environment, never the code (the first
// version's seedAdmin.js had the password written in it, in a public repo).
//
//   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run seed:admin
//
// ADMIN_PHONE, ADMIN_FIRST_NAME and ADMIN_LAST_NAME are used for a new account.

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!email) throw new Error("Set ADMIN_EMAIL.");
  if (password.length < 12) throw new Error("Set ADMIN_PASSWORD (12+ characters).");

  await connectDB();
  const hash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });

  if (existing) {
    existing.role = "admin";
    existing.password = hash;
    // Signs the account out everywhere, since the password changed.
    existing.tokenVersion = (existing.tokenVersion ?? 0) + 1;
    await existing.save();
    console.log(`${email} is an admin and its password was updated.`);
    return;
  }

  await User.create({
    firstName: process.env.ADMIN_FIRST_NAME?.trim() || "Admin",
    lastName: process.env.ADMIN_LAST_NAME?.trim() || "GadgetHub",
    email,
    phoneNumber: process.env.ADMIN_PHONE?.trim() || "+234 000 000 0000",
    password: hash,
    role: "admin",
  });
  console.log(`Created admin ${email}. Sign in at /admin/login.`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
