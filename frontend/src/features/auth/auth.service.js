/**
 * RedStone Auth Service
 * Handles authentication API calls (login, register).
 * All calls use the shared API client and follow the backend contract.
 *
 * Backend contract (from backend/src/routes/auth.routes.js):
 *   POST /api/auth/register  { name, email, password } → 201 { message, token, user }
 *   POST /api/auth/login     { email, password }       → 200 { token, user }
 *
 * Auth header expected by backend (from backend/src/middleware/auth.js):
 *   Authorization: Bearer <token>
 */

import { apiClient, ApiError } from '../../services/api.js';

/**
 * Register a new user account.
 * On success, the backend returns a JWT token and user object immediately —
 * no separate login step required.
 *
 * @param {{ name: string, email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function registerUser({ name, email, password }) {
  const response = await apiClient('/auth/register', {
    method: 'POST',
    body: { name: name.trim(), email: email.trim(), password },
  });
  return { token: response.token, user: response.user };
}

/**
 * Log in with email and password.
 *
 * @param {{ email: string, password: string }} data
 * @returns {Promise<{ token: string, user: object }>}
 */
export async function loginUser({ email, password }) {
  const response = await apiClient('/auth/login', {
    method: 'POST',
    body: { email: email.trim(), password },
  });
  return { token: response.token, user: response.user };
}

// ─── Session storage (sessionStorage — tab-scoped, not persistent) ────────────
// Security note: Storing JWTs in browser storage (sessionStorage or localStorage)
// is not as secure as HTTP-only cookies because it is accessible to JS running on
// the page. HTTP-only cookies would require backend changes (Set-Cookie header).
// This is documented as a future security improvement.
// sessionStorage was chosen over localStorage so the session is not persisted
// across browser restarts/new tabs.

const TOKEN_KEY = 'rs_token';
const USER_KEY = 'rs_user';

/** Persist token and user to sessionStorage. */
export function saveSession(token, user) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // sessionStorage may be unavailable in some private-mode browsers
  }
}

/** Remove token and user from sessionStorage. */
export function clearSession() {
  try {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  } catch {
    // ignore
  }
}

/** Read token from sessionStorage. Returns null if absent. */
export function getStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

/** Read user from sessionStorage. Returns null if absent or malformed. */
export function getStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Build a Bearer authorization header value for the given token.
 * Used by the API client to attach auth to protected requests.
 *
 * @param {string} token
 * @returns {{ Authorization: string }}
 */
export function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export { ApiError };
