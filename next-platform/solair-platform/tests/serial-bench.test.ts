import { test } from "node:test";
import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { SerialBench, type SerialReceiveState } from "../src/Serial";
import type { Telemetry } from "../packages/telemetry-contract";

// Web Serial fixtures only. These tests cannot reset or access physical devices.
const frame = JSON.stringify({ schema_version: 1, device_id: "TEST-FIXTURE", firmware_version: "TEST FIXTURE", boot_id: "fixture-serial-bench", sequence: 1, device_uptime_ms: 1, source_type: "hardware", transport: "usb", sensor_health: {} });
async function fixture(signals: "supported" | "missing" | "rejected") {
  const original = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  const operations: string[] = [], frames: Telemetry[] = [], errors: string[] = [], activity: SerialReceiveState[] = [];
  const commands: unknown[] = [];
  let elapsed = 0;
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  let readable: ReadableStream<Uint8Array>;
  const replaceStream = () => { readable = new ReadableStream<Uint8Array>({ start(c) { controller = c; } }); };
  replaceStream();
  const port = {
    writable: new WritableStream<Uint8Array>({ write(bytes) { commands.push(JSON.parse(new TextDecoder().decode(bytes))); } }),
    open: async () => { if (operations.includes("open")) replaceStream(); operations.push("open"); },
    ...(signals === "missing" ? {} : { setSignals: async (s: unknown) => {
      operations.push("signals");
      assert.deepEqual(s, { dataTerminalReady: false, requestToSend: false });
      if (signals === "rejected") throw new Error("TEST FIXTURE unsupported adapter");
    } }),
    get readable() { operations.push("reader"); return readable; },
    close: async () => { operations.push("close"); },
  };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: { serial: { requestPort: async () => port } } });
  const bench = new SerialBench(() => elapsed);
  try {
    await bench.connect(115200, t => frames.push(t), e => errors.push(e), () => operations.push("closed"), s => activity.push(s));
  } catch (error) {
    if (original) Object.defineProperty(globalThis, "navigator", original);
    else Reflect.deleteProperty(globalThis, "navigator");
    throw error;
  }
  return {
    bench, operations, frames, errors, activity, commands,
    advance(ms: number) { elapsed += ms; },
    async feedBytes(bytes: Uint8Array) { controller.enqueue(bytes); await setImmediate(); },
    async reconnect() {
      replaceStream();
      await bench.connect(115200, t => frames.push(t), e => errors.push(e), () => operations.push("closed"), s => activity.push(s));
    },
    async feed(text: string) { controller.enqueue(new TextEncoder().encode(text)); await setImmediate(); },
    async interrupt(recoverable: boolean) {
      const previous = controller;
      if (recoverable) replaceStream();
      else readable = null as unknown as ReadableStream<Uint8Array>;
      previous.error(new DOMException("TEST FIXTURE interrupted UART", "FramingError"));
      await setImmediate();
    },
    async close() {
      try { await bench.disconnect(); }
      finally {
        if (original) Object.defineProperty(globalThis, "navigator", original);
        else Reflect.deleteProperty(globalThis, "navigator");
      }
    },
  };
}

test("USB automatically resumes after a recoverable read error without joining a damaged JSON line", async () => {
  const f = await fixture("supported");
  try {
    await f.feed(frame.slice(0, 80));
    await f.interrupt(true);
    assert.equal(f.bench.active, true);
    assert.ok(f.errors.some(e => e.startsWith("# USB read interrupted")));
    await f.feed(frame.slice(80) + "\n" + frame + "\n");
    assert.equal(f.frames.length, 1, "Only the next complete frame is accepted");
    assert.equal(f.operations.filter(op => op === "open").length, 1);
    assert.equal(f.operations.filter(op => op === "signals").length, 1);
    assert.ok(!f.operations.includes("closed"));
    await f.interrupt(true);
    await f.feed("tail\r\n" + frame + "\n");
    assert.equal(f.frames.length, 2, "Repeated temporary interruptions must also recover");
  } finally { await f.close(); }
  assert.equal(f.operations.filter(op => op === "closed").length, 1);
});

test("USB physical removal closes monitoring and permits a fresh connection without page reload", async () => {
  const f = await fixture("supported");
  try {
    await f.interrupt(false);
    assert.equal(f.bench.active, false);
    assert.ok(f.errors.some(e => e.startsWith("Serial read stopped:")));
    assert.equal(f.operations.filter(op => op === "closed").length, 1);
    await f.reconnect();
    await f.feed(frame + "\n");
    assert.equal(f.frames.length, 1);
    assert.equal(f.operations.filter(op => op === "open").length, 2);
  } finally { await f.close(); }
});

test("USB releases reset/boot lines once before reading; fragmented startup messages do not prevent telemetry", async () => {
  const f = await fixture("supported");
  try {
    assert.deepEqual(f.operations, ["open", "signals", "reader"]);
    await f.feed("rst:0x1 (POWERON_RE");
    await f.feed("SET),boot:0x13 (SPI_FAST_FLASH_BOOT)\r");
    await f.feed("\nconfigsip: 0\r\nrst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_FLASH_BOOT)\r\n");
    const diagnostic = f.activity.at(-1)!;
    assert.equal(diagnostic.bootMessages, 2);
    assert.equal(diagnostic.lastBootReason, "0x1 (POWERON_RESET)");
    assert.match(diagnostic.preview, /configsip/);
    await f.feed(frame.slice(0, 40));
    await f.feed(frame.slice(40) + "\r\n");
    assert.equal(f.frames.length, 1);
    assert.equal(f.activity.at(-1)!.bootMessages, 2);
    assert.equal(f.operations.filter(op => op === "signals").length, 1, "Reading must never repeatedly toggle reset lines");
  } finally { await f.close(); }
  assert.deepEqual(f.operations.slice(-2), ["close", "closed"]);
});

for (const signals of ["missing", "rejected"] as const) {
  test(`USB still reads valid reports when signal control is ${signals}`, async () => {
    const f = await fixture(signals);
    try {
      await f.feed(frame + "\n");
      assert.equal(f.frames.length, 1);
      assert.ok(f.errors.some(error => error.startsWith("# USB adapter")), "Signal-control limitations must be visible in the log");
      assert.equal(f.activity.at(-1)!.bootMessages, 0);
    } finally { await f.close(); }
  });
}


test("USB destination commands validate before writing and carry no credentials", async () => {
  const f = await fixture("supported");
  try {
    await assert.rejects(f.bench.setLteDestination("http://fixture.example/api/ingest"));
    await assert.rejects(f.bench.setLteDestination("https://fixture.example/api/ingest\u0000"));
    assert.deepEqual(f.commands, []);
    await f.bench.setLteDestination("https://fixture.example/api/ingest");
    assert.deepEqual(f.commands, [{ command: "lte_set_endpoint", url: "https://fixture.example/api/ingest" }]);
  } finally { await f.close(); }
});

test("sustained binary noise reopens the same USB port once without a page refresh", async () => {
  const f = await fixture("supported");
  try {
    f.advance(2500);
    await f.feedBytes(new Uint8Array(6000).fill(0x80));
    assert.equal(f.bench.active, true);
    assert.equal(f.operations.filter(x => x === "open").length, 2);
    assert.equal(f.operations.filter(x => x === "close").length, 1);
    assert.equal(f.operations.filter(x => x === "closed").length, 0);
    assert.equal(f.frames.length, 0);
    await f.feed("damaged suffix\n" + frame + "\n");
    assert.equal(f.frames.length, 1, "Only complete validated telemetry resumes");
    f.advance(15000);
    await f.feedBytes(new Uint8Array(10000).fill(0x80));
    assert.equal(f.operations.filter(x => x === "open").length, 2, "Persistent corruption cannot create a reconnect loop");
    assert.ok(f.errors.some(x => x.includes("reopening the same port once")));
  } finally { await f.close(); }
});

test("ASCII diagnostics and a healthy report mixed with noise do not reopen USB", async () => {
  const f = await fixture("supported");
  try {
    f.advance(3000);
    await f.feed("# TEST FIXTURE startup diagnostic\n".repeat(200));
    assert.equal(f.operations.filter(x => x === "open").length, 1);
    await f.feedBytes(new TextEncoder().encode("\u0080".repeat(3000) + "\n" + frame + "\n"));
    assert.equal(f.frames.length, 1);
    assert.equal(f.operations.filter(x => x === "open").length, 1, "Valid telemetry in this batch cancels noise recovery");
  } finally { await f.close(); }
});
