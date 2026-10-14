import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as XLSX from "xlsx";
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

before(async () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const passwordHash = await bcrypt.hash("password123", 4);
  user = await prisma.user.create({ data: { name: "Upload User", email: `upload-${suffix}@example.com`, passwordHash } });
  otherUser = await prisma.user.create({ data: { name: "Other Upload User", email: `upload-other-${suffix}@example.com`, passwordHash } });
  timetable = await prisma.timetable.create({ data: { name: "Upload Timetable", userId: user.id } });
  otherTimetable = await prisma.timetable.create({ data: { name: "Other Upload Timetable", userId: otherUser.id } });
  token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET);
  otherToken = jwt.sign({ sub: otherUser.id }, process.env.JWT_SECRET);
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  await prisma.timetableEntry.deleteMany({ where: { timetableId: { in: [timetable.id, otherTimetable.id] } } });
  await prisma.timetable.deleteMany({ where: { id: { in: [timetable.id, otherTimetable.id] } } });
  await prisma.user.deleteMany({ where: { id: { in: [user.id, otherUser.id] } } });
  await prisma.$disconnect();
});

async function upload(filename, content, type, authToken = token) {
  const form = new FormData();
  form.append("file", new Blob([content], { type }), filename);
  return fetch(`${baseUrl}/api/timetables/${timetable.id}/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${authToken}` },
    body: form,
  });
}

describe("timetable upload and import", () => {
  test("extracts CSV candidates for review without saving them", async () => {
    const csv = [
      "subject,dayOfWeek,startTime,endTime,room,faculty",
      "Mathematics,1,09:00,10:00,101,Dr. Smith",
    ].join("\n");
    const response = await upload("schedule.csv", csv, "text/csv");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.entries.length, 1);
    assert.equal(await prisma.timetableEntry.count({ where: { timetableId: timetable.id } }), 0);
  });

  test("extracts XLSX candidates and rejects spoofed or empty files", async () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([
      ["subject", "dayOfWeek", "startTime", "endTime"],
      ["Physics", 2, "10:00", "11:00"],
    ]);
    XLSX.utils.book_append_sheet(workbook, sheet, "Schedule");
    const xlsx = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const valid = await upload("schedule.xlsx", xlsx, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert.equal(valid.status, 200);
    assert.equal((await valid.json()).entries[0].subject, "Physics");

    const spoofed = await upload("schedule.pdf", "not a pdf", "application/pdf");
    assert.equal(spoofed.status, 400);
    const empty = await upload("empty.csv", "", "text/csv");
    assert.equal(empty.status, 400);
  });

  test("enforces authentication and timetable ownership", async () => {
    const unauthenticated = await upload("schedule.csv", "subject,dayOfWeek,startTime,endTime\nA,1,09:00,10:00", "text/csv", "");
    assert.equal(unauthenticated.status, 401);

    const form = new FormData();
    form.append("file", new Blob(["subject,dayOfWeek,startTime,endTime\nA,1,09:00,10:00"], { type: "text/csv" }), "schedule.csv");
    const response = await fetch(`${baseUrl}/api/timetables/${otherTimetable.id}/upload`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: form,
    });
    assert.equal(response.status, 404);
    assert.ok(otherToken);
  });

  test("imports reviewed entries atomically and rejects overlap", async () => {
    const entries = [
      { subject: "Chemistry", dayOfWeek: 3, startTime: "09:00", endTime: "10:00", room: null, faculty: null },
      { subject: "Biology", dayOfWeek: 3, startTime: "10:00", endTime: "11:00", room: null, faculty: null },
    ];
    const imported = await fetch(`${baseUrl}/api/timetables/${timetable.id}/entries/import`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    assert.equal(imported.status, 201);
    assert.equal((await imported.json()).count, 2);

    const overlap = await fetch(`${baseUrl}/api/timetables/${timetable.id}/entries/import`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ entries: [
        { subject: "History", dayOfWeek: 3, startTime: "09:30", endTime: "10:30" },
        { subject: "Invalid", dayOfWeek: 8, startTime: "11:00", endTime: "12:00" },
      ] }),
    });
    assert.equal(overlap.status, 400);
    assert.equal(await prisma.timetableEntry.count({ where: { timetableId: timetable.id } }), 2);
  });
});
