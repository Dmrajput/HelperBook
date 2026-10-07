function allowedOrigins() {
  return (process.env.CLIENT_URL || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

export function corsOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  const origins = allowedOrigins();

  return {
    origin(origin, callback) {
      if (!origin || !isProduction) {
        callback(null, true);
        return;
      }

      if (origins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}
