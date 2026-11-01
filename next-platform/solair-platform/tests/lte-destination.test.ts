import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { lteDestinationValid } from "../packages/telemetry-contract/lte-destination";
import { benchDestinationReader, lteDestinationFromEnvironment } from "../server/lte-destination";

test("USB and firmware share strict destination validation vectors", async () => {
  const vectors = JSON.parse(await readFile(new URL("./fixtures/lte-destinations.json", import.meta.url), "utf8"));
  for (const v of vectors) assert.equal(lteDestinationValid(v.url), v.valid, JSON.stringify(v.url));
  assert.equal(lteDestinationValid(null), false);
  assert.equal(lteDestinationValid("https://" + "a".repeat(64) + ".example/api/ingest"), false);
  assert.equal(lteDestinationValid("https://" + ("a".repeat(60) + ".").repeat(4) + "example/api/ingest"), false);
});

test("destination discovery probes the restricted listener without credentials and coalesces callers", async () => {
  const dir = await mkdtemp(join(tmpdir(), "solair-destination-fixture-"));
  try {
    const path = join(dir, "state.json");
    await writeFile(path, JSON.stringify({ url: "https://fixture.example", secret: "TEST-FIXTURE-DO-NOT-EXPOSE" }));
    let calls = 0;
    const reader = benchDestinationReader(path, (async (url, init) => {
      calls++;
      assert.equal(url, "https://fixture.example/api/ingest");
      assert.equal(init?.method, "POST");
      assert.equal(init?.redirect, "error");
      assert.equal(init?.body, "{}");
      assert.deepEqual(init?.headers, { "Content-Type": "application/json" });
      return new Response("unauthorized", { status: 401 });
    }) as typeof fetch);
    const [a, b] = await Promise.all([reader(), reader()]);
    assert.deepEqual(a, b);
    assert.equal(calls, 1);
    assert.equal(a.reachable, true);
    assert.equal(a.temporary, true);
    assert.ok(!JSON.stringify(a).includes("DO-NOT-EXPOSE"));
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("invalid, unreachable and unexpected public destinations are never advertised ready", async () => {
  const dir = await mkdtemp(join(tmpdir(), "solair-destination-fixture-"));
  try {
    const path = join(dir, "state.json");
    let calls = 0;
    const request = (async () => { calls++; return new Response("wrong listener", { status: 200 }); }) as typeof fetch;
    await writeFile(path, JSON.stringify({ url: "http://127.0.0.1" }));
    await assert.rejects(benchDestinationReader(path, request)());
    assert.equal(calls, 0);
    await writeFile(path, JSON.stringify({ url: "https://fixture.example" }));
    await assert.rejects(benchDestinationReader(path, request)());
    assert.equal(calls, 1);
    await assert.rejects(benchDestinationReader(path, (async () => { throw new Error("TEST FIXTURE offline"); }) as typeof fetch)());
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("permanent deployment uses the configured origin and never needs bench runtime files", async () => {
  const calls: string[] = [];
  const request = (async (url, init) => {
    calls.push(String(url));
    assert.equal(init?.redirect, 'error');
    assert.equal(init?.body, '{}');
    assert.equal(new Headers(init?.headers).has('Authorization'), false);
    return new Response(null, {status: 401});
  }) as typeof fetch;
  const reader = lteDestinationFromEnvironment(true, {SOLAIR_PUBLIC_URL: 'https://solair.example'}, request)!;
  const ready = await reader();
  assert.equal(ready.url, 'https://solair.example/api/ingest');
  assert.equal(ready.temporary, false);
  assert.equal(ready.reachable, true);
  assert.ok(Number.isFinite(Date.parse(ready.checked_at)));
  const dedicated = lteDestinationFromEnvironment(true, {
    SOLAIR_PUBLIC_URL: 'https://solair.example', SOLAIR_DEVICE_INGEST_URL: 'https://devices.solair.example/api/ingest',
  }, request)!;
  assert.equal((await dedicated()).url, 'https://devices.solair.example/api/ingest');
  assert.deepEqual(calls, ['https://solair.example/api/ingest', 'https://devices.solair.example/api/ingest']);
  assert.equal(lteDestinationFromEnvironment(true, {}), undefined);
});

test("misconfigured production destinations fail closed without a probe or tunnel fallback", async () => {
  for (const env of [
    {SOLAIR_DEVICE_INGEST_URL: ''},
    {SOLAIR_DEVICE_INGEST_URL: 'http://solair.example/api/ingest'},
    {SOLAIR_PUBLIC_URL: 'https://solair.example/path'},
    {SOLAIR_PUBLIC_URL: 'https://user:secret@solair.example'},
    {SOLAIR_PUBLIC_URL: 'https://solair.example', SOLAIR_DEVICE_INGEST_URL: 'https://127.0.0.1/api/ingest'},
  ]) {
    assert.throws(() => lteDestinationFromEnvironment(true, env), /Invalid configured HTTPS/);
  }
  for (const status of [200, 301, 400, 403, 404, 429, 503]) {
    const reader = lteDestinationFromEnvironment(true, {SOLAIR_PUBLIC_URL: 'https://solair.example'},
      (async () => new Response(null, {status})) as typeof fetch)!;
    await assert.rejects(reader());
  }
});
