import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const id = process.env.RAZORPAY_KEY_ID || "";
const secret = process.env.RAZORPAY_KEY_SECRET || "";
const webhook = process.env.RAZORPAY_WEBHOOK_SECRET || "";

console.log(
  JSON.stringify(
    {
      envFile: path.resolve(__dirname, "../.env"),
      NODE_ENV: process.env.NODE_ENV || "",
      hasKeyId: Boolean(id.trim()),
      hasKeySecret: Boolean(secret.trim()),
      hasWebhookSecret: Boolean(webhook.trim()),
      keyIdLength: id.length,
      keySecretLength: secret.length,
      keyIdPrefix: id.trim().slice(0, 8),
      keyIdLooksQuoted: /^["']/.test(id.trim()) || /["']$/.test(id.trim()),
      keySecretLooksQuoted: /^["']/.test(secret.trim()) || /["']$/.test(secret.trim()),
      configured: Boolean(id.trim() && secret.trim()),
    },
    null,
    2
  )
);
