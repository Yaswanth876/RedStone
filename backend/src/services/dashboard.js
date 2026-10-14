import prisma from "../db.js";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";
const weekdayNumbers = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7,
};
const weekdayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function partsFor(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter(({ type }) => type !== "literal").map(({ type, value }) => [type, value]));
}

export function validateTimezone(timeZone) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function getLocalContext(now = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = partsFor(now, timeZone);
  const dayOfWeek = weekdayNumbers[parts.weekday];
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const time = `${parts.hour}:${parts.minute}`;
  const currentMinutes =
    Number(parts.hour) * 60 + Number(parts.minute) + Number(parts.second) / 60;
  return { date, time, currentMinutes, dayOfWeek, weekday: parts.weekday, timeZone };
}

export function formatEntry(entry) {
  return {
    id: entry.id,
    subject: entry.subject,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    room: entry.room,
    faculty: entry.faculty,
    timetableId: entry.timetableId,
  };
}

export function getNextUpcomingClass(entries, context) {
  const upcoming = entries
    .filter((entry) => entry.dayOfWeek === context.dayOfWeek && entry.startTime > context.time)
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
  if (!upcoming.length) return null;
  const nextClass = upcoming[0];
  const [hours, minutes] = nextClass.startTime.split(":").map(Number);
  return {
    ...formatEntry(nextClass),
    minutesUntilStart: Math.ceil(hours * 60 + minutes - context.currentMinutes),
  };
}

export function buildWeek(entries) {
  return weekdayNames.map((name, index) => {
    const dayOfWeek = index + 1;
    const classes = entries
      .filter((entry) => entry.dayOfWeek === dayOfWeek)
      .sort((first, second) => first.startTime.localeCompare(second.startTime))
      .map(formatEntry);
    return { dayOfWeek, weekday: name, count: classes.length, classes };
  });
}

export async function getDashboardData(userId, { timeZone = DEFAULT_TIMEZONE, now = new Date() } = {}) {
  const timetable = await prisma.timetable.findFirst({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: { id: true, name: true },
  });
  const context = getLocalContext(now, timeZone);
  const entries = timetable
    ? await prisma.timetableEntry.findMany({
      where: { timetableId: timetable.id },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    })
    : [];
  const todayClasses = entries
    .filter((entry) => entry.dayOfWeek === context.dayOfWeek)
    .sort((first, second) => first.startTime.localeCompare(second.startTime))
    .map(formatEntry);
  const nextClass = getNextUpcomingClass(entries, context);
  const weekly = buildWeek(entries);
  const isEmpty = !timetable || entries.length === 0;

  return {
    date: context.date,
    timezone: timeZone,
    timetable: timetable ? { id: timetable.id, name: timetable.name } : null,
    hasTimetable: Boolean(timetable),
    isEmpty,
    today: {
      date: context.date,
      timezone: timeZone,
      totalClasses: todayClasses.length,
      hasTimetable: Boolean(timetable),
      isEmpty: todayClasses.length === 0,
      classes: todayClasses,
    },
    nextClass,
    weekly,
  };
}
