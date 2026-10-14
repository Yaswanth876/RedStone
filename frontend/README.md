# RedStone Frontend 🎨

The client-side single page application (SPA) for **RedStone**, built with **React 18**, **Vite**, **Tailwind CSS**, and **React Router v6**.

---

## 🏗️ Architecture & Component Structure

```text
src/
├── app/
│   ├── App.jsx                 # Application root with Auth & Preferences providers
│   ├── router.jsx              # Centralized route definitions
│   ├── ProtectedRoute.jsx      # Route guard for authenticated users
│   └── GuestRoute.jsx          # Redirects logged-in users away from /login
├── components/
│   ├── layout/                 # Shell components (AppLayout, Sidebar, PageHeader, UserMenu)
│   └── ui/                     # Reusable design primitives:
│       ├── Button.jsx          # Primary, secondary, danger, ghost variants with loading states
│       ├── Card.jsx            # Glassmorphic and bordered card surfaces
│       ├── Modal.jsx           # Accessible dialog with focus trap & Escape handling
│       ├── Input.jsx           # Form field with labels & aria-describedby validation
│       ├── Select.jsx          # Accessible custom select dropdown
│       ├── Badge.jsx           # Status badges (success, warning, error, info)
│       ├── EmptyState.jsx      # Empty state placeholder with call-to-action
│       ├── Alert.jsx           # Inline alert banners
│       └── Skeleton.jsx        # Loading skeleton placeholders
├── features/
│   ├── auth/                   # Authentication domain:
│   │   ├── AuthContext.jsx     # Session state & sessionStorage persistence
│   │   ├── useAuth.js          # Authentication consumer hook
│   │   ├── LoginPage.jsx       # Login form with validation
│   │   └── RegisterPage.jsx    # Registration form
│   ├── dashboard/              # Overview & schedule insights:
│   │   ├── DashboardPage.jsx   # Consolidated dashboard view
│   │   ├── UpNextCard.jsx      # Next upcoming class card
│   │   ├── TodaySchedule.jsx   # Chronological list of today's classes
│   │   └── WeeklyPreview.jsx   # 7-day visual timetable preview
│   ├── timetable/              # Class & schedule management:
│   │   ├── TimetablePage.jsx   # Active timetable controller
│   │   ├── WeeklyTimetable.jsx # Week-at-a-glance layout
│   │   ├── DayView.jsx         # Single-day class list
│   │   ├── ClassModal.jsx      # Add / Edit class modal dialog
│   │   └── DeleteConfirmDialog.jsx # Confirmation dialog for class removal
│   ├── upload/                 # Document import & candidate review:
│   │   ├── ImportPage.jsx      # Drag-and-drop file upload interface
│   │   ├── FileDropzone.jsx    # Multi-format dropzone (.pdf, .csv, .xlsx)
│   │   ├── ReviewTimetablePage.jsx # Interactive candidate review grid
│   │   ├── CandidateGrid.jsx   # Editable rows with validation indicators
│   │   └── review.validation.js# Client-side overlap and duplicate checking
│   └── settings/               # User preferences & account details:
│       ├── SettingsPage.jsx    # Tabbed account management
│       ├── ProfileSection.jsx  # Student details inspection
│       ├── PreferencesSection.jsx # 12h vs 24h format switcher
│       ├── SecuritySection.jsx # Password and session security
│       ├── PreferencesContext.jsx # Global preferences provider
│       └── usePreferences.js   # Preferences hook
├── services/
│   ├── api.js                  # Shared fetch wrapper with Bearer token auto-attachment
│   ├── dashboard.service.js    # /api/dashboard client
│   ├── timetable.service.js    # /api/timetables & entries client
│   └── upload.service.js       # File upload & extraction client
└── utils/
    ├── dateTime.js             # Weekday names, time formatting (12h/24h), timezone helpers
    └── formatters.js           # Size & string formatters
```

---

## ⚙️ Environment Variables

Create `.env` in the `frontend/` directory (see [`.env.example`](./.env.example)):

```env
# URL pointing to the RedStone backend API
# Local development:
VITE_API_BASE_URL=http://localhost:4000/api

# Production (Render deployed backend):
# VITE_API_BASE_URL=https://redstone-api.onrender.com/api
```

---

## 🛠️ Available Scripts

```bash
# Start development server with Hot Module Replacement (HMR) at http://localhost:5173
npm run dev

# Run ESLint across the codebase
npm run lint

# Execute Node native test suite (51 unit and service tests)
npm run test:node

# Run tests via Vitest
npm test

# Build production bundle to /dist
npm run build

# Preview production build locally
npm run preview
```

---

## 🚀 Deployment on Vercel

The frontend is pre-configured for seamless deployment to **Vercel**:

1. **SPA Route Fallback:** [`vercel.json`](./vercel.json) specifies:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
   This ensures deep routes like `/timetable`, `/dashboard`, or `/import/review` reload without 404 errors.
2. **Security Headers:** Adds `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: strict-origin-when-cross-origin`.
3. **Build Settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Environment Variable: `VITE_API_BASE_URL=https://<your-render-backend-url>/api`
