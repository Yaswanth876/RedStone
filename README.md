# RedStone 🎓📅

**RedStone** is a student timetable and academic productivity web application designed to help university students manage weekly classes, import institutional schedules from documents, review extracted candidates with validation safeguards, commit approved schedules, and stay organized via an institutional dashboard.

---

## 🚀 Key Features

- **Weekly & Daily Timetable Management:**
  - Interactive calendar views with chronologically sorted class cards.
  - Full CRUD operations with instant client validation and server-side overlap rejection.
  - Active weekday tabs, empty state guidance, and accessible modal dialogs.
- **Document Upload & Extraction (Modules 4 & 5):**
  - Upload college timetables in **PDF**, **CSV**, or **Excel (.xlsx)** formats (up to 10 MB).
  - Safe in-memory parsing with MIME type and magic byte signature verification.
  - Candidate quarantine: Extracted classes are **never** committed directly to the permanent database.
  - Candidate Review Grid: Inline editing, row addition/removal, time validation, duplicate and collision detection.
  - Atomic Save: Single-click confirmation committing approved schedules inside a Prisma `$transaction`.
- **Intelligent Dashboard:**
  - Next upcoming class highlight with countdown context.
  - Today's agenda with class count, room numbers, and faculty details.
  - 7-day visual schedule overview with institutional timezone support.
- **Account & Display Preferences:**
  - 12-hour (AM/PM) vs. 24-hour time format toggle with persistent local storage.
  - Institutional timezone awareness (`America/New_York` / `UTC` / `Asia/Kolkata`).
  - Secure session restoration across page reloads.
- **Zero-Cost Production Architecture & Observability:**
  - Frontend ready for **Vercel** with SPA fallback rewrites.
  - Backend optimized for **Render** (Node.js runtime with `0.0.0.0` binding).
  - Managed **PostgreSQL** support (Supabase, Neon, or Render Postgres).
  - Built-in **Prometheus** metrics (`/metrics`) with token authentication and pre-configured **Grafana Cloud** dashboard.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js (ES Modules), Express 5, Prisma ORM, Zod, Multer, Helmet, CORS |
| **Database** | PostgreSQL (Supabase / Render / Local) |
| **Document Processing** | `pdf-parse`, `csv-parse`, `xlsx` |
| **Observability** | `prom-client` (Prometheus), Grafana Cloud |
| **Testing & QA** | Node Native Test Runner, Vitest, ESLint |

---

## 📁 Repository Structure

```text
RedStone/
├── frontend/                  # React 18 + Vite frontend application
│   ├── src/
│   │   ├── app/               # Router, layout shell, protected/guest routes
│   │   ├── components/        # Shared design system (Button, Card, Modal, Input, etc.)
│   │   ├── features/          # Feature domains (auth, dashboard, timetable, upload, settings)
│   │   ├── services/          # API client & domain service calls
│   │   └── utils/             # Date/time math & formatting utilities
│   ├── test/                  # Unit and integration tests
│   └── vercel.json            # Vercel SPA deployment configuration
├── backend/                   # Node.js + Express API server
│   ├── prisma/
│   │   ├── schema.prisma      # PostgreSQL schema definition
│   │   └── migrations/        # Declarative Prisma migrations
│   ├── src/
│   │   ├── routes/            # Express route controllers (auth, dashboard, timetable, upload)
│   │   ├── services/          # Extraction logic & dashboard date aggregation
│   │   ├── middleware/        # JWT auth, error handler, rate limiter
│   │   ├── metrics.js         # Prometheus instrumentation
│   │   └── server.js          # HTTP listener
│   └── test/                  # Integration test suites
├── monitoring/                # Production observability setup
│   ├── prometheus/            # Prometheus scrape config & alert rules
│   ├── grafana/dashboards/    # Production Grafana dashboard JSON
│   ├── docker-compose.yml     # Optional local Prometheus + Grafana stack
│   └── README.md              # Grafana Cloud zero-cost setup guide
├── render.yaml                # Render Blueprint infrastructure definition
├── vercel.json                # Root Vercel configuration fallback
└── README.md                  # Project documentation (this file)
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: Local instance running on port 5432, or a free [Supabase](https://supabase.com) project.

### 1. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and supply your DATABASE_URL and a secret JWT_SECRET

# Run database migrations
npx prisma migrate deploy

# Start API server in dev mode
npm run dev
# Server runs at http://localhost:4000
```

### 2. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Defaults to VITE_API_BASE_URL=http://localhost:4000/api

# Start development server
npm run dev
# App runs at http://localhost:5173
```

---

## 🧪 Testing & Verification

Both frontend and backend include automated test suites:

```bash
# Run backend integration tests (25 tests covering auth, entries, upload, metrics)
cd backend
npm test

# Run frontend tests (51 tests covering components, services, and validation)
cd ../frontend
npm run test:node

# Run frontend linter
npm run lint

# Validate frontend production build
npm run build
```

---

## 🚢 Production Deployment (₹0 Budget)

### 1. Database (Supabase PostgreSQL)
1. Create a project at [supabase.com](https://supabase.com).
2. Copy your connection string:
   `postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres?sslmode=require`
3. Percent-encode any special characters in your password (e.g., `@` → `%40`).

### 2. Backend (Render)
1. Connect your repository to [render.com](https://render.com).
2. Render will automatically detect [`render.yaml`](./render.yaml) or you can create a Web Service pointing to root directory `backend`.
3. Build Command: `npm install && npx prisma generate && npx prisma migrate deploy`
4. Start Command: `node src/server.js`
5. Configure Environment Variables:
   - `DATABASE_URL`: Your Supabase connection string with `?sslmode=require`
   - `JWT_SECRET`: Random 32+ character secret
   - `CLIENT_ORIGIN`: Your deployed Vercel frontend URL (e.g. `https://redstone-app.vercel.app`)
   - `METRICS_TOKEN`: Random secret for securing `/metrics`

### 3. Frontend (Vercel)
1. Import repository on [vercel.com](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Set Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend.onrender.com/api`
4. Deploy. [`frontend/vercel.json`](./frontend/vercel.json) automatically handles React Router deep-linking.

### 4. Observability (Grafana Cloud)
1. Sign up for a free Grafana Cloud tier at [grafana.com](https://grafana.com).
2. Add a hosted Prometheus scraper pointing to `https://your-backend.onrender.com/metrics`.
3. Import [`monitoring/grafana/dashboards/redstone-api.json`](./monitoring/grafana/dashboards/redstone-api.json).
4. See [`monitoring/README.md`](./monitoring/README.md) for full instructions.

---

## 🔒 Security Best Practices Implemented

- **Password Hashing:** Passwords are never stored in plaintext (salted bcrypt with 12 cost rounds).
- **JWT Protection:** Short/long-lived signed tokens with minimum 32-character production secret enforcement.
- **Access Control:** User isolation on all database models (`Timetable.userId == req.user.id`).
- **File Upload Safeguards:** `multer.memoryStorage()`, 10 MB ceiling, extension/MIME filtering, and magic byte validation against file header signatures.
- **Atomic Operations:** Bulk imports use PostgreSQL transactions (`prisma.$transaction`) ensuring zero partial imports.
- **Low Cardinality Metrics:** Prometheus route labels are strictly normalized to prevent memory exhaustion attacks.

---

## 📄 License
ISC
