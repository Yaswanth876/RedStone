import "dotenv/config";

export function validateEnvironment() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required");
  }
  if (process.env.NODE_ENV === "production" && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must contain at least 32 characters in production");
  }
}

export function getAllowedOrigins() {
  const raw = process.env.CLIENT_ORIGIN || "http://localhost:5173";
  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT) || 4000,
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  allowedOrigins: getAllowedOrigins(),
  jsonLimit: process.env.JSON_BODY_LIMIT || "1mb",
  metricsToken: process.env.METRICS_TOKEN || null,
};
