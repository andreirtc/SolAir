import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {Store} from '../server/db';
import {PostgresTestStore} from './postgres-store';
import {seed} from '../server/seed';
import {createApp} from '../server/app';
import {passwordHash} from '../server/auth';
import type {IdentityProvider} from '../server/identity';
import {SupabaseIdentity} from '../server/identity';

async function fixture(fn:(f:any)=>Promise<void>,provider?:(db:Store)=>IdentityProvider){
 const db=process.env.SOLAIR_TEST_POSTGRES==='1'?new PostgresTestStore():new Store(':memory:');await db.migrate();await seed(db);
 const server=createServer(createApp(db,false,provider?.(db)||null));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${(server.address() as {port:number}).port}`;
 const cookies:Record<string,string>={};
 async function request(path:string,actor='',body?:unknown,method=body===undefined?'GET':'POST'){
  const response=await fetch(base+'/api'+path,{method,headers:{Cookie:cookies[actor]||'','Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
  return {status:response.status,body:response.headers.get('content-type')?.includes('json')?await response.json():await response.text()};
 }
 async function login(id:string){const response=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:id+'@solair.local',password:'SolairDemo!2026'})});await response.text();if(response.ok)cookies[id]=response.headers.get('set-cookie')!.split(';')[0];return response.status;}
 async function person(id:string,role='driver'){await db.run('INSERT INTO profiles(id,org_id,email,name,role,password_hash) VALUES(?,?,?,?,?,?)',[id,'manila',id+'@solair.local','TEST FIXTURE '+id,role,passwordHash('SolairDemo!2026')]);}
 try{await fn({db,base,cookies,request,login,person});}finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));await db.close();}
}
const confirmation=(id:string)=>({confirmation_email:id+'@solair.local',reason:'TEST FIXTURE account lifecycle review'});

test('Provider deletion accepts only explicit success or a verified user-not-found response',async()=>{
 const original=globalThis.fetch;
 const provider=new SupabaseIdentity('https://fixture.invalid','fixture-anon','fixture-service','https://fixture.invalid');
 try{
  globalThis.fetch=async()=>new Response(JSON.stringify({msg:'Not found'}),{status:404,headers:{'Content-Type':'application/json'}});
  await assert.rejects(provider.removeUser('00000000-0000-0000-0000-000000000001'),/could not be confirmed/);
  globalThis.fetch=async()=>new Response(JSON.stringify({error_code:'user_not_found',msg:'User not found'}),{status:404,headers:{'Content-Type':'application/json'}});
  await provider.removeUser('00000000-0000-0000-0000-000000000001');
  globalThis.fetch=async()=>new Response(JSON.stringify({msg:'Denied'}),{status:403,headers:{'Content-Type':'application/json'}});
  await assert.rejects(provider.removeUser('00000000-0000-0000-0000-000000000001'),/could not be confirmed/);
 }finally{globalThis.fetch=original;}
});

test('Only admins can change lifecycle state; self-removal and incorrect confirmation are rejected',async()=>fixture(async({request,login,person})=>{
 for(const role of ['admin','operator','engineer','driver'])assert.equal(await login(role),200);
 for(const role of ['','operator','engineer','driver']){
  assert.equal((await request('/admin/people/driver/status',role,{...confirmation('driver'),active:false})).status,role?403:401);
  assert.equal((await request('/admin/people/driver',role,confirmation('driver'),'DELETE')).status,role?403:401);
 }
 assert.equal((await request('/admin/people/admin/status','admin',{...confirmation('admin'),active:false})).status,403);
 assert.equal((await request('/admin/people/admin','admin',confirmation('admin'),'DELETE')).status,403);
 assert.equal((await request('/admin/people/driver/status','admin',{...confirmation('operator'),active:false})).status,409);
 assert.equal((await request('/admin/people/driver','admin',confirmation('driver'),'DELETE')).status,409);
 await person('protected-admin','admin');assert.equal((await request('/users/protected-admin','admin',{name:'TEST FIXTURE protected',role:'driver'},'PATCH')).status,403);
}));

test('Deactivation revokes sessions/streams and assignments, preserves history, and reactivation requires new sign-in',async()=>fixture(async({db,base,cookies,request,login})=>{
 await login('admin');await login('driver');
 await db.run('INSERT INTO messages VALUES(?,?,?,?,?,?,?,?)',['lifecycle-message','manila','ET-01','driver','hardware','TEST FIXTURE retained message',new Date().toISOString(),null]);
 const response=await fetch(base+'/api/events',{headers:{Cookie:cookies.driver}}),reader=response.body!.getReader();await reader.read();
 assert.equal((await request('/admin/people/driver/status','admin',{...confirmation('driver'),active:false})).status,200);
 const timer=setTimeout(()=>void reader.cancel(),2000);const ended=await reader.read();clearTimeout(timer);assert.equal(ended.done,true);
 assert.equal((await request('/me','driver')).status,401);assert.equal(await login('driver'),403);
 assert.equal((await db.query("SELECT * FROM assignments WHERE driver_id='driver'")).length,0);
 assert.equal((await db.query("SELECT * FROM messages WHERE id='lifecycle-message'")).length,1);
 assert.ok(!(await request('/users','admin')).body.some((p:any)=>p.id==='driver'));
 assert.equal((await request('/assign','admin',{vehicle_id:'ET-01',driver_id:'driver'})).status,409);
 assert.equal((await request('/users/driver','admin',{name:'TEST FIXTURE inactive',role:'driver'},'PATCH')).status,409);
 assert.ok((await request('/people?status=inactive','admin')).body.items.some((p:any)=>p.id==='driver'&&!p.active));
 const removal=await request('/admin/people/driver','admin',confirmation('driver'),'DELETE');assert.equal(removal.status,409);assert.match(removal.body.error,/operational history/);
 assert.equal((await request('/admin/people/driver/status','admin',{...confirmation('driver'),active:true})).status,200);
 assert.equal((await request('/me','driver')).status,401);assert.equal(await login('driver'),200);
 assert.equal((await db.query("SELECT * FROM assignments WHERE driver_id='driver'")).length,0);
}));

test('Permanent deletion removes unused credentials/preferences while retaining searchable admin evidence',async()=>fixture(async({db,request,login,person})=>{
 await login('admin');await person('unused');await login('unused');
 await db.run('INSERT INTO contact_preferences(user_id,phone_e164,updated_at) VALUES(?,?,?)',['unused','+639171234567',new Date().toISOString()]);
 await db.run('INSERT INTO profile_registration VALUES(?,?,?)',['unused','BEMAC','TEST FIXTURE unused']);
 await db.run('INSERT INTO invitations VALUES(?,?,?,?,?,?,?)',['obsolete-invite','manila','unused@solair.local','driver','not-a-valid-token',new Date(Date.now()+60000).toISOString(),0]);
 assert.equal((await request('/admin/people/unused/status','admin',{...confirmation('unused'),active:false})).status,200);
 assert.equal((await request('/admin/people/unused','admin',confirmation('unused'),'DELETE')).status,200);
 for(const table of ['profiles','account_states','contact_preferences','profile_registration'])assert.equal((await db.query(`SELECT * FROM ${table} WHERE ${table==='profiles'?'id':'user_id'}=?`,['unused'])).length,0);
 assert.equal((await db.query("SELECT * FROM invitations WHERE email='unused@solair.local'")).length,0);
 assert.equal((await request('/me','unused')).status,401);assert.equal(await login('unused'),401);
 const activity=(await request('/admin/activity?category=accounts&q=unused','admin')).body.items;
 assert.ok(activity.some((row:any)=>row.action==='account_deleted'&&row.description.includes('unused@solair.local')));
 assert.ok((await db.query("SELECT * FROM audit_logs WHERE action='sign_in' AND target='unused' AND user_id IS NULL")).length>0);
 assert.ok((await request('/admin/activity?category=signins&q=unused','admin')).body.items.some((row:any)=>row.actor==='Former account'));
}));

test('Concurrent administrator removal cannot eliminate every active administrator',async()=>fixture(async({db,request,login,person})=>{
 await person('second-admin','admin');await login('admin');await login('second-admin');
 const results=await Promise.all([request('/admin/people/second-admin/status','admin',{...confirmation('second-admin'),active:false}),request('/admin/people/admin/status','second-admin',{...confirmation('admin'),active:false})]);
 assert.equal(results.filter(result=>result.status===200).length,1);
 const [count]=await db.query("SELECT COUNT(*) AS total FROM profiles p LEFT JOIN account_states s ON s.user_id=p.id WHERE p.role='admin' AND COALESCE(s.active,1)=1");assert.equal(Number(count.total),1);
}));

test('Provider failures keep deletion pending and blocked from reactivation; retry safely finishes cleanup',async()=>{
 let fail=true,calls=0;
 await fixture(async({db,request,login,person})=>{
  await person('provider-user');await login('admin');
  assert.equal((await request('/admin/people/provider-user/status','admin',{...confirmation('provider-user'),active:false})).status,200);
  assert.equal((await request('/admin/people/provider-user','admin',confirmation('provider-user'),'DELETE')).status,502);
  assert.equal((await db.query("SELECT * FROM account_states WHERE user_id='provider-user'"))[0].deletion_pending,1);
  assert.equal((await request('/admin/people/provider-user/status','admin',{...confirmation('provider-user'),active:true})).status,409);
  assert.equal(await login('provider-user'),403);fail=false;
  assert.equal((await request('/admin/people/provider-user','admin',confirmation('provider-user'),'DELETE')).status,200);assert.equal(calls,2);
 },db=>({name:'supabase',authenticate:async(email:string)=>{const [p]=await db.query('SELECT id FROM profiles WHERE email=?',[email]);return p?.id||null;},createUser:async()=>{throw new Error('Not used');},removeUser:async()=>{calls++;if(fail)throw new Error('TEST FIXTURE provider unavailable');}}));
});
