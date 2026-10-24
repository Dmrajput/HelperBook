/**
 * Drop the broken sparse unique index on razorpayPaymentId (null duplicates)
 * and sync the partial unique index from the SubscriptionPayment model.
 */
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { default: SubscriptionPayment } = await import("../src/models/SubscriptionPayment.js");

await mongoose.connect(process.env.MONGODB_URI);
const collection = mongoose.connection.collection("subscriptionpayments");

const unsetResult = await collection.updateMany(
  { razorpayPaymentId: null },
  { $unset: { razorpayPaymentId: "" } }
);
console.log(`Unset null razorpayPaymentId on ${unsetResult.modifiedCount} document(s).`);

const indexes = await collection.indexes();
const bad = indexes.find((idx) => idx.name === "razorpayPaymentId_1");
if (bad) {
  await collection.dropIndex("razorpayPaymentId_1");
  console.log("Dropped index razorpayPaymentId_1");
}

await SubscriptionPayment.syncIndexes();
console.log("Synced SubscriptionPayment indexes.");
console.log(await collection.indexes());

await mongoose.disconnect();
