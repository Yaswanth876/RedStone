/**
 * Timetable Review Validation Logic
 * Mirrors backend Zod schemas and validation constraints:
 *   - subject: required, 1–200 characters
 *   - dayOfWeek: integer 1–7 (Monday=1, Sunday=7)
 *   - startTime: HH:mm format
 *   - endTime: HH:mm format, must be strictly after startTime
 *   - room: optional string, max 100 characters
 *   - faculty: optional string, max 200 characters
 *   - duplicate detection: exact match on (dayOfWeek, subject, startTime, endTime)
 *   - overlap detection: same dayOfWeek where start1 < end2 && end1 > start2
 */

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validate a single review row.
 * @param {object} row
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateReviewRow(row) {
  const errors = {};

  // Subject validation
  const subject = (row.subject || '').trim();
  if (!subject) {
    errors.subject = 'Subject is required';
  } else if (subject.length > 200) {
    errors.subject = 'Subject must be 200 characters or less';
  }

  // Weekday validation
  const day = Number(row.dayOfWeek);
  if (!Number.isInteger(day) || day < 1 || day > 7) {
    errors.dayOfWeek = 'Select a valid day (Mon–Sun)';
  }

  // Time format validations
  const startTime = (row.startTime || '').trim();
  const endTime = (row.endTime || '').trim();

  if (!startTime) {
    errors.startTime = 'Start time is required';
  } else if (!TIME_REGEX.test(startTime)) {
    errors.startTime = 'Use HH:mm format (e.g. 09:30)';
  }

  if (!endTime) {
    errors.endTime = 'End time is required';
  } else if (!TIME_REGEX.test(endTime)) {
    errors.endTime = 'Use HH:mm format (e.g. 10:30)';
  }

  // End time after start time validation
  if (!errors.startTime && !errors.endTime) {
    if (endTime <= startTime) {
      errors.endTime = 'End time must be after start time';
    }
  }

  // Room validation
  if (row.room && row.room.trim().length > 100) {
    errors.room = 'Room must be 100 characters or less';
  }

  // Faculty validation
  if (row.faculty && row.faculty.trim().length > 200) {
    errors.faculty = 'Faculty must be 200 characters or less';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Check if two time intervals on the same day overlap.
 * Matches backend `overlaps` implementation in entry-validation.js.
 */
export function isOverlapping(first, second) {
  if (Number(first.dayOfWeek) !== Number(second.dayOfWeek)) {
    return false;
  }
  if (!first.startTime || !first.endTime || !second.startTime || !second.endTime) {
    return false;
  }
  return first.startTime < second.endTime && first.endTime > second.startTime;
}

/**
 * Check if two rows are duplicate entries (exact subject, day, and time range).
 */
export function isDuplicate(first, second) {
  return (
    Number(first.dayOfWeek) === Number(second.dayOfWeek) &&
    (first.subject || '').trim().toLowerCase() === (second.subject || '').trim().toLowerCase() &&
    first.startTime === second.startTime &&
    first.endTime === second.endTime
  );
}

/**
 * Evaluate all rows for validation errors, duplicates, and schedule overlaps.
 *
 * @param {Array} rows - Array of review candidate rows
 * @returns {{
 *   rowStatuses: Map<string, { isValid: boolean, errors: object, warnings: string[] }>,
 *   totalCount: number,
 *   validCount: number,
 *   invalidCount: number,
 *   conflictCount: number,
 *   duplicateCount: number,
 *   hasBlockingErrors: boolean
 * }}
 */
export function analyzeReviewEntries(rows = []) {
  const rowStatuses = new Map();
  let validCount = 0;
  let invalidCount = 0;
  let conflictCount = 0;
  let duplicateCount = 0;

  // 1. Validate each row individually
  rows.forEach((row) => {
    const { isValid, errors } = validateReviewRow(row);
    rowStatuses.set(row._rowId, {
      isValid,
      errors,
      warnings: [],
      isDuplicate: false,
      hasConflict: false,
    });
    if (isValid) {
      validCount++;
    } else {
      invalidCount++;
    }
  });

  // 2. Inter-row conflict & duplicate detection
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const rowA = rows[i];
      const rowB = rows[j];
      const statusA = rowStatuses.get(rowA._rowId);
      const statusB = rowStatuses.get(rowB._rowId);

      // Duplicate check
      if (isDuplicate(rowA, rowB)) {
        duplicateCount++;
        statusA.isDuplicate = true;
        statusB.isDuplicate = true;
        statusA.warnings.push(`Duplicate of "${rowB.subject}" at ${rowB.startTime}`);
        statusB.warnings.push(`Duplicate of "${rowA.subject}" at ${rowA.startTime}`);
      }
      // Overlap check
      else if (isOverlapping(rowA, rowB)) {
        conflictCount++;
        statusA.hasConflict = true;
        statusB.hasConflict = true;
        statusA.warnings.push(`Time overlaps with "${rowB.subject}" (${rowB.startTime}–${rowB.endTime})`);
        statusB.warnings.push(`Time overlaps with "${rowA.subject}" (${rowA.startTime}–${rowA.endTime})`);
      }
    }
  }

  // Any invalid field is a blocking error.
  // Overlaps also block because the backend explicitly rejects overlaps with HTTP 409!
  const hasBlockingErrors = invalidCount > 0 || conflictCount > 0;

  return {
    rowStatuses,
    totalCount: rows.length,
    validCount,
    invalidCount,
    conflictCount,
    duplicateCount,
    hasBlockingErrors,
  };
}

/**
 * Format entry for backend POST /api/timetables/:id/entries/import.
 * Matches backend `entryData` requirements.
 *
 * @param {object} row
 * @returns {object}
 */
export function sanitizeEntryForImport(row) {
  return {
    subject: (row.subject || '').trim(),
    dayOfWeek: Number(row.dayOfWeek),
    startTime: (row.startTime || '').trim(),
    endTime: (row.endTime || '').trim(),
    room: row.room?.trim() ? row.room.trim() : null,
    faculty: row.faculty?.trim() ? row.faculty.trim() : null,
  };
}
