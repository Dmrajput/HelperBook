const REQUIRED_VARIABLES = ["PORT", "NODE_ENV", "MONGODB_URI"];

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
}
