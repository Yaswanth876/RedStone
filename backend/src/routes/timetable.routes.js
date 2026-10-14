
import { Router } from "express";
import { z } from "zod";
import prisma from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// All timetable routes require authentication
router.use(requireAuth);

const createTimetableSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
}).strict();

const updateTimetableSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
  })
  .strict();
const timetableIdSchema = z.uuid();

/** Find a timetable by id, scoped to the requesting user */
const getTimetableById = async (id, userId) =>
  prisma.timetable.findFirst({
    where: { id, userId },
  });

function validateId(req, res) {
  if (!timetableIdSchema.safeParse(req.params.id).success) {
    res.status(400).json({ error: "id must be a valid UUID" });
    return false;
  }
  return true;
}

// GET /api/timetables — fetch all timetables for the authenticated user
router.get("/", async (req, res) => {
  try {
    const timetables = await prisma.timetable.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({ timetables });
  } catch (error) {
    console.error("Failed to fetch timetables:", error);
    return res.status(500).json({ error: "Failed to fetch timetables" });
  }
});

// POST /api/timetables — create a timetable owned by the authenticated user
router.post("/", async (req, res) => {
  const result = createTimetableSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid timetable data",
      details: result.error.issues,
    });
  }

  try {
    const timetable = await prisma.timetable.create({
      data: {
        name: result.data.name || "My Timetable",
        userId: req.user.id,
      },
    });

    return res.status(201).json({ message: "Timetable created successfully", timetable });
  } catch (error) {
    console.error("Failed to create timetable:", error);
    return res.status(500).json({ error: "Failed to create timetable" });
  }
});

// GET /api/timetables/:id — fetch a timetable by ID (must be owned by user)
router.get("/:id", async (req, res) => {
  if (!validateId(req, res)) return;
  try {
    const timetable = await getTimetableById(req.params.id, req.user.id);

    if (!timetable) {
      return res.status(404).json({ error: "Timetable not found" });
    }

    return res.status(200).json({ timetable });
  } catch (error) {
    console.error("Failed to fetch timetable:", error);
    return res.status(500).json({ error: "Failed to fetch timetable" });
  }
});

// PATCH /api/timetables/:id — update a timetable (must be owned by user)
router.patch("/:id", async (req, res) => {
  if (!validateId(req, res)) return;
  const result = updateTimetableSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid timetable data",
      details: result.error.issues,
    });
  }

  try {
    const existingTimetable = await getTimetableById(req.params.id, req.user.id);

    if (!existingTimetable) {
      return res.status(404).json({ error: "Timetable not found" });
    }

    const timetable = await prisma.timetable.update({
      where: { id: req.params.id },
      data: result.data,
    });

    return res.status(200).json({ message: "Timetable updated successfully", timetable });
  } catch (error) {
    console.error("Failed to update timetable:", error);
    return res.status(500).json({ error: "Failed to update timetable" });
  }
});

// DELETE /api/timetables/:id — delete a timetable (must be owned by user)
router.delete("/:id", async (req, res) => {
  if (!validateId(req, res)) return;
  try {
    const existingTimetable = await getTimetableById(req.params.id, req.user.id);

    if (!existingTimetable) {
      return res.status(404).json({ error: "Timetable not found" });
    }

    await prisma.timetable.delete({ where: { id: req.params.id } });

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete timetable:", error);
    return res.status(500).json({ error: "Failed to delete timetable" });
  }
});

export default router;
