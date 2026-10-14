/**
 * RedStone Frontend API Client
 * Configured with configurable base URL and robust JSON handling.
 *
 * Auth integration:
 *   Pass { headers: { Authorization: 'Bearer <token>' } } in options, or
 *   use the makeAuthenticatedRequest helper which reads the token automatically.
 */

const rawBaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) ||
  'http://localhost:4000/api';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '').endsWith('/api')
  ? rawBaseUrl.replace(/\/+$/, '')
  : `${rawBaseUrl.replace(/\/+$/, '')}/api`;

/**
 * Custom error representing failed API requests.
 */
export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Base fetch wrapper for RedStone API.
 * Handles JSON serialization, headers, and uniform error extraction.
 *
 * @param {string} endpoint - Relative path (e.g. '/health') or full URL
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<any>}
 */
export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const headers = new Headers(options.headers || {});

  // Default to JSON accept and content-type if body is JSON-serializable
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  // Attach stored Bearer token if not explicitly provided
  if (!headers.has('Authorization')) {
    try {
      const token = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('rs_token') : null;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch {
      // Ignore storage access errors
    }
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Try to parse response as JSON; fall back to text if not JSON
    const contentType = response.headers.get('content-type') || '';
    let responseData = null;

    if (contentType.includes('application/json')) {
      responseData = await response.json().catch(() => null);
    } else {
      responseData = await response.text().catch(() => null);
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      if (responseData) {
        if (typeof responseData === 'object') {
          errorMessage =
            responseData.message ||
            responseData.error ||
            (Array.isArray(responseData.details)
              ? responseData.details.map((d) => d.message || d).join(', ')
              : null) ||
            errorMessage;
        } else if (typeof responseData === 'string' && responseData.trim()) {
          errorMessage = responseData;
        }
      }

      throw new ApiError(errorMessage, response.status, responseData);
    }

    return responseData;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network or client-side failure
    throw new ApiError(
      err.message || 'Network error occurred while contacting the server',
      0,
      null
    );
  }
}

/**
 * Standard HTTP methods
 */
export const api = {
  get: (endpoint, options) => apiClient(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => apiClient(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => apiClient(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => apiClient(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => apiClient(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
