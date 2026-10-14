import { useContext } from 'react';
import { PreferencesContext } from './PreferencesContext.jsx';
import {
  DEFAULT_TIMEZONE,
  getTimeFormatPreference,
  setTimeFormatPreference,
  formatTime as formatTimeUtil,
} from '../../utils/dateTime.js';

/**
 * Hook to access and update application preferences.
 */
export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    // Graceful fallback for components tested outside the provider
    const fallbackFormat = getTimeFormatPreference();
    return {
      timeFormat: fallbackFormat,
      setTimeFormat: setTimeFormatPreference,
      timezone: DEFAULT_TIMEZONE,
      formatTime: (timeStr) => formatTimeUtil(timeStr, fallbackFormat),
    };
  }
  return context;
}

export default usePreferences;
