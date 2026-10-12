import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createDeviceReceiver } from './device-receiver.mjs';
import { createBackend } from './server.mjs';

// Only this opt-in entry exposes the ingestion port; operator APIs stay loopback.
const host = process.env.SOLAIR_DEVICE_HOST;
if (!host || !/^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(host) || host.split('.').some(n => Number(n) > 255)) throw Error('Set SOLAIR_DEVICE_HOST to this PC private LAN IPv4 address.');
const receiver = createDeviceReceiver({ databasePath: resolve('data/device-telemetry.sqlite'), token: readFileSync(resolve('data/device-token.txt'), 'utf8').trim() });
let backend;
try { backend = createBackend({ deviceReceiver: receiver, localDevelopment: true, startPaused: true }); }
catch (error) { receiver.close(); throw error; }
const servers = [backend.app.listen(3001, '127.0.0.1'), receiver.app.listen(3002, host)];
let closed = false;
const close = () => { if (closed) return; closed = true; backend.close(); for (const server of servers) { server.close(); server.closeAllConnections(); } receiver.close(); };
for (const server of servers) server.on('error', error => { console.error(`Hardware demo startup failed: ${error.code}`); process.exitCode = 1; close(); });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, close);
console.log('Hardware demo: dashboard API on loopback port 3001; token-protected ESP32 ingestion on private LAN port 3002.');
