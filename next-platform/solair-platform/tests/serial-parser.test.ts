import { test } from "node:test";
import assert from "node:assert/strict";
import { NDJSONParser, type Telemetry } from "../packages/telemetry-contract";

// Transport fixtures only; no device or database is used.
const line = (sequence: number) => JSON.stringify({ schema_version: 1, device_id: "TEST-FIXTURE", firmware_version: "TEST FIXTURE", boot_id: "TEST-FIXTURE-serial", sequence, device_uptime_ms: sequence, source_type: "hardware", transport: "usb", sensor_health: {} });
function receiver() {
  const frames: Telemetry[] = [], errors: string[] = [];
  return { frames, errors, parser: new NDJSONParser(t => frames.push(t), e => errors.push(e)) };
}

test("Serial batch larger than 64 KiB retains every complete valid frame", () => {
  const { frames, errors, parser } = receiver();
  const batch = Array.from({ length: 400 }, (_, i) => line(i) + "\r\n").join("");
  assert.ok(batch.length > 65536);
  parser.feed(batch);
  assert.equal(frames.length, 400);
  assert.equal(frames.at(-1)?.sequence, 399);
  assert.deepEqual(errors, []);
});

test("Serial oversized line is discarded while valid following lines in the same batch survive", () => {
  const { frames, errors, parser } = receiver();
  parser.feed("x".repeat(70000) + "\n" + line(1) + "\n");
  assert.equal(errors.length, 1);
  assert.equal(frames[0]?.sequence, 1);
});

test("Serial overflow spanning chunks discards its suffix until a real line boundary", () => {
  const { frames, errors, parser } = receiver();
  parser.feed("x".repeat(65000));
  parser.feed("y".repeat(1000));
  parser.feed(line(1)); // Still part of the overlong line; never accept this suffix.
  parser.feed("\r\n" + line(2).slice(0, 80));
  parser.feed(line(2).slice(80) + "\n");
  assert.equal(errors.length, 1);
  assert.deepEqual(frames.map(t => t.sequence), [2]);
});

test("Serial accepts CR, LF and split CRLF framing while preserving fragmented JSON", () => {
  const { frames, errors, parser } = receiver();
  parser.feed(line(1) + "\r" + line(2) + "\n" + line(3).slice(0, 50));
  parser.feed(line(3).slice(50) + "\r");
  parser.feed("\n" + line(4) + "\r\n");
  assert.deepEqual(frames.map(t => t.sequence), [1, 2, 3, 4]);
  assert.deepEqual(errors, []);
});

test("Serial recovery keeps strict telemetry validation and does not accept noise", () => {
  const { frames, errors, parser } = receiver();
  parser.feed("\u0000\ufffdgarbage\n" + line(1).replace('"sequence":1', '"sequence":"invalid"') + "\n" + line(2) + "\n");
  assert.equal(errors.length, 2);
  assert.deepEqual(frames.map(t => t.sequence), [2]);
});

test("Serial resumes strict telemetry after fragmented ESP32 ROM startup output", () => {
  const { frames, errors, parser } = receiver();
  parser.feed("ets Jun  8 2016 00:22:57\r\nrst:0x1 (POWERON_RESET),boot:0x13 (SPI_FAST_");
  parser.feed("FLASH_BOOT)\r\nconfigsip: 0, SPIWP:0xee\r\n# SOLAIR CPE v2 DISARMED\r\n" + line(1).slice(0, 90));
  parser.feed(line(1).slice(90) + "\r\n");
  assert.deepEqual(frames.map(t => t.sequence), [1]);
  assert.ok(errors.length >= 3 && errors.every(e => e.startsWith("#")), "Recognized boot diagnostics should not be labeled malformed telemetry");
});
