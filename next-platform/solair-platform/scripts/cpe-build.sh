#!/usr/bin/env bash
set -euo pipefail
task_script="$(readlink -f -- "${BASH_SOURCE[0]}")"
task_root="$(cd -- "$(dirname -- "$task_script")/.." && pwd)"
task_python="$task_root/.tools/cpe-python/bin/python"
task_target="${1:-integrated}"
task_action="${2:-build}"
task_port="${3:-}"
task_firmware="$task_root/firmware/solair-cpe"
export PLATFORMIO_CORE_DIR="$task_root/.tools/platformio"
case "$task_action" in
  build|upload|monitor|ports) ;;
  *) echo 'Usage: cpe-build.sh [target] [build|upload|monitor|ports] [/dev/observed-port]' >&2; exit 2 ;;
esac
if [[ "$task_action" == upload && "$task_target" == compile_all_only ]]; then
  echo 'compile_all_only must never be uploaded.' >&2; exit 2
fi
if [[ "$task_action" == upload || "$task_action" == monitor ]]; then
  if [[ "$task_port" != /dev/* || ! -c "$task_port" ]]; then
    echo 'Supply the observed ESP32 character device under /dev; no port is selected automatically.' >&2; exit 2
  fi
fi
if [[ ! -x "$task_python" ]]; then
  echo 'Missing isolated PlatformIO installation. See docs/LOCAL_LAPTOP_SETUP.md.' >&2; exit 1
fi
if [[ "$task_action" == ports ]]; then
  exec "$task_python" -m serial.tools.list_ports -v
fi
if [[ "$task_action" == monitor ]]; then
  exec "$task_python" -m platformio device monitor --port "$task_port" --baud 115200
fi
if ! "$task_python" - "$task_firmware/platformio.ini" "$task_target" <<'PY'
import configparser, sys
config = configparser.ConfigParser(interpolation=None)
config.read(sys.argv[1])
if 'env:' + sys.argv[2] not in config:
    print('Unknown firmware target. See firmware/solair-cpe/platformio.ini.', file=sys.stderr)
    sys.exit(2)
PY
then exit 2; fi
task_args=(run --project-dir "$task_firmware" -e "$task_target" -j 2)
if [[ "$task_action" == upload ]]; then
  task_args+=(--target upload --upload-port "$task_port")
fi
exec "$task_python" -m platformio "${task_args[@]}"
