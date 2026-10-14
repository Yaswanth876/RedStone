import client from "prom-client";

/**
 * RedStone Prometheus Metrics Instrumentation Module
 * 
 * Exposes bounded, low-cardinality metrics:
 * - HTTP request count & rate
 * - HTTP request duration histogram
 * - In-flight requests gauge
 * - HTTP errors counter
 * - Node.js process CPU, memory, and uptime metrics
 * - Database health gauge
 */

// Dedicated isolated registry to avoid global registration conflicts
export const register = new client.Registry();

// Standard Node.js default process and runtime metrics
client.collectDefaultMetrics({
  register,
  prefix: "redstone_",
});

// ─── Custom Metrics ──────────────────────────────────────────────────────────

/** Total count of processed HTTP requests */
export const httpRequestsTotal = new client.Counter({
  name: "redstone_http_requests_total",
  help: "Total count of HTTP requests processed by RedStone API",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

/** Latency histogram for HTTP requests */
export const httpRequestDuration = new client.Histogram({
  name: "redstone_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

/** Currently active requests */
export const httpRequestsInFlight = new client.Gauge({
  name: "redstone_http_requests_in_flight",
  help: "Number of HTTP requests currently being processed",
  labelNames: ["method"],
  registers: [register],
});

/** HTTP error count (4xx client errors, 5xx server errors) */
export const httpErrorsTotal = new client.Counter({
  name: "redstone_http_errors_total",
  help: "Total count of HTTP request errors",
  labelNames: ["method", "route", "status_code", "error_type"],
  registers: [register],
});

/** Database connectivity status indicator (1 = healthy/connected, 0 = disconnected) */
export const databaseStatus = new client.Gauge({
  name: "redstone_database_status",
  help: "Database connection status (1 for connected, 0 for disconnected)",
  registers: [register],
});

// Set default database status to 1 on initial startup
databaseStatus.set(1);

// ─── Route Normalization Helper ──────────────────────────────────────────────

/**
 * Normalize express route paths to bound label cardinality.
 * Never includes raw user IDs, emails, query parameters, or arbitrary tokens.
 *
 * @param {import("express").Request} req
 * @returns {string} Normalized route label (e.g. "/api/timetables/:id/entries")
 */
export function normalizeRoute(req) {
  // If matched by an Express route handler
  if (req.route && req.route.path) {
    const base = req.baseUrl || "";
    const routePath = req.route.path === "/" && base ? "" : req.route.path;
    return `${base}${routePath}`;
  }

  // Handle known top-level health and metrics routes
  if (req.path === "/api/health" || req.path === "/api/health/ready") {
    return req.path;
  }
  if (req.path === "/metrics") {
    return "/metrics";
  }

  // Bound unmatched 404 routes to prevent label explosion from random path scans
  return "unmatched";
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/**
 * Express middleware to record request duration, in-flight count, and total counts.
 * Explicitly excludes /metrics from its own metrics to avoid circular skew.
 */
export function metricsMiddleware(req, res, next) {
  // Exclude metrics endpoint from request instrumentation
  if (req.path === "/metrics" || req.path === "/api/metrics") {
    return next();
  }

  const startTime = process.hrtime.bigint();
  httpRequestsInFlight.inc({ method: req.method });

  res.on("finish", () => {
    httpRequestsInFlight.dec({ method: req.method });

    const endTime = process.hrtime.bigint();
    const durationSeconds = Number(endTime - startTime) / 1e9;
    const route = normalizeRoute(req);
    const statusCode = String(res.statusCode);

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: statusCode,
    });

    httpRequestDuration.observe(
      {
        method: req.method,
        route,
        status_code: statusCode,
      },
      durationSeconds
    );

    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? "server_error" : "client_error";
      httpErrorsTotal.inc({
        method: req.method,
        route,
        status_code: statusCode,
        error_type: errorType,
      });
    }
  });

  next();
}

// ─── Endpoint Handler ────────────────────────────────────────────────────────

/**
 * HTTP handler for GET /metrics endpoint.
 * Supports authentication protection via METRICS_TOKEN if configured in the environment.
 */
export async function metricsHandler(req, res) {
  const expectedToken = process.env.METRICS_TOKEN;

  // Protect metrics endpoint when token is set
  if (expectedToken) {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const customHeaderToken = req.headers["x-metrics-token"];
    const queryToken = req.query?.token;

    const providedToken = bearerToken || customHeaderToken || queryToken;

    if (!providedToken || providedToken !== expectedToken) {
      return res.status(401).json({ error: "Unauthorized access to metrics" });
    }
  }

  try {
    res.set("Content-Type", register.contentType);
    const metrics = await register.metrics();
    return res.end(metrics);
  } catch (err) {
    return res.status(500).json({ error: "Failed to collect metrics" });
  }
}
