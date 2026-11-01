// Keep aligned with firmware/solair-cpe/lte_destination.h; both are tested
// against the same allowed/invalid destination fixtures.
export function lteDestinationValid(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 240 || !value.startsWith("https://")) return false;
  const slash = value.indexOf("/", 8);
  if (slash < 0 || value.slice(slash) !== "/api/ingest") return false;
  const host = value.slice(8, slash), labels = host.split("."), tld = labels.at(-1)!;
  return labels.length > 1 && labels.every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label))
    && /^[a-z]{2,}$/.test(tld) && !["local", "localhost", "internal", "lan"].includes(tld);
}
