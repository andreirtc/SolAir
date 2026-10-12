import session from 'express-session';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
export const authStoragePath = path => path === ':memory:' ? path : resolve(root, path || process.env.SOLAIR_AUTH_DB_PATH || 'data/auth.sqlite');
export const sessionLifetime = 8 * 60 * 60 * 1000;
const derive = promisify(scrypt);
const parameters = { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 };
export const validUsername = value => typeof value === 'string' && /^[A-Za-z0-9_.@-]{1,64}$/.test(value);
export const validPassword = value => typeof value === 'string' && value.length >= 15 && Buffer.byteLength(value) <= 256;
export async function hashPassword(password) {
  if (!validPassword(password)) throw new Error('Password must contain at least 15 characters and at most 256 UTF-8 bytes.');
  const salt = randomBytes(16).toString('hex');
  return `scrypt-v1:${salt}:${(await derive(password, salt, 64, parameters)).toString('hex')}`;
}
async function verify(password, encoded) {
  const [, salt, key] = encoded.split(':');
  const actual = await derive(password, salt, 64, parameters);
  return timingSafeEqual(actual, Buffer.from(key, 'hex'));
}

export function openAuthStorage(path = process.env.SOLAIR_AUTH_DB_PATH || 'data/auth.sqlite', now = Date.now) {
  path = authStoragePath(path);
  if (path !== ':memory:') {
    const fromRoot = relative(root, path), fromData = relative(resolve(root, 'data'), path);
    if (!fromRoot.startsWith('..') && !isAbsolute(fromRoot) && (fromData.startsWith('..') || isAbsolute(fromData) || !fromData)) throw new Error('Project-local auth databases must be under data/.');
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path, { timeout: 2000 });
  try {
    if (db.prepare('PRAGMA user_version').get().user_version > 1) throw new Error('Unsupported authentication schema.');
    db.exec(`PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
      CREATE TABLE IF NOT EXISTS operators (id INTEGER PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, device_id TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1) STRICT;
      CREATE TABLE IF NOT EXISTS sessions (sid TEXT PRIMARY KEY, expires INTEGER NOT NULL, value TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL) STRICT;
      CREATE TABLE IF NOT EXISTS attempts (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL) STRICT;
      PRAGMA user_version=1;`);
    db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('session-secret', randomBytes(32).toString('hex'));
    db.prepare('INSERT OR IGNORE INTO settings VALUES (?,?)').run('dummy-hash', `scrypt-v1:${randomBytes(16).toString('hex')}:${randomBytes(64).toString('hex')}`);
  } catch (error) { db.close(); throw error; }
  const operator = id => db.prepare('SELECT id,username,device_id,revision FROM operators WHERE id=?').get(id);
  const read = sid => {
    const row = db.prepare('SELECT value FROM sessions WHERE sid=? AND expires>?').get(sid, now());
    if (!row) return null;
    const value = JSON.parse(row.value);
    if (value.operatorId) {
      const account = operator(value.operatorId);
      if (!account || account.revision !== value.revision || value.expiresAt <= now()) return null;
    }
    return value;
  };
  class SQLiteSessions extends session.Store {
    get(sid, callback) { try { callback(null, read(sid)); } catch (error) { callback(error); } }
    set(sid, value, callback = () => {}) {
      try {
        // Never resurrect a revoked account revision or extend absolute expiry.
        if (value.operatorId && (!operator(value.operatorId) || operator(value.operatorId).revision !== value.revision)) return callback();
        db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());
        db.prepare('INSERT OR REPLACE INTO sessions VALUES (?,?,?)').run(sid, value.expiresAt ?? now() + 10 * 60 * 1000, JSON.stringify(value)); callback();
      } catch (error) { callback(error); }
    }
    destroy(sid, callback = () => {}) { try { db.prepare('DELETE FROM sessions WHERE sid=?').run(sid); callback(); } catch (error) { callback(error); } }
    touch(_sid, _value, callback = () => {}) { callback(); }
  }
  return {
    path, store: new SQLiteSessions(), read, operator,
    secret: db.prepare('SELECT value FROM settings WHERE key=?').get('session-secret').value,
    async create(username, password, deviceId) {
      if (!validUsername(username) || typeof deviceId !== 'string' || !deviceId.length || deviceId.length > 128) throw new Error('Invalid username or device assignment.');
      const hash = await hashPassword(password);
      db.prepare('INSERT INTO operators(username,password_hash,device_id) VALUES (?,?,?)').run(username, hash, deviceId);
    },
    async reset(username, password) {
      const hash = await hashPassword(password);
      db.exec('BEGIN IMMEDIATE');
      try {
        const account = db.prepare('SELECT id FROM operators WHERE username=?').get(username);
        if (!account) throw new Error('Operator does not exist.');
        db.prepare('UPDATE operators SET password_hash=?,revision=revision+1 WHERE id=?').run(hash, account.id);
        db.prepare("DELETE FROM sessions WHERE json_extract(value,'$.operatorId')=?").run(account.id);
        db.exec('COMMIT');
      } catch (error) { db.exec('ROLLBACK'); throw error; }
    },
    async authenticate(username, password) {
      const account = db.prepare('SELECT * FROM operators WHERE username=?').get(username);
      const hash = account?.password_hash ?? db.prepare('SELECT value FROM settings WHERE key=?').get('dummy-hash').value;
      const matches = await verify(password, hash);
      const current = account ? operator(account.id) : null;
      // A reset during asynchronous hashing must not accept the old password.
      return matches && current?.revision === account?.revision ? current : null;
    },
    throttle(key) {
      db.prepare('DELETE FROM attempts WHERE expires<=?').run(now());
      db.prepare('INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key, now() + 15 * 60 * 1000);
      return db.prepare('SELECT count FROM attempts WHERE key=?').get(key).count > 10;
    },
    close() { if (db.isOpen) db.close(); },
  };
}

export function installAuth(app, { auth, origin, localDevelopment = false, now = Date.now, lifetime = sessionLifetime }) {
  const secure = !localDevelopment;
  if (localDevelopment && (!/^http:\/\/127\.0\.0\.1:\d+$/.test(origin) || process.env.NODE_ENV === 'production')) throw new Error('HTTP sessions require explicit loopback development.');
  const cookie = { httpOnly: true, sameSite: 'strict', secure, path: '/api', maxAge: lifetime };
  app.use('/api', session({ name: 'solair.sid', secret: auth.secret, store: auth.store, resave: false, saveUninitialized: false, rolling: false, cookie }));
  const csrf = (req, res, next) => {
    if (req.headers.origin !== origin || !req.session.csrf || req.headers['x-csrf-token'] !== req.session.csrf) return res.status(403).json({ error: 'Request verification failed. Refresh and retry.' });
    next();
  };
  const identity = req => {
    const value = auth.read(req.sessionID);
    return value?.operatorId ? auth.operator(value.operatorId) : null;
  };
  app.get('/api/auth/session', (req, res) => {
    req.session.csrf ??= randomBytes(32).toString('hex');
    const account = identity(req);
    res.json({ authenticated: !!account, username: account?.username, deviceId: account?.device_id, expiresAt: account ? req.session.expiresAt : null, csrfToken: req.session.csrf });
  });
  let passwordChecks = 0;
  app.post('/api/auth/login', csrf, async (req, res) => {
    if (secure && !req.secure) return res.status(403).json({ error: 'HTTPS required.' });
    if (auth.throttle(`ip:${req.socket.remoteAddress}`)) { res.set('Retry-After', '900'); return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }); }
    const { username, password } = req.body ?? {};
    if (!validUsername(username) || typeof password !== 'string' || !password.length || Buffer.byteLength(password) > 256) return res.status(401).json({ error: 'Invalid username or password.' });
    if (auth.throttle(`user:${username}`)) { res.set('Retry-After', '900'); return res.status(429).json({ error: 'Too many sign-in attempts. Try again in 15 minutes.' }); }
    if (passwordChecks >= 2) return res.status(429).json({ error: 'Sign-in is busy. Please retry shortly.' });
    passwordChecks++;
    let account;
    try { account = await auth.authenticate(username, password); } finally { passwordChecks--; }
    if (!account) return res.status(401).json({ error: 'Invalid username or password.' });
    await new Promise((resolve, reject) => req.session.regenerate(error => error ? reject(error) : resolve()));
    Object.assign(req.session, { operatorId: account.id, revision: account.revision, expiresAt: now() + lifetime, csrf: randomBytes(32).toString('hex') });
    await new Promise((resolve, reject) => req.session.save(error => error ? reject(error) : resolve()));
    res.json({ authenticated: true, username: account.username, deviceId: account.device_id, expiresAt: req.session.expiresAt, csrfToken: req.session.csrf });
  });
  app.post('/api/auth/logout', csrf, async (req, res) => {
    await new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
    res.clearCookie('solair.sid', { ...cookie, maxAge: undefined }); res.json({ ok: true });
  });
  const requireDevice = deviceId => (req, res, next) => {
    const account = identity(req);
    if (!account) return res.status(401).json({ error: 'Sign in required.', code: 'AUTH_REQUIRED' });
    if (account.device_id !== deviceId) return res.status(403).json({ error: 'Device access denied.', code: 'DEVICE_DENIED' });
    req.deviceId = account.device_id; next();
  };
  return { csrf, requireDevice, canStream(sid, deviceId) { const value = auth.read(sid); return !!value?.operatorId && auth.operator(value.operatorId)?.device_id === deviceId; } };
}
