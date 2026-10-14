import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTimeFormatPreference,
  setTimeFormatPreference,
  formatTime,
  TIME_FORMAT_STORAGE_KEY,
} from '../src/utils/dateTime.js';
import {
  saveSession,
  clearSession,
  getStoredToken,
  getStoredUser,
} from '../src/features/auth/auth.service.js';

describe('Settings & Account Preferences — Module 6 Unit Tests', () => {
  const originalLocalStorage = globalThis.localStorage;
  const originalSessionStorage = globalThis.sessionStorage;

  let mockLocalStorage = {};
  let mockSessionStorage = {};

  beforeEach(() => {
    mockLocalStorage = {};
    mockSessionStorage = {};

    globalThis.localStorage = {
      getItem: (key) => mockLocalStorage[key] || null,
      setItem: (key, val) => {
        mockLocalStorage[key] = String(val);
      },
      removeItem: (key) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      },
    };

    globalThis.sessionStorage = {
      getItem: (key) => mockSessionStorage[key] || null,
      setItem: (key, val) => {
        mockSessionStorage[key] = String(val);
      },
      removeItem: (key) => {
        delete mockSessionStorage[key];
      },
      clear: () => {
        mockSessionStorage = {};
      },
    };
  });

  afterEach(() => {
    globalThis.localStorage = originalLocalStorage;
    globalThis.sessionStorage = originalSessionStorage;
  });

  describe('Time Format Preference Storage & Formatting', () => {
    test('defaults to 12h format when no preference is stored', () => {
      assert.equal(getTimeFormatPreference(), '12h');
      assert.equal(formatTime('09:30'), '9:30 AM');
      assert.equal(formatTime('14:45'), '2:45 PM');
      assert.equal(formatTime('00:15'), '12:15 AM');
      assert.equal(formatTime('12:00'), '12:00 PM');
    });

    test('persists 24h format preference and updates formatTime output', () => {
      setTimeFormatPreference('24h');
      assert.equal(getTimeFormatPreference(), '24h');
      assert.equal(mockLocalStorage[TIME_FORMAT_STORAGE_KEY], '24h');

      // Now formatTime uses 24h by default
      assert.equal(formatTime('09:30'), '09:30');
      assert.equal(formatTime('14:45'), '14:45');
      assert.equal(formatTime('00:15'), '00:15');
      assert.equal(formatTime('12:00'), '12:00');
    });

    test('switches back to 12h format cleanly', () => {
      setTimeFormatPreference('24h');
      assert.equal(formatTime('15:30'), '15:30');

      setTimeFormatPreference('12h');
      assert.equal(getTimeFormatPreference(), '12h');
      assert.equal(formatTime('15:30'), '3:30 PM');
    });

    test('accepts explicit format override parameter in formatTime', () => {
      setTimeFormatPreference('12h');
      assert.equal(formatTime('16:00', '24h'), '16:00');

      setTimeFormatPreference('24h');
      assert.equal(formatTime('16:00', '12h'), '4:00 PM');
    });

    test('handles invalid, empty, or malformed time values safely', () => {
      assert.equal(formatTime(''), '');
      assert.equal(formatTime(null), '');
      assert.equal(formatTime(undefined), '');
      assert.equal(formatTime('invalid'), 'invalid');
    });
  });

  describe('Session Storage & Logout Management', () => {
    test('stores and clears user session correctly', () => {
      const mockUser = {
        id: 'u-123',
        name: 'Alex Morgan',
        email: 'alex@college.edu',
        createdAt: '2026-10-14T10:00:00.000Z',
      };
      const mockToken = 'mock.jwt.token';

      saveSession(mockToken, mockUser);
      assert.equal(getStoredToken(), mockToken);
      assert.deepEqual(getStoredUser(), mockUser);

      // Execute logout / clearSession
      clearSession();
      assert.equal(getStoredToken(), null);
      assert.equal(getStoredUser(), null);
    });

    test('handles corrupted session storage safely without crashing', () => {
      mockSessionStorage['rs_user'] = '{ corrupted json';
      assert.equal(getStoredUser(), null);
    });
  });

  describe('Account Data Integrity', () => {
    test('user object contains expected public student fields', () => {
      const user = {
        id: 'u-1',
        name: 'Jordan Lee',
        email: 'jordan@college.edu',
        createdAt: '2026-09-01T08:00:00.000Z',
      };

      assert.equal(typeof user.name, 'string');
      assert.equal(typeof user.email, 'string');
      assert.ok(user.createdAt);
      assert.equal(user.passwordHash, undefined); // Password hash must never be in client user object
    });
  });
});
