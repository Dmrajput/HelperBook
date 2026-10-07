import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import routes from "./routes/index.js";
import { getLocalUploadRoot } from "./services/storage/providers/local.provider.js";

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json({ limit: "100kb" }));
app.use(cors(corsOptions()));
app.use("/uploads", (req, res, next) => {
  if (process.env.IMAGE_PROVIDER !== "local" || process.env.NODE_ENV === "production") {
    next();
    return;
  }

  express.static(getLocalUploadRoot(), { index: false })(req, res, next);
});
app.use("/api", routes);
app.use(notFound);
app.use(errorHandler);

export default app;
