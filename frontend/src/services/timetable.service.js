/**
 * RedStone Timetable Service
 * Interacts with backend timetable and timetable-entry endpoints:
 *   GET    /api/timetables                             — List user's timetables
 *   POST   /api/timetables                             — Create a timetable
 *   GET    /api/timetables/:id/entries                 — List all entries
 *   GET    /api/timetables/:id/entries/week             — Weekly entries
 *   POST   /api/timetables/:id/entries                 — Create an entry
 *   PATCH  /api/timetables/:id/entries/:entryId        — Update an entry
 *   DELETE /api/timetables/:id/entries/:entryId        — Delete an entry
 *
 * Uses the shared API client which auto-attaches the Bearer token.
 */

import { apiClient, ApiError } from './api.js';

// ─── Timetable-level endpoints ────────────────────────────────────────────────

/**
 * Fetch all timetables for the authenticated user.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ timetables: Array }>}
 */
export async function getTimetables({ signal } = {}) {
  return apiClient('/timetables', { signal });
}

/**
 * Create a new timetable.
 * @param {object} [data]
 * @param {string} [data.name]
 * @returns {Promise<{ timetable: object }>}
 */
export async function createTimetable(data = {}) {
  return apiClient('/timetables', {
    method: 'POST',
    body: data,
  });
}

/**
 * Get or create the user's default (first) timetable.
 * The backend supports multiple timetables, but the UI treats
 * the first one as the primary/active timetable.
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} timetable object
 */
export async function getOrCreateDefaultTimetable({ signal } = {}) {
  const result = await getTimetables({ signal });
  const timetables = result.timetables || [];

  if (timetables.length > 0) {
    return timetables[0];
  }

  // Auto-create a default timetable
  const created = await createTimetable({ name: 'My Timetable' });
  return created.timetable;
}

// ─── Entry-level endpoints ────────────────────────────────────────────────────

/**
 * Fetch all entries for a timetable, sorted by day and time.
 * @param {string} timetableId
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ entries: Array }>}
 */
export async function getEntries(timetableId, { signal } = {}) {
  return apiClient(`/timetables/${timetableId}/entries`, { signal });
}

/**
 * Fetch weekly entries for a timetable.
 * @param {string} timetableId
 * @param {object} [options]
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<{ entries: Array }>}
 */
export async function getWeeklyEntries(timetableId, { signal } = {}) {
  return apiClient(`/timetables/${timetableId}/entries/week`, { signal });
}

/**
 * Create a new timetable entry.
 * @param {string} timetableId
 * @param {object} data - { subject, dayOfWeek, startTime, endTime, room?, faculty? }
 * @returns {Promise<{ entry: object }>}
 */
export async function createEntry(timetableId, data) {
  return apiClient(`/timetables/${timetableId}/entries`, {
    method: 'POST',
    body: data,
  });
}

/**
 * Update an existing timetable entry.
 * @param {string} timetableId
 * @param {string} entryId
 * @param {object} data - partial update fields
 * @returns {Promise<{ entry: object }>}
 */
export async function updateEntry(timetableId, entryId, data) {
  return apiClient(`/timetables/${timetableId}/entries/${entryId}`, {
    method: 'PATCH',
    body: data,
  });
}

/**
 * Delete a timetable entry.
 * @param {string} timetableId
 * @param {string} entryId
 * @returns {Promise<void>}
 */
export async function deleteEntry(timetableId, entryId) {
  return apiClient(`/timetables/${timetableId}/entries/${entryId}`, {
    method: 'DELETE',
  });
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

/**
 * Group entries by dayOfWeek (1–7).
 * Each day's classes are sorted by startTime.
 * @param {Array} entries
 * @returns {Map<number, Array>}
 */
export function groupEntriesByDay(entries = []) {
  const grouped = new Map();
  for (let day = 1; day <= 7; day++) {
    grouped.set(day, []);
  }
  for (const entry of entries) {
    const day = entry.dayOfWeek;
    if (grouped.has(day)) {
      grouped.get(day).push(entry);
    }
  }
  // Sort each day's entries by startTime
  for (const [, dayEntries] of grouped) {
    dayEntries.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));
  }
  return grouped;
}

export { ApiError };
