const REQUIRED_VARIABLES = [
  "PORT",
  "NODE_ENV",
  "MONGODB_URI",
  "OTP_PROVIDER",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "OTP_HASH_SECRET",
  "ACCESS_TOKEN_EXPIRES_IN",
  "REFRESH_TOKEN_EXPIRES_IN",
  "IMAGE_PROVIDER",
];

function assertSecret(name) {
  const value = process.env[name] || "";
  if (value.length < 32 || value.includes("replace_with")) {
    console.error(`${name} must be a random string of at least 32 characters.`);
    process.exit(1);
  }
}

export function assertEnv() {
  const missing = REQUIRED_VARIABLES.filter((name) => {
    const value = process.env[name];
    return typeof value !== "string" || value.trim() === "";
  });

  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.error("PORT must be an integer between 1 and 65535.");
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://")) {
    console.error("MONGODB_URI must be a mongodb:// or mongodb+srv:// connection string.");
    process.exit(1);
  }

  if (!["mock", "twilio"].includes(process.env.OTP_PROVIDER)) {
    console.error("OTP_PROVIDER must be mock or twilio.");
    process.exit(1);
  }

  if (process.env.OTP_PROVIDER === "mock" && process.env.NODE_ENV === "production") {
    console.error("OTP_PROVIDER=mock cannot be used in production.");
    process.exit(1);
  }

  if (process.env.OTP_PROVIDER === "twilio") {
    const twilioMissing = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"].filter(
      (name) => !process.env[name]
    );
    if (twilioMissing.length > 0) {
      console.error(`Missing Twilio environment variables: ${twilioMissing.join(", ")}`);
      process.exit(1);
    }
  }

  if (!["local", "cloudinary"].includes(process.env.IMAGE_PROVIDER)) {
    console.error("IMAGE_PROVIDER must be local or cloudinary.");
    process.exit(1);
  }

  if (process.env.IMAGE_PROVIDER === "local" && process.env.NODE_ENV === "production") {
    console.error("IMAGE_PROVIDER=local cannot be used in production.");
    process.exit(1);
  }

  if (process.env.IMAGE_PROVIDER === "cloudinary") {
    const cloudinaryMissing = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"].filter(
      (name) => !process.env[name]
    );
    if (cloudinaryMissing.length > 0) {
      console.error(`Missing Cloudinary environment variables: ${cloudinaryMissing.join(", ")}`);
      process.exit(1);
    }
  }

  assertSecret("JWT_ACCESS_SECRET");
  assertSecret("JWT_REFRESH_SECRET");
  assertSecret("OTP_HASH_SECRET");
}
