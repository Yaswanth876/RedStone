# RedStone Backend API ⚙️

The backend API server for **RedStone**, built with **Node.js (ES Modules)**, **Express 5**, **Prisma ORM**, and **PostgreSQL**.

---

## 🚀 Running Locally

Create `backend/.env` (see [`.env.example`](./.env.example) for reference):

```env
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/redstone?schema=public
JWT_SECRET=super-secure-local-development-secret-32-chars-long
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

Install dependencies and run database migrations:

```bash
npm install
npx prisma migrate deploy
npm run dev
# Server runs at http://localhost:4000
```

---

## 🧪 Testing

Execute the isolated backend integration test suite:

```bash
npm test
```

Tests run non-destructively against the configured database, creating isolated UUID entities and cleaning up their own data. They never drop or reset developer data.

---

## 📊 Prometheus Observability & Health

The backend includes native Prometheus instrumentation via `prom-client`:

- `GET /metrics`: Standard Prometheus metrics exporter (HTTP request count, duration histogram, error count, in-flight gauge, process CPU/RSS memory/heap, and database status).
  - **Security:** If `METRICS_TOKEN` is set in the environment, `/metrics` requires `Authorization: Bearer <METRICS_TOKEN>` or `X-Metrics-Token`.
  - Self-exclusion: The `/metrics` endpoint is excluded from its own metrics to avoid circular skew.
  - Low Cardinality: Route labels are strictly bounded (e.g. `/api/timetables/:id/entries`).
- `GET /api/health`: Lightweight liveness check (HTTP 200).
- `GET /api/health/ready`: Deep readiness probe verifying database connectivity (`SELECT 1`). Returns HTTP 200 when ready, HTTP 503 when the database is unreachable.

---

## 🔒 Security Architecture

1. **Authentication:** Salted bcrypt hashing with 12 cost rounds on registration; signed JWT bearer tokens for protected routes.
2. **Access Control & Multi-Tenancy:** Timetables and entries strictly verify ownership against the authenticated user (`where: { id, userId: req.user.id }`), preventing Insecure Direct Object Reference (IDOR) attacks.
3. **HTTP Hardening:** Helmet security headers, `X-Powered-By` suppression, JSON request limits (`JSON_BODY_LIMIT`), and IP rate limiting on `/api/auth` endpoints.
4. **File Upload Safety:** In-memory Multer processing with strict file size caps (10 MB), extension checks, MIME filtering, and magic byte file signature verification.

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` — Register a new student account (`name`, `email`, `password`).
- `POST /api/auth/login` — Authenticate and receive a JWT.

### Timetables
- `GET /api/timetables` — List all timetables for the authenticated user.
- `POST /api/timetables` — Create a new timetable.
- `GET /api/timetables/:id` — Fetch specific timetable details.
- `PATCH /api/timetables/:id` — Update timetable name.
- `DELETE /api/timetables/:id` — Delete timetable and cascade-delete its entries.

### Timetable Entries
- `GET /api/timetables/:id/entries` — List all entries sorted by weekday and start time.
- `POST /api/timetables/:id/entries` — Create class entry (enforces overlap validation).
- `GET /api/timetables/:id/entries/day/:day` — List entries for specific weekday (1=Mon ... 7=Sun).
- `GET /api/timetables/:id/entries/week` — List entries grouped by week.
- `GET /api/timetables/:id/entries/:entryId` — Fetch specific entry.
- `PATCH /api/timetables/:id/entries/:entryId` — Update entry details.
- `DELETE /api/timetables/:id/entries/:entryId` — Delete entry.

### Document Upload & Extraction
- `POST /api/timetables/:id/upload` — Multipart upload (`file`). Extracts candidates for review without permanent saving.
- `POST /api/timetables/:id/entries/import` — Atomic bulk commit (`{ entries: [...] }`) inside a database transaction.

### Dashboard
- `GET /api/dashboard?timezone=Asia/Kolkata` — Consolidated agenda, next upcoming class, and 7-day schedule.
- `GET /api/dashboard/today?timezone=Asia/Kolkata` — Today's classes and count.
- `GET /api/dashboard/next-class?timezone=Asia/Kolkata` — Immediate next class.
- `GET /api/dashboard/week?timezone=Asia/Kolkata` — 7-day schedule overview.

---

## 🚢 Production Deployment

### Render Blueprint
The backend is configured for deployment on Render via [`render.yaml`](../render.yaml):
- **Build Command:** `npm install && npx prisma generate && npx prisma migrate deploy`
- **Start Command:** `node src/server.js`
- **Port:** Binds automatically to `0.0.0.0` on `process.env.PORT`.

### Supabase PostgreSQL Connection
When connecting to a managed Supabase database:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxxx.supabase.co:5432/postgres?sslmode=require"
```
*(Ensure special characters in the password are percent-encoded).*
