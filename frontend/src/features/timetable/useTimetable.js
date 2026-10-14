import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getOrCreateDefaultTimetable,
  getEntries,
  createEntry,
  updateEntry,
  deleteEntry,
  groupEntriesByDay,
} from '../../services/timetable.service.js';

/**
 * Custom hook for managing timetable data lifecycle.
 * Handles fetching, creating, updating, and deleting timetable entries.
 * Prevents race conditions via AbortController.
 *
 * @returns {{
 *   timetableId: string|null,
 *   entries: Array,
 *   entriesByDay: Map,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: Error|null,
 *   totalClasses: number,
 *   refetch: () => Promise<void>,
 *   addEntry: (data: object) => Promise<object>,
 *   editEntry: (entryId: string, data: object) => Promise<object>,
 *   removeEntry: (entryId: string) => Promise<void>,
 * }}
 */
export function useTimetable() {
  const [timetableId, setTimetableId] = useState(null);
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Abort previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      // Get or create default timetable
      const timetable = await getOrCreateDefaultTimetable({ signal: controller.signal });
      if (controller.signal.aborted) return;

      setTimetableId(timetable.id);

      // Fetch entries
      const result = await getEntries(timetable.id, { signal: controller.signal });
      if (controller.signal.aborted) return;

      setEntries(result.entries || []);
      setError(null);
    } catch (err) {
      if (err.name === 'AbortError' || controller.signal.aborted) return;
      setError(err);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  const addEntry = useCallback(async (data) => {
    if (!timetableId) throw new Error('No timetable available');
    const result = await createEntry(timetableId, data);
    // Refresh data after successful creation
    await fetchData();
    return result.entry;
  }, [timetableId, fetchData]);

  const editEntry = useCallback(async (entryId, data) => {
    if (!timetableId) throw new Error('No timetable available');
    const result = await updateEntry(timetableId, entryId, data);
    // Refresh data after successful update
    await fetchData();
    return result.entry;
  }, [timetableId, fetchData]);

  const removeEntry = useCallback(async (entryId) => {
    if (!timetableId) throw new Error('No timetable available');
    await deleteEntry(timetableId, entryId);
    // Refresh data after successful deletion
    await fetchData();
  }, [timetableId, fetchData]);

  const entriesByDay = groupEntriesByDay(entries);
  const totalClasses = entries.length;

  return {
    timetableId,
    entries,
    entriesByDay,
    isLoading,
    isError: Boolean(error),
    error,
    totalClasses,
    refetch: fetchData,
    addEntry,
    editEntry,
    removeEntry,
  };
}

export default useTimetable;
