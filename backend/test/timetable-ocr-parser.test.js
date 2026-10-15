import test, { describe } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeWeekday,
  parseTimeRange,
  formatTime24,
  extractRoom,
  extractFaculty,
  cleanSubject,
  parseTimetableFromOcr,
} from "../src/services/timetable-ocr-parser.js";

describe("Timetable OCR Parser - Unit Tests", () => {
  describe("Weekday Normalization", () => {
    test("normalizes full day names to 1-7 database format", () => {
      assert.equal(normalizeWeekday("Monday"), 1);
      assert.equal(normalizeWeekday("Tuesday"), 2);
      assert.equal(normalizeWeekday("Wednesday"), 3);
      assert.equal(normalizeWeekday("Thursday"), 4);
      assert.equal(normalizeWeekday("Friday"), 5);
      assert.equal(normalizeWeekday("Saturday"), 6);
      assert.equal(normalizeWeekday("Sunday"), 7);
    });

    test("normalizes short weekday abbreviations and case insensitivity", () => {
      assert.equal(normalizeWeekday("MON"), 1);
      assert.equal(normalizeWeekday("tue"), 2);
      assert.equal(normalizeWeekday("Wed."), 3);
      assert.equal(normalizeWeekday("Thu"), 4);
      assert.equal(normalizeWeekday("thurs"), 4);
      assert.equal(normalizeWeekday("Fri"), 5);
      assert.equal(normalizeWeekday("SAT"), 6);
      assert.equal(normalizeWeekday("sun"), 7);
    });

    test("returns null for non-weekdays", () => {
      assert.equal(normalizeWeekday("Holiday"), null);
      assert.equal(normalizeWeekday("12345"), null);
      assert.equal(normalizeWeekday(""), null);
      assert.equal(normalizeWeekday(null), null);
    });
  });

  describe("Time Range Parsing & 24h Normalization", () => {
    test("converts 12-hour AM/PM times to 24-hour HH:mm", () => {
      assert.equal(formatTime24("9", "00", "am"), "09:00");
      assert.equal(formatTime24("11", "30", "am"), "11:30");
      assert.equal(formatTime24("12", "00", "pm"), "12:00");
      assert.equal(formatTime24("1", "15", "pm"), "13:15");
      assert.equal(formatTime24("5", "45", "pm"), "17:45");
      assert.equal(formatTime24("12", "30", "am"), "00:30");
    });

    test("parses standard 24-hour time ranges", () => {
      const result = parseTimeRange("09:00 - 10:30");
      assert.deepEqual(result, { startTime: "09:00", endTime: "10:30" });
    });

    test("parses 12-hour AM/PM time ranges", () => {
      const result = parseTimeRange("9:00 AM - 10:30 AM");
      assert.deepEqual(result, { startTime: "09:00", endTime: "10:30" });

      const afternoon = parseTimeRange("1:00 PM - 2:30 PM");
      assert.deepEqual(afternoon, { startTime: "13:00", endTime: "14:30" });
    });

    test("infers morning start time when only end is marked PM", () => {
      const result = parseTimeRange("10:00 - 1:00 PM");
      assert.deepEqual(result, { startTime: "10:00", endTime: "13:00" });
    });

    test("rejects invalid or backwards time ranges where endTime <= startTime", () => {
      assert.equal(parseTimeRange("14:00 - 10:00"), null);
      assert.equal(parseTimeRange("10:00 - 10:00"), null);
      assert.equal(parseTimeRange("not a time"), null);
    });
  });

  describe("Room and Faculty Extraction", () => {
    test("extracts room identifiers from text", () => {
      const res1 = extractRoom("Computer Networks Room 301 Dr. Smith");
      assert.equal(res1.room, "301");
      assert.equal(res1.remaining.includes("301"), false);

      const res2 = extractRoom("Chemistry Lab-2 Prof. Brown");
      assert.equal(res2.room, "Lab-2");

      const res3 = extractRoom("History LH-1");
      assert.equal(res3.room, "LH-1");
    });

    test("extracts faculty titles and names", () => {
      const res1 = extractFaculty("Physics Room 101 Dr. Smith");
      assert.equal(res1.faculty, "Dr. Smith");

      const res2 = extractFaculty("Mathematics Prof. John Doe");
      assert.equal(res2.faculty, "Prof. John Doe");
    });
  });

  describe("OCR Extraction Strategies", () => {
    test("extracts line-by-line schedule records", () => {
      const ocrOutput = {
        text: [
          "Monday 09:00 - 10:30 Machine Learning Room 301 Dr. Alan",
          "Wednesday 11:00 - 12:30 Software Architecture Lab-1 Prof. Lisa",
          "Friday 14:00 - 15:30 Database Systems Room 204",
        ].join("\n"),
        lines: [
          { text: "Monday 09:00 - 10:30 Machine Learning Room 301 Dr. Alan", confidence: 95 },
          { text: "Wednesday 11:00 - 12:30 Software Architecture Lab-1 Prof. Lisa", confidence: 92 },
          { text: "Friday 14:00 - 15:30 Database Systems Room 204", confidence: 88 },
        ],
        words: [],
      };

      const result = parseTimetableFromOcr(ocrOutput);
      assert.equal(result.entries.length, 3);

      assert.equal(result.entries[0].subject, "Machine Learning");
      assert.equal(result.entries[0].dayOfWeek, 1);
      assert.equal(result.entries[0].startTime, "09:00");
      assert.equal(result.entries[0].endTime, "10:30");
      assert.equal(result.entries[0].room, "301");
      assert.equal(result.entries[0].faculty, "Dr. Alan");

      assert.equal(result.entries[1].subject, "Software Architecture");
      assert.equal(result.entries[1].dayOfWeek, 3);
      assert.equal(result.entries[1].startTime, "11:00");
      assert.equal(result.entries[1].endTime, "12:30");

      assert.equal(result.entries[2].subject, "Database Systems");
      assert.equal(result.entries[2].dayOfWeek, 5);
      assert.equal(result.entries[2].startTime, "14:00");
      assert.equal(result.entries[2].endTime, "15:30");
      assert.equal(result.entries[2].room, "204");
      assert.equal(result.entries[2].faculty, null);
    });

    test("extracts section-grouped timetable text", () => {
      const ocrOutput = {
        text: [
          "MONDAY",
          "09:00 - 10:00 Calculus I Room 101",
          "10:00 - 11:00 Linear Algebra",
          "TUESDAY",
          "14:00 - 15:30 Physics Mechanics Lab-4 Dr. Albert",
        ].join("\n"),
        lines: [
          { text: "MONDAY", confidence: 95 },
          { text: "09:00 - 10:00 Calculus I Room 101", confidence: 95 },
          { text: "10:00 - 11:00 Linear Algebra", confidence: 90 },
          { text: "TUESDAY", confidence: 95 },
          { text: "14:00 - 15:30 Physics Mechanics Lab-4 Dr. Albert", confidence: 94 },
        ],
        words: [],
      };

      const result = parseTimetableFromOcr(ocrOutput);
      assert.equal(result.entries.length, 3);
      assert.equal(result.entries[0].dayOfWeek, 1);
      assert.equal(result.entries[0].subject, "Calculus I");
      assert.equal(result.entries[1].dayOfWeek, 1);
      assert.equal(result.entries[1].subject, "Linear Algebra");
      assert.equal(result.entries[2].dayOfWeek, 2);
      assert.equal(result.entries[2].subject, "Physics Mechanics");
    });

    test("flags low-confidence OCR results in warnings", () => {
      const ocrOutput = {
        text: "Monday 09:00 - 10:00 Discrete Math Room 105",
        lines: [{ text: "Monday 09:00 - 10:00 Discrete Math Room 105", confidence: 45 }],
        words: [],
      };

      const result = parseTimetableFromOcr(ocrOutput);
      assert.equal(result.entries.length, 1);
      assert.ok(result.warnings.some((w) => w.message.includes("Low OCR confidence")));
    });

    test("throws 422 error for empty OCR text", () => {
      assert.throws(
        () => parseTimetableFromOcr({ text: "   " }),
        (err) => err.status === 422
      );
    });

    test("returns warning and raw text when text is present but not structured as a timetable", () => {
      const ocrOutput = {
        text: "Invoice #12345 Customer Name John Doe Amount Due $500",
        lines: [{ text: "Invoice #12345 Customer Name John Doe Amount Due $500", confidence: 90 }],
        words: [],
      };

      const result = parseTimetableFromOcr(ocrOutput);
      assert.equal(result.entries.length, 0);
      assert.ok(result.warnings.length > 0);
      assert.ok(result.warnings[0].message.includes("no timetable class schedule could be automatically parsed"));
    });
  });
});
