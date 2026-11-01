// Browser regression only: intercept every API and tile; never write research data
// or bulk-fetch the public tile service.
import { chromium } from "playwright";
import assert from "node:assert/strict";

const base = process.env.TEST_URL || "http://127.0.0.1:3000";
const origin = new URL(base).origin + "/";
const browser = await chromium.launch({
  headless: true,
  ...(process.env.SOLAIR_TEST_CHROMIUM
    ? { executablePath: process.env.SOLAIR_TEST_CHROMIUM }
    : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let fix = { latitude: 14.61, longitude: 121, measured_at: new Date().toISOString() };
  let hasFix = true;
  let hdop = 1.1, satellites = 8, fixAge = 250;
  let freezeTime = false, reportAt = new Date().toISOString();
  const errors: string[] = [];
  const tileRequests: { url: string; referer: string | undefined }[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => {
    window.EventSource = class extends EventTarget {
      constructor() { super(); (window as any).fixtureEvents = this; }
      close() {}
    } as unknown as typeof EventSource;
  });
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/api/me") body = { id: "fixture-engineer", org_id: "fixture-org", role: "engineer", name: "TEST FIXTURE" };
    if (path === "/api/health") body = { environment: "local development" };
    if (path === "/api/organization") body = { name: "TEST FIXTURE" };
    if (path === "/api/fleet") {
      if (!freezeTime) reportAt = new Date().toISOString();
      if (hasFix && hdop <= 3 && satellites >= 4 && !freezeTime) fix.measured_at = reportAt;
      body = [{
      id: "ET-01", name: "TEST FIXTURE", status: "online", image_url: "/bemac-white.png",
      gps: fix,
      telemetry: { gps_fix: hasFix, gps_fix_age_ms: hasFix ? fixAge : null, satellites, received_at: reportAt, measured_at: reportAt, transport: 'lte', cpe: {
        historical: false, meter_source: 'unknown', load_mode: 'none', mpu_raw: null, queue_dropped: 0,
        pzem: { quality: 'unavailable', voltage_v: null, current_a: null, power_w: null, energy_wh: null, alarm_high: null, alarm_low: null },
        acs: { quality: 'uncalibrated', current_a: null, adc_mv: null, zero_v: null, sensitivity_v_per_a: null },
        lte: { quality: 'ok', at_detected: true, registered: true, attached: true, rssi: 20, uplink_commissioned: true },
        gps: { quality: 'ok', hdop, last_byte_age_ms: 100, checksum_failures: 0, software_uart_overflows: 0 },
        alarm: { commanded: false, output_level: null, feedback: null, reason: null, duration_ms: 5000 },
      } },
    }]; }
    await route.fulfill({ json: body });
  });
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a+j8AAAAASUVORK5CYII=", "base64");
  let failTiles = false;
  await page.route("https://tile.openstreetmap.org/**", async route => {
    tileRequests.push({ url: route.request().url(), referer: (await route.request().allHeaders()).referer });
    if (failTiles) await route.abort();
    else await route.fulfill({ contentType: "image/png", body: png });
  });
  const response = await page.goto(base + "/?map-regression=private-path-must-not-leak");
  await page.getByLabel('Data mode').selectOption('hardware');
  assert.equal(response?.headers()["referrer-policy"], "no-referrer", "Keep the app-wide privacy policy");
  await page.locator(".map-vehicle").first().waitFor();
  await page.waitForFunction(() => Array.from(document.querySelectorAll<HTMLImageElement>("img.leaflet-tile")).some(tile => tile.complete && tile.naturalWidth > 0));
  assert.ok(tileRequests.length > 0);
  assert.ok(tileRequests.every(request => request.referer === origin), "Tile requests must identify the app origin without its path/query");
  assert.ok(tileRequests.every(request => new URL(request.url).hostname === "tile.openstreetmap.org"));
  assert.ok(await page.locator("img.leaflet-tile").evaluateAll(tiles => tiles.every(tile => (tile as HTMLImageElement).referrerPolicy === "strict-origin-when-cross-origin")));
  assert.ok(await page.locator(".leaflet-control-attribution").first().innerText().then(text => text.includes("OpenStreetMap")));
  console.log("PASS: canonical tiles load with origin Referer despite app no-referrer; attribution retained");

  await page.getByText('LIVE GPS VIA LTE', { exact: false }).waitFor();
  const marker = page.locator('.map-vehicle').first();
  const initial = await marker.getAttribute('style');
  fix = { latitude: 14.612, longitude: 121.002, measured_at: new Date().toISOString() };
  await page.evaluate(() => (window as any).fixtureEvents.dispatchEvent(new Event('update')));
  await page.waitForFunction(before => document.querySelector('.map-vehicle')?.getAttribute('style') !== before, initial);
  await marker.click();
  await page.getByText('Live via LTE', { exact: false }).waitFor();
  const reliablePosition = await marker.evaluate(element => (element as HTMLElement).style.transform);
  hdop = 99.99; satellites = 0; fixAge = 25000;
  await page.evaluate(() => (window as any).fixtureEvents.dispatchEvent(new Event('update')));
  await page.getByText('LOW GPS QUALITY', { exact: false }).waitFor();
  assert.equal(await page.locator('.map-vehicle .offline').count(), 1);
  assert.equal(await marker.evaluate(element => (element as HTMLElement).style.transform), reliablePosition);
  console.log('PASS: zero-satellite/high-HDOP retained fixes are last known, not live positions');

  hdop = 1.1; satellites = 8; fixAge = 250;
  freezeTime = true; reportAt = new Date().toISOString(); fix.measured_at = reportAt;
  await page.evaluate(() => (window as any).fixtureEvents.dispatchEvent(new Event('update')));
  await page.getByText('LIVE GPS VIA LTE', { exact: false }).waitFor();
  await page.getByText('LAST KNOWN GPS', { exact: false }).waitFor({ timeout: 15000 });
  assert.equal(await page.locator('.map-vehicle .offline').count(), 1);
  console.log('PASS: stale live marker expires on its own timer even without a new GPS loss event');
  freezeTime = false;
  hasFix = false;
  await page.evaluate(() => (window as any).fixtureEvents.dispatchEvent(new Event('update')));
  await page.getByText('LAST KNOWN GPS', { exact: false }).waitFor();
  assert.equal(await page.locator('.map-vehicle .offline').count(), 1);
  console.log('PASS: fixture LTE GPS marker moves on server event without reload; GPS loss retains the position and marks it last known');

  // Navigation mounts a new map; failure must retain GPS markers and explain it.
  failTiles = true;
  await page.locator(".sidebar nav").getByRole("button", { name: "Live Fleet Map", exact: true }).click();
  await page.getByText("Basemap unavailable", { exact: false }).waitFor();
  assert.ok(await page.locator(".map-vehicle").count() > 0);
  assert.equal(errors.length, 0, errors.join("\n"));
  console.log("PASS: tile failure keeps reported GPS markers and unavailable message");
} catch (error) {
  console.error('Map regression failed:', error);
  throw error;
} finally {
  await browser.close();
}
