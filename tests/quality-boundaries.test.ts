import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {gzipSync} from 'node:zlib';
import {randomUUID} from 'node:crypto';
import {seed} from '../server/seed';
import {PostgresTestStore} from './postgres-store';
import {Store} from '../server/db';
import {createApp} from '../server/app';
import {databaseReady} from '../server/readiness';

async function fixture(run: (base: string, db: Store) => Promise<void>) {
 const db = process.env.SOLAIR_TEST_POSTGRES === '1' ? new PostgresTestStore() : new Store(':memory:'); await db.migrate();
 const server = createServer(createApp(db));
 try {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); assert(address && typeof address !== 'string');
  await run(`http://127.0.0.1:${address.port}`, db);
 } finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); await db.close(); }
}

test('Readiness reflects database failure and recovery without leaking exception details', async () => {
 await fixture(async (base, db) => {
  assert.equal((await fetch(base + '/api/health')).status, 200);
  const query = db.query.bind(db);
  db.query = async () => { throw new Error('TEST FIXTURE private connection details'); };
  const failed = await fetch(base + '/api/health'); assert.equal(failed.status, 503);
  const body = await failed.text(); assert(!body.includes('private connection')); assert.equal(JSON.parse(body).database_status, 'unavailable');
  db.query = query;
  const recovered = await fetch(base + '/api/health'); assert.equal(recovered.status, 200); assert.equal((await recovered.json()).database_status, 'reachable');
 });
});

test('Concurrent health timeouts share one database probe and can recover', async () => {
 let calls = 0, release: (() => void) | undefined;
 const waiting = new Promise<void>(resolve => { release = resolve; });
 const db: Pick<Store, 'query'> = {query: async () => { calls++; await waiting; return [{ready: 1}]; }};
 assert.deepEqual(await Promise.all([databaseReady(db, 10), databaseReady(db, 10), databaseReady(db, 10)]), [false, false, false]);
 assert.equal(calls, 1); release!();
 assert.equal(await databaseReady(db, 100), true);
});

test('IPv4 and IPv4-mapped IPv6 representations share the login rate limit', async () => {
 await fixture(async base => {
  for (let i = 0; i < 10; i++) {
   const response = await fetch(base + '/api/login', {method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':i % 2 ? '::ffff:203.0.113.7' : '203.0.113.7'},body:JSON.stringify({email:'missing@test.invalid',password:'TEST FIXTURE invalid'})});
   assert.equal(response.status, 401);
  }
  for (const ip of ['203.0.113.7','::ffff:203.0.113.7']) {
   const response = await fetch(base + '/api/login', {method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':ip},body:JSON.stringify({email:'missing@test.invalid',password:'TEST FIXTURE invalid'})});
   assert.equal(response.status, 429);
  }
 });
});

test('Oversized and unsupported-encoding requests produce bounded client errors', async () => {
 await fixture(async base => {
  const oversized = await fetch(base + '/api/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({padding:'x'.repeat(100000)})});
  assert.equal(oversized.status, 413); assert.deepEqual(await oversized.json(), {error:'Request is too large'});
  const unsupported = await fetch(base + '/api/login', {method:'POST',headers:{'Content-Type':'application/json','Content-Encoding':'not-supported'},body:'{}'});
  assert.equal(unsupported.status, 415); assert.deepEqual(await unsupported.json(), {error:'Unsupported request encoding'});
  assert.equal((await fetch(base + '/api/health')).status, 200);
 });
});

test('Trailing bytes on a gzip request cannot crash the API or expose parser details', async () => {
 await fixture(async base => {
  const compressed = Buffer.concat([gzipSync(JSON.stringify({email:'missing@test.invalid',password:'TEST FIXTURE invalid'})), Buffer.from('invalid trailing bytes')]);
  const response = await fetch(base + '/api/login', {method:'POST',headers:{'Content-Type':'application/json','Content-Encoding':'gzip'},body:compressed});
  assert([400, 401].includes(response.status)); assert(!/stack|Z_DATA_ERROR|node_modules/.test(await response.text()));
  assert.equal((await fetch(base + '/api/health')).status, 200);
 });
});

test('Assistance replay preserves the original receipt/status and rejects conflicting identities', async () => {
 await fixture(async (base, db) => {
  await seed(db);
  const login=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'driver@solair.local',password:'SolairDemo!2026'})});assert.equal(login.status,200);
  const cookie=login.headers.get('set-cookie')!.split(';')[0];
  const [assignment]=await db.query('SELECT vehicle_id FROM assignments WHERE driver_id=?',['driver']);
  const body={id:randomUUID(),vehicle_id:assignment.vehicle_id,type:'Mechanical assistance',notes:'TEST FIXTURE original details'};
  const send=(payload:unknown,mode='hardware')=>fetch(base+'/api/help?mode='+mode,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(payload)});
  const first=await send(body);assert.equal(first.status,201);const receipt=await first.json();
  await db.run('UPDATE help_requests SET status=? WHERE id=?',['acknowledged',body.id]);
  const replay=await send(body);assert.equal(replay.status,201);const repeated=await replay.json();assert.equal(repeated.server_received_at,receipt.server_received_at);assert.equal(repeated.status,'acknowledged');
  assert.equal((await send({...body,notes:'TEST FIXTURE changed details'})).status,409);
  assert.equal((await send(body,'demo')).status,409);
  const rows=await db.query('SELECT notes FROM help_requests WHERE id=?',[body.id]);assert.equal(rows.length,1);assert.equal(rows[0].notes,body.notes);
 });
});
