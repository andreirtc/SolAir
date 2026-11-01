"""Native temporary tunnel to the device-only listener, with public URL discovery.

No credentials are extracted. Restarting may issue a different address; firmware
2.0.14 can save that replacement through USB without recompilation.
"""
import json
import os
from pathlib import Path
import re
import signal
import subprocess
import tempfile
from datetime import datetime, timezone


def quick_origin(line):
    match = re.search(r"https://([a-z0-9]+(?:-[a-z0-9]+)*\.trycloudflare\.com)(?=[\s|]|$)", line)
    if not match or match[1] == "api.trycloudflare.com":
        return None
    return "https://" + match[1]


def save_origin(folder, origin):
    folder.mkdir(parents=True, exist_ok=True)
    os.chmod(folder, 0o700)
    with tempfile.NamedTemporaryFile(mode="w", dir=folder, delete=False) as f:
        name = Path(f.name)
        json.dump({"url": origin, "provider": "cloudflare-native-quick", "temporary": True,
                   "started_at": datetime.now(timezone.utc).isoformat()}, f)
        f.flush()
        os.fsync(f.fileno())
    try:
        os.chmod(name, 0o600)
        os.replace(name, folder / "quick.json")
    finally:
        name.unlink(missing_ok=True)


def main():
    root = Path(__file__).resolve().parents[1]
    binary = root / ".tools/cloudflared"
    if not binary.is_file():
        raise SystemExit("Missing .tools/cloudflared; restore the existing tool before starting LTE ingress.")
    protocol = os.environ.get("SOLAIR_TUNNEL_PROTOCOL", "http2")
    if protocol not in {"http2", "quic", "auto"}:
        raise SystemExit("Invalid SOLAIR_TUNNEL_PROTOCOL")
    command = [str(binary), "tunnel", "--config", "/dev/null", "--protocol", protocol,
               "--edge-ip-version", "4", "--no-autoupdate", "--url", "http://127.0.0.1:3003"]
    print("Starting temporary device-only ingress. Keep app3000 and ingress3003 running.", flush=True)
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
    def stop(_signal, _frame):
        raise KeyboardInterrupt
    signal.signal(signal.SIGTERM, stop)
    signal.signal(signal.SIGHUP, stop)
    announced = False
    try:
        for line in process.stdout:
            print(line, end="", flush=True)
            if "Your quick Tunnel has been created" in line:
                announced = True
            origin = quick_origin(line) if announced else None
            if origin:
                save_origin(root / ".tools/lte-tunnel-runtime", origin)
                announced = False
                print("Public address recorded. CPE Lab verifies reachability before offering USB address update.", flush=True)
        return process.wait()
    except KeyboardInterrupt:
        return 130
    finally:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == "__main__":
    raise SystemExit(main())
