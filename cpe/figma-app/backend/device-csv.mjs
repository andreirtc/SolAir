// Real v2 storage has its own export; never use the v1 simulator CSV serializer.
export const deviceCsvColumns = ['recordId', 'eventId', 'deviceId', 'firmwareVersion', 'sessionId', 'sequence', 'messageType', 'eventType', 'sampledAtUtc', 'clockSynchronized', 'receivedAtUtc', 'uptimeMs', 'securityState', 'accelerationX_Mps2', 'accelerationY_Mps2', 'accelerationZ_Mps2', 'angularVelocityX_RadPerSec', 'angularVelocityY_RadPerSec', 'angularVelocityZ_RadPerSec', 'imuStatus', 'imuFaultCode', 'lidState', 'mountState', 'switchStatus', 'switchFaultCode', 'source', 'provenance', 'delivery', 'acceptedRetryCount', 'lastRetryAtUtc'];
const cell = value => {
  let text = value === null || value === undefined ? '' : String(value);
  // Spreadsheet formula injection protection, including leading whitespace.
  if (typeof value === 'string' && /^\s*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
};
export function deviceCsv(records) {
  return [deviceCsvColumns.join(','), ...records.map(r => {
    const m = r.message, a = m.accelerationMps2, g = m.angularVelocityRadPerSec;
    const fields = { ...m, recordId: r.id, eventId: r.eventId, receivedAtUtc: r.receivedAtUtc, provenance: r.provenance, delivery: r.delivery, acceptedRetryCount: r.acceptedRetryCount, lastRetryAtUtc: r.lastRetryAtUtc,
      accelerationX_Mps2: a?.x, accelerationY_Mps2: a?.y, accelerationZ_Mps2: a?.z,
      angularVelocityX_RadPerSec: g?.x, angularVelocityY_RadPerSec: g?.y, angularVelocityZ_RadPerSec: g?.z };
    return deviceCsvColumns.map(k => cell(fields[k])).join(',');
  })].join('\r\n') + '\r\n';
}
