import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateFile,
  formatFileSize,
  getFileTypeLabel,
  uploadAndExtractTimetable,
  saveExtractionSession,
  getExtractionSession,
  clearExtractionSession,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
} from '../src/services/upload.service.js';

describe('Timetable Upload Service & Validation Tests', () => {
  const originalFetch = globalThis.fetch;
  const originalSessionStorage = globalThis.sessionStorage;

  // Mock in-memory storage for sessionStorage
  let mockStorage = {};
  beforeEach(() => {
    mockStorage = {};
    globalThis.sessionStorage = {
      getItem: (key) => mockStorage[key] || null,
      setItem: (key, val) => {
        mockStorage[key] = String(val);
      },
      removeItem: (key) => {
        delete mockStorage[key];
      },
      clear: () => {
        mockStorage = {};
      },
    };
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    globalThis.sessionStorage = originalSessionStorage;
  });

  describe('Configuration constants', () => {
    test('MAX_FILE_SIZE_BYTES matches backend multer limit of 10 MB', () => {
      assert.equal(MAX_FILE_SIZE_BYTES, 10 * 1024 * 1024);
    });

    test('ALLOWED_EXTENSIONS contains only PDF, CSV, and XLSX', () => {
      assert.deepEqual(ALLOWED_EXTENSIONS, ['.pdf', '.csv', '.xlsx']);
    });
  });

  describe('formatFileSize & getFileTypeLabel helpers', () => {
    test('formatFileSize formats bytes correctly', () => {
      assert.equal(formatFileSize(0), '0 B');
      assert.equal(formatFileSize(500), '500 B');
      assert.equal(formatFileSize(2048), '2.0 KB');
      assert.equal(formatFileSize(10 * 1024 * 1024), '10.0 MB');
      assert.equal(formatFileSize(-1), '0 B');
      assert.equal(formatFileSize(NaN), '0 B');
    });

    test('getFileTypeLabel returns descriptive labels', () => {
      assert.equal(getFileTypeLabel({ name: 'schedule.pdf' }), 'PDF Document');
      assert.equal(getFileTypeLabel({ name: 'routine.csv' }), 'CSV Spreadsheet');
      assert.equal(getFileTypeLabel({ name: 'classes.xlsx' }), 'Excel Workbook');
      assert.equal(getFileTypeLabel({ name: 'unknown.txt' }), 'Document');
    });
  });

  describe('validateFile client-side constraints', () => {
    test('rejects missing file', () => {
      const res = validateFile(null);
      assert.equal(res.valid, false);
      assert.match(res.error, /select a timetable document/i);
    });

    test('accepts valid PDF file under 10 MB', () => {
      const file = { name: 'schedule.pdf', size: 1024 * 500 };
      const res = validateFile(file);
      assert.equal(res.valid, true);
      assert.equal(res.error, null);
    });

    test('accepts valid CSV file under 10 MB', () => {
      const file = { name: 'classes.csv', size: 2048 };
      const res = validateFile(file);
      assert.equal(res.valid, true);
      assert.equal(res.error, null);
    });

    test('accepts valid XLSX file under 10 MB', () => {
      const file = { name: 'routine.xlsx', size: 1024 * 80 };
      const res = validateFile(file);
      assert.equal(res.valid, true);
      assert.equal(res.error, null);
    });

    test('rejects unsupported extensions (.docx, .png, .jpg, .zip)', () => {
      const unsupported = ['timetable.docx', 'schedule.png', 'photo.jpg', 'archive.zip'];
      for (const name of unsupported) {
        const res = validateFile({ name, size: 1024 });
        assert.equal(res.valid, false);
        assert.match(res.error, /Unsupported file format/i);
      }
    });

    test('rejects files with no extension', () => {
      const res = validateFile({ name: 'timetableschedule', size: 1024 });
      assert.equal(res.valid, false);
      assert.match(res.error, /no file extension/i);
    });

    test('rejects empty file (0 bytes)', () => {
      const res = validateFile({ name: 'empty.csv', size: 0 });
      assert.equal(res.valid, false);
      assert.match(res.error, /empty/i);
    });

    test('rejects file exceeding 10 MB limit', () => {
      const oversized = { name: 'large.pdf', size: 10 * 1024 * 1024 + 1 };
      const res = validateFile(oversized);
      assert.equal(res.valid, false);
      assert.match(res.error, /exceeds the maximum allowed limit/i);
    });
  });

  describe('uploadAndExtractTimetable API flow', () => {
    test('throws if timetableId is missing', async () => {
      await assert.rejects(
        async () => uploadAndExtractTimetable(null, { name: 'test.pdf', size: 100 }),
        /timetable ID is required/i
      );
    });

    test('throws if file fails client validation', async () => {
      await assert.rejects(
        async () => uploadAndExtractTimetable('tt-1', { name: 'invalid.exe', size: 100 }),
        /Unsupported file format/i
      );
    });

    test('sends FormData with field name "file" and parses extraction response', async () => {
      const mockResult = {
        message: 'Timetable extracted for review',
        entries: [
          {
            subject: 'Mathematics',
            dayOfWeek: 1,
            startTime: '09:00',
            endTime: '10:00',
            room: '101',
            faculty: 'Dr. Euler',
          },
        ],
        warnings: [],
      };

      let capturedUrl = '';
      let capturedMethod = '';
      let capturedBody = null;

      globalThis.fetch = async (url, options) => {
        capturedUrl = url;
        capturedMethod = options.method;
        capturedBody = options.body;

        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => mockResult,
        };
      };

      const file = new File(['dummy content'], 'schedule.csv', { type: 'text/csv' });
      const response = await uploadAndExtractTimetable('tt-1234', file);

      assert.match(capturedUrl, /\/api\/timetables\/tt-1234\/upload$/);
      assert.equal(capturedMethod, 'POST');
      assert.ok(capturedBody instanceof FormData);
      assert.ok(capturedBody.get('file'));

      assert.equal(response.entries.length, 1);
      assert.equal(response.entries[0].subject, 'Mathematics');
      assert.equal(response.warnings.length, 0);
    });

    test('handles partial extraction with warnings', async () => {
      const mockResult = {
        message: 'Timetable extracted for review',
        entries: [{ subject: 'Physics', dayOfWeek: 2, startTime: '10:00', endTime: '11:00' }],
        warnings: [{ row: 3, message: 'Row needs correction' }],
      };

      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResult,
      });

      const file = new File(['dummy content'], 'routine.xlsx', {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const response = await uploadAndExtractTimetable('tt-1', file);

      assert.equal(response.entries.length, 1);
      assert.equal(response.warnings.length, 1);
      assert.equal(response.warnings[0].row, 3);
    });

    test('handles server 422 layout unsupported error', async () => {
      globalThis.fetch = async () => ({
        ok: false,
        status: 422,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          error: 'The file could not be read or its layout is unsupported',
          warnings: ['Manual entry or OCR may be required'],
        }),
      });

      const file = new File(['%PDF-1.4 dummy'], 'scanned.pdf', { type: 'application/pdf' });
      await assert.rejects(
        async () => uploadAndExtractTimetable('tt-1', file),
        (err) => {
          assert.equal(err.status, 422);
          assert.match(err.message, /layout is unsupported/i);
          return true;
        }
      );
    });

    test('handles network failure', async () => {
      globalThis.fetch = async () => {
        throw new Error('Failed to fetch');
      };

      const file = new File(['a,b,c'], 'test.csv', { type: 'text/csv' });
      await assert.rejects(
        async () => uploadAndExtractTimetable('tt-1', file),
        (err) => {
          assert.match(err.message, /Failed to fetch/i);
          return true;
        }
      );
    });
  });

  describe('Module 5 Handoff Persistence via SessionStorage', () => {
    test('saveExtractionSession, getExtractionSession, and clearExtractionSession', () => {
      const payload = {
        timetableId: 'tt-abc',
        filename: 'schedule.csv',
        entries: [{ subject: 'Biology', dayOfWeek: 3, startTime: '08:00', endTime: '09:00' }],
        warnings: [],
      };

      // Initially empty
      assert.equal(getExtractionSession(), null);

      // Save
      saveExtractionSession(payload);
      const retrieved = getExtractionSession();
      assert.equal(retrieved.timetableId, 'tt-abc');
      assert.equal(retrieved.filename, 'schedule.csv');
      assert.equal(retrieved.entries.length, 1);
      assert.equal(retrieved.entries[0].subject, 'Biology');
      assert.ok(retrieved.savedAt);

      // Clear
      clearExtractionSession();
      assert.equal(getExtractionSession(), null);
    });
  });
});
