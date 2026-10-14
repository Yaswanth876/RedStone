# RedStone — Production Monitoring & Observability

This directory contains the production observability configuration for the RedStone student timetable and productivity application using **Prometheus** and **Grafana Cloud**.

---

## 1. Architecture Overview

```
┌─────────────────────────────────┐
│     RedStone Express API        │
│  (Render / Node.js Runtime)     │
│  - Endpoint: GET /metrics       │
│  - Auth: Optional METRICS_TOKEN │
└────────────────┬────────────────┘
                 │ Scrapes every 15s
                 ▼
┌─────────────────────────────────┐
│     Prometheus Scraper          │
│  (Grafana Cloud Agent / Local)  │
│  - Evaluates alert rules        │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│        Grafana Dashboard        │
│  - Real-time Traffic & Latency  │
│  - System Resources & Errors    │
│  - Database Connectivity        │
└─────────────────────────────────┘
```

---

## 2. Metrics Exposed

The RedStone backend exposes standard Prometheus text-format metrics at `GET /metrics`:

| Metric Name | Type | Description | Labels |
|---|---|---|---|
| `redstone_http_requests_total` | Counter | Total HTTP requests handled | `method`, `route`, `status_code` |
| `redstone_http_request_duration_seconds` | Histogram | Request latency in seconds | `method`, `route`, `status_code`, `le` |
| `redstone_http_requests_in_flight` | Gauge | Active requests currently executing | `method` |
| `redstone_http_errors_total` | Counter | Total 4xx and 5xx errors | `method`, `route`, `status_code`, `error_type` |
| `redstone_database_status` | Gauge | PostgreSQL connectivity (1 = OK, 0 = Down) | (None) |
| `redstone_process_resident_memory_bytes` | Gauge | Node.js process RSS memory in bytes | (None) |
| `redstone_nodejs_heap_size_used_bytes` | Gauge | V8 JavaScript heap memory used | (None) |
| `redstone_process_cpu_user_seconds_total` | Counter | Process user CPU time consumed | (None) |
| `redstone_process_start_time_seconds` | Gauge | Process epoch start time for uptime calculation | (None) |

> **Privacy & Low Cardinality Guarantee:** Route labels are strictly normalized (e.g. `/api/timetables/:id/entries`). Never will user IDs, emails, authentication tokens, query strings, or unmapped paths be used as labels.

---

## 3. Securing the `/metrics` Endpoint

To prevent unauthorized public scraping of internal application metrics in production on Render:

1. In your Render Dashboard, set the environment variable:
   ```env
   METRICS_TOKEN=your-random-secret-token-here
   ```
2. When `METRICS_TOKEN` is present, requests to `/metrics` require authentication via:
   - Header: `Authorization: Bearer <METRICS_TOKEN>`
   - Or Header: `X-Metrics-Token: <METRICS_TOKEN>`
   - Or Query Parameter: `?token=<METRICS_TOKEN>`
3. Requests missing or providing an incorrect token are rejected with HTTP 401 Unauthorized.
4. When `METRICS_TOKEN` is unset (local development or test runs), `/metrics` is publicly readable.

---

## 4. Free Production Monitoring with Grafana Cloud (₹0 Budget)

Grafana Cloud provides a permanent free tier including:
- Up to 10,000 active Prometheus series.
- 50 GB logs, 50 GB traces.
- 3 user seats, 14-day retention.

### Step-by-Step Setup:
1. **Sign Up:** Register for free at [grafana.com/products/cloud](https://grafana.com/products/cloud/).
2. **Add Scrape Target (Grafana Cloud Integrations):**
   - In Grafana Cloud, navigate to **Connections** > **Add new connection** > **Prometheus**.
   - If using Grafana Cloud Hosted Scraper, enter your Render API URL:
     ```text
     https://your-redstone-api.onrender.com/metrics
     ```
   - If `METRICS_TOKEN` is enabled, configure an HTTP Header in the scraper settings:
     ```text
     Authorization: Bearer <YOUR_METRICS_TOKEN>
     ```
3. **Alternative (Prometheus Remote-Write):**
   - If running a lightweight local or cloud Prometheus agent, uncomment the `remote_write` block in `monitoring/prometheus/prometheus.yml` using your Grafana Cloud credentials.
4. **Import the Dashboard:**
   - In Grafana, go to **Dashboards** > **New** > **Import**.
   - Upload or paste the contents of [`monitoring/grafana/dashboards/redstone-api.json`](./grafana/dashboards/redstone-api.json).
   - Select your Prometheus data source.
   - Click **Import**.

---

## 5. Local Monitoring Stack (Docker Compose)

For testing metrics collection and dashboard visualization locally on your workstation:

```bash
# From the project root
docker compose -f monitoring/docker-compose.yml up -d
```

### Accessing Local Services:
- **Prometheus UI:** [http://localhost:9090](http://localhost:9090)
  - Targets: [http://localhost:9090/targets](http://localhost:9090/targets)
  - Alerts: [http://localhost:9090/alerts](http://localhost:9090/alerts)
- **Grafana UI:** [http://localhost:3001](http://localhost:3001)
  - Credentials: username `admin`, password `admin`.
  - Add Prometheus data source targeting `http://prometheus:9090`.
  - Import `redstone-api.json` from the dashboards directory.

> [!IMPORTANT]
> **Host Power Notice:** Local Prometheus running via Docker Compose runs entirely on your local computer. It **cannot** collect metrics, track uptime, or fire alerts when your computer is powered off, suspended, or disconnected from the internet. For 24/7 uninterrupted monitoring on a ₹0 budget, use the Grafana Cloud free tier described above.
