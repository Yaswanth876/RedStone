import { Router } from "express";
import { z } from "zod";
import prisma from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

const uuidSchema = z.uuid();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");
const entryFields = {
  subject: z.string().trim().min(1).max(200),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: timeSchema,
  endTime: timeSchema,
  room: z.string().trim().max(100).optional(),
  faculty: z.string().trim().max(200).optional(),
};
const createEntrySchema = z.object(entryFields).strict().superRefine(validateTimeRange);
const updateEntrySchema = z.object(entryFields).partial().strict();

function validateTimeRange(value, context) {
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "End time must be later than start time",
    });
  }
}

function parseUuid(value, field) {
  const result = uuidSchema.safeParse(value);
  return result.success ? value : { error: `${field} must be a valid UUID` };
}

async function getOwnedTimetable(timetableId, userId) {
  return prisma.timetable.findFirst({ where: { id: timetableId, userId } });
}

async function getEntry(timetableId, entryId) {
  return prisma.timetableEntry.findFirst({ where: { id: entryId, timetableId } });
}

async function hasOverlap(timetableId, data, excludedId) {
  const entries = await prisma.timetableEntry.findMany({
    where: {
      timetableId,
      dayOfWeek: data.dayOfWeek,
      ...(excludedId ? { id: { not: excludedId } } : {}),
    },
    select: { id: true, startTime: true, endTime: true },
  });

  return entries.find(
    (entry) => data.startTime < entry.endTime && data.endTime > entry.startTime
  );
}

function validationError(res, result) {
  return res.status(400).json({ error: "Invalid timetable entry data", details: result.error.issues });
}

async function authorizeRoute(req, res) {
  const timetableId = parseUuid(req.params.timetableId, "timetableId");
  if (typeof timetableId !== "string") {
    res.status(400).json(timetableId);
    return null;
  }

  const timetable = await getOwnedTimetable(timetableId, req.user.id);
  if (!timetable) {
    res.status(404).json({ error: "Timetable not found" });
    return null;
  }
  return timetableId;
}

router.post("/", async (req, res) => {
  try {
    const timetableId = await authorizeRoute(req, res);
    if (!timetableId) return;

    const result = createEntrySchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);

    const conflict = await hasOverlap(timetableId, result.data);
    if (conflict) return res.status(409).json({ error: "Timetable entry overlaps an existing entry" });

    const entry = await prisma.timetableEntry.create({ data: { ...result.data, timetableId } });
    return res.status(201).json({ message: "Timetable entry created successfully", entry });
  } catch (error) {
    console.error("Failed to create timetable entry:", error);
    return res.status(500).json({ error: "Failed to create timetable entry" });
  }
});

router.get("/", async (req, res) => {
  try {
    const timetableId = await authorizeRoute(req, res);
    if (!timetableId) return;

    const entries = await prisma.timetableEntry.findMany({
      where: { timetableId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return res.status(200).json({ entries });
  } catch (error) {
    console.error("Failed to fetch timetable entries:", error);
    return res.status(500).json({ error: "Failed to fetch timetable entries" });
  }
});

router.get("/day/:dayOfWeek", async (req, res) => {
  try {
    const timetableId = await authorizeRoute(req, res);
    if (!timetableId) return;
    const day = Number(req.params.dayOfWeek);
    if (!Number.isInteger(day) || day < 1 || day > 7) {
      return res.status(400).json({ error: "dayOfWeek must be an integer from 1 to 7" });
    }

    const entries = await prisma.timetableEntry.findMany({
      where: { timetableId, dayOfWeek: day },
      orderBy: { startTime: "asc" },
    });
    return res.status(200).json({ entries });
  } catch (error) {
    console.error("Failed to fetch daily timetable entries:", error);
    return res.status(500).json({ error: "Failed to fetch timetable entries" });
  }
});

router.get("/week", async (req, res) => {
  try {
    const timetableId = await authorizeRoute(req, res);
    if (!timetableId) return;
    const entries = await prisma.timetableEntry.findMany({
      where: { timetableId },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });
    return res.status(200).json({ entries });
  } catch (error) {
    console.error("Failed to fetch weekly timetable entries:", error);
    return res.status(500).json({ error: "Failed to fetch timetable entries" });
  }
});

router.get("/:entryId", async (req, res) => {
  try {
    const timetableId = await authorizeRoute(req, res);
    if (!timetableId) return;
    const entryId = parseUuid(req.params.entryId, "entryId");
    if (typeof entryId !== "string") return res.status(400).json(entryId);

    const entry = await getEntry(timetableId, entryId);
    if (!entry) return res.status(404).json({ error: "Timetable entry not found" });
    return res.status(200).json({ entry });
  } catch (error) {
    console.error("Failed to fetch timetable entry:", error);
    return res.status(500).json({ error: "Failed to fetch timetable entry" });
  }
});

router.patch("/:entryId", async (req, res) => {
  try {
    const timetableId = await authorizeRoute(req, res);
    if (!timetableId) return;
    const entryId = parseUuid(req.params.entryId, "entryId");
    if (typeof entryId !== "string") return res.status(400).json(entryId);

    const existing = await getEntry(timetableId, entryId);
    if (!existing) return res.status(404).json({ error: "Timetable entry not found" });

    const result = updateEntrySchema.safeParse(req.body);
    if (!result.success) return validationError(res, result);
    const finalEntry = { ...existing, ...result.data };
    const finalResult = createEntrySchema.safeParse({
      subject: finalEntry.subject,
      dayOfWeek: finalEntry.dayOfWeek,
      startTime: finalEntry.startTime,
      endTime: finalEntry.endTime,
      room: finalEntry.room ?? undefined,
      faculty: finalEntry.faculty ?? undefined,
    });
    if (!finalResult.success) return validationError(res, finalResult);

    const conflict = await hasOverlap(timetableId, finalResult.data, entryId);
    if (conflict) return res.status(409).json({ error: "Timetable entry overlaps an existing entry" });

    const entry = await prisma.timetableEntry.update({
      where: { id: entryId },
      data: finalResult.data,
    });
    return res.status(200).json({ message: "Timetable entry updated successfully", entry });
  } catch (error) {
    console.error("Failed to update timetable entry:", error);
    return res.status(500).json({ error: "Failed to update timetable entry" });
  }
});

router.delete("/:entryId", async (req, res) => {
  try {
    const timetableId = await authorizeRoute(req, res);
    if (!timetableId) return;
    const entryId = parseUuid(req.params.entryId, "entryId");
    if (typeof entryId !== "string") return res.status(400).json(entryId);
    const existing = await getEntry(timetableId, entryId);
    if (!existing) return res.status(404).json({ error: "Timetable entry not found" });

    await prisma.timetableEntry.delete({ where: { id: entryId } });
    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete timetable entry:", error);
    return res.status(500).json({ error: "Failed to delete timetable entry" });
  }
});

export default router;
