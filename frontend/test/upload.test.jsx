import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('Timetable Upload Service — Vitest Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Configuration & Metadata', () => {
    it('enforces 10 MB limit and correct extensions', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(10485760);
      expect(ALLOWED_EXTENSIONS).toEqual(['.pdf', '.csv', '.xlsx']);
    });

    it('formats file sizes accurately', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
    });

    it('labels file types accurately', () => {
      expect(getFileTypeLabel({ name: 'classes.pdf' })).toBe('PDF Document');
      expect(getFileTypeLabel({ name: 'classes.csv' })).toBe('CSV Spreadsheet');
      expect(getFileTypeLabel({ name: 'classes.xlsx' })).toBe('Excel Workbook');
    });
  });

  describe('Client Validation Rules', () => {
    it('validates supported file types and sizes', () => {
      expect(validateFile({ name: 'schedule.pdf', size: 1024 }).valid).toBe(true);
      expect(validateFile({ name: 'schedule.csv', size: 1024 }).valid).toBe(true);
      expect(validateFile({ name: 'schedule.xlsx', size: 1024 }).valid).toBe(true);

      // Rejections
      expect(validateFile(null).valid).toBe(false);
      expect(validateFile({ name: 'file.docx', size: 1024 }).valid).toBe(false);
      expect(validateFile({ name: 'empty.pdf', size: 0 }).valid).toBe(false);
      expect(validateFile({ name: 'huge.pdf', size: 20 * 1024 * 1024 }).valid).toBe(false);
    });
  });

  describe('Upload & Extraction API Flow', () => {
    it('sends file and receives candidate entries', async () => {
      const mockResponse = {
        message: 'Timetable extracted for review',
        entries: [
          { subject: 'Algorithms', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        ],
        warnings: [],
      };

      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      });
      vi.stubGlobal('fetch', fetchSpy);

      const file = new File(['mock content'], 'schedule.csv', { type: 'text/csv' });
      const result = await uploadAndExtractTimetable('tt-123', file);

      expect(result.entries.length).toBe(1);
      expect(result.entries[0].subject).toBe('Algorithms');
      expect(fetchSpy.mock.calls[0][0]).toContain('/timetables/tt-123/upload');
    });
  });

  describe('Session Storage Persistence', () => {
    it('saves, retrieves, and clears extraction session', () => {
      const data = { filename: 'test.pdf', entries: [] };
      saveExtractionSession(data);
      expect(getExtractionSession()).toEqual(data);
      clearExtractionSession();
      expect(getExtractionSession()).toBe(null);
    });
  });
});
