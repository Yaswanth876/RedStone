import { describe, it, expect } from 'vitest';
import { API_BASE_URL, ApiError, api, apiClient } from '../src/services/api.js';

describe('API Client - Configuration and Defaults', () => {
  it('has valid base URL', () => {
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL).toBe('http://localhost:4000/api');
  });
});

describe('API Client - ApiError class structure', () => {
  it('structures ApiError accurately', () => {
    const err = new ApiError('Not found', 404, { code: 'NOT_FOUND' });
    expect(err.message).toBe('Not found');
    expect(err.status).toBe(404);
    expect(err.data).toEqual({ code: 'NOT_FOUND' });
    expect(err.name).toBe('ApiError');
  });
});

describe('API Client - HTTP Method helper bindings', () => {
  it('exposes expected HTTP methods', () => {
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
    expect(typeof api.put).toBe('function');
    expect(typeof api.patch).toBe('function');
    expect(typeof api.delete).toBe('function');
    expect(typeof apiClient).toBe('function');
  });
});
