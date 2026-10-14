import { createContext, useState, useCallback, useMemo } from 'react';
import {
  DEFAULT_TIMEZONE,
  getTimeFormatPreference,
  setTimeFormatPreference,
  formatTime as formatTimeUtil,
} from '../../utils/dateTime.js';

const PreferencesContext = createContext(null);

/**
 * PreferencesProvider — provides application-wide display preferences (time format, academic timezone).
 */
export function PreferencesProvider({ children }) {
  const [timeFormat, setTimeFormatState] = useState(() => getTimeFormatPreference());

  const setTimeFormat = useCallback((format) => {
    const valid = format === '24h' ? '24h' : '12h';
    setTimeFormatPreference(valid);
    setTimeFormatState(valid);
  }, []);

  const formatTime = useCallback(
    (timeStr) => formatTimeUtil(timeStr, timeFormat),
    [timeFormat]
  );

  const value = useMemo(
    () => ({
      timeFormat,
      setTimeFormat,
      timezone: DEFAULT_TIMEZONE,
      formatTime,
    }),
    [timeFormat, setTimeFormat, formatTime]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export { PreferencesContext };
export default PreferencesContext;
