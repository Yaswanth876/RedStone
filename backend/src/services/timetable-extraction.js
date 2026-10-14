import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import { PDFParse } from "pdf-parse";
import { createEntrySchema, entryData } from "../entry-validation.js";

const dayNames = {
  mon: 1, monday: 1, tue: 2, tues: 2, tuesday: 2, wed: 3, wednesday: 3,
  thu: 4, thurs: 4, thursday: 4, fri: 5, friday: 5, sat: 6, saturday: 6,
  sun: 7, sunday: 7,
};
const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

function clean(value) {
  return String(value ?? "").trim();
}

function day(value) {
  const normalized = clean(value).toLowerCase().replace(/[.]/g, "");
  return dayNames[normalized] ?? null;
}

function time(value) {
  const match = clean(value).match(/(?:^|\s)([01]\d|2[0-3]):([0-5]\d)(?:\s|$)/);
  return match ? `${match[1]}:${match[2]}` : null;
}

function columnIndexes(headers) {
  const result = {};
  headers.forEach((header, index) => {
    const value = clean(header).toLowerCase().replace(/[^a-z]/g, "");
    if (["subject", "course", "class", "name"].includes(value)) result.subject = index;
    if (["day", "weekday", "dayofweek"].includes(value)) result.dayOfWeek = index;
    if (["start", "starttime", "from"].includes(value)) result.startTime = index;
    if (["end", "endtime", "to"].includes(value)) result.endTime = index;
    if (["room", "location", "classroom"].includes(value)) result.room = index;
    if (["faculty", "teacher", "instructor", "professor"].includes(value)) result.faculty = index;
  });
  return result;
}

function parseRows(rows, warnings) {
  if (!rows.length) return [];
  const indexes = columnIndexes(rows[0]);
  const hasRecordColumns = ["subject", "dayOfWeek", "startTime", "endTime"]
    .every((key) => indexes[key] !== undefined);
  const candidates = [];

  if (hasRecordColumns) {
    rows.slice(1).forEach((row, index) => {
      const candidate = {
        subject: clean(row[indexes.subject]),
        dayOfWeek: day(row[indexes.dayOfWeek]) ?? Number(row[indexes.dayOfWeek]),
        startTime: time(row[indexes.startTime]) ?? clean(row[indexes.startTime]),
        endTime: time(row[indexes.endTime]) ?? clean(row[indexes.endTime]),
        room: indexes.room === undefined ? null : clean(row[indexes.room]) || null,
        faculty: indexes.faculty === undefined ? null : clean(row[indexes.faculty]) || null,
      };
      const validation = createEntrySchema.safeParse(candidate);
      if (validation.success) candidates.push(entryData(validation.data));
      else warnings.push({ row: index + 2, message: "Row needs correction", details: validation.error.issues });
    });
    return candidates;
  }

  const headerDays = rows[0].map(day);
  for (let rowIndex = 1; rowIndex < rows.length; rowIndex += 1) {
    const startTime = time(rows[rowIndex][0]);
    const endTime = time(rows[rowIndex][0]?.split("-")[1]) || (startTime ? null : null);
    if (!startTime || !endTime) {
      warnings.push({ row: rowIndex + 1, message: "Unrecognized time-slot row" });
      continue;
    }
    rows[rowIndex].slice(1).forEach((cell, offset) => {
      const dayOfWeek = headerDays[offset + 1];
      const subject = clean(cell);
      if (!subject) return;
      if (!dayOfWeek) {
        warnings.push({ row: rowIndex + 1, message: "Unrecognized weekday column" });
        return;
      }
      candidates.push({ subject, dayOfWeek, startTime, endTime, room: null, faculty: null });
    });
  }
  return candidates;
}

function extractDelimitedText(text, warnings) {
  const rows = parse(text, { relax_column_count: true, skip_empty_lines: true, bom: true });
  return parseRows(rows, warnings);
}

async function extractPdf(buffer, warnings) {
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = result.text?.trim();
    if (!text) {
      warnings.push({ message: "PDF has no extractable text; manual entry or OCR is required" });
      return [];
    }
    const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const rows = lines
      .filter((line) => !/^--\s+\d+\s+of\s+\d+\s+--$/i.test(line))
      .map((line) => line.split(/\t+|\s{2,}|\|/).map((part) => part.trim()));
    const whitespaceRows = lines
      .filter((line) => !/^--\s+\d+\s+of\s+\d+\s+--$/i.test(line))
      .map((line) => line.split(/\s+/));
    const structuredWarnings = [];
    const structured = parseRows(rows, structuredWarnings);
    if (!structured.length && whitespaceRows.length > 1) {
      return parseRows(whitespaceRows, warnings);
    }
    warnings.push(...structuredWarnings);
    return structured;
  } finally {
    await parser.destroy();
  }
}

export async function extractTimetable(buffer, extension) {
  const warnings = [];
  let entries = [];
  if (extension === ".csv") {
    entries = extractDelimitedText(buffer.toString("utf8"), warnings);
  } else if (extension === ".xlsx") {
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!firstSheet) throw new Error("Spreadsheet contains no worksheets");
    entries = parseRows(XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: "" }), warnings);
  } else {
    entries = await extractPdf(buffer, warnings);
  }
  if (!entries.length && !warnings.length) {
    warnings.push({ message: "No timetable entries could be recognized from this file" });
  }
  return { entries, warnings };
}

export function fileSignatureMatches(buffer, extension) {
  if (extension === ".pdf") return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  if (extension === ".xlsx") return buffer.subarray(0, 2).toString("ascii") === "PK";
  return buffer.length > 0 && !buffer.subarray(0, 100).includes(0);
}
