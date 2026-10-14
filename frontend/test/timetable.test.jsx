import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  groupEntriesByDay,
  getOrCreateDefaultTimetable,
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../src/services/timetable.service.js';

describe('Timetable Service - Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('groupEntriesByDay', () => {
    it('initializes 7 days (1 to 7) with empty arrays', () => {
      const grouped = groupEntriesByDay([]);
      expect(grouped.size).toBe(7);
      for (let day = 1; day <= 7; day++) {
        expect(grouped.get(day)).toEqual([]);
      }
    });

    it('correctly groups entries by day and sorts by startTime', () => {
      const entries = [
        { id: '1', subject: 'Math', dayOfWeek: 1, startTime: '11:00', endTime: '12:00' },
        { id: '2', subject: 'Physics', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        { id: '3', subject: 'Chemistry', dayOfWeek: 3, startTime: '14:00', endTime: '15:30' },
      ];

      const grouped = groupEntriesByDay(entries);

      // Day 1 has 2 entries, sorted by startTime (09:00 before 11:00)
      const day1 = grouped.get(1);
      expect(day1.length).toBe(2);
      expect(day1[0].subject).toBe('Physics');
      expect(day1[1].subject).toBe('Math');

      // Day 3 has 1 entry
      const day3 = grouped.get(3);
      expect(day3.length).toBe(1);
      expect(day3[0].subject).toBe('Chemistry');

      // Day 2 is empty
      expect(grouped.get(2)).toEqual([]);
    });
  });

  describe('getOrCreateDefaultTimetable', () => {
    it('returns existing timetable if user has one', async () => {
      const mockTimetable = { id: 'tt-1', name: 'Semester 1' };
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ success: true, timetables: [mockTimetable] }),
        })
      );

      const result = await getOrCreateDefaultTimetable();
      expect(result).toEqual(mockTimetable);
    });

    it('auto-creates a default timetable if user has none', async () => {
      const newTimetable = { id: 'tt-new', name: 'My Timetable' };
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValueOnce({
            ok: true,
            status: 200,
            json: async () => ({ success: true, timetables: [] }),
          })
          .mockResolvedValueOnce({
            ok: true,
            status: 201,
            json: async () => ({ success: true, timetable: newTimetable }),
          })
      );

      const result = await getOrCreateDefaultTimetable();
      expect(result).toEqual(newTimetable);
    });
  });

  describe('CRUD operations for timetable entries', () => {
    it('getEntries calls /api/timetables/:id/entries', async () => {
      const mockEntries = [{ id: 'e1', subject: 'CS101' }];
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, entries: mockEntries }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const res = await getEntries('tt-1');
      expect(res.entries).toEqual(mockEntries);
      expect(fetchSpy.mock.calls[0][0]).toContain('/timetables/tt-1/entries');
    });

    it('createEntry posts data to /api/timetables/:id/entries', async () => {
      const entryData = {
        subject: 'Linear Algebra',
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '11:30',
      };
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ success: true, entry: { id: 'e2', ...entryData } }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const res = await createEntry('tt-1', entryData);
      expect(res.entry.subject).toBe('Linear Algebra');
      expect(fetchSpy.mock.calls[0][1].method).toBe('POST');
    });

    it('updateEntry patches data to /api/timetables/:id/entries/:entryId', async () => {
      const updateData = { room: 'Hall 404' };
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, entry: { id: 'e1', room: 'Hall 404' } }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      const res = await updateEntry('tt-1', 'e1', updateData);
      expect(res.entry.room).toBe('Hall 404');
      expect(fetchSpy.mock.calls[0][1].method).toBe('PATCH');
    });

    it('deleteEntry issues DELETE request', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      });
      vi.stubGlobal('fetch', fetchSpy);

      await deleteEntry('tt-1', 'e1');
      expect(fetchSpy.mock.calls[0][1].method).toBe('DELETE');
    });
  });
});
