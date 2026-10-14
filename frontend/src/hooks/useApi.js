/**
 * useApi — a hook that returns API helpers with the Bearer token automatically
 * attached from the current auth session. Use this for all authenticated requests
 * (dashboard, timetable, etc.) in future modules.
 *
 * Usage:
 *   const { get, post } = useApi();
 *   const data = await get('/dashboard');
 */

import { useCallback } from 'react';
import { useAuth } from '../features/auth/useAuth.js';
import { apiClient } from '../services/api.js';
import { authHeader } from '../features/auth/auth.service.js';

export function useApi() {
  const { token } = useAuth();

  const request = useCallback(
    (endpoint, options = {}) => {
      const headers = token
        ? { ...authHeader(token), ...(options.headers || {}) }
        : options.headers || {};
      return apiClient(endpoint, { ...options, headers });
    },
    [token]
  );

  return {
    get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) =>
      request(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) =>
      request(endpoint, { ...options, method: 'PUT', body }),
    patch: (endpoint, body, options) =>
      request(endpoint, { ...options, method: 'PATCH', body }),
    delete: (endpoint, options) =>
      request(endpoint, { ...options, method: 'DELETE' }),
    request,
  };
}

export default useApi;
