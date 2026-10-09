import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const { default: AdminUser } = await import("../src/models/AdminUser.js");
const { hashPassword } = await import("../src/services/admin/adminAuth.service.js");

const email = String(process.env.ADMIN_BOOTSTRAP_EMAIL || "").trim().toLowerCase();
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD || "";
const name = process.env.ADMIN_BOOTSTRAP_NAME || "Super Admin";
const role = process.env.ADMIN_BOOTSTRAP_ROLE || "super_admin";

if (!email || !password) {
  console.error("Set ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD. This command does not create a public account.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
const existing = await AdminUser.findOne({ email });
if (existing) {
  console.error("An admin with this email already exists. This bootstrap command will not replace it.");
  await mongoose.disconnect();
  process.exit(1);
}
const admin = await AdminUser.create({
  email,
  name,
  role,
  passwordHash: await hashPassword(password),
});
console.log(`Created ${admin.role} admin for ${admin.email}.`);
await mongoose.disconnect();
