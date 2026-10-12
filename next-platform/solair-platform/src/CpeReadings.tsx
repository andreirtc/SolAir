import type { Telemetry } from "../packages/telemetry-contract";
import { value } from "./api";
export default function CpeReadings({t}:{t:Telemetry|null}) {
  const c=t?.cpe;
  return <section className="panel"><div className="panel-heading"><h3>MPPT output & CPE channels</h3><span className="badge">{t?.source_type==="hardware"?"DEVICE REPORT":"NO REAL MEASUREMENT"}</span></div>
    <p>Load: <strong>{c?.load_mode||"unknown"}</strong> · {c?.load_mode==="bench_resistor"?"Bench resistor measurement; not vehicle charging":"Charging authorization is separate from this device report."}</p>
    <p className="subtle">Meter source: {c?.meter_source||"unknown"}. bench_supply readings do not establish MPPT production.</p>
    <div className="electrical-grid">
      <p className="subtle">MPU raw ax/ay/az/temp/gx/gy/gz: {c?.mpu_raw?.join(" / ")||"unavailable"}</p>
      <p className="subtle">ADS channels: {[0,1,2,3].map(i=>`A${i} ${value(t?.ads_voltage?.[i],4)} V (${t?.ads_raw?.[i]??"—"})`).join(" · ")}</p>
      {[["PZEM voltage",value(c?.pzem.voltage_v)+" V"],["PZEM current",value(c?.pzem.current_a)+" A"],["PZEM power",value(c?.pzem.power_w)+" W"],["PZEM cumulative meter",value(c?.pzem.energy_wh)+" Wh"],["ACS calibrated current",value(c?.acs.current_a)+" A"],["ACS ADC1",value(c?.acs.adc_mv)+" mV"]].map(([label,v])=><div key={label}><span>{label}</span><strong>{v}</strong></div>)}
    </div>
    <p className="subtle">PZEM {c?.pzem.quality||"unavailable"} · ACS {c?.acs.quality||"unavailable"}. Meter Wh is cumulative since its own reset; it is not battery SOC or PV-input energy.</p>
    <p>LTE {c?.lte.quality||"unavailable"} · AT {c?.lte.at_detected?"detected":"not detected"} · registered {c?.lte.registered?"yes":"no"} · attached {c?.lte.attached?"yes":"no"} · cellular uplink {c?.lte.uplink_commissioned?"commissioned":"not commissioned"}</p>
    <p>GPS {c?.gps.quality||"unavailable"} · HDOP {value(c?.gps.hdop)} · checksum failures {c?.gps.checksum_failures??"—"} · software UART overflows {c?.gps.software_uart_overflows??"—"}</p>
    <p>Alarm command {c?String(c.alarm.commanded):"unavailable"} · GPIO level {c?.alarm.output_level??"—"} · physical feedback {c?.alarm.feedback==null?"not instrumented":String(c.alarm.feedback)} · reason {c?.alarm.reason||"—"} · duration {c?.alarm.duration_ms??"—"} ms</p>
    <p className="subtle">Retained report values may be stale; check the device last-seen time above. Lost queue frames: {c?.queue_dropped??"—"}. Wind remains unavailable until controller commissioning.</p>
  </section>;
}
