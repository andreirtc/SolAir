// Software fixtures only: every API, tile and Web Serial interaction is intercepted.
import { chromium } from "playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ headless: true, ...(process.env.SOLAIR_TEST_CHROMIUM ? { executablePath: process.env.SOLAIR_TEST_CHROMIUM } : {}) });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors: string[] = [];
  const accepted: number[] = [];
  let releaseFirst!: () => void;
  let noticeFirst!: () => void;
  const firstArrived = new Promise<void>(resolve => { noticeFirst = resolve; });
  const holdFirst = new Promise<void>(resolve => { releaseFirst = resolve; });
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(`
    const fixture = { opens: 0, closes: 0, released: 0 };
    window.serialFixture = fixture;
    Object.defineProperty(navigator, "serial", { value: { requestPort: async () => ({
      open: async () => { fixture.opens++; fixture.stream = new ReadableStream({ start(controller) { fixture.controller = controller; } }); },
      setSignals: async (signals) => {
        if (signals.dataTerminalReady !== false || signals.requestToSend !== false) throw new Error("TEST FIXTURE: reset lines must be released");
        fixture.released++;
      },
      get readable() { return fixture.stream; },
      close: async () => { fixture.closes++; },
      writable: new WritableStream(),
    }) } });
    window.EventSource = class extends EventTarget { close() {} };
  `);
  const frame = (sequence: number) => ({ schema_version: 1, device_id: "SOL-ET-01", firmware_version: "TEST FIXTURE USB navigation", boot_id: "fixture-navigation", sequence, device_uptime_ms: sequence * 2000, source_type: "hardware", transport: "usb", sensor_health: {}, accelerometer: [0, 0, 9.81] });
  await page.route("**/api/**", async route => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown = [];
    if (path === "/api/me") body = { id: "fixture-engineer", org_id: "fixture-org", role: "engineer", name: "TEST FIXTURE", email: "fixture@solair.local", notifications: 0, organization_name: "TEST FIXTURE" };
    if (path === "/api/health") body = { environment: "local development" };
    if (path === "/api/organization") body = { name: "TEST FIXTURE" };
    if (path.startsWith("/api/research/")) body = { records: [] };
    if (path.startsWith("/api/battery/")) body = { quality: "unavailable", soc_pct: null, tte_minutes: null };
    if (path === "/api/fleet") body = ["01", "02"].map(id => ({ id: `ET-${id}`, device_id: `SOL-ET-${id}`, name: "TEST FIXTURE", model: "BEMAC", image_url: "/bemac-white.png", telemetry: null, gps: null }));
    if (path === "/api/ingest") {
      const sequence = route.request().postDataJSON().sequence;
      accepted.push(sequence);
      if (sequence === 4) {
        noticeFirst();
        await holdFirst;
        await route.fulfill({ status: 503, json: { error: "TEST FIXTURE delayed failure" } });
        return;
      }
      body = { accepted: true };
    }
    await route.fulfill({ json: body });
  });
  await page.route("https://tile.openstreetmap.org/**", route => route.abort());
  await page.goto(process.env.TEST_URL || "http://127.0.0.1:3000");
  await page.getByLabel("Data mode").selectOption("hardware");
  const nav = (name: string) => page.locator(".sidebar nav").getByRole("button", { name, exact: name !== "CPE Lab" }).click();
  await nav("CPE Lab");
  const counters = () => page.evaluate(() => ({ opens: (window as any).serialFixture.opens, closes: (window as any).serialFixture.closes }));
  const connect = async () => {
    await page.getByRole("button", { name: "Connect ESP32", exact: true }).click();
    try { await page.getByRole("button", { name: "Disconnect USB", exact: true }).waitFor({ timeout: 10000 }); }
    catch (error) { console.log({ errors, fixture: await counters(), body: (await page.locator("body").innerText()).slice(-1800) }); throw error; }
  };
  await connect();
  await page.evaluate(() => (window as any).serialFixture.controller.enqueue(new TextEncoder().encode("rst:0x1 (POWERON_RE")));
  await page.evaluate(() => (window as any).serialFixture.controller.enqueue(new TextEncoder().encode("SET),boot:0x13 (SPI_FAST_FLASH_BOOT)\r\nconfigsip: 0\r\nrst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)\r\n")));
  await page.locator(".serial-receive summary").click();
  await page.getByText("ESP32 startup messages since USB opened: 2.", { exact: false }).waitFor();
  assert.equal(await page.evaluate(() => (window as any).serialFixture.released), 1);
  await page.evaluate(() => {
    const fixture = (window as any).serialFixture;
    fixture.controller.enqueue(new TextEncoder().encode('{"schema_version":1,"device_id":"interrupted'));
  });
  await page.evaluate(() => {
    const fixture = (window as any).serialFixture;
    const previous = fixture.controller;
    fixture.stream = new ReadableStream({ start(controller) { fixture.controller = controller; } });
    previous.error(new DOMException("TEST FIXTURE temporary UART framing error", "FramingError"));
  });
  await page.getByText("# USB read interrupted", { exact: false }).waitFor({ state: "attached", timeout: 10000 });
  await page.evaluate(() => (window as any).serialFixture.controller.enqueue(new TextEncoder().encode('tail"}\r\n')));
  const push = (sequence: number) => page.evaluate(frame => (window as any).serialFixture.controller.enqueue(new TextEncoder().encode(JSON.stringify(frame) + "\n")), frame(sequence));
  await push(1);
  await page.getByText("Report #1", { exact: false }).waitFor();
  assert.equal(await page.locator(".serial-receive").count(), 0, "Valid telemetry must clear the startup warning");
  assert.deepEqual(await counters(), { opens: 1, closes: 0 });
  console.log("PASS: USB releases reset lines once, reports boot text correctly, and recovers from a temporary read error without refresh/reconnect or damaged-frame ingestion");
  await nav("Live Fleet Map");
  assert.equal(await page.getByRole("heading", { name: "From breadboard to road." }).isVisible(), false);
  await push(2);
  await nav("History & Reports");
  await push(3);
  await nav("CPE Lab");
  await page.getByText("Report #3 · USB", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Disconnect USB", exact: true }).waitFor();
  assert.deepEqual(await counters(), { opens: 1, closes: 0 });
  assert.deepEqual(accepted, [1, 2, 3]);
  console.log("PASS: map/history navigation keeps one USB connection and continues ingestion while Lab is hidden");

  await push(4);
  await firstArrived;
  await push(5);
  await page.getByText("Report #5 · USB", { exact: true }).waitFor();
  assert.deepEqual(accepted, [1, 2, 3, 4], "A delayed POST must not be overtaken by the next serial frame");
  const fifthResponse = page.waitForResponse(response => response.url().endsWith('/api/ingest') && response.request().postDataJSON().sequence === 5);
  releaseFirst();
  assert.equal((await fifthResponse).status(), 200);
  assert.deepEqual(accepted, [1, 2, 3, 4, 5], "A failed POST must release the queue for later frames");
  console.log("PASS: delayed USB requests preserve sequence order, live display continues, and a failed request does not block the next frame");

  await page.getByRole("button", { name: "Disconnect USB", exact: true }).click();
  await page.getByRole("button", { name: "Connect ESP32", exact: true }).waitFor();
  assert.deepEqual(await counters(), { opens: 1, closes: 1 });
  await connect();
  await page.getByLabel("Data mode").selectOption("demo");
  await page.getByRole("button", { name: "Connect ESP32", exact: true }).waitFor();
  assert.deepEqual(await counters(), { opens: 2, closes: 2 });
  await page.getByLabel("Data mode").selectOption("hardware");
  await connect();
  await page.getByLabel("Selected vehicle").selectOption("ET-02");
  await page.getByRole("button", { name: "Connect ESP32", exact: true }).waitFor();
  assert.deepEqual(await counters(), { opens: 3, closes: 3 });
  console.log("PASS: explicit disconnect and mode/device changes release the old port");

  await page.getByLabel("Selected vehicle").selectOption("ET-01");
  await connect();
  await nav("Live Fleet Map");
  await page.getByRole("button", { name: "Open account menu", exact: true }).click();
  await page.getByRole("dialog", { name: "Account options" }).getByRole("button", { name: "Log out", exact: true }).click();
  await page.getByLabel("Email address").waitFor();
  assert.deepEqual(await counters(), { opens: 4, closes: 4 });
  assert.deepEqual(errors, []);
  console.log("PASS: sign-out from the map closes the retained USB session");
} finally {
  await browser.close();
}
