import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../src/db.js";
import app from "../src/app.js";
import {
  buildWeek,
  getLocalContext,
  getNextUpcomingClass,
} from "../src/services/dashboard.js";

let server;
let baseUrl;
let user;
let emptyUser;
let timetable;
let token;

before(async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const passwordHash = await bcrypt.hash("password123", 4);
  user = await prisma.user.create({
    data: { name: "Dashboard User", email: `dashboard-${suffix}@example.com`, passwordHash },
  });
  emptyUser = await prisma.user.create({
    data: { name: "Empty Dashboard User", email: `dashboard-empty-${suffix}@example.com`, passwordHash },
  });
  timetable = await prisma.timetable.create({ data: { name: "Dashboard Timetable", userId: user.id } });
  const now = new Date();
  const day = getLocalContext(now).dayOfWeek;
  const otherDay = day === 1 ? 2 : 1;
  await prisma.timetableEntry.createMany({
    data: [
      { timetableId: timetable.id, subject: "Later", dayOfWeek: day, startTime: "23:00", endTime: "23:30" },
      { timetableId: timetable.id, subject: "Earlier", dayOfWeek: day, startTime: "21:00", endTime: "21:30" },
      { timetableId: timetable.id, subject: "Other Day Class", dayOfWeek: otherDay, startTime: "10:00", endTime: "11:00" },
    ],
  });
  token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await prisma.timetableEntry.deleteMany({ where: { timetableId: timetable.id } });
  await prisma.timetable.deleteMany({ where: { id: timetable.id } });
  await prisma.user.deleteMany({ where: { id: { in: [user.id, emptyUser.id] } } });
  await prisma.$disconnect();
});

describe("dashboard time and grouping helpers", () => {
  test("maps weekday and timezone correctly across a midnight boundary", () => {
    const context = getLocalContext(new Date("2026-01-04T18:45:00.000Z"), "Asia/Kolkata");
    assert.equal(context.date, "2026-01-05");
    assert.equal(context.dayOfWeek, 1);
    assert.equal(context.time, "00:15");
  });

  test("selects only future classes today and excludes in-progress classes", () => {
    const context = getLocalContext(new Date("2026-01-05T04:30:00.000Z"), "Asia/Kolkata");
    const entries = [
      { id: "1", subject: "Started", timetableId: "t", dayOfWeek: 1, startTime: "10:00", endTime: "11:00" },
      { id: "2", subject: "Next", timetableId: "t", dayOfWeek: 1, startTime: "11:15", endTime: "12:00" },
      { id: "3", subject: "Tomorrow", timetableId: "t", dayOfWeek: 2, startTime: "09:00", endTime: "10:00" },
    ];
    const next = getNextUpcomingClass(entries, context);
    assert.equal(next.subject, "Next");
    assert.equal(next.minutesUntilStart, 75);
    assert.equal(
      getNextUpcomingClass(
        [{ id: "4", subject: "Done", timetableId: "t", dayOfWeek: 1, startTime: "09:00", endTime: "10:00" }],
        context
      ),
      null
    );
  });

  test("uses the requested timezone when determining the local day", () => {
    const utcInstant = new Date("2026-01-05T00:30:00.000Z");
    assert.equal(getLocalContext(utcInstant, "Asia/Kolkata").dayOfWeek, 1);
    assert.equal(getLocalContext(utcInstant, "America/New_York").dayOfWeek, 7);
  });

  test("builds all seven sorted weekday groups including empty days", () => {
    const days = buildWeek([
      { id: "1", subject: "Late", timetableId: "t", dayOfWeek: 1, startTime: "12:00", endTime: "13:00" },
      { id: "2", subject: "Early", timetableId: "t", dayOfWeek: 1, startTime: "08:00", endTime: "09:00" },
    ]);
    assert.equal(days.length, 7);
    assert.deepEqual(days[0].classes.map((entry) => entry.subject), ["Early", "Late"]);
    assert.equal(days[6].count, 0);
  });
});

describe("dashboard endpoints", () => {
  test("returns today's classes with metadata and sorted classes", async () => {
    const response = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.timezone, "Asia/Kolkata");
    assert.equal(typeof body.date, "string");
    assert.equal(body.totalClasses, body.classes.length);
    assert.deepEqual(body.classes.map((entry) => entry.subject), ["Earlier", "Later"]);
  });

  test("returns seven days and combined dashboard consistently", async () => {
    const headers = { authorization: `Bearer ${token}` };
    const week = await (await fetch(`${baseUrl}/api/dashboard/week`, { headers })).json();
    const combined = await (await fetch(`${baseUrl}/api/dashboard`, { headers })).json();
    assert.equal(week.days.length, 7);
    assert.deepEqual(combined.week, week.days);
    assert.deepEqual(combined.today, (await (await fetch(`${baseUrl}/api/dashboard/today`, { headers })).json()));
  });

  test("returns safe empty states and requires authentication", async () => {
    const emptyToken = jwt.sign({ sub: emptyUser.id }, process.env.JWT_SECRET);
    const empty = await fetch(`${baseUrl}/api/dashboard/week`, {
      headers: { authorization: `Bearer ${emptyToken}` },
    });
    const emptyBody = await empty.json();
    assert.equal(empty.status, 200);
    assert.equal(emptyBody.hasTimetable, false);
    assert.equal(emptyBody.isEmpty, true);
    assert.equal(emptyBody.days.length, 7);

    const unauthenticated = await fetch(`${baseUrl}/api/dashboard`);
    assert.equal(unauthenticated.status, 401);
  });

  test("rejects an invalid timezone", async () => {
    const response = await fetch(`${baseUrl}/api/dashboard/today?timezone=Not/AZone`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(response.status, 400);
  });
});
