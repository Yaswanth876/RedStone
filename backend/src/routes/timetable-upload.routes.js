import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import prisma from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { createEntrySchema, entryData, findInternalOverlap, importEntriesSchema, overlaps } from "../entry-validation.js";
import { extractTimetable, fileSignatureMatches } from "../services/timetable-extraction.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const maxFileSize = Number(process.env.UPLOAD_MAX_BYTES) || 10 * 1024 * 1024;
const allowedExtensions = new Set([".pdf", ".csv", ".xlsx"]);
const allowedMimes = new Set([
  "application/pdf", "text/csv", "application/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream", "text/plain",
]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSize, files: 1 },
  fileFilter: (req, file, callback) => {
    const extension = `.${file.originalname.split(".").pop().toLowerCase()}`;
    if (!allowedExtensions.has(extension) || !allowedMimes.has(file.mimetype)) {
      const error = new Error("Unsupported file type");
      error.status = 415;
      return callback(error);
    }
    return callback(null, true);
  },
});
const uuidSchema = z.uuid();

async function ownedTimetable(req, res) {
  if (!uuidSchema.safeParse(req.params.timetableId).success) {
    res.status(400).json({ error: "timetableId must be a valid UUID" });
    return null;
  }
  const timetable = await prisma.timetable.findFirst({
    where: { id: req.params.timetableId, userId: req.user.id },
  });
  if (!timetable) res.status(404).json({ error: "Timetable not found" });
  return timetable;
}

function uploadError(error, req, res, next) {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File exceeds the upload size limit" });
    return res.status(400).json({ error: "Invalid file upload" });
  }
  if (error) return res.status(error.status || 400).json({
    error: error.status === 415 ? "Unsupported file type" : "Unsupported or invalid file upload",
  });
  return next();
}

router.post("/upload", (req, res, next) => upload.single("file")(req, res, (error) => uploadError(error, req, res, next)), async (req, res) => {
  try {
    const timetable = await ownedTimetable(req, res);
    if (!timetable) return;
    if (!req.file || !req.file.buffer.length) return res.status(400).json({ error: "A non-empty file is required" });

    const extension = `.${req.file.originalname.split(".").pop().toLowerCase()}`;
    if (!allowedExtensions.has(extension) || !fileSignatureMatches(req.file.buffer, extension)) {
      return res.status(400).json({ error: "File extension, MIME type, and file contents do not match" });
    }
    try {
      const result = await extractTimetable(req.file.buffer, extension);
      return res.status(200).json({
        message: "Timetable extracted for review",
        entries: result.entries,
        warnings: result.warnings,
      });
    } catch (error) {
      console.error("Timetable extraction failed:", error);
      return res.status(422).json({ error: "The file could not be read or its layout is unsupported", warnings: ["Manual entry or OCR may be required"] });
    }
  } catch (error) {
    console.error("Timetable upload failed:", error);
    return res.status(500).json({ error: "Failed to process timetable upload" });
  }
});

router.post("/entries/import", async (req, res) => {
  try {
    const timetable = await ownedTimetable(req, res);
    if (!timetable) return;
    const result = importEntriesSchema.safeParse(req.body);
    if (!result.success) return res.status(400).json({ error: "Invalid import entries", details: result.error.issues });

    const entries = result.data.entries.map(entryData);
    const internalConflict = findInternalOverlap(entries);
    if (internalConflict) {
      return res.status(409).json({ error: "Imported entries overlap", details: internalConflict });
    }

    const existing = await prisma.timetableEntry.findMany({ where: { timetableId: timetable.id } });
    const conflict = entries.find((candidate) => existing.some((stored) => overlaps(candidate, stored)));
    if (conflict) return res.status(409).json({ error: "An imported entry overlaps an existing entry" });
    const duplicate = entries.find((candidate) => existing.some(
      (stored) => stored.subject === candidate.subject && stored.dayOfWeek === candidate.dayOfWeek &&
        stored.startTime === candidate.startTime && stored.endTime === candidate.endTime
    ));
    if (duplicate) return res.status(409).json({ error: "An imported entry already exists" });

    const saved = await prisma.$transaction(
      entries.map((entry) => prisma.timetableEntry.create({ data: { ...entry, timetableId: timetable.id } }))
    );
    return res.status(201).json({ message: "Timetable entries imported successfully", count: saved.length, entries: saved });
  } catch (error) {
    console.error("Timetable import failed:", error);
    return res.status(500).json({ error: "Failed to import timetable entries" });
  }
});

export default router;
