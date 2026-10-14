/**
 * Auth integration tests — Module 1
 *
 * All backend requests are mocked via vi.stubGlobal('fetch', ...) so these
 * tests run without a live server or database.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../src/features/auth/AuthContext.jsx';
import { useAuth } from '../src/features/auth/useAuth.js';
import { LoginPage } from '../src/features/auth/LoginPage.jsx';
import { RegisterPage } from '../src/features/auth/RegisterPage.jsx';
import { ProtectedRoute } from '../src/app/ProtectedRoute.jsx';
import {
  saveSession,
  clearSession,
  getStoredToken,
  getStoredUser,
  authHeader,
} from '../src/features/auth/auth.service.js';

// ─── Mock fetch globally ──────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MOCK_USER = { id: 'u1', name: 'Alex Morgan', email: 'alex@test.com', createdAt: new Date().toISOString() };
const MOCK_TOKEN = 'mock.jwt.token';

function renderWithAuth(ui, { initialEntries = ['/login'] } = {}) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
}

// ─── Session service unit tests ───────────────────────────────────────────────

describe('auth.service session helpers', () => {
  afterEach(() => {
    clearSession();
  });

  it('saveSession stores token and user', () => {
    saveSession(MOCK_TOKEN, MOCK_USER);
    expect(getStoredToken()).toBe(MOCK_TOKEN);
    expect(getStoredUser()).toEqual(MOCK_USER);
  });

  it('clearSession removes token and user', () => {
    saveSession(MOCK_TOKEN, MOCK_USER);
    clearSession();
    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('authHeader returns correct Bearer header', () => {
    const headers = authHeader('abc123');
    expect(headers).toEqual({ Authorization: 'Bearer abc123' });
  });
});

// ─── Login Form — Validation ──────────────────────────────────────────────────

describe('LoginPage — form validation', () => {
  beforeEach(() => clearSession());

  it('shows errors when submitting empty form', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );

    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
  });

  it('shows error for invalid email format', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );

    await userEvent.type(screen.getByLabelText(/student email/i), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
  });
});

// ─── Login — Successful ───────────────────────────────────────────────────────

describe('LoginPage — successful login', () => {
  beforeEach(() => {
    clearSession();
    mockFetch(200, { token: MOCK_TOKEN, user: MOCK_USER });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it('navigates to /dashboard after successful login', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/student email/i), 'alex@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  it('persists token in sessionStorage after login', async () => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/student email/i), 'alex@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => expect(getStoredToken()).toBe(MOCK_TOKEN));
  });
});

// ─── Login — Failed ───────────────────────────────────────────────────────────

describe('LoginPage — failed login', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it('shows error for 401 invalid credentials', async () => {
    mockFetch(401, { error: 'Invalid email or password' });

    renderWithAuth(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );

    await userEvent.type(screen.getByLabelText(/student email/i), 'wrong@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/incorrect email or password/i)).toBeInTheDocument();
    });
  });

  it('shows network error when fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))));

    renderWithAuth(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    );

    await userEvent.type(screen.getByLabelText(/student email/i), 'alex@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});

// ─── Registration Form — Validation ──────────────────────────────────────────

describe('RegisterPage — form validation', () => {
  beforeEach(() => clearSession());

  it('shows errors when submitting empty form', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/login" element={<RegisterPage />} />
      </Routes>
    );

    await userEvent.click(screen.getByRole('button', { name: /create redstone account/i }));

    expect(screen.getByText('Full name is required')).toBeInTheDocument();
    expect(screen.getByText('Email is required')).toBeInTheDocument();
    expect(screen.getByText('Password is required')).toBeInTheDocument();
    expect(screen.getByText('Please confirm your password')).toBeInTheDocument();
  });

  it('shows error when password is too short', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/login" element={<RegisterPage />} />
      </Routes>
    );

    await userEvent.type(screen.getByLabelText(/full name/i), 'Alex');
    await userEvent.type(screen.getByLabelText(/college email/i), 'alex@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'short');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'short');
    await userEvent.click(screen.getByRole('button', { name: /create redstone account/i }));

    expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
  });

  it('shows error when passwords do not match', async () => {
    renderWithAuth(
      <Routes>
        <Route path="/login" element={<RegisterPage />} />
      </Routes>
    );

    await userEvent.type(screen.getByLabelText(/full name/i), 'Alex Morgan');
    await userEvent.type(screen.getByLabelText(/college email/i), 'alex@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'differentpass');
    await userEvent.click(screen.getByRole('button', { name: /create redstone account/i }));

    expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
  });
});

// ─── Registration — Successful ────────────────────────────────────────────────

describe('RegisterPage — successful registration', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it('navigates to /dashboard after successful registration', async () => {
    mockFetch(201, { message: 'Account created', token: MOCK_TOKEN, user: MOCK_USER });

    render(
      <MemoryRouter initialEntries={['/register']}>
        <AuthProvider>
          <Routes>
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await userEvent.type(screen.getByLabelText(/full name/i), 'Alex Morgan');
    await userEvent.type(screen.getByLabelText(/college email/i), 'alex@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create redstone account/i }));

    await waitFor(() => {
      expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
    });
  });

  it('shows duplicate email error (409) inline', async () => {
    mockFetch(409, { error: 'Email already registered' });

    renderWithAuth(
      <Routes>
        <Route path="/login" element={<RegisterPage />} />
      </Routes>
    );

    await userEvent.type(screen.getByLabelText(/full name/i), 'Alex Morgan');
    await userEvent.type(screen.getByLabelText(/college email/i), 'existing@test.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'password123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'password123');
    await userEvent.click(screen.getByRole('button', { name: /create redstone account/i }));

    await waitFor(() => {
      expect(
        screen.getByText('An account with this email already exists.')
      ).toBeInTheDocument();
    });
  });
});

// ─── Protected Route ─────────────────────────────────────────────────────────

describe('ProtectedRoute', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearSession();
  });

  it('redirects unauthenticated user to /login', async () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument();
    });
  });

  it('allows authenticated user to access protected content', async () => {
    saveSession(MOCK_TOKEN, MOCK_USER);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Protected Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});

// ─── Session restore ─────────────────────────────────────────────────────────

describe('Auth session restoration', () => {
  afterEach(() => clearSession());

  it('restores session from sessionStorage on page refresh simulation', async () => {
    saveSession(MOCK_TOKEN, MOCK_USER);

    function SessionDisplay() {
      const { isAuthenticated, user } = useAuth();
      return (
        <div>
          <span data-testid="auth">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
          <span data-testid="name">{user?.name || ''}</span>
        </div>
      );
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <SessionDisplay />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('logged-in');
      expect(screen.getByTestId('name')).toHaveTextContent('Alex Morgan');
    });
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe('Logout', () => {
  afterEach(() => clearSession());

  it('clears session on logout', () => {
    saveSession(MOCK_TOKEN, MOCK_USER);
    clearSession();
    expect(getStoredToken()).toBeNull();
    expect(getStoredUser()).toBeNull();
  });

  it('marks user as unauthenticated after logout', async () => {
    saveSession(MOCK_TOKEN, MOCK_USER);

    function LogoutTest() {
      const { isAuthenticated, logout } = useAuth();
      return (
        <div>
          <span data-testid="auth">{isAuthenticated ? 'logged-in' : 'logged-out'}</span>
          <button onClick={logout}>Logout</button>
        </div>
      );
    }

    render(
      <MemoryRouter>
        <AuthProvider>
          <LogoutTest />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('logged-in');
    });

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));

    await waitFor(() => {
      expect(screen.getByTestId('auth')).toHaveTextContent('logged-out');
    });
    expect(getStoredToken()).toBeNull();
  });
});
