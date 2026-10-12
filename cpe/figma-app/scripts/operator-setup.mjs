import { createInterface } from 'node:readline/promises';
import { openAuthStorage, validUsername } from '../backend/auth.mjs';
import { demoTelemetry } from '../src/app/data/demoTelemetry.ts';

const action = process.argv[2];
if (!['create', 'reset'].includes(action) || process.argv.length !== 3) throw new Error('Use npm.cmd run operator:create or operator:reset; no credential arguments.');
if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error('Private setup requires an interactive terminal.');
const terminal = createInterface({ input: process.stdin, output: process.stdout });
const username = (await terminal.question('Operator username (case-sensitive): ')).trim();
terminal.close();
if (!validUsername(username)) throw new Error('Use 1–64 letters, digits, underscore, dot, @ or hyphen.');

function privatePassword(prompt) {
  process.stdout.write(prompt);
  process.stdin.setEncoding('utf8');
  process.stdin.setRawMode(true); process.stdin.resume();
  return new Promise((resolve, reject) => {
    let value = '', oversized = false;
    const finish = () => { process.stdin.off('data', read); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write('\n'); };
    const read = chunk => {
      for (const char of chunk.toString('utf8')) {
        if (char === '\u0003') { finish(); reject(new Error('Cancelled.')); return; }
        if (char === '\r' || char === '\n') { finish(); if (oversized) reject(new Error('Password exceeds 256 UTF-8 bytes. No account changed.')); else resolve(value); return; }
        if (char === '\u007f' || char === '\b') value = Array.from(value).slice(0, -1).join('');
        else if (char >= ' ') { if (Buffer.byteLength(value + char) <= 256) value += char; else oversized = true; }
      }
    };
    process.stdin.on('data', read);
  });
}
let auth;
try {
  const password = await privatePassword('Password (hidden, minimum 15 characters): ');
  const confirmation = await privatePassword('Confirm password (hidden): ');
  if (password !== confirmation) throw new Error('Passwords do not match. No account changed.');
  auth = openAuthStorage();
  if (action === 'create') await auth.create(username, password, demoTelemetry.deviceId);
  else await auth.reset(username, password);
  console.log(action === 'create' ? `Operator created and assigned to ${demoTelemetry.deviceId}.` : 'Password reset. All previous sessions invalidated.');
} catch (error) { console.error(error.code?.startsWith('SQLITE') ? 'Account operation failed. Check username and database access.' : error.message); process.exitCode = 1; }
finally { auth?.close(); }
