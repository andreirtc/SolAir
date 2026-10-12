import { NDJSONParser, type Telemetry } from "../packages/telemetry-contract";
export class SerialBench {
  port: any;
  reader: any;
  writer: any;
  active = false;
  async connect(
    baud: number,
    onData: (t: Telemetry) => void,
    onError: (s: string) => void,
    onClose: () => void,
  ) {
    const serial = (navigator as any).serial;
    if (!serial)
      throw new Error(
        "Web Serial requires Chrome or Edge on desktop with HTTPS or localhost. Use Wi-Fi ingest as a fallback.",
      );
    this.port = await serial.requestPort();
    await this.port.open({ baudRate: baud });
    this.active = true;
    const parser = new NDJSONParser(onData, onError);
    this.reader = this.port.readable.getReader();
    const decoder = new TextDecoder();
    void (async () => {
      try {
        while (this.active) {
          const { value, done } = await this.reader.read();
          if (done) break;
          parser.feed(decoder.decode(value, { stream: true }));
        }
      } catch {
        onError("Serial disconnected");
      } finally {
        this.active = false;
        this.reader.releaseLock();
        onClose();
      }
    })();
  }
  async command(command: string) {
    if (!this.active) throw new Error("Connect hardware first");
    const w = this.port.writable.getWriter();
    try {
      await w.write(
        new TextEncoder().encode(JSON.stringify({ command }) + "\n"),
      );
    } finally {
      w.releaseLock();
    }
  }
  async disconnect() {
    this.active = false;
    await this.reader?.cancel();
    await this.port?.close();
  }
}
