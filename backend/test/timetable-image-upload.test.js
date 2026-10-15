import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import sharp from "sharp";
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
  user = await prisma.user.create({
    data: { name: "Image Upload User", email: `img-user-${suffix}@example.com`, passwordHash },
  });
  otherUser = await prisma.user.create({
    data: { name: "Other User", email: `img-other-${suffix}@example.com`, passwordHash },
  });
  timetable = await prisma.timetable.create({
    data: { name: "Image Timetable", userId: user.id },
  });
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
  await prisma.timetableEntry.deleteMany({
    where: { timetableId: { in: [timetable.id, otherTimetable.id] } },
  });
  await prisma.timetable.deleteMany({
    where: { id: { in: [timetable.id, otherTimetable.id] } },
  });
  await prisma.user.deleteMany({
    where: { id: { in: [user.id, otherUser.id] } },
  });
  await prisma.$disconnect();
});

async function upload(filename, content, type, authToken = token, targetTimetableId = timetable.id) {
  const form = new FormData();
  form.append("file", new Blob([content], { type }), filename);
  return fetch(`${baseUrl}/api/timetables/${targetTimetableId}/upload`, {
    method: "POST",
    headers: { authorization: `Bearer ${authToken}` },
    body: form,
  });
}

describe("Image Timetable Upload & OCR Integration Tests", () => {
  test("extracts candidate timetable entries from image via OCR without saving to DB", async () => {
    // Generate a synthetic timetable image containing clean, recognizable text
    const svg = `
      <svg width="1200" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="1200" height="400" fill="#ffffff" />
        <text x="50" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#000000">Monday 09:00 - 10:30 Operating Systems Room 101 Dr. Taylor</text>
        <text x="50" y="160" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#000000">Wednesday 11:00 - 12:30 Computer Networks Lab-2 Prof. Adams</text>
      </svg>
    `;

    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();

    const response = await upload("timetable.png", pngBuffer, "image/png");
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.message, "Timetable extracted for review");
    assert.ok(Array.isArray(body.entries));
    assert.ok(body.entries.length >= 1, "Should extract at least 1 candidate entry");

    const first = body.entries[0];
    assert.equal(first.dayOfWeek, 1); // Monday
    assert.equal(first.startTime, "09:00");
    assert.equal(first.endTime, "10:30");
    assert.ok(first.subject.toLowerCase().includes("operating systems"));

    // Critical assertion: verify no entries were written to database automatically
    const storedCount = await prisma.timetableEntry.count({
      where: { timetableId: timetable.id },
    });
    assert.equal(storedCount, 0, "Candidates must not be saved to DB prior to explicit user confirmation");
  });

  test("imports reviewed candidate entries atomically upon explicit confirmation", async () => {
    const candidateEntries = [
      {
        subject: "Algorithms & Data Structures",
        dayOfWeek: 2,
        startTime: "10:00",
        endTime: "11:30",
        room: "Hall-A",
        faculty: "Dr. Gauss",
      },
      {
        subject: "Web Development",
        dayOfWeek: 4,
        startTime: "14:00",
        endTime: "15:30",
        room: "Lab-3",
        faculty: "Prof. Lovelace",
      },
    ];

    const importResponse = await fetch(`${baseUrl}/api/timetables/${timetable.id}/entries/import`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ entries: candidateEntries }),
    });

    assert.equal(importResponse.status, 201);
    const result = await importResponse.json();
    assert.equal(result.count, 2);

    // Verify records exist in database now
    const entriesInDb = await prisma.timetableEntry.findMany({
      where: { timetableId: timetable.id },
      orderBy: { dayOfWeek: "asc" },
    });
    assert.equal(entriesInDb.length, 2);
    assert.equal(entriesInDb[0].subject, "Algorithms & Data Structures");
    assert.equal(entriesInDb[1].subject, "Web Development");
  });

  test("rejects corrupt image uploads with HTTP 400", async () => {
    // Starts with PNG header but contains corrupt truncated data
    const corruptPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
    const response = await upload("corrupted.png", corruptPng, "image/png");
    assert.equal(response.status, 400);
    const body = await response.json();
    assert.ok(body.error.toLowerCase().includes("corrupt") || body.error.toLowerCase().includes("match"));
  });

  test("rejects spoofed file with fake extension with HTTP 400", async () => {
    const fakeImage = Buffer.from("this is just text and not a real jpeg image");
    const response = await upload("fake.jpg", fakeImage, "image/jpeg");
    assert.equal(response.status, 400);
  });

  test("rejects unsupported image extensions with HTTP 415", async () => {
    const bmpBuffer = Buffer.from("BM12345");
    const response = await upload("schedule.bmp", bmpBuffer, "image/bmp");
    assert.equal(response.status, 415);
  });

  test("rejects empty image files with HTTP 400", async () => {
    const response = await upload("empty.png", Buffer.alloc(0), "image/png");
    assert.equal(response.status, 400);
  });

  test("handles blank/no-text image with HTTP 422", async () => {
    // Pure blank white image
    const blankPng = await sharp({
      create: { width: 300, height: 200, channels: 3, background: { r: 255, g: 255, b: 255 } },
    })
      .png()
      .toBuffer();

    const response = await upload("blank.png", blankPng, "image/png");
    assert.equal(response.status, 422);
    const body = await response.json();
    assert.ok(body.error.toLowerCase().includes("no readable text") || body.error.toLowerCase().includes("could not be read"));
  });

  test("regression: existing CSV upload still works seamlessly", async () => {
    const csv = [
      "subject,dayOfWeek,startTime,endTime,room,faculty",
      "Linear Algebra,1,08:00,09:00,Room 102,Dr. Euler",
    ].join("\n");

    const response = await upload("routine.csv", csv, "text/csv");
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.entries.length, 1);
    assert.equal(body.entries[0].subject, "Linear Algebra");
  });
});
