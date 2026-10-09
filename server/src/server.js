import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { redactSensitive } from "./utils/redact.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, "../.env") });

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", redactSensitive(error?.message || error));
  process.exit(1);
});

async function startServer() {
  const { assertEnv } = await import("./config/env.js");
  assertEnv();

  const { default: connectDatabase } = await import("./config/database.js");
  await connectDatabase();

  const { default: app } = await import("./app.js");
  const { startNotificationJobs } = await import("./jobs/notification.jobs.js");
  startNotificationJobs();
  const mongoose = (await import("mongoose")).default;
  const port = Number(process.env.PORT);
  const server = app.listen(port, "0.0.0.0", () => {
    console.log(`HelperBook API listening on http://0.0.0.0:${port}`);
  });

  server.on("error", (error) => {
    console.error("Server failed to start:", redactSensitive(error.message));
    process.exit(1);
  });

  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down.`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

startServer().catch((error) => {
  console.error("Server failed to start:", redactSensitive(error?.message || error));
  process.exit(1);
});
