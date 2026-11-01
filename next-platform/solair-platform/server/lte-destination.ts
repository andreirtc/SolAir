import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { lteDestinationValid } from "../packages/telemetry-contract/lte-destination";

export type LteDestination = { url: string; reachable: true; temporary: boolean; checked_at: string };

function destinationReader(
  readUrl: () => Promise<string>,
  temporary: boolean,
  request: typeof fetch = fetch,
) {
  let cached: { expires: number; result: Promise<LteDestination> } | undefined;
  return async (): Promise<LteDestination> => {
    if (cached && cached.expires > Date.now()) return cached.result;
    const result = (async (): Promise<LteDestination> => {
      const url = await readUrl();
      if (!lteDestinationValid(url)) throw new Error("Invalid LTE destination configuration");
      // No credentials or telemetry. 401 from the ingestion listener confirms
      // reachability. Never follow redirects to send a device elsewhere.
      const response = await request(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", redirect: "error", signal: AbortSignal.timeout(5000) });
      await response.body?.cancel();
      if (response.status !== 401) throw new Error("LTE destination is unavailable");
      return { url, reachable: true, temporary, checked_at: new Date().toISOString() };
    })();
    cached = { expires: Date.now() + 10000, result };
    return result;
  };
}

export function benchDestinationReader(
  statePath = resolve(".tools/lte-tunnel-runtime/quick.json"),
  request: typeof fetch = fetch,
) {
  return destinationReader(async () => {
    const state = JSON.parse(await readFile(statePath, "utf8"));
    return typeof state.url === "string" ? state.url + "/api/ingest" : "";
  }, true, request);
}

// Explicit device origin wins over the website origin for deployments with a
// dedicated ingestion domain. Never derive destinations from request headers.
export function lteDestinationFromEnvironment(
  production: boolean,
  env: Readonly<Record<string, string | undefined>> = process.env,
  request: typeof fetch = fetch,
): (() => Promise<LteDestination>) | undefined {
  const url = env.SOLAIR_DEVICE_INGEST_URL ??
    (env.SOLAIR_PUBLIC_URL ? env.SOLAIR_PUBLIC_URL + "/api/ingest" : undefined);
  if (url !== undefined) {
    if (!lteDestinationValid(url)) throw new Error("Invalid configured HTTPS device ingestion URL");
    return destinationReader(async () => url, false, request);
  }
  return production ? undefined : benchDestinationReader(undefined, request);
}
