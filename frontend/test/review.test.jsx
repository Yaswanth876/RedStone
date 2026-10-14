import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateReviewRow,
  isOverlapping,
  isDuplicate,
  analyzeReviewEntries,
  sanitizeEntryForImport,
} from '../src/features/upload/review.validation.js';
import { importEntries } from '../src/services/upload.service.js';

describe('Review & Save Module 5 — Vitest Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Row Validation', () => {
    it('validates correct candidate row', () => {
      const row = {
        subject: 'Algorithms',
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '11:30',
        room: 'Lab 2',
        faculty: 'Dr. Codd',
      };
      const res = validateReviewRow(row);
      expect(res.isValid).toBe(true);
      expect(res.errors).toEqual({});
    });

    it('flags missing subject and invalid time range', () => {
      const badRow = {
        subject: '',
        dayOfWeek: 1,
        startTime: '11:00',
        endTime: '10:00',
      };
      const res = validateReviewRow(badRow);
      expect(res.isValid).toBe(false);
      expect(res.errors.subject).toBeDefined();
      expect(res.errors.endTime).toBeDefined();
    });
  });

  describe('Duplicate & Conflict Checking', () => {
    it('detects duplicates accurately', () => {
      const a = { dayOfWeek: 1, subject: 'Math', startTime: '09:00', endTime: '10:00' };
      const b = { dayOfWeek: 1, subject: 'math', startTime: '09:00', endTime: '10:00' };
      expect(isDuplicate(a, b)).toBe(true);
    });

    it('detects overlapping time blocks on the same day', () => {
      const a = { dayOfWeek: 1, startTime: '09:00', endTime: '10:30' };
      const b = { dayOfWeek: 1, startTime: '10:00', endTime: '11:00' };
      expect(isOverlapping(a, b)).toBe(true);
    });

    it('analyzes candidate rows for validation errors and overlaps', () => {
      const rows = [
        { _rowId: '1', subject: 'Math', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        { _rowId: '2', subject: '', dayOfWeek: 1, startTime: '10:00', endTime: '11:00' },
      ];
      const analysis = analyzeReviewEntries(rows);
      expect(analysis.totalCount).toBe(2);
      expect(analysis.validCount).toBe(1);
      expect(analysis.invalidCount).toBe(1);
    });
  });

  describe('Sanitization & Backend Import', () => {
    it('sanitizes empty fields to null', () => {
      const raw = {
        subject: ' Physics ',
        dayOfWeek: 3,
        startTime: '14:00',
        endTime: '15:00',
        room: '',
        faculty: '  ',
      };
      expect(sanitizeEntryForImport(raw)).toEqual({
        subject: 'Physics',
        dayOfWeek: 3,
        startTime: '14:00',
        endTime: '15:00',
        room: null,
        faculty: null,
      });
    });

    it('calls importEntries API endpoint', async () => {
      const mockResult = { message: 'Timetable entries imported successfully', count: 1, entries: [{ id: '1' }] };
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResult,
      });
      vi.stubGlobal('fetch', fetchSpy);

      const res = await importEntries('tt-1', [{ subject: 'Math', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' }]);
      expect(res.count).toBe(1);
      expect(fetchSpy.mock.calls[0][0]).toContain('/timetables/tt-1/entries/import');
    });
  });
});
