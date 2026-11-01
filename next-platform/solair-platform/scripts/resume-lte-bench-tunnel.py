"""Compatibility entry point: start native quick-tunnel lifecycle and record its URL.

A temporary hostname cannot be promised after shutdown. Historical private state
is retained; stale credentials are not replayed as a named tunnel. Firmware
2.0.14 can save the new public address through CPE Lab over USB.
"""
from pathlib import Path
import runpy

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).with_name("start-lte-bench-tunnel.py")), run_name="__main__")
