import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";
import { Store } from "../server/db";
import { PostgresTestStore } from "./postgres-store";
import { seed } from "../server/seed";
import { createApp } from "../server/app";
import {
  telemetrySchema,
  NDJSONParser,
  power,
  integrateWh,
  freshness,
} from "../packages/telemetry-contract";
let db: Store, server: Server, base: string;
const cookies: Record<string, string> = {};
async function req(
  path: string,
  role = "",
  method = "GET",
  body?: unknown,
  headers: Record<string, string> = {},
) {
  const r = await fetch(base + "/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(role ? { Cookie: cookies[role] } : {}),
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: r.status, body: await r.json(), headers: r.headers };
}
before(async () => {
  db =
    process.env.SOLAIR_TEST_POSTGRES === "1"
      ? new PostgresTestStore()
      : new Store(":memory:");
  await db.migrate();
  await seed(db);
  server = createServer(createApp(db));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as any).port}`;
  for (const role of ["driver", "operator", "engineer", "admin", "outsider"]) {
    const r = await req("/login", "", "POST", {
      email: role + "@solair.local",
      password: "SolairDemo!2026",
    });
    assert.equal(r.status, 200);
    cookies[role] = r.headers.get("set-cookie")!.split(";")[0];
  }
});
after(async () => {
  server.closeAllConnections();
  await new Promise<void>((r) => server.close(() => r()));
  await db.close();
});
const frame = (changes: any = {}) => ({
  schema_version: 1,
  device_id: "SOL-ET-01",
  firmware_version: "test-1",
  boot_id: "bench-boot",
  sequence: 1,
  device_uptime_ms: 2000,
  source_type: "hardware",
  transport: "usb",
  sensor_health: { mpu6050: "ok", ads1115: "absent" },
  accelerometer: [0, 0, 9.81],
  gyroscope: [0, 0, 0],
  lid_state: "secure",
  mount_state: "secure",
  ...changes,
});
test("Unauthenticated private endpoints reject access", async () => {
  assert.equal((await req("/fleet")).status, 401);
  assert.equal((await req("/messages/ET-01")).status, 401);
});
test("Incorrect credentials fail", async () =>
  assert.equal(
    (
      await req("/login", "", "POST", {
        email: "driver@solair.local",
        password: "wrong",
      })
    ).status,
    401,
  ));
test("Drivers see only their assigned vehicle", async () => {
  const r = await req("/fleet?mode=demo", "driver");
  assert.deepEqual(
    r.body.map((v: any) => v.id),
    ["ET-01"],
  );
});
test("Operators cannot read another TODA telemetry or location", async () => {
  assert.equal((await req("/history/OTHER-01", "operator")).status, 403);
  assert.equal((await req("/messages/OTHER-01", "operator")).status, 403);
  assert.deepEqual(
    (await req("/fleet", "outsider")).body.map((v: any) => v.id),
    ["OTHER-01"],
  );
});
test("Drivers cannot access unrelated vehicle histories or messages", async () => {
  assert.equal((await req("/history/ET-02", "driver")).status, 403);
  assert.equal((await req("/messages/ET-02", "driver")).status, 403);
});
test("Engineering endpoints are role restricted on server", async () => {
  assert.equal(
    (await req("/bench/sessions", "driver", "POST", { device_id: "SOL-ET-01" }))
      .status,
    403,
  );
  assert.equal(
    (
      await req("/devices/provision", "operator", "POST", {
        vehicle_id: "ET-01",
      })
    ).status,
    403,
  );
});
test("Real hardware and demonstration telemetry are isolated", async () => {
  const real = await req("/fleet", "driver"),
    demo = await req("/fleet?mode=demo", "driver");
  assert.equal(real.body[0].telemetry, null);
  assert.equal(real.body[0].gps, null);
  assert.equal(real.body[0].solar_wh, null);
  assert.equal(demo.body[0].telemetry.source_type, "demo");
  assert.equal(demo.body[0].telemetry.battery_current_a, null);
});
test("Missing electrical fields are null, never inferred from specifications", () => {
  const t = telemetrySchema.parse(frame());
  assert.equal(t.battery_voltage_v, null);
  assert.equal(t.battery_current_a, null);
  assert.equal(power(t.battery_voltage_v, t.battery_current_a), null);
});
test("Out-of-range and uncalibrated electrical data are rejected", () => {
  assert.equal(
    telemetrySchema.safeParse(frame({ battery_voltage_v: 400 })).success,
    false,
  );
  assert.equal(
    telemetrySchema.safeParse(frame({ battery_voltage_v: 58 })).success,
    false,
  );
  assert.equal(
    telemetrySchema.safeParse(
      frame({ battery_voltage_v: 58, calibration_status: "calibrated" }),
    ).success,
    true,
  );
});
test("Coordinates require a valid fresh GPS fix", () => {
  assert.equal(
    telemetrySchema.safeParse(
      frame({ latitude: 14.6, longitude: 121, gps_fix: false }),
    ).success,
    false,
  );
  assert.equal(
    telemetrySchema.safeParse(
      frame({
        latitude: 14.6,
        longitude: 121,
        gps_fix: true,
        gps_fix_age_ms: 50000,
      }),
    ).success,
    false,
  );
  assert.equal(
    telemetrySchema.safeParse(
      frame({
        latitude: 14.6,
        longitude: 121,
        gps_fix: true,
        gps_fix_age_ms: 100,
      }),
    ).success,
    true,
  );
});
test("Simulation cannot claim hardware provenance", () =>
  assert.equal(
    telemetrySchema.safeParse(frame({ transport: "simulation" })).success,
    false,
  ));
test("Serial parser handles fragmented lines and rejects malformed messages without crashing", () => {
  const frames: any[] = [],
    errors: string[] = [];
  const parser = new NDJSONParser(
    (t) => frames.push(t),
    (e) => errors.push(e),
  );
  const str = JSON.stringify(frame());
  parser.feed(str.slice(0, 60));
  parser.feed(str.slice(60) + "\nnot-json\n");
  parser.feed(JSON.stringify(frame({ sequence: 2 })) + "\n");
  assert.equal(frames.length, 2);
  assert.equal(errors.length, 1);
});
test("Serial oversized input is bounded", () => {
  let errors = 0;
  const p = new NDJSONParser(
    () => {},
    () => errors++,
  );
  p.feed("x".repeat(70000));
  assert.equal(errors, 1);
});
test("Energy integration uses timestamps and excludes gaps and null readings", () => {
  const p = { at: "2026-10-10T00:00:00Z", power: 100 };
  assert.equal(integrateWh(p, { at: "2026-10-10T00:00:18Z", power: 300 }), 1);
  assert.equal(integrateWh(p, { at: "2026-10-10T00:01:00Z", power: 100 }), 0);
  assert.equal(integrateWh(p, { at: "2026-10-10T00:00:18Z", power: null }), 0);
  assert.equal(integrateWh(p, { at: "2026-10-09T00:00:18Z", power: 100 }), 0);
});
test("Freshness distinguishes never connected, online and stale", () => {
  assert.equal(freshness(null), "Never connected");
  assert.equal(freshness(new Date().toISOString()), "Online");
  assert.equal(
    freshness(new Date(Date.now() - 200000).toISOString()),
    "Offline",
  );
});
test("USB bench persists genuine-format MPU, switch and event frames", async () => {
  const r = await req(
    "/ingest",
    "engineer",
    "POST",
    frame({
      event_id: "event-1",
      event_type: "lid",
      lid_state: "tampered",
      lid_raw: 1,
      alarm_active: true,
    }),
    { "X-Bench-Transport": "usb" },
  );
  assert.equal(r.status, 201);
  const f = await req("/fleet", "driver");
  assert.deepEqual(f.body[0].telemetry.accelerometer, [0, 0, 9.81]);
  assert.equal(f.body[0].telemetry.battery_current_a, null);
  assert.equal(f.body[0].gps, null);
  assert.equal(f.body[0].solar_wh, null);
  assert.equal(f.body[0].wind_wh, null);
  const exported=await req('/export/ET-01','driver');
  assert.equal(exported.status,200);
  assert.equal(exported.body.source_type,'hardware');
  assert.deepEqual(exported.body.energy_measurements.map((e:any)=>e.source).sort(),['solar','wind']);
  assert.ok(exported.body.energy_measurements.every((e:any)=>e.power_w===null));
  assert.equal((await req('/export/ET-02','driver')).status,403);
  assert.equal((await req("/alerts", "operator")).body.length, 1);
});
test("Duplicate telemetry is idempotent and earlier sequences reject replay", async () => {
  assert.equal(
    (
      await req("/ingest", "engineer", "POST", frame({event_id:"event-1",event_type:"lid",lid_state:"tampered",lid_raw:1,alarm_active:true}), {
        "X-Bench-Transport": "usb",
      })
    ).body.duplicate,
    true,
  );
  assert.equal(
    (
      await req("/ingest", "engineer", "POST", frame({ sequence: 0 }), {
        "X-Bench-Transport": "usb",
      })
    ).status,
    409,
  );
  assert.equal(
    (await db.query("SELECT id FROM telemetry WHERE mode='hardware'")).length,
    1,
  );
});
test("Ingest requires device credentials or authorized bench identity", async () => {
  assert.equal((await req("/ingest", "", "POST", frame())).status, 401);
  assert.equal(
    (
      await req("/ingest", "driver", "POST", frame(), {
        "X-Bench-Transport": "usb",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await req("/ingest", "outsider", "POST", frame(), {
        "X-Bench-Transport": "usb",
      })
    ).status,
    403,
  );
});
test("Wi-Fi credential provisioning and rotation are enforced", async () => {
  const provision = await req("/devices/provision", "engineer", "POST", {
    vehicle_id: "ET-01",
  });
  assert.equal(provision.status, 200);
  const t = frame({ transport: "wifi", sequence: 2 });
  const h = { Authorization: "Bearer " + provision.body.device_token };
  assert.equal((await req("/ingest", "", "POST", t, h)).status, 201);
  await req("/devices/provision", "engineer", "POST", { vehicle_id: "ET-01" });
  assert.equal(
    (
      await req(
        "/ingest",
        "",
        "POST",
        frame({ transport: "wifi", sequence: 3 }),
        h,
      )
    ).status,
    401,
  );
});
test("Driver SOS persists, operator acknowledgment and resolution persist", async () => {
  const id = randomUUID();
  assert.equal(
    (
      await req("/help?mode=demo", "driver", "POST", {
        id,
        vehicle_id: "ET-01",
        type: "Emergency SOS",
        notes: "Test assistance workflow",
      })
    ).status,
    201,
  );
  assert.equal(
    (await req("/help?mode=demo", "operator")).body[0].status,
    "pending",
  );
  assert.equal(
    (await req("/help/" + id, "operator", "PATCH", { status: "resolved" }))
      .status,
    409,
  );
  assert.equal(
    (await req("/help/" + id, "operator", "PATCH", { status: "acknowledged" }))
      .status,
    200,
  );
  assert.equal(
    (await req("/help?mode=demo", "driver")).body[0].status,
    "acknowledged",
  );
  await req("/help/" + id, "operator", "PATCH", { status: "resolved" });
  assert.equal(
    (await req("/help?mode=demo", "driver")).body[0].status,
    "resolved",
  );
  assert.equal(
    (await req("/help/" + id, "outsider", "PATCH", { status: "acknowledged" }))
      .status,
    404,
  );
});
test("Messages persist across users and read acknowledgment is explicit", async () => {
  const r = await req("/messages/ET-01?mode=demo", "driver", "POST", {
    body: "Need assistance at the terminal",
  });
  assert.equal(r.status, 201);
  const messages = await req("/messages/ET-01?mode=demo", "operator");
  assert.equal(messages.body.at(-1).body, "Need assistance at the terminal");
  assert.equal(messages.body.at(-1).read_at, null);
  await req("/messages/" + r.body.id + "/read", "operator", "POST");
  assert.ok(
    (await req("/messages/ET-01?mode=demo", "driver")).body.at(-1).read_at,
  );
});
test("Bench results preserve engineer evidence without automatic PASS", async () => {
  const s = await req("/bench/sessions", "engineer", "POST", {
    device_id: "SOL-ET-01",
  });
  assert.equal(s.status, 201);
  assert.equal(
    (
      await req("/bench/results", "engineer", "POST", {
        session_id: s.body.id,
        test: "Siren test",
        result: "BLOCKED",
        measurements: "",
        notes: "Not physically verified",
        evidence: "",
        firmware: "test-1",
      })
    ).status,
    201,
  );
  const e = await req("/bench/evidence/SOL-ET-01", "engineer");
  assert.equal(e.body[0].result, "BLOCKED");
  assert.equal(
    (await req("/bench/evidence/SOL-ET-01", "operator")).status,
    403,
  );
});
test("Operators cannot elevate invite roles or assign foreign users", async () => {
  assert.equal(
    (
      await req("/invite", "operator", "POST", {
        email: "new@test.com",
        role: "admin",
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await req("/assign", "operator", "POST", {
        vehicle_id: "ET-01",
        driver_id: "outsider",
      })
    ).status,
    403,
  );
});
test("Invitation creates account once and enforces assigned role", async () => {
  const i = await req("/invite", "admin", "POST", {
    email: "new@test.com",
    role: "driver",
  });
  const token = i.body.invitation_url.split("token=")[1];
  assert.equal(
    (
      await req("/register", "", "POST", {
        token,
        name: "New driver",
        password: "LongPassword!123",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await req("/register", "", "POST", {
        token,
        name: "Again",
        password: "LongPassword!123",
      })
    ).status,
    400,
  );
  const [p] = await db.query("SELECT role,org_id FROM profiles WHERE email=?", [
    "new@test.com",
  ]);
  assert.deepEqual({ ...p }, { role: "driver", org_id: "manila" });
});
test("Audit trail is admin-only and records sensitive actions", async () => {
  assert.equal((await req("/audit", "operator")).status, 403);
  const a = await req("/audit", "admin");
  assert.ok(a.body.some((a: any) => a.action === "device_credential_rotated"));
});
test("Foreign-key constraints prevent orphan records", async () => {
  await assert.rejects(
    db.run("INSERT INTO assignments VALUES (?,?)", ["ET-01", "missing-user"]),
  );
});
test("Cross-origin mutation is rejected", async () =>
  assert.equal(
    (
      await req(
        "/profile",
        "driver",
        "PATCH",
        { name: "X", notifications: true },
        { Origin: "https://evil.example" },
      )
    ).status,
    403,
  ));
test("Logout invalidates session", async () => {
  await req("/logout", "outsider", "POST");
  assert.equal((await req("/me", "outsider")).status, 401);
});
test("Transaction rolls back dependent writes after failure", async () => {
  await assert.rejects(
    db.transaction(async (tx) => {
      await tx.run("INSERT INTO organizations VALUES (?,?)", [
        "rollback-org",
        "Must not persist",
      ]);
      throw new Error("Intentional failure");
    }),
  );
  assert.equal(
    (
      await db.query("SELECT id FROM organizations WHERE id=?", [
        "rollback-org",
      ])
    ).length,
    0,
  );
});
test("Vehicle registration stays scoped to an organization", async () => {
  assert.equal(
    (
      await req("/vehicles", "admin", "POST", {
        id: "ET-09",
        name: "Test BEMAC",
      })
    ).status,
    201,
  );
  assert.equal(
    (
      await req("/vehicles", "driver", "POST", {
        id: "ET-10",
        name: "Unauthorized",
      })
    ).status,
    403,
  );
  const [v] = await db.query("SELECT org_id FROM vehicles WHERE id=?", [
    "ET-09",
  ]);
  assert.equal(v.org_id, "manila");
});
test("Invalid image uploads and unauthorized photo access reject", async () => {
  assert.equal(
    (
      await req("/vehicle-image/ET-01", "engineer", "POST", {
        mime: "image/png",
        base64: "bm90LWEtcG5n",
      })
    ).status,
    400,
  );
  assert.equal((await req("/vehicle-image/ET-02", "driver")).status, 403);
});
test("Sensor faults persist once per transition and remain isolated from demo", async () => {
  const headers = {"X-Bench-Transport":"usb"};
  const faulty = {mpu6050:"fault",gps:"fault"};
  for (const sequence of [3,4]) assert.equal((await req('/ingest','engineer','POST',frame({sequence,sensor_health:faulty}),headers)).status,201);
  const faults = (await req('/alerts','operator')).body.filter((a:any)=>a.type==='GPS unavailable'||a.type.startsWith('Sensor fault'));
  assert.equal(faults.length,2);
  assert.equal((await req('/alerts?mode=demo','operator')).body.some((a:any)=>a.type==='GPS unavailable'),false);
  await req('/ingest','engineer','POST',frame({sequence:5,sensor_health:{mpu6050:'ok',gps:'ok'}}),headers);
  await req('/ingest','engineer','POST',frame({sequence:6,sensor_health:faulty}),headers);
  assert.equal((await req('/alerts','operator')).body.filter((a:any)=>a.type==='GPS unavailable'||a.type.startsWith('Sensor fault')).length,4);
});
