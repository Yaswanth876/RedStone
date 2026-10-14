import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../src/db.js";
import app from "../src/app.js";

let server;
let baseUrl;
let user;
let otherUser;
let timetable;
let otherTimetable;
let token;
let otherToken;
const createdEntryIds = [];

async function request(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  return fetch(`${baseUrl}${path}`, { ...options, headers });
}

before(async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  user = await prisma.user.create({
    data: {
      name: "Entry Test User",
      email: `entry-test-${suffix}@example.com`,
      passwordHash: await bcrypt.hash("password123", 4),
    },
  });
  otherUser = await prisma.user.create({
    data: {
      name: "Other Entry Test User",
      email: `entry-test-other-${suffix}@example.com`,
      passwordHash: await bcrypt.hash("password123", 4),
    },
  });
  timetable = await prisma.timetable.create({ data: { name: "Entry Test Timetable", userId: user.id } });
  otherTimetable = await prisma.timetable.create({
    data: { name: "Other Timetable", userId: otherUser.id },
  });
  token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  otherToken = jwt.sign({ sub: otherUser.id }, process.env.JWT_SECRET);
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await prisma.timetableEntry.deleteMany({ where: { id: { in: createdEntryIds } } });
  await prisma.timetable.deleteMany({ where: { id: { in: [timetable.id, otherTimetable.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [user.id, otherUser.id] } } });
  await prisma.$disconnect();
});

const auth = (value = token) => ({ authorization: `Bearer ${value}` });
const entry = (overrides = {}) => ({
  subject: "Mathematics",
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "10:00",
  room: "101",
  faculty: "Dr. Test",
  ...overrides,
});

describe("timetable entry management", () => {
  test("rejects unauthenticated and invalid UUID requests", async () => {
    const unauthenticated = await request(`/api/timetables/${timetable.id}/entries`);
    assert.equal(unauthenticated.status, 401);

    const invalid = await request("/api/timetables/not-a-uuid/entries", { headers: auth() });
    assert.equal(invalid.status, 400);
  });

  test("enforces timetable ownership", async () => {
    const response = await request(`/api/timetables/${otherTimetable.id}/entries`, { headers: auth() });
    assert.equal(response.status, 404);
  });

  test("creates, retrieves, lists, and queries entries", async () => {
    const createdResponse = await request(`/api/timetables/${timetable.id}/entries`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify(entry()),
    });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json();
    assert.equal(created.entry.subject, "Mathematics");
    createdEntryIds.push(created.entry.id);

    const getResponse = await request(
      `/api/timetables/${timetable.id}/entries/${created.entry.id}`,
      { headers: auth() }
    );
    assert.equal(getResponse.status, 200);

    const dayResponse = await request(`/api/timetables/${timetable.id}/entries/day/1`, {
      headers: auth(),
    });
    assert.equal(dayResponse.status, 200);
    assert.equal((await dayResponse.json()).entries.length, 1);

    const weekResponse = await request(`/api/timetables/${timetable.id}/entries/week`, {
      headers: auth(),
    });
    assert.equal(weekResponse.status, 200);
    assert.equal((await weekResponse.json()).entries.length, 1);
  });

  test("validates fields and rejects overlap while allowing adjacent entries", async () => {
    const invalid = await request(`/api/timetables/${timetable.id}/entries`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify(entry({ dayOfWeek: 8, endTime: "08:00" })),
    });
    assert.equal(invalid.status, 400);

    const overlap = await request(`/api/timetables/${timetable.id}/entries`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify(entry({ subject: "Physics", startTime: "09:30", endTime: "10:30" })),
    });
    assert.equal(overlap.status, 409);

    const adjacent = await request(`/api/timetables/${timetable.id}/entries`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify(entry({ subject: "Physics", startTime: "10:00", endTime: "11:00" })),
    });
    assert.equal(adjacent.status, 201);
    createdEntryIds.push((await adjacent.json()).entry.id);
  });

  test("updates without self-overlap and deletes entries", async () => {
    const createdResponse = await request(`/api/timetables/${timetable.id}/entries`, {
      method: "POST",
      headers: auth(),
      body: JSON.stringify(entry({ subject: "Chemistry", dayOfWeek: 2 })),
    });
    const created = await createdResponse.json();
    createdEntryIds.push(created.entry.id);

    const update = await request(`/api/timetables/${timetable.id}/entries/${created.entry.id}`, {
      method: "PATCH",
      headers: auth(),
      body: JSON.stringify({ subject: "Advanced Chemistry", endTime: "10:30" }),
    });
    assert.equal(update.status, 200);
    assert.equal((await update.json()).entry.subject, "Advanced Chemistry");

    const deleted = await request(`/api/timetables/${timetable.id}/entries/${created.entry.id}`, {
      method: "DELETE",
      headers: auth(),
    });
    assert.equal(deleted.status, 204);
  });

  test("prevents cross-timetable entry access", async () => {
    const createdResponse = await request(`/api/timetables/${otherTimetable.id}/entries`, {
      method: "POST",
      headers: auth(otherToken),
      body: JSON.stringify(entry()),
    });
    const created = await createdResponse.json();
    const response = await request(`/api/timetables/${otherTimetable.id}/entries/${created.entry.id}`, {
      headers: auth(),
    });
    assert.equal(response.status, 404);
    await prisma.timetableEntry.delete({ where: { id: created.entry.id } });
  });
});
