import test, { after, before, describe } from "node:test";
import assert from "node:assert/strict";
import app from "../src/app.js";

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  server.close();
  delete process.env.METRICS_TOKEN;
});

describe("Prometheus metrics instrumentation", () => {
  test("exposes /metrics with standard Prometheus format", async () => {
    // Make a request to a known endpoint first to generate metrics
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);

    const metricsRes = await fetch(`${baseUrl}/metrics`);
    assert.equal(metricsRes.status, 200);
    assert.match(metricsRes.headers.get("content-type"), /text\/plain/i);

    const body = await metricsRes.text();

    // Verify presence of default Node.js process metrics
    assert.match(body, /redstone_process_cpu_user_seconds_total/);
    assert.match(body, /redstone_process_resident_memory_bytes/);
    assert.match(body, /redstone_process_start_time_seconds/);

    // Verify custom HTTP metrics
    assert.match(body, /redstone_http_requests_total/);
    assert.match(body, /redstone_http_request_duration_seconds/);
    assert.match(body, /redstone_database_status/);

    // Verify /api/health was recorded in metrics
    assert.match(body, /route="\/api\/health"/);
    assert.match(body, /status_code="200"/);
  });

  test("excludes /metrics endpoint from its own request metrics", async () => {
    // Fetch /metrics twice
    await fetch(`${baseUrl}/metrics`);
    const metricsRes = await fetch(`${baseUrl}/metrics`);
    const body = await metricsRes.text();

    // Verify /metrics is NOT labeled in redstone_http_requests_total
    assert.equal(body.includes('route="/metrics"'), false);
  });

  test("records client errors in redstone_http_errors_total", async () => {
    // Trigger a 404
    const notFoundRes = await fetch(`${baseUrl}/api/non-existent-route-for-test`);
    assert.equal(notFoundRes.status, 404);

    const metricsRes = await fetch(`${baseUrl}/metrics`);
    const body = await metricsRes.text();

    assert.match(body, /redstone_http_errors_total\{method="GET",route="unmatched",status_code="404",error_type="client_error"\}/);
  });

  test("protects /metrics endpoint when METRICS_TOKEN is set", async () => {
    process.env.METRICS_TOKEN = "super-secret-metrics-token-12345";

    // 1. Without token -> 401
    const unauthRes = await fetch(`${baseUrl}/metrics`);
    assert.equal(unauthRes.status, 401);
    const unauthBody = await unauthRes.json();
    assert.match(unauthBody.error, /unauthorized/i);

    // 2. With invalid token -> 401
    const badTokenRes = await fetch(`${baseUrl}/metrics`, {
      headers: { Authorization: "Bearer wrong-token" },
    });
    assert.equal(badTokenRes.status, 401);

    // 3. With valid Bearer token -> 200
    const validBearerRes = await fetch(`${baseUrl}/metrics`, {
      headers: { Authorization: "Bearer super-secret-metrics-token-12345" },
    });
    assert.equal(validBearerRes.status, 200);

    // 4. With valid X-Metrics-Token header -> 200
    const validHeaderRes = await fetch(`${baseUrl}/metrics`, {
      headers: { "X-Metrics-Token": "super-secret-metrics-token-12345" },
    });
    assert.equal(validHeaderRes.status, 200);

    // 5. With valid query param -> 200
    const validQueryRes = await fetch(`${baseUrl}/metrics?token=super-secret-metrics-token-12345`);
    assert.equal(validQueryRes.status, 200);

    // Cleanup
    delete process.env.METRICS_TOKEN;
  });
});
