import { createEntrySchema, entryData } from "../entry-validation.js";

const DAY_NAMES = {
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
  sun: 7, sunday: 7,
};

const WEEKDAY_REGEX = /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:nesday)?|thu(?:rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i;

/**
 * Normalizes day string to 1-7 or null.
 * @param {string} value
 * @returns {number|null}
 */
export function normalizeWeekday(value) {
  if (!value) return null;
  const match = String(value).trim().toLowerCase().match(WEEKDAY_REGEX);
  if (!match) return null;
  return DAY_NAMES[match[1]] || null;
}

/**
 * Convert 12-hour or 24-hour time to strict "HH:mm" (24-hour).
 * @param {string} hourStr
 * @param {string} minuteStr
 * @param {string} [meridiem] - "am" or "pm"
 * @returns {string|null}
 */
export function formatTime24(hourStr, minuteStr = "00", meridiem = null) {
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr || "00", 10);

  if (isNaN(hour) || isNaN(minute) || minute < 0 || minute > 59) {
    return null;
  }

  if (meridiem) {
    const med = meridiem.toLowerCase();
    if (med.startsWith("p") && hour < 12) {
      hour += 12;
    } else if (med.startsWith("a") && hour === 12) {
      hour = 0;
    }
  }

  if (hour < 0 || hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * Extract start and end time from a time range string.
 * Supports:
 * - "09:00 - 10:30"
 * - "9:00am - 10:30am"
 * - "9:00 - 10:00 AM"
 * - "14:00 to 15:30"
 * - "9.00 - 10.00"
 * - "09:00 — 10:00"
 *
 * @param {string} text
 * @returns {{ startTime: string, endTime: string } | null}
 */
export function parseTimeRange(text) {
  if (!text) return null;

  // Regex matching start and end times
  const rangePattern =
    /(?:^|\b)(\d{1,2})[:.](\d{2})\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})[:.](\d{2})\s*(am|pm)?(?:\b|$)/i;

  const match = text.match(rangePattern);
  if (match) {
    const [, startH, startM, startMed, endH, endM, endMed] = match;
    // If end has PM and start has no meridiem, infer start meridiem
    let inferredStartMed = startMed;
    let inferredEndMed = endMed;
    if (!startMed && endMed) {
      const sH = parseInt(startH, 10);
      const eH = parseInt(endH, 10);
      if (endMed.toLowerCase().startsWith("p") && sH > eH && sH < 12) {
        inferredStartMed = "am";
      } else {
        inferredStartMed = endMed;
      }
    }

    const start = formatTime24(startH, startM, inferredStartMed);
    const end = formatTime24(endH, endM, inferredEndMed);

    if (start && end && start < end) {
      return { startTime: start, endTime: end };
    }
  }

  // Also support hour-only formats like "9am - 10am" or "9 - 10 AM"
  const hourOnlyPattern =
    /(?:^|\b)(\d{1,2})\s*(am|pm)\s*(?:-|–|—|to)\s*(\d{1,2})\s*(am|pm)(?:\b|$)/i;

  const hourMatch = text.match(hourOnlyPattern);
  if (hourMatch) {
    const [, startH, startMed, endH, endMed] = hourMatch;
    const start = formatTime24(startH, "00", startMed);
    const end = formatTime24(endH, "00", endMed);
    if (start && end && start < end) {
      return { startTime: start, endTime: end };
    }
  }

  return null;
}

/**
 * Extract classroom or room identifier from text.
 * @param {string} text
 * @returns {{ room: string | null, remaining: string }}
 */
export function extractRoom(text) {
  if (!text) return { room: null, remaining: "" };

  const patterns = [
    /\b(?:Room|Rm|Classroom|Hall|LH|Lab)\.?\s*[:#-]?\s*([A-Za-z0-9-]+)\b/i,
    /\b([A-Z]-\d{2,4})\b/,
    /\b(Lab\s*[A-Z0-9-]+)\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const room = match[1] || match[0];
      const remaining = text.replace(match[0], " ").trim();
      return { room: room.trim(), remaining };
    }
  }

  return { room: null, remaining: text };
}

/**
 * Extract faculty/teacher name from text.
 * @param {string} text
 * @returns {{ faculty: string | null, remaining: string }}
 */
export function extractFaculty(text) {
  if (!text) return { faculty: null, remaining: "" };

  const patterns = [
    /\b(?:Prof|Professor|Dr|Mr|Mrs|Ms)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b/,
    /\b(?:Faculty|Teacher|Instructor)\s*[:#-]?\s*([A-Za-z\s.]+?)(?:$|[,\n;])/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const faculty = match[1] || match[0];
      const remaining = text.replace(match[0], " ").trim();
      return { faculty: faculty.trim(), remaining };
    }
  }

  return { faculty: null, remaining: text };
}

/**
 * Clean and format subject string.
 * @param {string} text
 * @returns {string}
 */
export function cleanSubject(text) {
  return text
    .replace(/[|•*#~`^]/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Strategy 1: Parse Line-by-Line / Record entries.
 * E.g., lines containing a day of week and a time range.
 */
function parseRecordLines(lines, warnings) {
  const candidates = [];

  for (const lineObj of lines) {
    const rawLine = typeof lineObj === "string" ? lineObj : lineObj.text;
    const line = rawLine?.trim();
    if (!line || line.length < 5) continue;

    // Check if line contains weekday
    const dayOfWeek = normalizeWeekday(line);
    if (!dayOfWeek) continue;

    // Check if line contains time range
    const timeRange = parseTimeRange(line);
    if (!timeRange) continue;

    // Remove day and time range from line to isolate subject, room, faculty
    let remaining = line
      .replace(WEEKDAY_REGEX, " ")
      .replace(/(?:^|\b)\d{1,2}[:.]\d{2}\s*(?:am|pm)?\s*(?:-|–|—|to)\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?(?:\b|$)/i, " ")
      .replace(/(?:^|\b)\d{1,2}\s*(?:am|pm)\s*(?:-|–|—|to)\s*\d{1,2}\s*(?:am|pm)(?:\b|$)/i, " ");

    const roomRes = extractRoom(remaining);
    remaining = roomRes.remaining;

    const facultyRes = extractFaculty(remaining);
    remaining = facultyRes.remaining;

    const subject = cleanSubject(remaining);
    if (!subject || subject.length < 2) continue;

    const candidate = {
      subject,
      dayOfWeek,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      room: roomRes.room || null,
      faculty: facultyRes.faculty || null,
    };

    const validation = createEntrySchema.safeParse(candidate);
    if (validation.success) {
      if (typeof lineObj === "object" && lineObj.confidence && lineObj.confidence < 60) {
        warnings.push({
          message: `Low OCR confidence (${Math.round(lineObj.confidence)}%) for "${subject}" - please verify details.`,
        });
      }
      candidates.push(entryData(validation.data));
    }
  }

  return candidates;
}

/**
 * Strategy 2: Parse Block / Section grouped timetable text.
 * E.g.,
 * Monday
 * 09:00 - 10:30 Math
 * 11:00 - 12:30 Physics
 * Tuesday
 * ...
 */
function parseSectionGroupedLines(lines, warnings) {
  const candidates = [];
  let currentDay = null;

  for (const lineObj of lines) {
    const rawLine = typeof lineObj === "string" ? lineObj : lineObj.text;
    const line = rawLine?.trim();
    if (!line) continue;

    // Check if line is purely or predominantly a day header
    const dayMatch = normalizeWeekday(line);
    if (dayMatch && line.length <= 15) {
      currentDay = dayMatch;
      continue;
    }

    if (!currentDay) continue;

    const timeRange = parseTimeRange(line);
    if (!timeRange) continue;

    let remaining = line
      .replace(/(?:^|\b)\d{1,2}[:.]\d{2}\s*(?:am|pm)?\s*(?:-|–|—|to)\s*\d{1,2}[:.]\d{2}\s*(?:am|pm)?(?:\b|$)/i, " ")
      .replace(/(?:^|\b)\d{1,2}\s*(?:am|pm)\s*(?:-|–|—|to)\s*\d{1,2}\s*(?:am|pm)(?:\b|$)/i, " ");

    const roomRes = extractRoom(remaining);
    remaining = roomRes.remaining;

    const facultyRes = extractFaculty(remaining);
    remaining = facultyRes.remaining;

    const subject = cleanSubject(remaining);
    if (!subject || subject.length < 2) continue;

    const candidate = {
      subject,
      dayOfWeek: currentDay,
      startTime: timeRange.startTime,
      endTime: timeRange.endTime,
      room: roomRes.room || null,
      faculty: facultyRes.faculty || null,
    };

    const validation = createEntrySchema.safeParse(candidate);
    if (validation.success) {
      candidates.push(entryData(validation.data));
    }
  }

  return candidates;
}

/**
 * Strategy 3: Bounding-box Spatial Grid Parsing.
 * Uses word coordinates to correlate columns (weekdays) and rows (time slots).
 */
function parseSpatialGrid(ocrResult, warnings) {
  const words = ocrResult.words || [];
  if (words.length < 5) return [];

  // Identify weekday header words with bounding boxes
  const weekdayHeaders = [];
  for (const w of words) {
    const day = normalizeWeekday(w.text);
    if (day && w.bbox) {
      weekdayHeaders.push({
        day,
        text: w.text,
        bbox: w.bbox,
        centerX: (w.bbox.x0 + w.bbox.x1) / 2,
        centerY: (w.bbox.y0 + w.bbox.y1) / 2,
      });
    }
  }

  // Deduplicate weekday headers that are horizontally spread
  const sortedDayHeaders = weekdayHeaders.sort((a, b) => a.centerX - b.centerX);
  if (sortedDayHeaders.length < 2) return [];

  // Identify time range words/lines with bounding boxes
  const lines = ocrResult.lines || [];
  const timeRows = [];
  for (const line of lines) {
    const timeRange = parseTimeRange(line.text);
    if (timeRange && line.bbox) {
      timeRows.push({
        timeRange,
        bbox: line.bbox,
        centerY: (line.bbox.y0 + line.bbox.y1) / 2,
      });
    }
  }

  if (timeRows.length === 0) return [];

  // We have weekday columns and time rows!
  // Determine column X boundaries
  const columnBounds = [];
  for (let i = 0; i < sortedDayHeaders.length; i++) {
    const cur = sortedDayHeaders[i];
    const prev = sortedDayHeaders[i - 1];
    const next = sortedDayHeaders[i + 1];

    const left = prev ? (prev.centerX + cur.centerX) / 2 : cur.bbox.x0 - 50;
    const right = next ? (cur.centerX + next.centerX) / 2 : cur.bbox.x1 + 150;

    columnBounds.push({
      day: cur.day,
      minX: left,
      maxX: right,
    });
  }

  // Group candidate text cells in the grid
  const candidates = [];

  for (const row of timeRows) {
    // Find text lines roughly aligned vertically with this time row
    const rowMinY = row.bbox.y0 - 20;
    const rowMaxY = row.bbox.y1 + 40;

    for (const col of columnBounds) {
      // Find lines that fall inside col and row
      const cellLines = lines.filter((l) => {
        if (!l.bbox) return false;
        const lineCenterX = (l.bbox.x0 + l.bbox.x1) / 2;
        const lineCenterY = (l.bbox.y0 + l.bbox.y1) / 2;
        return (
          lineCenterX >= col.minX &&
          lineCenterX <= col.maxX &&
          lineCenterY >= rowMinY &&
          lineCenterY <= rowMaxY &&
          !parseTimeRange(l.text) &&
          !normalizeWeekday(l.text)
        );
      });

      if (cellLines.length === 0) continue;

      const cellText = cellLines.map((l) => l.text).join(" ").trim();
      if (!cellText || cellText.length < 2) continue;

      const roomRes = extractRoom(cellText);
      const facultyRes = extractFaculty(roomRes.remaining);
      const subject = cleanSubject(facultyRes.remaining);

      if (!subject || subject.length < 2) continue;

      const candidate = {
        subject,
        dayOfWeek: col.day,
        startTime: row.timeRange.startTime,
        endTime: row.timeRange.endTime,
        room: roomRes.room || null,
        faculty: facultyRes.faculty || null,
      };

      const validation = createEntrySchema.safeParse(candidate);
      if (validation.success) {
        candidates.push(entryData(validation.data));
      }
    }
  }

  return candidates;
}

/**
 * Deduplicate candidates that match subject, dayOfWeek, startTime, and endTime.
 */
function deduplicateCandidates(candidates) {
  const seen = new Set();
  const unique = [];

  for (const item of candidates) {
    const key = `${item.subject.toLowerCase()}|${item.dayOfWeek}|${item.startTime}|${item.endTime}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique;
}

/**
 * Master parser for Timetable OCR results.
 * Executes complementary extraction strategies and returns validated candidate entries.
 *
 * @param {object} ocrResult - Tesseract OCR output { text, lines, words, confidence }
 * @returns {{ entries: Array, warnings: Array, rawTextSnippet: string }}
 */
export function parseTimetableFromOcr(ocrResult) {
  const warnings = [];
  const text = (ocrResult.text || "").trim();

  if (!text || text.length < 5) {
    const err = new Error("No readable text detected in the uploaded image. Please ensure the image is clear and legible.");
    err.status = 422;
    throw err;
  }

  const lines = (ocrResult.lines || []).filter((l) => (l.text || "").trim().length > 0);

  // Fallback if lines array is empty: split raw text by newlines
  const textLines = lines.length > 0 ? lines : text.split(/\r?\n/).map((t) => ({ text: t }));

  // 1. Try Spatial Grid Parser first if bounding boxes exist
  let candidates = parseSpatialGrid(ocrResult, warnings);

  // 2. If spatial grid did not find entries, try record/line matching
  if (candidates.length === 0) {
    candidates = parseRecordLines(textLines, warnings);
  }

  // 3. If still empty, try section-grouped lines (e.g. Day headers followed by class times)
  if (candidates.length === 0) {
    candidates = parseSectionGroupedLines(textLines, warnings);
  }

  // Deduplicate entries
  const uniqueEntries = deduplicateCandidates(candidates);

  // Raw text preview snippet (first 300 chars) for review context
  const rawTextSnippet = text.length > 300 ? `${text.slice(0, 300)}...` : text;

  if (uniqueEntries.length === 0) {
    warnings.push({
      message:
        "Text was detected, but no timetable class schedule could be automatically parsed. Please review the image clarity or use manual entry.",
      sampleText: rawTextSnippet,
    });
  }

  return {
    entries: uniqueEntries,
    warnings,
    rawTextSnippet,
  };
}
