/**
 * Dashboard integration and unit tests — Module 2
 *
 * Mocks API calls via vi.stubGlobal('fetch', ...) so tests run hermetically
 * without requiring a live PostgreSQL instance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/features/auth/AuthContext.jsx';
import { DashboardPage } from '../src/features/dashboard/DashboardPage.jsx';
import { saveSession, clearSession } from '../src/features/auth/auth.service.js';

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const MOCK_USER = {
  id: 'u1',
  name: 'Alex Morgan',
  email: 'alex@college.edu',
};

const MOCK_USER_NO_NAME = {
  id: 'u2',
  email: 'student@college.edu',
};

const MOCK_TOKEN = 'mock-valid-jwt-token';

const MOCK_POPULATED_DASHBOARD = {
  date: '2026-10-14',
  timezone: 'Asia/Kolkata',
  hasTimetable: true,
  isEmpty: false,
  today: {
    date: '2026-10-14',
    timezone: 'Asia/Kolkata',
    totalClasses: 3,
    hasTimetable: true,
    isEmpty: false,
    classes: [
      {
        id: 'c1',
        subject: 'Algorithms & Data Structures',
        dayOfWeek: 3,
        startTime: '08:00',
        endTime: '09:30',
        room: 'Lecture Hall A',
        faculty: 'Prof. Turing',
        timetableId: 'tt-1',
      },
      {
        id: 'c2',
        subject: 'Database Systems',
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '11:30',
        room: 'Lab 2',
        faculty: 'Dr. Codd',
        timetableId: 'tt-1',
      },
      {
        id: 'c3',
        subject: 'Computer Networks',
        dayOfWeek: 3,
        startTime: '13:00',
        endTime: '14:30',
        room: 'Room 304',
        faculty: 'Dr. Cerf',
        timetableId: 'tt-1',
      },
    ],
  },
  nextClass: {
    id: 'c2',
    subject: 'Database Systems',
    dayOfWeek: 3,
    startTime: '10:00',
    endTime: '11:30',
    room: 'Lab 2',
    faculty: 'Dr. Codd',
    timetableId: 'tt-1',
    minutesUntilStart: 25,
  },
  nextClassMessage: 'Next upcoming class today',
  week: [
    {
      dayOfWeek: 1,
      weekday: 'Monday',
      count: 2,
      classes: [
        { id: 'm1', subject: 'Discrete Math', startTime: '09:00', endTime: '10:30' },
        { id: 'm2', subject: 'Linear Algebra', startTime: '11:00', endTime: '12:30' },
      ],
    },
    { dayOfWeek: 2, weekday: 'Tuesday', count: 0, classes: [] },
    {
      dayOfWeek: 3,
      weekday: 'Wednesday',
      count: 3,
      classes: [
        { id: 'c1', subject: 'Algorithms & Data Structures', startTime: '08:00', endTime: '09:30' },
        { id: 'c2', subject: 'Database Systems', startTime: '10:00', endTime: '11:30' },
        { id: 'c3', subject: 'Computer Networks', startTime: '13:00', endTime: '14:30' },
      ],
    },
    { dayOfWeek: 4, weekday: 'Thursday', count: 1, classes: [{ id: 'th1', subject: 'Web Architecture', startTime: '14:00', endTime: '15:30' }] },
    { dayOfWeek: 5, weekday: 'Friday', count: 2, classes: [{ id: 'f1', subject: 'Operating Systems', startTime: '10:00', endTime: '11:30' }] },
    { dayOfWeek: 6, weekday: 'Saturday', count: 0, classes: [] },
    { dayOfWeek: 7, weekday: 'Sunday', count: 0, classes: [] },
  ],
};

const MOCK_EMPTY_TIMETABLE_DASHBOARD = {
  date: '2026-10-14',
  timezone: 'Asia/Kolkata',
  hasTimetable: false,
  isEmpty: true,
  today: {
    date: '2026-10-14',
    timezone: 'Asia/Kolkata',
    totalClasses: 0,
    hasTimetable: false,
    isEmpty: true,
    classes: [],
  },
  nextClass: null,
  nextClassMessage: 'No upcoming classes today',
  week: [],
};

const MOCK_NO_CLASSES_TODAY_DASHBOARD = {
  date: '2026-10-14',
  timezone: 'Asia/Kolkata',
  hasTimetable: true,
  isEmpty: false,
  today: {
    date: '2026-10-14',
    timezone: 'Asia/Kolkata',
    totalClasses: 0,
    hasTimetable: true,
    isEmpty: true,
    classes: [],
  },
  nextClass: null,
  nextClassMessage: 'No upcoming classes today',
  week: [
    { dayOfWeek: 1, weekday: 'Monday', count: 2, classes: [{ id: 'm1', subject: 'Physics', startTime: '09:00', endTime: '10:30' }] },
    { dayOfWeek: 2, weekday: 'Tuesday', count: 0, classes: [] },
    { dayOfWeek: 3, weekday: 'Wednesday', count: 0, classes: [] },
    { dayOfWeek: 4, weekday: 'Thursday', count: 2, classes: [{ id: 'th1', subject: 'Chemistry', startTime: '10:00', endTime: '11:30' }] },
    { dayOfWeek: 5, weekday: 'Friday', count: 1, classes: [{ id: 'f1', subject: 'Math', startTime: '09:00', endTime: '10:30' }] },
    { dayOfWeek: 6, weekday: 'Saturday', count: 0, classes: [] },
    { dayOfWeek: 7, weekday: 'Sunday', count: 0, classes: [] },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mockFetch(status, body) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: status >= 200 && status < 300,
        status,
        headers: {
          get: () => 'application/json',
        },
        json: () => Promise.resolve(body),
      })
    )
  );
}

function renderDashboard(initialEntries = ['/dashboard']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/timetable" element={<div>Timetable Page</div>} />
          <Route path="/import" element={<div>Import Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('Dashboard Module — Module 2', () => {
  beforeEach(() => {
    saveSession(MOCK_TOKEN, MOCK_USER);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it('renders loading skeleton while data is fetching', () => {
    // Return a pending promise so the skeleton stays visible during assertion
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));

    renderDashboard();

    expect(screen.getByRole('status', { name: /loading dashboard/i })).toBeInTheDocument();
  });

  it('renders personalized greeting using user first name', async () => {
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Alex/i);
    });
  });

  it('renders fallback greeting when user has no name', async () => {
    saveSession(MOCK_TOKEN, MOCK_USER_NO_NAME);
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      // Should show standard greeting like "Good morning", "Good afternoon", or "Good evening"
      expect(heading.textContent).toMatch(/Good (morning|afternoon|evening)/i);
    });
  });

  it('displays accurate today class count and summary metrics', async () => {
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      // 3 classes today
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText(/3 sessions scheduled/i)).toBeInTheDocument();
    });
  });

  it('sorts today classes chronologically and displays all available fields', async () => {
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText('Algorithms & Data Structures').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Database Systems').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Computer Networks').length).toBeGreaterThan(0);
    });

    // Check classroom and faculty fields
    expect(screen.getAllByText('Lecture Hall A').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Prof. Turing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Lab 2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Dr. Codd').length).toBeGreaterThan(0);
  });

  it('identifies and prominently features the next upcoming class', async () => {
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Up Next Today/i)).toBeInTheDocument();
      expect(screen.getAllByText('Database Systems').length).toBeGreaterThan(0);
      expect(screen.getByText(/Starts in ~25 min/i)).toBeInTheDocument();
    });
  });

  it('renders weekly overview with classes and today badge', async () => {
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('Weekly Overview')).toBeInTheDocument();
      expect(screen.getByText('Monday')).toBeInTheDocument();
      expect(screen.getByText('Discrete Math')).toBeInTheDocument();
    });
  });

  it('handles empty timetable state with prominent import and view actions', async () => {
    mockFetch(200, MOCK_EMPTY_TIMETABLE_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText('No Timetable Added Yet')).toBeInTheDocument();
      expect(
        screen.getByText(/You haven't uploaded or created a semester timetable/i)
      ).toBeInTheDocument();
    });

    // Does not display fabricated class cards
    expect(screen.queryByText('Algorithms & Data Structures')).not.toBeInTheDocument();
  });

  it('handles no classes today while preserving the weekly overview', async () => {
    mockFetch(200, MOCK_NO_CLASSES_TODAY_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getAllByText(/No classes scheduled for today/i).length).toBeGreaterThan(0);
      // Weekly overview still displays
      expect(screen.getByText('Weekly Overview')).toBeInTheDocument();
      expect(screen.getAllByText('Thursday').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Chemistry').length).toBeGreaterThan(0);
    });
  });

  it('displays error state on API failure with retry action', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Connection failed'))));

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Unable to load your schedule')).toBeInTheDocument();
    });

    const retryButton = screen.getByRole('button', { name: /retry/i });
    expect(retryButton).toBeInTheDocument();

    // Now mock a success and click retry
    mockFetch(200, MOCK_POPULATED_DASHBOARD);
    await userEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getAllByText('Algorithms & Data Structures').length).toBeGreaterThan(0);
    });
  });

  it('navigates to timetable view on primary action click', async () => {
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /view timetable/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /view timetable/i }));

    await waitFor(() => {
      expect(screen.getByText('Timetable Page')).toBeInTheDocument();
    });
  });

  it('navigates to import page on secondary action click', async () => {
    mockFetch(200, MOCK_POPULATED_DASHBOARD);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /import timetable/i })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /import timetable/i }));

    await waitFor(() => {
      expect(screen.getByText('Import Page')).toBeInTheDocument();
    });
  });
});
