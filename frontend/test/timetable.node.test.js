import test, { describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import {
  groupEntriesByDay,
  getOrCreateDefaultTimetable,
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from '../src/services/timetable.service.js';

describe('Timetable Unit & Integration Tests', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('groupEntriesByDay', () => {
    test('groupEntriesByDay initializes 7 days with sorted arrays', () => {
      const rawEntries = [
        { id: '1', subject: 'Math', dayOfWeek: 1, startTime: '11:00', endTime: '12:00' },
        { id: '2', subject: 'Physics', dayOfWeek: 1, startTime: '09:00', endTime: '10:00' },
        { id: '3', subject: 'Chemistry', dayOfWeek: 5, startTime: '14:00', endTime: '15:30' },
      ];

      const grouped = groupEntriesByDay(rawEntries);

      assert.equal(grouped.size, 7);

      // Monday (day 1)
      const monday = grouped.get(1);
      assert.equal(monday.length, 2);
      assert.equal(monday[0].subject, 'Physics');
      assert.equal(monday[1].subject, 'Math');

      // Friday (day 5)
      const friday = grouped.get(5);
      assert.equal(friday.length, 1);
      assert.equal(friday[0].subject, 'Chemistry');

      // Tuesday (day 2 - empty)
      assert.equal(grouped.get(2).length, 0);
    });

    test('groupEntriesByDay handles empty entries safely', () => {
      const grouped = groupEntriesByDay([]);
      assert.equal(grouped.size, 7);
      for (let d = 1; d <= 7; d++) {
        assert.deepEqual(grouped.get(d), []);
      }
    });

    test('groupEntriesByDay handles undefined safely', () => {
      const grouped = groupEntriesByDay(undefined);
      assert.equal(grouped.size, 7);
    });
  });

  describe('Timetable API integration functions', () => {
    test('getOrCreateDefaultTimetable returns first timetable if available', async () => {
      const mockTimetable = { id: 'tt-123', name: 'Semester 1' };
      globalThis.fetch = async () => ({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ success: true, timetables: [mockTimetable] }),
      });

      const result = await getOrCreateDefaultTimetable();
      assert.deepEqual(result, mockTimetable);
    });

    test('getOrCreateDefaultTimetable creates a default if none exists', async () => {
      const createdTimetable = { id: 'tt-new', name: 'My Timetable' };
      let callCount = 0;
      globalThis.fetch = async (url, options) => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'content-type': 'application/json' }),
            json: async () => ({ success: true, timetables: [] }),
          };
        }
        assert.equal(options.method, 'POST');
        return {
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, timetable: createdTimetable }),
        };
      };

      const result = await getOrCreateDefaultTimetable();
      assert.deepEqual(result, createdTimetable);
    });

    test('getEntries retrieves entries for a timetable', async () => {
      const mockList = [{ id: 'e1', subject: 'Operating Systems' }];
      globalThis.fetch = async (url) => {
        assert.match(url, /\/api\/timetables\/tt-1\/entries/);
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, entries: mockList }),
        };
      };

      const res = await getEntries('tt-1');
      assert.deepEqual(res.entries, mockList);
    });

    test('createEntry posts data and returns entry', async () => {
      const newEntry = {
        subject: 'Database Systems',
        dayOfWeek: 2,
        startTime: '10:00',
        endTime: '11:30',
      };
      globalThis.fetch = async (url, options) => {
        assert.equal(options.method, 'POST');
        const parsed = JSON.parse(options.body);
        assert.equal(parsed.subject, 'Database Systems');
        return {
          ok: true,
          status: 201,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, entry: { id: 'e2', ...newEntry } }),
        };
      };

      const res = await createEntry('tt-1', newEntry);
      assert.equal(res.entry.subject, 'Database Systems');
    });

    test('updateEntry patches data and returns updated entry', async () => {
      globalThis.fetch = async (url, options) => {
        assert.equal(options.method, 'PATCH');
        const parsed = JSON.parse(options.body);
        assert.equal(parsed.room, 'Lab 3');
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ success: true, entry: { id: 'e1', room: 'Lab 3' } }),
        };
      };

      const res = await updateEntry('tt-1', 'e1', { room: 'Lab 3' });
      assert.equal(res.entry.room, 'Lab 3');
    });

    test('deleteEntry sends DELETE request', async () => {
      let deleted = false;
      globalThis.fetch = async (url, options) => {
        assert.equal(options.method, 'DELETE');
        deleted = true;
        return {
          ok: true,
          status: 204,
          headers: new Headers(),
          text: async () => '',
        };
      };

      await deleteEntry('tt-1', 'e1');
      assert.equal(deleted, true);
    });
  });
});
