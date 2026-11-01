import { z } from "zod";
import { lteDestinationValid } from "./lte-destination";
const voltage = z.number().finite().min(0).max(100).nullable().default(null);
const current = z.number().finite().min(-100).max(100).nullable().default(null);
const quality = z.enum(["ok", "unavailable", "fault", "uncalibrated"]);
export const cpeSchema = z.object({
  historical: z.boolean(),
  remote_control: z.object({enabled:z.boolean(),last_id:z.string().uuid().nullable(),last_command:z.enum(["arm","disarm","siren_test"]).nullable(),last_result:z.enum(["accepted","rejected","expired"]).nullable()}).strict().optional(),
  imu_diagnostic: z.string().max(120).optional(),
  pzem_diagnostic: z.string().max(120).optional(),
  lte_diagnostic: z.string().max(120).optional(),
  lte_http_status: z.number().int().min(-1000).max(999).optional(),
  lte_clock: z.string().max(40).optional(),
  lte_engine: z.enum(["modem_https","esp32_ppp_tls"]).optional(),
  lte_tls_error: z.string().max(160).optional(),
  lte_at_diagnostic: z.string().max(160).optional(),
  lte_endpoint: z.string().max(240).refine(v => v === "" || lteDestinationValid(v), "Invalid LTE destination").optional(),
  lte_endpoint_saved: z.boolean().optional(),
  lte_revision: z.string().max(100).optional(),
  pzem_rx_bytes: z.number().int().min(0).max(64).optional(),
  pzem_shunt50_verified: z.boolean().optional(),
  meter_source: z.enum(["bench_supply","mppt_output","unknown"]),
  mpu_raw: z.array(z.number().int().min(-32768).max(32767)).length(7).nullable(),
  load_mode: z.enum(["bench_resistor", "vehicle_charging", "none", "unknown"]),
  measurements: z.object({battery_voltage_validated:z.boolean(),battery_current_validated:z.boolean(),solar_output_validated:z.boolean()}).strict().optional(),
  motion: z.object({enabled:z.boolean(),calibrated:z.boolean(),delta_threshold_mps2:z.number().finite().positive().max(400),gyro_threshold_rad_s:z.number().finite().positive().max(100),hold_ms:z.literal(200),window_samples:z.number().int().nonnegative(),longest_above_threshold_ms:z.number().int().min(0).max(4294967295).optional(),peak_delta_mps2:z.number().finite().min(0).max(400).nullable(),peak_gyro_rad_s:z.number().finite().min(0).max(100).nullable()}).strict().optional(),
  pzem: z.object({ quality, voltage_v: z.number().finite().min(0).max(350).nullable(), current_a: z.number().finite().min(0).max(300).nullable(), power_w: z.number().finite().min(0).max(100000).nullable(), energy_wh: z.number().finite().nonnegative().nullable(), alarm_high: z.boolean().nullable(), alarm_low: z.boolean().nullable() }).strict(),
  acs: z.object({
    quality, current_a: current,
    adc_mv: z.number().finite().min(0).max(3300).nullable(),
    zero_v: voltage, sensitivity_v_per_a: z.number().positive().max(10).nullable(),
    current_diagnostic: z.enum(["not_calibrated","ok","invalid_sample_or_outside_validated_range"]).optional(),
    validated_min_a: z.number().finite().min(-50).max(50).nullable().optional(),
    validated_max_a: z.number().finite().min(-50).max(50).nullable().optional(),
    adc_source: z.enum(["esp32_adc1_gpio34", "ads1115_a1"]).optional(),
    adc_diagnostic: z.string().max(100).optional(),
    adc_raw: z.number().finite().min(-32768).max(32767).nullable().optional(),
    adc_age_ms: z.number().int().min(0).max(4294967295).nullable().optional(),
  }).strict(),
  lte: z.object({ quality, at_detected: z.boolean(), registered: z.boolean(), attached: z.boolean(), rssi: z.number().int().min(0).max(99).nullable(), uplink_commissioned: z.boolean() }).strict(),
  gps: z.object({ chars_processed: z.number().int().nonnegative().optional(), sentences_passed: z.number().int().nonnegative().optional(), last_byte_age_ms: z.number().int().nonnegative().nullable().optional(), quality, hdop: z.number().finite().nonnegative().nullable(), checksum_failures: z.number().int().nonnegative(), software_uart_overflows: z.number().int().nonnegative() }).strict(),
  alarm: z.object({ commanded: z.boolean(), output_level: z.number().int().min(0).max(1).nullable(), feedback: z.boolean().nullable(), reason: z.enum(["lid", "mount", "motion", "test"]).nullable(), duration_ms: z.number().int().min(0).max(10000) }).strict(),
  queue_dropped: z.number().int().nonnegative(),
}).strict().superRefine((v,c)=>{
  const p=v.pzem;
  if(p.quality!=="ok" && [p.voltage_v,p.current_a,p.power_w,p.energy_wh].some(x=>x!==null)) c.addIssue({code:"custom",message:"Unavailable PZEM cannot carry measurements"});
  if(p.quality==="ok" && [p.voltage_v,p.current_a,p.power_w,p.energy_wh].some(x=>x===null)) c.addIssue({code:"custom",message:"Healthy PZEM requires all measurements"});
  if(v.acs.quality!=="ok" && v.acs.current_a!==null) c.addIssue({code:"custom",message:"ACS current requires calibrated quality"});
  const a=v.acs;
  const hasRange=a.validated_min_a!==undefined||a.validated_max_a!==undefined;
  if(hasRange){
    const declared=a.validated_min_a!=null&&a.validated_max_a!=null&&a.validated_min_a<a.validated_max_a;
    if((a.validated_min_a!=null||a.validated_max_a!=null)&&!declared)c.addIssue({code:"custom",message:"ACS validated range requires ordered bounds"});
    if(a.quality==="ok"&&(!declared||a.current_a==null||a.current_a<a.validated_min_a!||a.current_a>a.validated_max_a!))c.addIssue({code:"custom",message:"ACS current is outside its independently validated range"});
  }
  if(a.current_diagnostic==="ok"&&a.quality!=="ok"||a.current_diagnostic&&a.current_diagnostic!=="ok"&&a.current_a!==null)c.addIssue({code:"custom",message:"ACS current diagnostic must agree with quality"});
  // 2.0.16 reports "ok"; 2.0.17 also identifies the verified A1 config.
  // Only the exact single-ended A1/+/-4.096V/128SPS/single-shot config is
  // accepted. Other channel/config diagnostics must never validate a voltage.
  const acsSampleValid=v.acs.adc_diagnostic==="ok" || v.acs.adc_diagnostic==="ok_A1_config_0xD383_verified";
  if(v.acs.adc_source==="ads1115_a1" && v.acs.adc_mv!==null &&
    (!acsSampleValid || v.acs.adc_age_ms==null || v.acs.adc_age_ms>500 || v.acs.adc_raw==null))
    c.addIssue({code:"custom",message:"ADS1115 ACS voltage requires a fresh valid channel sample"});
  if(v.acs.adc_source==="ads1115_a1" && v.acs.quality==="ok" && v.acs.adc_mv===null)
    c.addIssue({code:"custom",message:"Calibrated ADS1115 ACS current requires its voltage sample"});
  if(v.lte.registered && !v.lte.at_detected) c.addIssue({code:"custom",message:"LTE registration requires AT detection"});
  if(v.lte.attached && !v.lte.registered) c.addIssue({code:"custom",message:"LTE attachment requires registration"});
  if(v.lte_endpoint_saved && !v.lte_endpoint) c.addIssue({code:"custom",message:"Saved LTE destination requires its address"});
});
export const telemetrySchema = z
  .object({
    schema_version: z.union([z.literal(1), z.literal(2)]),
    cpe: cpeSchema.nullable().default(null),
    device_id: z.string().min(1).max(80),
    firmware_version: z.string().max(80),
    boot_id: z.string().min(1).max(80),
    sequence: z.number().int().nonnegative(),
    device_uptime_ms: z.number().int().nonnegative(),
    device_timestamp: z.iso.datetime().nullable().default(null),
    source_type: z.enum(["hardware", "demo"]),
    transport: z.enum(["usb", "wifi", "lte", "simulation"]),
    sensor_age_ms: z.record(z.string(), z.number().finite().nonnegative()).default({}),
    sensor_health: z.record(
      z.string(),
      z.enum(["ok", "absent", "fault", "uncalibrated"]),
    ),
    battery_voltage_v: voltage,
    battery_current_a: current,
    auxiliary_voltage_v: voltage,
    solar_voltage_v: voltage,
    solar_current_a: current,
    solar_output_voltage_v: voltage,
    solar_output_current_a: current,
    wind_voltage_v: voltage,
    wind_current_a: current,
    accelerometer: z
      .array(z.number().finite().min(-200).max(200))
      .length(3)
      .nullable()
      .default(null),
    gyroscope: z
      .array(z.number().finite().min(-3000).max(3000))
      .length(3)
      .nullable()
      .default(null),
    lid_state: z.enum(["secure", "tampered"]).nullable().default(null),
    mount_state: z.enum(["secure", "tampered"]).nullable().default(null),
    lid_raw: z.number().int().min(0).max(1).nullable().default(null),
    mount_raw: z.number().int().min(0).max(1).nullable().default(null),
    motion_detected: z.boolean().nullable().default(null),
    armed: z.boolean().nullable().default(null),
    security_state: z.enum(["DISARMED", "ARMED", "TRIGGERED"]).optional(),
    alarm_active: z.boolean().nullable().default(null),
    siren_verified: z.boolean().default(false),
    gps_fix: z.boolean().default(false),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
    gps_fix_age_ms: z.number().nonnegative().nullable().default(null),
    satellites: z.number().int().nonnegative().nullable().default(null),
    ads_raw: z
      .array(z.number().int().min(-32768).max(32767).nullable())
      .length(4)
      .nullable()
      .default(null),
    ads_voltage: z
      .array(z.number().min(-6.144).max(6.144).nullable())
      .length(4)
      .nullable()
      .default(null),
    ads_gain: z.string().nullable().default(null),
    acs_output_v: voltage,
    acs_zero_v: voltage,
    calibration_status: z
      .enum(["unverified", "calibrated"])
      .default("unverified"),
    lte_registration: z.string().nullable().default(null),
    lte_signal_quality: z.number().min(0).max(99).nullable().default(null),
    alarm_id: z.string().min(1).max(80).nullable().default(null),
    alarm_causes: z.array(z.enum(["lid", "mount", "motion", "sensor_fault"])).max(4).default([]),
    event_timestamp: z.iso.datetime().nullable().optional(),
    event_uptime_ms: z.number().int().nonnegative().optional(),
    event_id: z.string().max(80).nullable().default(null),
    event_type: z
      .enum(["motion", "lid", "mount", "sensor_fault", "test"])
      .nullable()
      .default(null),
  })
  .strict()
  .superRefine((t, c) => {
    if(t.security_state && t.security_state!==legacySecurityState(t))
      c.addIssue({code:"custom",message:"Explicit security state conflicts with reported armed/alarm/latch fields"});
    const roles=t.cpe?.measurements;
    if(roles){
      if(roles.battery_voltage_validated!==(t.battery_voltage_v!==null)||roles.battery_current_validated!==(t.battery_current_a!==null)||roles.solar_output_validated!==(t.solar_output_voltage_v!==null&&t.solar_output_current_a!==null))
        c.addIssue({code:"custom",message:"Measurement validity must match published channels"});
      if(!roles.solar_output_validated&&(t.solar_output_voltage_v!==null||t.solar_output_current_a!==null))
        c.addIssue({code:"custom",message:"Unvalidated solar output cannot carry measurements"});
      if((roles.battery_voltage_validated||roles.solar_output_validated)&&(t.cpe!.meter_source!=="mppt_output"||t.cpe!.pzem.quality!=="ok"))
        c.addIssue({code:"custom",message:"Battery bus/solar voltage requires a healthy installed MPPT-output meter"});
      if(roles.battery_current_validated&&(t.cpe!.acs.quality!=="ok"||t.cpe!.acs.current_a===null||Math.abs(t.battery_current_a!-t.cpe!.acs.current_a)>0.0001))
        c.addIssue({code:"custom",message:"Net battery current requires its calibrated ACS measurement"});
    }
    if ((t.schema_version===2)!==(t.cpe!==null)) c.addIssue({code:"custom",message:"v2 requires CPE data; v1 cannot carry CPE data"});
    if(t.cpe?.historical && (!t.event_id||!t.event_type))c.addIssue({code:"custom",message:"Historical CPE frames require event identity"});
    // Recovered events retain the configuration observed at acquisition. Device
    // authentication still gates delivery; do not rewrite old sensor evidence.
    if(t.transport==="lte" && !t.cpe?.lte.uplink_commissioned && !t.cpe?.historical) c.addIssue({code:"custom",message:"LTE transport requires commissioned uplink"});
    if (
      t.gps_fix &&
      (t.latitude === null ||
        t.longitude === null ||
        t.gps_fix_age_ms === null ||
        t.gps_fix_age_ms > 30000)
    )
      c.addIssue({
        code: "custom",
        message: "A valid GPS fix requires coordinates and age ≤30 seconds",
      });
    if (!t.gps_fix && (t.latitude !== null || t.longitude !== null))
      c.addIssue({
        code: "custom",
        message: "Coordinates require a valid GPS fix",
      });
    if (t.source_type === "hardware" && t.transport === "simulation")
      c.addIssue({ code: "custom", message: "Simulation cannot be hardware" });
    if (t.source_type === "demo" && t.transport !== "simulation")
      c.addIssue({
        code: "custom",
        message: "Demo must use simulation transport",
      });
    if (
      t.source_type === "hardware" &&
      t.calibration_status !== "calibrated" &&
      [
        t.battery_voltage_v,
        t.battery_current_a,
        t.solar_voltage_v,
        t.solar_current_a,
        t.wind_voltage_v,
        t.wind_current_a,
        t.solar_output_voltage_v,
        t.solar_output_current_a,
      ].some((v) => v !== null)
    )
      c.addIssue({
        code: "custom",
        message: "Electrical measurements require calibration",
      });
  });
export type Telemetry = z.infer<typeof telemetrySchema>;
// Older frames remain readable; the retained alarm reason carries the CPE latch
// after the siren timer expires. A disarmed bench siren test is not an armed security trip.
function legacySecurityState(t: {armed?:boolean|null;alarm_active?:boolean|null;cpe?:{alarm:{reason:string|null}}|null}|null|undefined) {
  if (t?.armed === false) return "DISARMED";
  if (t?.alarm_active || t?.cpe?.alarm.reason) return "TRIGGERED";
  return t?.armed === true ? "ARMED" : null;
}
export function securityState(t: Telemetry | null | undefined) {
  return t?.security_state ?? legacySecurityState(t);
}

export function power(v: number | null, i: number | null) {
  return v === null || i === null ? null : v * i;
}
export function sourcePower(t: Telemetry, source: "solar"|"wind") {
  if(source==="solar"&&t.cpe?.meter_source==="mppt_output"&&t.cpe.measurements?.solar_output_validated)
    return power(t.solar_output_voltage_v,t.solar_output_current_a);
  return power(t[`${source}_voltage_v`],t[`${source}_current_a`]);
}
export function integrateWh(
  previous: { at: string; power: number | null } | null,
  next: { at: string; power: number | null },
  maxGapMs = 30000,
) {
  if (!previous || previous.power === null || next.power === null) return 0;
  const dt = Date.parse(next.at) - Date.parse(previous.at);
  return dt > 0 && dt <= maxGapMs
    ? (((previous.power + next.power) / 2) * dt) / 3600000
    : 0;
}
export function freshness(at: string | null) {
  if (!at) return "Never connected";
  const age = Date.now() - Date.parse(at);
  return age < 30000 ? "Online" : age < 90000 ? "Delayed" : "Offline";
}
export class NDJSONParser {
  private buffer = "";
  private discarding = false;
  constructor(
    private onMessage: (t: Telemetry) => void,
    private onError: (e: string) => void,
  ) {}
  discardInterruptedLine() {
    // Lost bytes make the current line unusable. Do not combine a surviving
    // suffix with buffered data or promote it to a valid frame.
    this.buffer = "";
    this.discarding = true;
  }
  feed(chunk: string) {
    // A Web Serial read is a batch, not a frame. Limit each unfinished line,
    // consume complete frames first, and never discard later frames in a batch.
    let start = 0;
    for (const boundary of chunk.matchAll(/[\r\n]/g)) {
      this.append(chunk.slice(start, boundary.index));
      const line = this.buffer.trim();
      const discarded = this.discarding;
      this.buffer = "";
      this.discarding = false;
      start = boundary.index + 1;
      if (!discarded && line) this.parseLine(line);
    }
    this.append(chunk.slice(start));
  }
  private append(fragment: string) {
    if (this.discarding) return;
    if (this.buffer.length + fragment.length > 65536) {
      this.buffer = "";
      this.discarding = true;
      this.onError("Serial line exceeded 64 KiB and was discarded. Waiting for the next line ending; check the ESP32 port and 115200 baud.");
    } else this.buffer += fragment;
  }
  private parseLine(line: string) {
    if (line.startsWith("#")) {
      this.onError(line);
      return;
    }
    // The ESP32 ROM writes startup diagnostics before application NDJSON.
    // Keep recognizable boot output visible without calling it bad telemetry.
    if (/^(?:ets (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s|rst:0x[\da-f]+\s+\(|configsip:|clk_drv:|mode:(?:DIO|QIO|DOUT|QOUT),|load:0x[\da-f]+,len:|entry 0x[\da-f]+\s*$)/i.test(line)) {
      this.onError(`# ESP32 startup: ${line}`);
      return;
    }
    let raw: unknown;
    try {
      raw = JSON.parse(line);
    } catch {
      this.onError("Invalid telemetry line rejected: incomplete or malformed JSON");
      return;
    }
    const parsed = telemetrySchema.safeParse(raw);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      this.onError(`Invalid telemetry line rejected: ${issue.path.join(".") || "frame"}: ${issue.message}`);
      return;
    }
    this.onMessage(parsed.data);
  }
}
