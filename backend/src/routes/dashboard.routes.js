import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  DEFAULT_TIMEZONE,
  getDashboardData,
  validateTimezone,
} from "../services/dashboard.js";

const router = Router();
router.use(requireAuth);

function requestedTimezone(req, res) {
  const timeZone = req.query.timezone || DEFAULT_TIMEZONE;
  if (typeof timeZone !== "string" || !validateTimezone(timeZone)) {
    res.status(400).json({ error: "Invalid timezone" });
    return null;
  }
  return timeZone;
}

function nextClassMessage(nextClass) {
  return nextClass ? "Next upcoming class today" : "No upcoming classes today";
}

router.get("/today", async (req, res) => {
  try {
    const timeZone = requestedTimezone(req, res);
    if (!timeZone) return;
    const dashboard = await getDashboardData(req.user.id, { timeZone });
    return res.status(200).json(dashboard.today);
  } catch (error) {
    console.error("Failed to fetch today's dashboard:", error);
    return res.status(500).json({ error: "Failed to fetch today's dashboard" });
  }
});

router.get("/next-class", async (req, res) => {
  try {
    const timeZone = requestedTimezone(req, res);
    if (!timeZone) return;
    const dashboard = await getDashboardData(req.user.id, { timeZone });
    return res.status(200).json({
      nextClass: dashboard.nextClass,
      message: nextClassMessage(dashboard.nextClass),
    });
  } catch (error) {
    console.error("Failed to fetch next dashboard class:", error);
    return res.status(500).json({ error: "Failed to fetch next dashboard class" });
  }
});

router.get("/week", async (req, res) => {
  try {
    const timeZone = requestedTimezone(req, res);
    if (!timeZone) return;
    const dashboard = await getDashboardData(req.user.id, { timeZone });
    return res.status(200).json({
      timezone: timeZone,
      hasTimetable: dashboard.hasTimetable,
      isEmpty: dashboard.isEmpty,
      days: dashboard.weekly,
    });
  } catch (error) {
    console.error("Failed to fetch weekly dashboard:", error);
    return res.status(500).json({ error: "Failed to fetch weekly dashboard" });
  }
});

router.get("/", async (req, res) => {
  try {
    const timeZone = requestedTimezone(req, res);
    if (!timeZone) return;
    const dashboard = await getDashboardData(req.user.id, { timeZone });
    return res.status(200).json({
      date: dashboard.date,
      timezone: timeZone,
      hasTimetable: dashboard.hasTimetable,
      isEmpty: dashboard.isEmpty,
      today: dashboard.today,
      nextClass: dashboard.nextClass,
      nextClassMessage: nextClassMessage(dashboard.nextClass),
      week: dashboard.weekly,
    });
  } catch (error) {
    console.error("Failed to fetch dashboard:", error);
    return res.status(500).json({ error: "Failed to fetch dashboard" });
  }
});

export default router;
