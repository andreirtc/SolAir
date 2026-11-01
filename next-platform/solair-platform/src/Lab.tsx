import { useEffect, useRef, useState } from "react";
import {
  Usb,
  Activity,
  Cpu,
  CheckCircle,
  Download,
  Wifi,
  FlaskConical,
} from "lucide-react";
import { api, stamp, value } from "./api";
import { SerialBench, type SerialReceiveState } from "./Serial";
import type { Vehicle } from "./types";
import { securityState, type Telemetry } from "../packages/telemetry-contract";
import { guides } from "./bench-guides";
import CpeReadings from "./CpeReadings";
import CpeHistory from "./CpeHistory";
import BatterySummary from './BatterySummary';
import ResearchPanel from './ResearchPanel';
import RemoteControls from './RemoteControls';
import CpeIngressErrors from "./CpeIngressErrors";
import { lteDestinationValid } from "../packages/telemetry-contract/lte-destination";
const tests = [
  "ESP32 connectivity",
  "MPU6050 I²C detection",
  "Microswitch transitions",
  "Anti-tamper LED",
  "ADS1115 known-voltage measurement",
  "ACS758 zero-current calibration",
  "GPS reception and fix",
  "LTE AT verification",
  "HW-548 control verification",
  "Siren after safety verification",
  "End-to-end telemetry",
  "Offline and reconnection",
  "PZEM USB / MAX3485 measurement",
  "Combined all-sensors soak",
];
export default function Lab({
  vehicle,
  mode,
  refresh,
  toast,
}: {
  vehicle: Vehicle;
  mode: string;
  refresh: () => void;
  toast: (s: string) => void;
}) {
  const bench = useRef(new SerialBench());
  const [usbSupported,setUsbSupported]=useState(false);
  useEffect(()=>{setUsbSupported(window.isSecureContext&&Boolean((navigator as any).serial?.requestPort));},[]);
  const lastBytesAt = useRef(0);
  const serialReceive = useRef<SerialReceiveState | null>(null);
  const lastSample = useRef<Telemetry | null>(null);
  const lastUsbFrame = useRef<Telemetry | null>(null);
  // Preserve the device's serial order even when an earlier POST is delayed.
  const ingestChain = useRef<Promise<void>>(Promise.resolve());
  const forwardUsbRef = useRef(true);
  const ingestGeneration = useRef(0);
  const serialGeneration = useRef(0);
  const [forwardUsb, setForwardUsb] = useState(true);
  const [lastAcceptedUsb,setLastAcceptedUsb]=useState<{boot:string;sequence:number;receivedAt:string|null;duplicate:boolean;historical:boolean}|null>(null);
  const [connected, setConnected] = useState(false),
    [connecting, setConnecting] = useState(false),
    [usbAt, setUsbAt] = useState(0),
    [now, setNow] = useState(Date.now()),
    [serialError, setSerialError] = useState(""),
    [ingestError, setIngestError] = useState(""),
    [baud, setBaud] = useState(115200),
    [live, setLive] = useState<Telemetry | null>(null),
    [log, setLog] = useState<string[]>([]),
    [session, setSession] = useState(""),
    [evidence, setEvidence] = useState<any[]>([]),
    [creds, setCreds] = useState<any>(null),
    [samples, setSamples] = useState<number[][]>([]);
  const [graphAxis, setGraphAxis] = useState("0");
  const [syncingDestination, setSyncingDestination] = useState(false);
  const [pendingDestination, setPendingDestination] = useState<{url: string; since: number} | null>(null);
  const [test, setTest] = useState(tests[0]),
    [result, setResult] = useState("NOT TESTED"),
    [notes, setNotes] = useState(""),
    [measurements, setMeasurements] = useState(""),
    [reference, setReference] = useState(""),
    [cal, setCal] = useState<any[]>([]);
  const serverAt = Date.parse(vehicle.telemetry?.received_at || "") || 0;
  const useUsb = live && (live.boot_id === vehicle.telemetry?.boot_id
    ? live.sequence >= vehicle.telemetry.sequence
    : usbAt >= serverAt);
  const t = useUsb ? live : vehicle.telemetry;
  const supportsDestinationSync = Number(/^solair-cpe-2\.0\.(\d+)(?:\/|$)/.exec(t?.firmware_version || "")?.[1] || 0) >= 14;
  const usbAge = usbAt ? Math.max(0, Math.floor((now - usbAt) / 1000)) : null;
  const streaming = connected && usbAge !== null && usbAge < 10;
  const testLatched = t?.cpe?.alarm.reason === "test";
  const graphAxes = graphAxis === "all" ? [0, 1, 2] : [Number(graphAxis)];
  const graphValues = samples.flatMap(sample => graphAxes.map(axis => sample[axis]));
  const min = Math.min(0, ...graphValues) - 1;
  const max = Math.max(0, ...graphValues) + 1;
  const graphY = (v: number) => 77 - ((v - min) / (max - min)) * 69;
  const addLog = (s: string) =>
    setLog((l) =>
      [`${new Date().toLocaleTimeString("en-PH")} ${s}`, ...l].slice(0, 80),
    );
  useEffect(() => {
    if (!pendingDestination) return;
    if (t?.cpe?.lte_endpoint_saved && t.cpe.lte_endpoint === pendingDestination.url) {
      addLog("# LTE address confirmed saved by the device; ready for an upload test");
      setPendingDestination(null);
      setSyncingDestination(false);
    } else if (now - pendingDestination.since >= 120000 || !connected) {
      addLog("# LTE address save was not confirmed. Keep USB connected and inspect the reported address before starting LTE.");
      setPendingDestination(null);
      setSyncingDestination(false);
    }
  }, [pendingDestination, t?.cpe?.lte_endpoint, t?.cpe?.lte_endpoint_saved, now, connected]);
  useEffect(() => {
    let active=true;
    setEvidence([]);setCal([]);setSession("");setCreds(null);
    api(`/bench/evidence/${vehicle.device_id}?mode=${mode}`)
      .then(value=>{if(active)setEvidence(value);})
      .catch(() => {});
    api(`/calibrations/${vehicle.device_id}`)
      .then(value=>{if(active)setCal(value);})
      .catch(() => {});
    return()=>{active=false;};
  }, [vehicle.device_id, mode]);
  useEffect(() => {
    serialGeneration.current++;
    setConnected(false);setConnecting(false);setLive(null);setUsbAt(0);setLastAcceptedUsb(null);setSamples([]);
    setSerialError("");setIngestError("");setPendingDestination(null);setSyncingDestination(false);
    lastUsbFrame.current=null;lastSample.current=null;
    return()=>{serialGeneration.current++;ingestGeneration.current++;void bench.current.disconnect().catch(()=>{});};
  }, [vehicle.device_id, mode]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    if (!t || t.cpe?.historical) return;
    const previous = lastSample.current;
    if (previous?.boot_id === t.boot_id && previous.sequence >= t.sequence) return;
    lastSample.current = t;
    if (t.accelerometer) setSamples((s) => [...s.slice(-39), t.accelerometer!]);
  }, [t]);
  const connect = async () => {
    setConnecting(true);
    const connectionGeneration=++serialGeneration.current;
    try {
      if (mode !== "hardware")
        throw new Error("Select REAL HARDWARE mode before USB connection");
      setUsbAt(0);
      lastUsbFrame.current = null;
      lastBytesAt.current = 0;
      serialReceive.current = null;
      setSerialError("");
      setIngestError("");
      setLastAcceptedUsb(null);
      await bench.current.connect(
        baud,
        (t) => {
          if(connectionGeneration!==serialGeneration.current)return;
          if (t.device_id !== vehicle.device_id || t.source_type !== "hardware" || t.transport !== "usb") {
            const error = `Rejected frame: expected ${vehicle.device_id} / hardware / usb; received ${t.device_id} / ${t.source_type} / ${t.transport}`;
            setSerialError(error);
            addLog(error);
            return;
          }
          setSerialError("");
          if (!t.cpe?.historical) {
            const previous = lastUsbFrame.current;
            if (!previous || previous.boot_id !== t.boot_id || t.sequence > previous.sequence) {
              lastUsbFrame.current = t;
              setLive(t);
              setUsbAt(Date.now());
            }
          }
          addLog(`RX ${t.device_id} #${t.sequence}`);
          if (!forwardUsbRef.current) return;
          const generation = ingestGeneration.current;
          ingestChain.current = ingestChain.current
            .then(async () => {
              if (generation !== ingestGeneration.current) return;
              const response=await api("/ingest", "POST", t, { "X-Bench-Transport": "usb" });
              const ack=response?.ack;
              if(response?.accepted!==true||response?.queued===true||(ack&&(ack.persisted!==true||ack.device_id!==t.device_id||ack.boot_id!==t.boot_id||ack.sequence!==t.sequence)))throw new Error("Server has not acknowledged this USB frame as accepted storage");
              if (generation === ingestGeneration.current) {
                setIngestError("");
                setLastAcceptedUsb({boot:t.boot_id,sequence:t.sequence,receivedAt:typeof response.backend_received_at==='string'&&Number.isFinite(Date.parse(response.backend_received_at))?response.backend_received_at:null,duplicate:response.duplicate===true,historical:t.cpe?.historical===true});
              }
            })
            .catch((e) => {
              if (generation !== ingestGeneration.current) return;
              setIngestError(e.message); addLog(`Server rejected frame: ${e.message}`);
            });
        },
        (message) => {
          if(connectionGeneration!==serialGeneration.current)return;
          addLog(message);
          if (!message.startsWith("#")) setSerialError(message);
        },
        () => {
          if(connectionGeneration!==serialGeneration.current)return;
          setConnected(false);
          setLive(null);
          addLog("Port disconnected; last server readings retained");
        },
        (state) => { if(connectionGeneration===serialGeneration.current){lastBytesAt.current = Date.now(); serialReceive.current = state;} },
      );
      if(connectionGeneration===serialGeneration.current){setConnected(true);addLog("USB port opened");}
    } catch (e) {
      toast((e as Error).message);
    } finally {
      if(connectionGeneration===serialGeneration.current)setConnecting(false);
    }
  };
  const command = async (cmd: string) => {
    try {
      let utcSeconds: number | undefined;
      if (["lte_once", "lte_start"].includes(cmd)) {
        const health = await api("/health");
        const epoch = Date.parse(health.server_time);
        if (!Number.isFinite(epoch)) throw new Error("Backend time unavailable; LTE command was not sent");
        utcSeconds = Math.floor(epoch / 1000);
      }
      await bench.current.command(cmd, utcSeconds);
      addLog(
        `TX ${cmd}; await reported state, GPIO is not proof of physical operation`,
      );
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const syncDestination = async () => {
    setSyncingDestination(true);
    try {
      const result = await api(`/cpe-uplink/${vehicle.id}`);
      if (!result.reachable || !lteDestinationValid(result.url)) throw new Error("Backend LTE address is not ready");
      if (t?.cpe?.lte_endpoint_saved && t.cpe.lte_endpoint === result.url) {
        setSyncingDestination(false);
        toast("The device already has the current LTE address saved");
        return;
      }
      await bench.current.setLteDestination(result.url);
      setPendingDestination({url: result.url, since: Date.now()});
      addLog("# LTE address update sent; waiting for the device to confirm it was saved");
    } catch (e) {
      setSyncingDestination(false);
      toast((e as Error).message);
    }
  };
  const save = async () => {
    try {
      let sid = session;
      if (!sid) {
        sid = (
          await api(`/bench/sessions?mode=${mode}`, "POST", {
            device_id: vehicle.device_id,
          })
        ).id;
        setSession(sid);
      }
      await api("/bench/results", "POST", {
        session_id: sid,
        test,
        result,
        measurements,
        notes,
        evidence: reference,
        firmware: t?.firmware_version || "Not reported",
      });
      setEvidence(
        await api(`/bench/evidence/${vehicle.device_id}?mode=${mode}`),
      );
      toast("Test evidence saved. Physical result recorded by engineer.");
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const exportEvidence = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(
        [
          JSON.stringify(
            {
              exported_at: new Date().toISOString(),
              device: vehicle.device_id,
              mode,
              latest_report: t,
              latest_report_source: t ? useUsb ? "USB" : "server" : "none",
              usb_last_valid_at: usbAt ? new Date(usbAt).toISOString() : null,
              serial_error: serialError || null,
              ingest_error: ingestError || null,
              last_usb_storage_acknowledgement:lastAcceptedUsb,
              physical_tests: evidence,
              calibrations: cal,
            },
            null,
            2,
          ),
        ],
        { type: "application/json" },
      ),
    );
    a.download = `solair-bench-${mode}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <>
      <div className="lab-connect panel">
        <div>
          <span className="eyebrow">HARDWARE WORKSPACE</span>
          <h2>From breadboard to road.</h2>
          <p>Connect, observe and document genuine device behavior.</p>
        </div>
        <div className="connection-actions">
          <select
            disabled={connected || connecting}
            aria-label="Serial baud rate"
            value={baud}
            onChange={(e) => setBaud(+e.target.value)}
          >
            <option>115200</option>
            <option>9600</option>
          </select>
          <button
            className="primary"
            disabled={connecting || !usbSupported}
            title={usbSupported ? "Desktop USB connection" : "Phone monitoring uses LTE; desktop USB is unavailable here"}
            onClick={
              connected
                ? async () => {
                    try { await bench.current.disconnect(); }
                    catch (e) { toast((e as Error).message); }
                  }
                : connect
            }
          >
            <Usb size={17} />
            {connecting ? "Opening USB…" : connected ? "Disconnect USB" : "Connect ESP32"}
          </button>
        </div>
      </div>
      <p className="subtle">Phone monitoring updates automatically from LTE. Connect ESP32 is for desktop USB only.</p>
      <RemoteControls vehicleId={vehicle.id} mode={mode}/>
      <label>
        <input
          type="checkbox"
          checked={forwardUsb}
          disabled={!connected}
          onChange={(e) => {
            const enabled = e.target.checked;
            forwardUsbRef.current = enabled;
            ingestGeneration.current++;
            setForwardUsb(enabled);
            setIngestError("");
            addLog(enabled ? "USB server forwarding enabled" : "USB monitor only: queued USB uploads skipped; an in-flight upload may finish. Device uploads continue independently.");
          }}
        />{" "}
        Forward USB readings to server
      </label>
      <div className="lab-info">
        <span>
          <Cpu size={16} /> {vehicle.device_id}
        </span>
        <span>
          <span className={"dot " + (streaming ? "green" : "")} />
          {connected ? streaming ? forwardUsb ? "USB streaming" : "USB monitor only · server forwarding off" : "USB open · waiting for telemetry" : vehicle.status}
        </span>
        <span>Firmware {t?.firmware_version || "—"}</span>
        <span>
          Uptime{" "}
          {t?.device_uptime_ms == null
            ? "—"
            : Math.floor(t.device_uptime_ms / 1000) + " s"}
        </span>
        <span>Server receipt {stamp(vehicle.telemetry?.received_at)}</span>
        <span>Report #{t?.sequence ?? "—"} · {t ? useUsb ? "USB" : "server" : "no data"}</span>
        {t&&<span>Transport {t.transport.toUpperCase()} · boot {t.boot_id} · device time {t.device_timestamp?stamp(t.device_timestamp):"not supplied"}</span>}
        {connected && <span>Last valid USB frame: {usbAge === null ? "none" : `${usbAge} s ago`}</span>}
      </div>
      {connected&&<p className="subtle" data-testid="usb-storage-status">Local USB reception is separate from accepted server data. {lastAcceptedUsb?`Last acknowledged USB ${lastAcceptedUsb.historical?'historical event':'report'} #${lastAcceptedUsb.sequence} · boot ${lastAcceptedUsb.boot} · ${lastAcceptedUsb.duplicate?'already stored':'accepted'} · ${lastAcceptedUsb.receivedAt?`server receipt ${stamp(lastAcceptedUsb.receivedAt)}`:'receipt timestamp not returned'}.`:'No USB frame has been acknowledged as stored in this session.'} {live&&useUsb&&(!lastAcceptedUsb||lastAcceptedUsb.boot!==live.boot_id||lastAcceptedUsb.sequence!==live.sequence)?'The displayed USB report has no matching storage acknowledgement yet.':''} {!forwardUsb?'USB forwarding is OFF; monitor readings do not establish LTE delivery.':''}</p>}
      {connected && !streaming && <p className="safety" role="status">
        {lastBytesAt.current && now - lastBytesAt.current < 10000
          ? "USB bytes are arriving, but no current telemetry frame has been accepted. Check the frame error and serial log below."
          : "USB is open, but telemetry has stopped or has not started. Confirm 115200 baud and that the combined/final sketch is running. Close Arduino Serial Monitor before reconnecting USB."}
        {" Displayed server values are retained history until a new valid report arrives."}
      </p>}
      {connected && !streaming && serialReceive.current && <details className="serial-receive panel">
        <summary>USB receive diagnostics · {serialReceive.current.bytes} bytes · CR {serialReceive.current.carriageReturns} / LF {serialReceive.current.lineFeeds}</summary>
        <p>{serialReceive.current.carriageReturns + serialReceive.current.lineFeeds === 0
          ? "No line endings received. Confirm the selected USB device and baud rate; SOLAIR firmware sends one JSON report per line."
          : "Line endings received. Check the parser error and recent bytes for incomplete JSON or an unexpected device stream."}</p>
        <p>Non-ASCII/control bytes: {serialReceive.current.unusualBytes}. Port settings: {baud} baud, 8 data bits, no parity, 1 stop bit, no flow control.</p>
        {serialReceive.current.bootMessages > 0 && <p>
          ESP32 startup messages since USB opened: {serialReceive.current.bootMessages}. Last reset: {serialReceive.current.lastBootReason}.
          {serialReceive.current.bootMessages > 1
            ? " More than one startup was received. If this count keeps increasing without pressing RESET, the device is repeatedly restarting; valid telemetry has not resumed."
            : " A startup message was received. Waiting for a valid SOLAIR telemetry report."}
        </p>}
        <p>Recent received text (escaped):</p><code>{serialReceive.current.preview}</code>
        <p>Recent received bytes (hex):</p><code>{serialReceive.current.hex}</code>
      </details>}
      {serialError && <p className="safety" role="alert">{serialError}</p>}
      {ingestError && <p className="safety" role="alert">Live USB display is separate from server storage. Server error: {ingestError}</p>}
      <div className="lab-grid">
        <CpeReadings t={t} reportFresh={Boolean(useUsb ? streaming : serverAt && now>=serverAt && now-serverAt<30000)} />
        <section className="panel">
          <div className="panel-heading">
            <h3>
              <Activity size={18} /> Motion & enclosure
            </h3>
            <span className="badge">{t?.sensor_health.mpu6500_compatible && t.sensor_health.mpu6500_compatible !== "absent" ? "MPU6500-compatible" : "IMU"}</span>
          </div>
          <div className="axis-readings">
            {["X", "Y", "Z"].map((a, i) => (
              <div key={a}>
                <small>{a} acceleration</small>
                <strong>
                  {value(t?.accelerometer?.[i], 3)} <em>m/s²</em>
                </strong>
                <small>Gyro {value(t?.gyroscope?.[i], 2)} °/s</small>
              </div>
            ))}
          </div>
          <label className="motion-graph-control">
            Graph
            <select aria-label="Motion graph axis" value={graphAxis} onChange={e => setGraphAxis(e.target.value)}>
              <option value="0">X acceleration</option>
              <option value="1">Y acceleration</option>
              <option value="2">Z acceleration</option>
              <option value="all">All axes (X / Y / Z)</option>
            </select>
          </label>
          <svg viewBox="0 0 400 85" className="spark" role="img" aria-label={`MPU acceleration history, ${graphAxis === "all" ? "X Y and Z axes" : `${["X", "Y", "Z"][Number(graphAxis)]} axis`}`}>
            <path d={`M0 ${graphY(0)}H400`} stroke="#d8e2ea" strokeDasharray="4 4" />
            {graphAxes.map(axis => <g key={axis}>
              <path
                data-axis={axis}
                d={samples.map((v, i) => `${i ? "L" : "M"} ${5 + i * 10} ${graphY(v[axis])}`).join(" ")}
                fill="none" stroke={["#007c73", "#245fbc", "#a34e13"][axis]} strokeWidth="2"
              />
              {samples.length > 0 && <circle cx={5 + (samples.length - 1) * 10} cy={graphY(samples[samples.length - 1][axis])} r="2.5" fill={["#007c73", "#245fbc", "#a34e13"][axis]} />}
            </g>)}
          </svg>
          <p className="subtle">{graphAxis === "all" ? "X teal · Y blue · Z brown" : `${["X", "Y", "Z"][Number(graphAxis)]} acceleration`} · {samples.length}/40 samples · {min.toFixed(1)} to {max.toFixed(1)} m/s²</p>
          {t && !t.accelerometer && <p className="safety" role="status">No MPU reading in the latest report. {samples.length ? "The graph retains earlier measurements; these lines are not live MPU readings." : "Waiting for a valid MPU measurement."} USB and other sensors can continue updating independently.</p>}
          {!samples.length && <p className="empty">Waiting for MPU acceleration samples from USB or network telemetry.</p>}
          <div className="switch-row">
            <span>Lid · GPIO25</span>
            <strong>
              {t?.lid_state || "Not reported"} · raw {t?.lid_raw ?? "—"}
            </strong>
          </div>
          <div className="switch-row">
            <span>Mount · GPIO26</span>
            <strong>
              {t?.firmware_version?.includes("/lid-only") ? "Disabled" : t?.mount_state || "Not reported"} · raw {t?.mount_raw ?? "—"}
            </strong>
          </div>
          <p>Security: <strong>{securityState(t) || "Not reported"}</strong> · last device report</p>
          {testLatched && <p className="subtle">Manual siren test {t?.alarm_active ? "running" : "complete"}. Clear its latch before arming security.</p>}
          {t?.armed === false && !testLatched && <p className="subtle">Disarmed: switch changes do not trigger the alarm. Hold each enabled switch secure, then arm security to test a tamper trip.</p>}
          <div className="button-row">
            <button disabled={!connected || t?.schema_version===2} onClick={() => command("calibrate_motion")}>
              {t?.schema_version===2?"Motion calibration: recorded firmware coefficients":"Calibrate baseline"}
            </button>
            <button disabled={!connected} onClick={() => command(t?.armed || testLatched || securityState(t) === "TRIGGERED" ? "disarm" : "arm")}>
              {testLatched ? "Clear test latch" : t?.armed || securityState(t) === "TRIGGERED" ? "Disarm bench" : "Arm bench"}
            </button>
            <button disabled={!connected} onClick={() => command("siren_test")}>
              Test Siren (5s)
            </button>
          </div>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h3>
              <Cpu size={18} /> Sensor diagnostics
            </h3>
          </div>
          {[
            "mpu6050",
            "mpu6500_compatible",
            "switches",
            "ads1115",
            "acs758",
            "gps",
            "lte",
            "pzem017",
            "wind",
          ].map((s) => (
            <div className="switch-row" key={s}>
              <span>{s.toUpperCase()}</span>
              <span className="badge">
                {t?.sensor_health[s] || "Not reported"}
              </span>
            </div>
          ))}
          <p className="subtle">
            ADS gain: {t?.ads_gain || "—"} · A0: {value(t?.ads_voltage?.[0], 4)}{" "}
            V · raw {t?.ads_raw?.[0] ?? "—"}
          </p>
          <p className="subtle">
            ACS output {value(t?.acs_output_v, 4)} V · zero{" "}
            {value(t?.acs_zero_v, 4)} V
          </p>
          <p className="subtle">
            GPS: {t?.gps_fix ? "Valid fix" : "No fix"} · satellites{" "}
            {t?.satellites ?? "—"} · age {t?.gps_fix_age_ms ?? "—"} ms
          </p>
          <p className="subtle">
            LTE registration {t?.lte_registration || "Unavailable"} · signal{" "}
            {t?.lte_signal_quality ?? "—"}
          </p>
          {t?.cpe?.lte_at_diagnostic && <p className="subtle">Modem command response: {t.cpe.lte_at_diagnostic}</p>}
          {supportsDestinationSync && t?.cpe?.lte_endpoint && <p className="subtle">LTE address: {t.cpe.lte_endpoint} · {t.cpe.lte_endpoint_saved ? "saved on device" : "firmware default"}</p>}
          {/^solair-cpe-2\.0\.(?:[5-9]|[1-9]\d+)(?:\/|$)/.test(t?.firmware_version || "") && <>
            <div className="button-row">
              <button disabled={!connected || syncingDestination || !t?.cpe?.lte.uplink_commissioned} onClick={() => command("lte_once")}>Test LTE upload once</button>
              <button disabled={!connected || syncingDestination || !t?.cpe?.lte.uplink_commissioned} onClick={() => command("lte_start")}>Start LTE streaming</button>
              <button disabled={!connected} onClick={() => command("lte_stop")}>Stop LTE streaming</button>
              {supportsDestinationSync && <button disabled={!connected || syncingDestination} onClick={syncDestination}>{syncingDestination ? "Waiting for saved LTE address…" : "Update LTE address"}</button>}
            </div>
            <p className="subtle">Controls use USB. LTE delivery must be verified in server records. Stop allows an in-flight request to finish.</p>
          </>}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h3>
              <FlaskConical size={18} /> Guided physical test
            </h3>
            <span className="badge">
              {mode === "demo" ? "SIMULATED WORKSPACE" : "ENGINEER EVIDENCE"}
            </span>
          </div>
          <label>
            Test
            <select value={test} onChange={(e) => setTest(e.target.value)}>
              {tests.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <ol className="guide-steps">
            {guides[test]?.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <label>
            Observed result
            <select value={result} onChange={(e) => setResult(e.target.value)}>
              {["NOT TESTED", "PASS", "FAIL", "BLOCKED"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Measured values
            <input
              value={measurements}
              onChange={(e) => setMeasurements(e.target.value)}
              placeholder="Instrument reading, units and conditions"
            />
          </label>
          <label>
            Notes
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe what actually happened"
            />
          </label>
          <label>
            Evidence reference
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Photo/report filename or reference"
            />
          </label>
          <button className="primary" onClick={save}>
            <CheckCircle size={16} />
            Save test record
          </button>
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h3>
              <Wifi size={18} /> Transport & safe output
            </h3>
          </div>
          <p>USB and Wi-Fi use validated v1/v2 telemetry. Remote commands are not connected; bench controls require USB.</p>
          <a className="button" href={`/api/cpe-export/${vehicle.id}?mode=${mode}`}>Export CPE CSV (up to 5,000 rows)</a>
          <details><summary>Last payload / device provenance</summary><p>{useUsb?'Locally received USB payload; check storage acknowledgement separately.':'Last accepted server payload; retain its receipt and measurement times.'}</p><pre>{JSON.stringify(t,null,2)||"No payload reported"}</pre></details>
          {mode==='hardware'&&<CpeIngressErrors vehicleId={vehicle.id} />}
          <code>
            POST /api/ingest
            <br />
            Authorization: Bearer device-token
          </code>
          <button
            onClick={async () => {
              try {
                setCreds(
                  await api("/devices/provision", "POST", {
                    vehicle_id: vehicle.id,
                  }),
                );
                toast("Device token rotated; previous token is revoked");
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            Provision / rotate device credential
          </button>
          {creds && (
            <div className="secret">
              <strong>Copy once into solair_config.h</strong>
              <textarea readOnly value={creds.device_token} />
              <button onClick={() => setCreds(null)}>Hide credential</button>
            </div>
          )}
          <div className="safety">
            <strong>Siren disabled by default</strong>
            <p>
              GPIO{t?.firmware_version.includes("/alarm26")?26:27} command:{" "}
              {t?.alarm_active ? "Active" : "Inactive / unavailable"}.
              Verification:{" "}
              {t?.siren_verified
                ? "Firmware reports verified"
                : "Not physically verified"}
              . A GPIO state is not proof of siren operation.
            </p>
          </div>
          <div className="button-row">
            <button onClick={() => command("led_test")}>
              Test low-voltage LED
            </button>
            <button onClick={() => command("alarm_off")}>
              Clear bench alarm
            </button>
          </div>
          <p className="subtle">
            Powered siren enablement requires a documented electrical test and
            firmware configuration. No traction controls exist.
          </p>
        </section>
      </div>
      <section className="panel">
        <BatterySummary vehicleId={vehicle.id} mode={mode} configure/>
        <ResearchPanel vehicleId={vehicle.id} mode={mode}/>
        <CpeHistory vehicleId={vehicle.id} mode={mode} />
        <div className="panel-heading">
          <h3>Evidence & calibration records</h3>
          <button onClick={exportEvidence}>
            <Download size={16} />
            Export JSON
          </button>
        </div>
        <div className="button-row">
          <button
            onClick={async () => {
              const values = window.prompt(
                "Calibration JSON (offset, reference instrument, units)",
              );
              if (!values) return;
              const evidence = window.prompt(
                "Physical calibration evidence reference",
              );
              if (!evidence) return;
              try {
                await api("/calibrations", "POST", {
                  device_id: vehicle.device_id,
                  sensor: "ACS758",
                  values_json: values,
                  evidence,
                });
                setCal(await api(`/calibrations/${vehicle.device_id}`));
                toast(
                  "Calibration record saved; apply verified coefficients in firmware",
                );
              } catch (e) {
                toast((e as Error).message);
              }
            }}
          >
            Record ACS calibration
          </button>
          <button onClick={refresh}>Refresh network telemetry</button>
        </div>
        {evidence.length ? (
          evidence.map((e) => (
            <div className="switch-row" key={e.id}>
              <span>
                {e.test} · {stamp(e.created_at)}
              </span>
              <strong>
                {e.result} ·{" "}
                {e.mode === "demo"
                  ? "SIMULATED"
                  : e.measurements || "No measurement"}
              </strong>
            </div>
          ))
        ) : (
          <p className="empty">
            No tests recorded. Hardware tests start as NOT TESTED.
          </p>
        )}
        {cal.map((c) => (
          <p key={c.id}>
            {c.sensor} · {stamp(c.created_at)} · {c.evidence}
          </p>
        ))}
      </section>
      <details className="panel serial-log">
        <summary>Serial transition log · {log.length} lines</summary>
        <pre>{log.join("\n") || "Awaiting hardware connection"}</pre>
      </details>
    </>
  );
}
