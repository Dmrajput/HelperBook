import crypto from "crypto";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { sendLegalPage } from "./legal/publicPages.js";
import { getReady } from "./controllers/health.controller.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import routes from "./routes/index.js";
import { getLocalUploadRoot } from "./services/storage/providers/local.provider.js";

const app = express();

app.use(helmet());
app.use((req, res, next) => {
  const incoming = typeof req.get("x-request-id") === "string" ? req.get("x-request-id").slice(0, 80) : "";
  req.id = incoming || crypto.randomUUID();
  res.setHeader("X-Request-Id", req.id);
  next();
});
morgan.token("id", (req) => req.id || "-");
app.use(morgan(process.env.NODE_ENV === "production"
  ? ':id :remote-addr [:date[iso]] ":method :url" :status :response-time ms'
  : "dev"));
app.use("/api/subscriptions/webhook", express.raw({ type: "*/*", limit: "256kb" }));
app.use(express.json({ limit: "100kb" }));
app.use(cors(corsOptions()));
app.use("/uploads", (req, res, next) => {
  if (process.env.IMAGE_PROVIDER !== "local" || process.env.NODE_ENV === "production") {
    next();
    return;
  }

  express.static(getLocalUploadRoot(), { index: false })(req, res, next);
});
app.get("/api/ready", getReady);
app.get("/privacy", (req, res) => sendLegalPage(res, "privacy-policy.md", "HelperBook privacy policy"));
app.get("/terms", (req, res) => sendLegalPage(res, "terms-of-service.md", "HelperBook terms of service"));
app.get("/delete-account", (req, res) => sendLegalPage(res, "account-deletion.md", "Delete a HelperBook account"));
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
