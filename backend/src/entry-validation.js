import { z } from "zod";

export const timeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Time must use HH:mm format");

export const entryFields = {
  subject: z.string().trim().min(1, "Subject is required").max(200),
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: timeSchema,
  endTime: timeSchema,
  room: z.string().trim().max(100).nullable().optional(),
  faculty: z.string().trim().max(200).nullable().optional(),
};

export const createEntrySchema = z.object(entryFields).strict().superRefine(validateTimeRange);
export const updateEntrySchema = z.object(entryFields).partial().strict();
export const importEntriesSchema = z.object({ entries: z.array(createEntrySchema).min(1).max(500) }).strict();

export function validateTimeRange(value, context) {
  if (value.startTime && value.endTime && value.endTime <= value.startTime) {
    context.addIssue({
      code: "custom",
      path: ["endTime"],
      message: "End time must be later than start time",
    });
  }
}

export function entryData(value) {
  return {
    subject: value.subject.trim(),
    dayOfWeek: value.dayOfWeek,
    startTime: value.startTime,
    endTime: value.endTime,
    room: value.room?.trim() || null,
    faculty: value.faculty?.trim() || null,
  };
}

export function overlaps(first, second) {
  return first.dayOfWeek === second.dayOfWeek &&
    first.startTime < second.endTime &&
    first.endTime > second.startTime;
}

export function findInternalOverlap(entries) {
  for (let index = 0; index < entries.length; index += 1) {
    for (let next = index + 1; next < entries.length; next += 1) {
      if (overlaps(entries[index], entries[next])) {
        return { first: index, second: next };
      }
    }
  }
  return null;
}
