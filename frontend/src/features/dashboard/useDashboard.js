import { useState, useEffect, useCallback, useRef } from 'react';
import { getDashboard } from '../../services/dashboard.service.js';
import { DEFAULT_TIMEZONE } from '../../utils/dateTime.js';

/**
 * Custom hook to fetch and manage dashboard data lifecycle.
 * Prevents race conditions and cancels in-flight requests on unmount.
 *
 * @param {object} [options]
 * @param {string} [options.timezone=DEFAULT_TIMEZONE]
 * @returns {{
 *   data: object|null,
 *   isLoading: boolean,
 *   isError: boolean,
 *   error: Error|null,
 *   refetch: () => Promise<void>
 * }}
 */
export function useDashboard({ timezone = DEFAULT_TIMEZONE } = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async () => {
    // Abort previous in-flight request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const result = await getDashboard({
        timezone,
        signal: controller.signal,
      });

      setData(result);
      setError(null);
    } catch (err) {
      // Ignore abort errors from component unmount / superseded requests
      if (err.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setError(err);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [timezone]);

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return {
    data,
    isLoading,
    isError: Boolean(error),
    error,
    refetch: fetchData,
  };
}

export default useDashboard;
