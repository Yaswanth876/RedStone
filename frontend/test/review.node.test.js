import test, { describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateReviewRow,
  isOverlapping,
  isDuplicate,
  analyzeReviewEntries,
  sanitizeEntryForImport,
} from '../src/features/upload/review.validation.js';
import { importEntries } from '../src/services/upload.service.js';

describe('Timetable Review & Save — Module 5 Unit Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('validateReviewRow', () => {
    test('validates clean, complete row', () => {
      const row = {
        subject: 'Algorithms & Data Structures',
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '10:30',
        room: 'Lab 1',
        faculty: 'Prof. Turing',
      };
      const result = validateReviewRow(row);
      assert.equal(result.isValid, true);
      assert.deepEqual(result.errors, {});
    });

    test('rejects blank subject name', () => {
      const row = { subject: '   ', dayOfWeek: 2, startTime: '09:00', endTime: '10:00' };
      const result = validateReviewRow(row);
      assert.equal(result.isValid, false);
      assert.match(result.errors.subject, /Subject is required/i);
    });

    test('rejects subject exceeding 200 characters', () => {
      const row = { subject: 'A'.repeat(201), dayOfWeek: 2, startTime: '09:00', endTime: '10:00' };
      const result = validateReviewRow(row);
      assert.equal(result.isValid, false);
      assert.match(result.errors.subject, /200 characters or less/i);
    });

    test('rejects invalid dayOfWeek (< 1 or > 7)', () => {
      assert.equal(validateReviewRow({ subject: 'Math', dayOfWeek: 0, startTime: '09:00', endTime: '10:00' }).isValid, false);
      assert.equal(validateReviewRow({ subject: 'Math', dayOfWeek: 8, startTime: '09:00', endTime: '10:00' }).isValid, false);
      assert.equal(validateReviewRow({ subject: 'Math', dayOfWeek: 'not-a-day', startTime: '09:00', endTime: '10:00' }).isValid, false);
    });

    test('rejects malformed time format', () => {
      const row = { subject: 'Math', dayOfWeek: 1, startTime: '9:00', endTime: '10:00 AM' };
      const result = validateReviewRow(row);
      assert.equal(result.isValid, false);
      assert.ok(result.errors.startTime);
      assert.ok(result.errors.endTime);
    });

    test('rejects endTime <= startTime (non-overnight rule)', () => {
      const equalTime = { subject: 'Math', dayOfWeek: 1, startTime: '10:00', endTime: '10:00' };
      assert.equal(validateReviewRow(equalTime).isValid, false);
      assert.match(validateReviewRow(equalTime).errors.endTime, /after start time/i);

      const earlierTime = { subject: 'Math', dayOfWeek: 1, startTime: '11:00', endTime: '10:00' };
      assert.equal(validateReviewRow(earlierTime).isValid, false);
      assert.match(validateReviewRow(earlierTime).errors.endTime, /after start time/i);
    });

    test('validates room and faculty length constraints', () => {
      const longRoom = { subject: 'Math', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', room: 'R'.repeat(101) };
      assert.match(validateReviewRow(longRoom).errors.room, /100 characters or less/i);

      const longFaculty = { subject: 'Math', dayOfWeek: 1, startTime: '09:00', endTime: '10:00', faculty: 'F'.repeat(201) };
      assert.match(validateReviewRow(longFaculty).errors.faculty, /200 characters or less/i);
    });
  });

  describe('isOverlapping & isDuplicate detection', () => {
    test('isOverlapping detects same day overlapping intervals', () => {
      const first = { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' };
      const overlap = { dayOfWeek: 1, startTime: '10:00', endTime: '11:30' };
      assert.equal(isOverlapping(first, overlap), true);

      // Adjacent entries do NOT overlap
      const adjacent = { dayOfWeek: 1, startTime: '10:30', endTime: '11:30' };
      assert.equal(isOverlapping(first, adjacent), false);

      // Different days do NOT overlap
      const diffDay = { dayOfWeek: 2, startTime: '09:30', endTime: '10:00' };
      assert.equal(isOverlapping(first, diffDay), false);
    });

    test('isDuplicate detects exact match on day, subject, and time', () => {
      const a = { dayOfWeek: 3, subject: 'Physics', startTime: '10:00', endTime: '11:00' };
      const b = { dayOfWeek: 3, subject: 'physics', startTime: '10:00', endTime: '11:00' };
      assert.equal(isDuplicate(a, b), true);

      // Different subjects at same time are not duplicates
      const diffSub = { dayOfWeek: 3, subject: 'Chemistry', startTime: '10:00', endTime: '11:00' };
      assert.equal(isDuplicate(a, diffSub), false);
    });
  });

  describe('analyzeReviewEntries batch analysis', () => {
    test('computes counts dynamically and flags blocking errors and overlaps', () => {
      const rows = [
        { _rowId: '1', subject: 'Math', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        { _rowId: '2', subject: 'Physics', dayOfWeek: 1, startTime: '09:30', endTime: '10:30' }, // Overlaps row 1!
        { _rowId: '3', subject: '', dayOfWeek: 2, startTime: '11:00', endTime: '12:00' }, // Blank subject error!
        { _rowId: '4', subject: 'English', dayOfWeek: 3, startTime: '14:00', endTime: '15:00' }, // Clean valid row
      ];

      const analysis = analyzeReviewEntries(rows);

      assert.equal(analysis.totalCount, 4);
      assert.equal(analysis.validCount, 3);
      assert.equal(analysis.invalidCount, 1); // Row 3 is invalid
      assert.equal(analysis.conflictCount, 1); // Row 1 & 2 overlap
      assert.equal(analysis.hasBlockingErrors, true);

      const status1 = analysis.rowStatuses.get('1');
      assert.equal(status1.hasConflict, true);
      assert.match(status1.warnings[0], /Time overlaps with "Physics"/i);

      const status3 = analysis.rowStatuses.get('3');
      assert.equal(status3.isValid, false);
      assert.equal(status3.errors.subject, 'Subject is required');
    });

    test('returns clean valid counts when all rows are valid without overlaps', () => {
      const rows = [
        { _rowId: '1', subject: 'Math', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        { _rowId: '2', subject: 'Physics', dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
        { _rowId: '3', subject: 'Chemistry', dayOfWeek: 2, startTime: '09:00', endTime: '10:00' },
      ];

      const analysis = analyzeReviewEntries(rows);
      assert.equal(analysis.totalCount, 3);
      assert.equal(analysis.validCount, 3);
      assert.equal(analysis.invalidCount, 0);
      assert.equal(analysis.conflictCount, 0);
      assert.equal(analysis.hasBlockingErrors, false);
    });
  });

  describe('sanitizeEntryForImport formatting', () => {
    test('trims strings, casts dayOfWeek to number, and converts empty room/faculty to null', () => {
      const row = {
        subject: '  Software Engineering  ',
        dayOfWeek: '4',
        startTime: '10:00',
        endTime: '11:30',
        room: '   ',
        faculty: '  Dr. Knuth  ',
      };

      const sanitized = sanitizeEntryForImport(row);
      assert.deepEqual(sanitized, {
        subject: 'Software Engineering',
        dayOfWeek: 4,
        startTime: '10:00',
        endTime: '11:30',
        room: null,
        faculty: 'Dr. Knuth',
      });
    });
  });

  describe('importEntries API client function', () => {
    test('requires timetableId and non-empty entries', async () => {
      await assert.rejects(async () => importEntries(null, [{ subject: 'Math' }]), /timetable ID is required/i);
      await assert.rejects(async () => importEntries('tt-1', []), /At least one valid timetable entry is required/i);
    });

    test('posts to /api/timetables/:id/entries/import and returns server transaction count', async () => {
      const entries = [
        { subject: 'Operating Systems', dayOfWeek: 5, startTime: '09:00', endTime: '10:30' },
      ];

      let postedUrl = '';
      let postedBody = null;

      globalThis.fetch = async (url, options) => {
        postedUrl = url;
        postedBody = JSON.parse(options.body);

        return {
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({
            message: 'Timetable entries imported successfully',
            count: 1,
            entries: [{ id: 'saved-1', ...entries[0] }],
          }),
        };
      };

      const result = await importEntries('tt-999', entries);
      assert.match(postedUrl, /\/api\/timetables\/tt-999\/entries\/import$/);
      assert.equal(postedBody.entries.length, 1);
      assert.equal(result.count, 1);
      assert.equal(result.entries[0].id, 'saved-1');
    });

    test('throws ApiError on server 409 conflict rejection', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 409,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'An imported entry overlaps an existing entry',
        }),
      });

      await assert.rejects(
        async () => importEntries('tt-1', [{ subject: 'A', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]),
        (err) => {
          assert.equal(err.status, 409);
          assert.match(err.message, /overlaps an existing entry/i);
          return true;
        }
      );
    });
  });
});
