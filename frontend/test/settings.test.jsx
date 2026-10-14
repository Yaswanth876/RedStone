import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getTimeFormatPreference,
  setTimeFormatPreference,
  formatTime,
} from '../src/utils/dateTime.js';
import {
  saveSession,
  clearSession,
  getStoredToken,
  getStoredUser,
} from '../src/features/auth/auth.service.js';

describe('Settings & Preferences — Vitest Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Time Format', () => {
    it('defaults to 12h and formats correctly', () => {
      expect(getTimeFormatPreference()).toBe('12h');
      expect(formatTime('08:15')).toBe('8:15 AM');
      expect(formatTime('13:45')).toBe('1:45 PM');
    });

    it('persists and uses 24h format', () => {
      setTimeFormatPreference('24h');
      expect(getTimeFormatPreference()).toBe('24h');
      expect(formatTime('08:15')).toBe('08:15');
      expect(formatTime('13:45')).toBe('13:45');
    });
  });

  describe('Session Storage & Logout', () => {
    it('saves and clears session on logout', () => {
      const user = { id: 'u1', name: 'Taylor', email: 'taylor@college.edu' };
      saveSession('token123', user);
      expect(getStoredToken()).toBe('token123');
      expect(getStoredUser()).toEqual(user);

      clearSession();
      expect(getStoredToken()).toBeNull();
      expect(getStoredUser()).toBeNull();
    });
  });
});
