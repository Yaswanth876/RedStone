import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import prisma from "../src/db.js";
import app from "../src/app.js";

let server;
let baseUrl;
let email;
let userId;
let token;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  email = `security-${Date.now()}@example.com`;
});

after(async () => {
  server.close();
  if (userId) await prisma.user.delete({ where: { id: userId } });
  await prisma.$disconnect();
});

async function json(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  return { response, body: await response.json() };
}

describe("validation, security and health", () => {
  test("registers and logs in without exposing password data", async () => {
    const registration = await json("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Security User", email: email.toUpperCase(), password: "password123" }),
    });
    assert.equal(registration.response.status, 201);
    assert.equal(registration.body.user.email, email);
    assert.equal("passwordHash" in registration.body.user, false);
    assert.equal("password" in registration.body.user, false);
    token = registration.body.token;
    userId = registration.body.user.id;

    const duplicate = await json("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name: "Duplicate", email, password: "password123" }),
    });
    assert.equal(duplicate.response.status, 409);

    const login = await json("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: email.toUpperCase(), password: "password123" }),
    });
    assert.equal(login.response.status, 200);
    assert.equal("passwordHash" in login.body.user, false);
  });

  test("rejects malformed requests, invalid tokens and unsupported fields", async () => {
    const invalidRegister = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "", email: "not-an-email", password: "short", extra: true }),
    });
    assert.equal(invalidRegister.status, 400);

    const malformed = await fetch(`${baseUrl}/api/timetables`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: "{\"name\":",
    });
    assert.equal(malformed.status, 400);
    assert.equal((await malformed.json()).error, "Malformed JSON request body");

    const unauthorized = await fetch(`${baseUrl}/api/timetables`, {
      headers: { authorization: "Bearer invalid" },
    });
    assert.equal(unauthorized.status, 401);

    const expired = await fetch(`${baseUrl}/api/timetables`, {
      headers: { authorization: `Bearer ${jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: -1 })}` },
    });
    assert.equal(expired.status, 401);

    const unsupportedId = await fetch(`${baseUrl}/api/timetables/not-a-uuid`, {
      headers: { authorization: `Bearer ${token}` },
    });
    assert.equal(unsupportedId.status, 400);
  });

  test("exposes safe health, readiness, unknown-route and security responses", async () => {
    const health = await json("/api/health");
    assert.equal(health.response.status, 200);

    const readiness = await json("/api/health/ready");
    assert.equal(readiness.response.status, 200);
    assert.equal(readiness.body.status, "ready");

    const missing = await json("/api/not-a-route");
    assert.equal(missing.response.status, 404);
    assert.equal(missing.body.error, "Route not found");

    const headers = await fetch(`${baseUrl}/api/health`);
    assert.ok(headers.headers.get("x-content-type-options"));
    assert.equal(headers.headers.get("x-powered-by"), null);
  });
});
