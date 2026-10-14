import { config, validateEnvironment } from "./config.js";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import timetableRoutes from "./routes/timetable.routes.js";
import timetableEntryRoutes from "./routes/timetable-entry.routes.js";
import timetableUploadRoutes from "./routes/timetable-upload.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import authRoutes from "./routes/auth.routes.js";
import prisma from "./db.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import { metricsMiddleware, metricsHandler, databaseStatus } from "./metrics.js";

validateEnvironment();
const app = express();

app.disable("x-powered-by");
app.use(helmet());

// Configure CORS for local development and deployed Vercel origins
const allowedOrigins = config.allowedOrigins;
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-side health checks)
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
        return callback(null, true);
      }
      // Support Vercel deployments (e.g. https://red-stone-nine.vercel.app and preview branches)
      if (
        /^https:\/\/(?:redstone|red-stone)[a-z0-9-]*\.vercel\.app$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: config.jsonLimit }));

// Apply Prometheus metrics collection middleware before routes
app.use(metricsMiddleware);

// Expose Prometheus metrics endpoint
app.get("/metrics", metricsHandler);

app.use("/api/auth", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT) || 100,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { error: "Too many authentication requests, please try again later" },
}));
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/timetables", timetableRoutes);
app.use("/api/timetables/:timetableId/entries", timetableEntryRoutes);
app.use("/api/timetables/:timetableId", timetableUploadRoutes);
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "RedStone API is running" });
});
app.get("/api/health/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    databaseStatus.set(1);
    return res.status(200).json({ status: "ready" });
  } catch (error) {
    databaseStatus.set(0);
    console.error("Readiness check failed:", error);
    return res.status(503).json({ status: "unavailable", error: "Database unavailable" });
  }
});

app.use("/api", notFoundHandler);
app.use(errorHandler);

export default app;
