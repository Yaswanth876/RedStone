/**
 * RedStone Dashboard Service
 * Interacts with backend dashboard endpoints:
 *   GET /api/dashboard           — Full consolidated dashboard
 *   GET /api/dashboard/today     — Today's classes
 *   GET /api/dashboard/next-class — Next upcoming class
 *   GET /api/dashboard/week      — Weekly schedule preview
 *
 * Uses shared API client and handles timezone querying and normalization.
 */

import { apiClient, ApiError } from './api.js';
import { DEFAULT_TIMEZONE } from '../utils/dateTime.js';

/**
 * Fetch consolidated dashboard data.
 * @param {object} [options]
 * @param {string} [options.timezone=DEFAULT_TIMEZONE]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>}
 */
export async function getDashboard({ timezone = DEFAULT_TIMEZONE, signal } = {}) {
  const query = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
  const data = await apiClient(`/dashboard${query}`, { signal });
  return normalizeDashboard(data);
}

/**
 * Fetch today's classes breakdown.
 * @param {object} [options]
 * @param {string} [options.timezone=DEFAULT_TIMEZONE]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>}
 */
export async function getTodayClasses({ timezone = DEFAULT_TIMEZONE, signal } = {}) {
  const query = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
  return apiClient(`/dashboard/today${query}`, { signal });
}

/**
 * Fetch next upcoming class.
 * @param {object} [options]
 * @param {string} [options.timezone=DEFAULT_TIMEZONE]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ nextClass: object|null, message: string }>}
 */
export async function getNextClass({ timezone = DEFAULT_TIMEZONE, signal } = {}) {
  const query = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
  return apiClient(`/dashboard/next-class${query}`, { signal });
}

/**
 * Fetch weekly schedule overview.
 * @param {object} [options]
 * @param {string} [options.timezone=DEFAULT_TIMEZONE]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ timezone: string, hasTimetable: boolean, isEmpty: boolean, days: Array }>}
 */
export async function getWeeklySchedule({ timezone = DEFAULT_TIMEZONE, signal } = {}) {
  const query = timezone ? `?timezone=${encodeURIComponent(timezone)}` : '';
  return apiClient(`/dashboard/week${query}`, { signal });
}

/**
 * Normalize dashboard payload to ensure safe defaults for all UI consumers.
 * @param {object} data
 * @returns {object}
 */
export function normalizeDashboard(data = {}) {
  const todayData = data.today || {};
  const rawClasses = Array.isArray(todayData.classes) ? todayData.classes : [];

  // Ensure today's classes are strictly sorted chronologically by startTime
  const sortedTodayClasses = [...rawClasses].sort((a, b) =>
    (a.startTime || '').localeCompare(b.startTime || '')
  );

  const rawWeek = Array.isArray(data.week) ? data.week : [];
  const normalizedWeek = [...rawWeek].sort((a, b) => (a.dayOfWeek || 0) - (b.dayOfWeek || 0));

  return {
    date: data.date || todayData.date || new Date().toISOString().split('T')[0],
    timezone: data.timezone || todayData.timezone || DEFAULT_TIMEZONE,
    hasTimetable: Boolean(data.hasTimetable ?? todayData.hasTimetable),
    isEmpty: Boolean(data.isEmpty),
    today: {
      date: todayData.date || data.date,
      timezone: todayData.timezone || data.timezone || DEFAULT_TIMEZONE,
      totalClasses: Number.isInteger(todayData.totalClasses)
        ? todayData.totalClasses
        : sortedTodayClasses.length,
      hasTimetable: Boolean(todayData.hasTimetable ?? data.hasTimetable),
      isEmpty: Boolean(todayData.isEmpty ?? (sortedTodayClasses.length === 0)),
      classes: sortedTodayClasses,
    },
    nextClass: data.nextClass || null,
    nextClassMessage: data.nextClassMessage || '',
    week: normalizedWeek,
  };
}

export { ApiError };
