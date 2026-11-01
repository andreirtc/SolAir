import { NDJSONParser, type Telemetry } from "../packages/telemetry-contract";
import { lteDestinationValid } from "../packages/telemetry-contract/lte-destination";
export type SerialReceiveState = {
  bytes: number;
  carriageReturns: number;
  lineFeeds: number;
  unusualBytes: number;
  bootMessages: number;
  lastBootReason: string | null;
  preview: string;
  hex: string;
};
export class SerialBench {
  constructor(private readonly clock: () => number = Date.now) {}
  port: any;
  reader: any;
  private reading?: Promise<void>;
  private opening = false;
  private recovering = false;
  private generation = 0;
  active = false;
  async connect(
    baud: number,
    onData: (t: Telemetry) => void,
    onError: (s: string) => void,
    onClose: () => void,
    onActivity: (state: SerialReceiveState) => void = () => {},
  ) {
    if (this.active || this.reading || this.opening) throw new Error("Disconnect the current USB session first");
    const serial = (navigator as any).serial;
    if (!serial)
      throw new Error(
        "USB requires desktop Chrome/Edge with Web Serial. Phone monitoring uses LTE automatically; do not connect USB on the phone.",
      );
    const generation = ++this.generation;
    this.opening = true;
    let port: any;
    let reader: any;
    let stream: any;
    try {
      port = await serial.requestPort();
      if (generation !== this.generation) throw new Error("USB connection cancelled");
      await port.open({ baudRate: baud, dataBits: 8, stopBits: 1, parity: "none", flowControl: "none", bufferSize: 65536 });
      if (generation !== this.generation) throw new Error("USB connection cancelled");
      // USB-UART adapters can retain asserted reset/boot control lines after
      // another serial client closes. Monitoring must release them, not pulse
      // them or deliberately reset the running device.
      if (typeof port.setSignals === "function") {
        try {
          await port.setSignals({ dataTerminalReady: false, requestToSend: false });
        } catch {
          onError("# USB adapter could not release DTR/RTS; monitoring continues. Check startup messages if telemetry does not resume.");
        }
      } else {
        onError("# USB adapter does not expose DTR/RTS control; monitoring continues.");
      }
      if (generation !== this.generation) throw new Error("USB connection cancelled");
      stream = port.readable;
      reader = stream.getReader();
    } catch (error) {
      try { await port?.close(); } catch { /* An unopened port has nothing to release. */ }
      throw error;
    } finally {
      this.opening = false;
    }
    this.port = port;
    this.reader = reader;
    this.active = true;
    let validFrames = 0, noiseBytes = 0, noiseBad = 0, quietSince = this.clock(), reopened = false;
    const parser = new NDJSONParser(t => {
      validFrames++;
      noiseBytes = noiseBad = 0;
      quietSince = this.clock();
      onData(t);
    }, onError);
    let decoder = new TextDecoder();
    const received: SerialReceiveState = { bytes: 0, carriageReturns: 0, lineFeeds: 0, unusualBytes: 0, bootMessages: 0, lastBootReason: null, preview: "", hex: "" };
    let recentText = "", recentBytes = new Uint8Array(0), diagnosticLine = "";
    this.reading = (async () => {
      try {
        while (this.active) {
          try {
            while (this.active) {
              const { value, done } = await reader.read();
              if (done) break;
              const text = decoder.decode(value, { stream: true });
              received.bytes += value.length;
              for (const byte of value) {
                if (byte === 13) received.carriageReturns++;
                if (byte === 10) received.lineFeeds++;
                if ((byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte > 126) received.unusualBytes++;
              }
              noiseBytes += value.length;
              for (const byte of value) if ((byte < 32 && byte !== 9 && byte !== 10 && byte !== 13) || byte > 126) noiseBad++;
              // Reads may be only a few bytes. Retain context across reads so a
              // split ROM startup line is recognizable and counted exactly once.
              const diagnosticText = diagnosticLine + text;
              const lastBoundary = Math.max(diagnosticText.lastIndexOf("\r"), diagnosticText.lastIndexOf("\n"));
              if (lastBoundary >= 0) {
                for (const line of diagnosticText.slice(0, lastBoundary + 1).split(/[\r\n]+/)) {
                  const boot = /^rst:(0x[\da-f]+\s+\([^\r\n)]+\)),boot:/i.exec(line.trim());
                  if (boot) { received.bootMessages++; received.lastBootReason = boot[1]; }
                }
              }
              diagnosticLine = diagnosticText.slice(lastBoundary + 1).slice(-512);
              recentText = (recentText + text).slice(-512);
              recentBytes = new Uint8Array([...recentBytes, ...value.slice(-24)]).slice(-24);
              received.preview = JSON.stringify(recentText);
              received.hex = Array.from(recentBytes, byte => byte.toString(16).padStart(2, "0")).join(" ");
              onActivity({ ...received });
              parser.feed(text);
              // Some adapters deliver sustained binary noise after upload
              // without raising a read exception. A parser cannot repair that
              // byte stream. Reconfigure this same port once, preserving the
              // page/session; never change baud/port or deliberately reset.
              if (!reopened && noiseBytes >= 4096 && noiseBad / noiseBytes >= 0.25 && this.clock() - quietSince >= (validFrames ? 10000 : 2000) && !port.writable?.locked) {
                reopened = true;
                this.recovering = true;
                onError("# USB sustained binary noise; reopening the same port once at the selected settings. No telemetry is accepted from the corrupted stream.");
                await reader.cancel();
                reader.releaseLock();
                reader = undefined;
                this.reader = undefined;
                await port.close();
                if (!this.active) break;
                await port.open({ baudRate: baud, dataBits: 8, stopBits: 1, parity: "none", flowControl: "none", bufferSize: 65536 });
                if (!this.active) break;
                if (typeof port.setSignals === "function") {
                  try { await port.setSignals({ dataTerminalReady: false, requestToSend: false }); }
                  catch { onError("# USB adapter could not release DTR/RTS after reopening; check startup diagnostics."); }
                }
                stream = port.readable;
                reader = stream.getReader();
                this.reader = reader;
                this.recovering = false;
                parser.discardInterruptedLine();
                decoder = new TextDecoder();
                diagnosticLine = "";
                noiseBytes = noiseBad = 0;
                quietSince = this.clock();
                onError("# USB port reopened; waiting for a complete valid telemetry report. If noise persists, disconnect and inspect the serial connection; automatic reopening will not loop.");
              }
            }
            break;
          } catch (error) {
            // Chrome replaces the readable stream after recoverable framing,
            // parity and buffer errors. Keep the open port and acquire that
            // replacement instead of forcing a page refresh/reconnect.
            if (!this.active) break;
            const replacement = port.readable;
            if (!replacement || replacement === stream) throw error;
            reader.releaseLock();
            this.reader = undefined;
            parser.discardInterruptedLine();
            decoder = new TextDecoder();
            diagnosticLine = "";
            reader = replacement.getReader();
            stream = replacement;
            this.reader = reader;
            onError(`# USB read interrupted (${(error as Error).name || "read error"}); monitoring resumed. Waiting for the next complete telemetry line.`);
          }
        }
      } catch (error) {
        if (this.active) onError(`Serial read stopped: ${(error as Error).message}`);
      } finally {
        this.active = false;
        this.recovering = false;
        reader?.releaseLock();
        try { await port.close(); } catch { /* A physically removed port may already be closed. */ }
        this.reader = undefined;
        this.port = undefined;
        this.reading = undefined;
        onClose();
      }
    })();
  }
  async command(command: string, utcSeconds?: number) {
    await this.send({ command, ...(utcSeconds === undefined ? {} : { utc_seconds: utcSeconds }) });
  }
  async setLteDestination(url: string) {
    if (!lteDestinationValid(url)) throw new Error("Invalid HTTPS LTE ingestion address");
    await this.send({ command: "lte_set_endpoint", url });
  }
  private async send(payload: Record<string, unknown>) {
    if (!this.active) throw new Error("Connect hardware first");
    if (this.recovering) throw new Error("USB is recovering; wait for a valid telemetry report before sending a command");
    const w = this.port.writable.getWriter();
    try {
      await w.write(
        new TextEncoder().encode(JSON.stringify(payload) + "\n"),
      );
    } finally {
      w.releaseLock();
    }
  }
  async disconnect() {
    this.generation++;
    this.active = false;
    try { await this.reader?.cancel(); } finally { await this.reading; }
  }
}
