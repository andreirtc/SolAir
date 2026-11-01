// Software fixtures only: every API request is intercepted; no bench database writes.
import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true, ...(process.env.SOLAIR_TEST_CHROMIUM ? { executablePath: process.env.SOLAIR_TEST_CHROMIUM } : {}) });
try {
  const page = await browser.newPage();
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  const frame = (sequence: number) => ({ schema_version: 1, device_id: "SOL-ET-01", boot_id: "TEST-FIXTURE-website", sequence, firmware_version: "TEST FIXTURE ONLY", device_uptime_ms: sequence * 2000, source_type: "hardware", transport: "wifi", sensor_health: { mpu6050: "ok" }, accelerometer: [sequence, 2, 9.81], gyroscope: [0, 0, 0], solar_voltage_v: 10, solar_current_a: sequence, received_at: new Date().toISOString() });
  let report = frame(10);
  let delayNext = false;
  let release!: () => void;
  let started!: () => void;
  let completed!: () => void;
  let historyLoads = 0;
  await page.addInitScript(`
    class FixtureEvents extends EventTarget {
      constructor() { super(); window.fixtureEvents = this; }
      close() {}
    }
    window.EventSource = FixtureEvents;
  `);
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/api/me") body = { id: "TEST-FIXTURE-engineer", org_id: "TEST-FIXTURE-org", role: "engineer", name: "Fixture Engineer" };
    if (path === "/api/health") body = { environment: "local development" };
    if (path === "/api/organization") body = { name: "TEST FIXTURE ONLY" };
    if (path === "/api/fleet") {
      body = [{ id: "ET-01", device_id: "SOL-ET-01", name: "TEST FIXTURE", image_url: "/bemac-white.png", telemetry: structuredClone(report), gps: null }];
      if (delayNext) {
        delayNext = false;
        await new Promise<void>(resolve => { release = resolve; started(); });
        await route.fulfill({ json: body });
        completed();
        return;
      }
    }
    if (path === "/api/history/ET-01") { historyLoads++; body = [{ id: `fixture-${report.sequence}`, received_at: report.received_at, measured_at: report.received_at, payload: JSON.stringify(report) }]; }
    await route.fulfill({ json: body });
  });
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:3000");
  await page.getByLabel("Data mode").selectOption("hardware");
  await page.getByRole("button", { name: "CPE Lab", exact: false }).click();
  await page.getByText("Report #10", { exact: false }).waitFor();
  report = frame(11);
  delayNext = true;
  const pending = new Promise<void>(resolve => { started = resolve; });
  const oldCompleted = new Promise<void>(resolve => { completed = resolve; });
  await page.getByRole("button", { name: "Refresh network telemetry", exact: true }).click();
  await pending;
  report = frame(12);
  await page.getByRole("button", { name: "Refresh network telemetry", exact: true }).click();
  await page.getByText("Report #12", { exact: false }).waitFor();
  release();
  await oldCompleted;
  await page.waitForTimeout(200);
  assert.equal(await page.getByText("Report #12", { exact: false }).count(), 1, "A delayed older response must not roll the live display back");
  console.log("PASS: delayed older network response cannot overwrite newer telemetry");

  const graph = page.getByRole("img", { name: "MPU acceleration history, X axis" });
  await graph.waitFor();
  assert.equal(await graph.locator("path[data-axis]").count(), 1);
  await page.getByLabel("Motion graph axis").selectOption("all");
  assert.equal(await page.getByRole("img", { name: "MPU acceleration history, X Y and Z axes" }).locator("path[data-axis]").count(), 3);
  console.log("PASS: one X-axis line by default; all three axes remain selectable");

  await page.locator(".sidebar nav").getByRole("button", { name: "Energy", exact: true }).click();
  await page.getByText("max 120.0 W", { exact: false }).waitFor();
  const before = historyLoads;
  report = frame(13);
  await page.evaluate(() => (window as any).fixtureEvents.dispatchEvent(new Event("update")));
  await page.getByText("max 130.0 W", { exact: false }).waitFor({ timeout: 5000 });
  assert.ok(historyLoads > before);
  console.log("PASS: energy trend refreshes on new telemetry without leaving the page");
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
