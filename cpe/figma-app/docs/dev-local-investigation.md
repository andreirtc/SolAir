# Combined development launcher investigation — 2026-10-08

The cause of the previously reported Vite exit is **not confirmed**. No saved launcher-exit log was found in the project. The existing timing investigation and persistence report do not contain that exit's code or session termination details. The working ports 3001 and 5173 were already occupied and their owners were left alone.

## Evidence before the change

- A diagnostic copy of the original launcher changed only the backend/frontend ports to 13001/15173. It used a paused SQLite file in the OS temporary directory. The original working database was never selected.
- The first tool run failed with esbuild `Access is denied` / config resolution errors inside the filesystem sandbox and exited 1. Repeating outside that sandbox started both services. This establishes an execution-environment restriction in this investigation, not the cause of the earlier incident.
- Closing the diagnostic launcher's piped standard input after five seconds did not stop either service. They remained running until the test terminated the owned launcher at ten seconds. That Windows SIGTERM termination was a forced termination test, not Ctrl+C or proof of graceful cleanup. Both diagnostic ports were subsequently free.
- Installed Vite code registers a standard-input end shutdown handler when CI is not true. Its existence alone does not prove the earlier process consumed EOF or received it. Neither an application crash nor a coding-tool lifecycle cause was reproduced.
- An occupied frontend test port reproduced a concrete launcher defect: the old launcher printed its dashboard/ready announcement before Vite failed with `Port 15173 is already in use`. It then exited 1. The announcement also ignored diagnostic port values. The old launcher had no explicit named frontend exit report; backend initialization exceptions were not wrapped in service-specific reporting.

## Change

`scripts/dev-local.mjs` uses the already installed Vite Node API beside the existing Express backend in the same process. This removes the separate Vite process/session boundary and Windows child-tree shutdown problem. It announces readiness only after both listeners start, labels frontend output, reports service startup/listener errors and code 1, and closes both acquired services on failure or SIGINT/SIGTERM. Vite's normal HTTP-server close during config reload is not treated as a crash. No dependency, telemetry/storage/CSV implementation, thresholds, Vite config, package command or working record was changed.

The optional diagnostic port flags change the combined launcher's loopback listener/proxy/host/origin settings together. Database selection and paused startup retain their existing environment semantics. No port-owner termination or process enumeration is used. Graceful shutdown closes the backend's timers/SSE/storage and Vite's server/watchers; it does not terminate unrelated services. Forced termination of Node by an external tool cannot run graceful JavaScript cleanup.

## Checks actually performed

- `node scripts/check-dev-local.mjs`: ephemeral loopback ports and a unique OS temporary directory; paused startup, frontend dashboard HTTP, proxy latest-state HTTP, selected temporary SQLite path, stdin EOF survival, injected in-process SIGINT shutdown and ability to bind both ports afterward. The harness uses IPC to emit SIGINT, so this automated check is explicitly **not** a real Ctrl+C.
- Invalid temporary SQLite file: backend named error / exit 1, no ready message and both ports free.
- Unpaused startup saved simulated samples to the temporary SQLite file; shutdown released both listeners. The focused suite was rerun after allowing Vite's normal config-reload close event.
- Occupied backend and frontend ports: named error / exit 1, no ready message, sibling listener absent afterward, test-owned conflicting listener still running. No unrelated owner was killed.
- **Actual Ctrl+C:** `npm.cmd run dev:local -- --backend-port 13001 --frontend-port 15173` in a Windows PTY, paused unique temporary SQLite file. Sending the terminal Ctrl+C character produced `Stopping owned services` then `Services stopped`. Answering Y to npm's Windows `Terminate batch job (Y/N)?` prompt finished the terminal command (exit 1 from the interrupted batch). Both ports could be bound afterward. This verifies terminal Ctrl+C separately from signal injection/forced termination; it is not an interactive VS Code UI test.
- Simulation, contract, backend and storage checks passed. These existing checks use temporary databases; the expected failed-write diagnostic occurred in the storage rollback test.
- `npm.cmd run build` passed outside the filesystem sandbox, with the existing bundle-size warning.

No working service was restarted. Browser history/CSV/resume completion was reported by the user, not newly tested by this launcher investigation. Follow the README integrated-terminal procedure for the final user startup check. The completed PWA still needs a short, memorable public URL in a future deployment milestone; no deployment occurred here.
