import { Store } from "./db";
import { hash, passwordHash, token } from "./auth";
import { telemetrySchema } from "../packages/telemetry-contract";
export async function seed(db: Store) {
  if ((await db.query("SELECT id FROM organizations LIMIT 1")).length) return;
  await db.run("INSERT INTO organizations VALUES (?,?)", [
    "manila",
    "Manila Central TODA",
  ]);
  await db.run("INSERT INTO organizations VALUES (?,?)", [
    "other",
    "Other TODA",
  ]);
  const users = [
    ["driver", "Miguel Santos"],
    ["operator", "Andrea Reyes"],
    ["engineer", "CPE Engineer"],
    ["admin", "Platform Admin"],
    ["outsider", "Other Operator"],
  ];
  for (const [id, name] of users)
    await db.run(
      "INSERT INTO profiles(id,org_id,email,name,role,password_hash) VALUES (?,?,?,?,?,?)",
      [
        id,
        id === "outsider" ? "other" : "manila",
        `${id}@solair.local`,
        name,
        id === "outsider" ? "operator" : id,
        passwordHash("SolairDemo!2026"),
      ],
    );
  for (let n = 1; n <= 8; n++) {
    const id = `ET-${String(n).padStart(2, "0")}`;
    await db.run("INSERT INTO vehicles(id,org_id,name) VALUES (?,?,?)", [
      id,
      "manila",
      id,
    ]);
    await db.run("INSERT INTO devices VALUES (?,?,?,?,?)", [
      `SOL-${id}`,
      id,
      hash(token()),
      null,
      new Date().toISOString(),
    ]);
  }
  await db.run("INSERT INTO assignments VALUES (?,?)", ["ET-01", "driver"]);
  await db.run("INSERT INTO vehicles(id,org_id,name) VALUES (?,?,?)", [
    "OTHER-01",
    "other",
    "Other vehicle",
  ]);
  for (let n = 1; n <= 6; n++)
    for (let s = 0; s < 24; s++) {
      const at = new Date(
        Date.now() - (24 - s) * 15000 - (n > 4 ? 180000 : 0),
      ).toISOString();
      const t = telemetrySchema.parse({
        schema_version: 1,
        device_id: `SOL-ET-${String(n).padStart(2, "0")}`,
        firmware_version: "demo-1.0",
        boot_id: "demo-seed",
        sequence: s,
        device_uptime_ms: s * 15000,
        device_timestamp: at,
        source_type: "demo",
        transport: "simulation",
        sensor_health: {
          mpu6050: "ok",
          switches: "ok",
          ads1115: "ok",
          acs758: "uncalibrated",
          gps: "ok",
          lte: "absent",
          wind: "absent",
        },
        battery_voltage_v: 57.8 + n * 0.1,
        battery_current_a: null,
        solar_voltage_v: 38.4,
        solar_current_a: Math.max(0, 5 + Math.sin(s / 5) * 2 - n * 0.2),
        armed: true,
        lid_state: "secure",
        mount_state: "secure",
        motion_detected: false,
        alarm_active: false,
        gps_fix: true,
        latitude: 14.5995 + n * 0.007,
        longitude: 120.9842 + n * 0.009,
        gps_fix_age_ms: 500,
      });
      await db.run("INSERT INTO telemetry VALUES (?,?,?,?,?,?,?,?)", [
        `demo-${n}-${s}`,
        t.device_id,
        "demo",
        t.boot_id,
        s,
        at,
        at,
        JSON.stringify(t),
      ]);
      await db.run("INSERT INTO energy_measurements VALUES (?,?,?,?,?,?,?,?)", [
        `energy-${n}-${s}`,
        `demo-${n}-${s}`,
        t.device_id,
        "demo",
        "solar",
        t.solar_voltage_v! * t.solar_current_a!,
        s ? 0.7 : 0,
        at,
      ]);
      await db.run("INSERT INTO gps_records VALUES (?,?,?,?,?,?,?)", [
        `gps-${n}-${s}`,
        `demo-${n}-${s}`,
        t.device_id,
        "demo",
        t.latitude,
        t.longitude,
        at,
      ]);
    }
  await db.run("INSERT INTO security_events VALUES (?,?,?,?,?,?)", [
    "demo-event",
    "SOL-ET-03",
    "demo",
    "Mount switch released",
    new Date().toISOString(),
    null,
  ]);
}
