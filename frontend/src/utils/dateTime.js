/**
 * Date and time helpers for RedStone.
 * Matches the backend conventions:
 *   - Default timezone: Asia/Kolkata
 *   - Weekday mapping: 1 = Monday ... 7 = Sunday
 *   - Time strings: "HH:mm" (24h)
 */

export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

export const WEEKDAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const WEEKDAY_MAP = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};

export const TIME_FORMAT_STORAGE_KEY = 'rs_time_format';

/**
 * Retrieve user's saved time format preference ('12h' or '24h').
 * Defaults to '12h'.
 * @returns {'12h'|'24h'}
 */
export function getTimeFormatPreference() {
  try {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(TIME_FORMAT_STORAGE_KEY) : null;
    return saved === '24h' ? '24h' : '12h';
  } catch {
    return '12h';
  }
}

/**
 * Persist user's time format preference ('12h' or '24h').
 * @param {'12h'|'24h'} format
 */
export function setTimeFormatPreference(format) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(TIME_FORMAT_STORAGE_KEY, format === '24h' ? '24h' : '12h');
    }
  } catch {
    // Ignore storage errors in restricted environments
  }
}

/**
 * Format standard "HH:mm" 24h time string.
 * Supports '12h' (e.g., "09:30" → "9:30 AM") or '24h' (e.g., "09:30" → "09:30").
 * Defaults to the user's stored preference.
 *
 * @param {string} timeStr
 * @param {'12h'|'24h'} [format]
 * @returns {string}
 */
export function formatTime(timeStr, format = getTimeFormatPreference()) {
  if (!timeStr || typeof timeStr !== 'string') return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  const hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  if (Number.isNaN(hours)) return timeStr;

  if (format === '24h') {
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${ampm}`;
}

/**
 * Format a Date, timestamp, or ISO string to a human-readable date.
 * @param {Date|string|number} date
 * @param {Intl.DateTimeFormatOptions} [options]
 * @param {string} [timeZone=DEFAULT_TIMEZONE]
 * @returns {string}
 */
export function formatDate(
  date,
  options = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  },
  timeZone = DEFAULT_TIMEZONE
) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return String(date);
  try {
    return d.toLocaleDateString(undefined, { timeZone, ...options });
  } catch {
    return d.toLocaleDateString(undefined, options);
  }
}

/**
 * Get current time string "HH:mm" in the specified timezone.
 * @param {string} [timeZone=DEFAULT_TIMEZONE]
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export function getCurrentTimeInTimezone(timeZone = DEFAULT_TIMEZONE, now = new Date()) {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(now);
  } catch {
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }
}

/**
 * Get current day of week (1 = Monday, ..., 7 = Sunday) in the specified timezone.
 * @param {string} [timeZone=DEFAULT_TIMEZONE]
 * @param {Date} [now=new Date()]
 * @returns {number} 1 to 7
 */
export function getCurrentDayOfWeek(timeZone = DEFAULT_TIMEZONE, now = new Date()) {
  try {
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'long',
    }).format(now);
    return WEEKDAY_MAP[weekday] || 1;
  } catch {
    const day = now.getDay(); // 0 is Sunday
    return day === 0 ? 7 : day;
  }
}

/**
 * Generate contextual greeting based on current hour in specified timezone.
 * @param {string} [timeZone=DEFAULT_TIMEZONE]
 * @param {Date} [now=new Date()]
 * @returns {string}
 */
export function getGreeting(timeZone = DEFAULT_TIMEZONE, now = new Date()) {
  let hours;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      hour12: false,
    }).formatToParts(now);
    const hourPart = parts.find((p) => p.type === 'hour');
    hours = parseInt(hourPart?.value || '9', 10);
  } catch {
    hours = now.getHours();
  }

  if (hours >= 5 && hours < 12) {
    return 'Good morning';
  }
  if (hours >= 12 && hours < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/**
 * Check if a class is currently in progress.
 * @param {string} startTime - "HH:mm"
 * @param {string} endTime - "HH:mm"
 * @param {string} currentTime - "HH:mm"
 * @returns {boolean}
 */
export function isClassInProgress(startTime, endTime, currentTime) {
  if (!startTime || !endTime || !currentTime) return false;
  return currentTime >= startTime && currentTime < endTime;
}

/**
 * Check if a class has ended.
 * @param {string} endTime - "HH:mm"
 * @param {string} currentTime - "HH:mm"
 * @returns {boolean}
 */
export function isClassCompleted(endTime, currentTime) {
  if (!endTime || !currentTime) return false;
  return currentTime >= endTime;
}

/**
 * Check if a class is upcoming.
 * @param {string} startTime - "HH:mm"
 * @param {string} currentTime - "HH:mm"
 * @returns {boolean}
 */
export function isClassUpcoming(startTime, currentTime) {
  if (!startTime || !currentTime) return false;
  return currentTime < startTime;
}

/**
 * Get classes remaining today (those that have not ended yet).
 * @param {Array} classes
 * @param {string} currentTime - "HH:mm"
 * @returns {Array}
 */
export function getRemainingClasses(classes = [], currentTime) {
  if (!Array.isArray(classes)) return [];
  return classes.filter((c) => !isClassCompleted(c.endTime, currentTime));
}

/**
 * Find the next scheduled day with classes from weekly schedule, starting from tomorrow.
 * @param {Array} week - Array of { dayOfWeek, weekday, count, classes }
 * @param {number} currentDayOfWeek - 1 to 7
 * @returns {{ dayOfWeek: number, weekday: string, count: number, classes: Array, isTomorrow: boolean } | null}
 */
export function getNextScheduledDay(week = [], currentDayOfWeek = 1) {
  if (!Array.isArray(week) || week.length === 0) return null;

  // Search starting from tomorrow (currentDayOfWeek + 1), wrapping around 7 days
  for (let offset = 1; offset <= 7; offset += 1) {
    let targetDay = (currentDayOfWeek + offset);
    if (targetDay > 7) targetDay -= 7;

    const dayData = week.find((d) => d.dayOfWeek === targetDay);
    if (dayData && dayData.count > 0) {
      return {
        ...dayData,
        isTomorrow: offset === 1,
      };
    }
  }

  return null;
}
