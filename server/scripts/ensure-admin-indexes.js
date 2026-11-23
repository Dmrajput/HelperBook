/**
 * Ensures additive indexes used by the platform admin portal.
 * Safe to re-run. Does not drop or rename existing indexes.
 *
 * Usage: node scripts/ensure-admin-indexes.js
 */
import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

await import("../src/models/AdminAuditLog.js");
await import("../src/models/AdminUser.js");
await import("../src/models/AdminSession.js");
await import("../src/models/Shop.js");
await import("../src/models/Subscription.js");
await import("../src/models/SubscriptionPayment.js");
await import("../src/models/User.js");
await import("../src/models/Employee.js");

if (!process.env.MONGODB_URI) {
  console.error("Set MONGODB_URI before running this script.");
  process.exit(1);
}

await mongoose.connect(process.env.MONGODB_URI);
for (const name of Object.keys(mongoose.models)) {
  await mongoose.models[name].syncIndexes();
  console.log(`Synced indexes: ${name}`);
}
await mongoose.disconnect();
console.log("Admin indexes ensured.");
