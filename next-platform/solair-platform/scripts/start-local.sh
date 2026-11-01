#!/usr/bin/env bash
set -euo pipefail
task_script="$(readlink -f -- "${BASH_SOURCE[0]}")"
task_root="$(cd -- "$(dirname -- "$task_script")/.." && pwd)"
export PATH="$HOME/.local/bin:$PATH"
cd "$task_root"
if ! command -v node >/dev/null || [[ "$(node -p 'process.versions.node.split(".")[0]')" != 24 ]]; then
  echo 'Node 24 is required. See docs/LOCAL_LAPTOP_SETUP.md.' >&2
  exit 1
fi
if [[ ! -d node_modules ]]; then
  echo 'Run npm ci in the application directory first.' >&2
  exit 1
fi
exec npm run dev
