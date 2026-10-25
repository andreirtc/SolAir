import {before,after,test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer,type Server} from 'node:http';
import {readFileSync} from 'node:fs';
import {Store} from '../server/db';
import {seed} from '../server/seed';
import {createApp} from '../server/app';
import {decodeProfilePhoto} from '../server/profile-photos';
const png=readFileSync('public/icon-192.png'),replacement=readFileSync('public/icon-512.png');
let db:Store,server:Server,base:string,driverCookie:string,operatorCookie:string;
async function login(email:string){const r=await fetch(base+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'SolairDemo!2026'})});assert.equal(r.status,200);return r.headers.get('set-cookie')!.split(';')[0];}
const request=(path:string,cookie='',method='GET',body?:unknown)=>fetch(base+path,{method,headers:{...(cookie?{Cookie:cookie}:{}),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
before(async()=>{db=new Store(':memory:');await db.migrate();await db.migrate();await seed(db);server=createServer(createApp(db));await new Promise<void>(resolve=>server.listen(0,'127.0.0.1',resolve));const address=server.address();assert(address&&typeof address!=='string');base='http://127.0.0.1:'+address.port;driverCookie=await login('driver@solair.local');operatorCookie=await login('operator@solair.local');});
after(async()=>{server?.closeAllConnections();if(server)await new Promise<void>(resolve=>server.close(()=>resolve()));await db?.close();});
test('Photo validation accepts PNG and rejects disguised, malformed, oversized or redirected uploads',()=>{
 assert.deepEqual(decodeProfilePhoto({filename:'photo.png',mime:'image/png',base64:png.toString('base64')}).bytes,png);
 assert.deepEqual(decodeProfilePhoto({filename:'photo.img',mime:'image/png',base64:png.toString('base64')}).bytes,png);
 for(const filename of ['photo.jpg','photo.webp','photo.gif','photo.png.exe'])assert.throws(()=>decodeProfilePhoto({filename,mime:'image/png',base64:png.toString('base64')}));
 for(const value of [{filename:'photo.png',mime:'image/svg+xml',base64:Buffer.from('<svg/>').toString('base64')},{filename:'photo.png',mime:'image/png',base64:Buffer.from('<script/>').toString('base64')},{filename:'photo.png',mime:'image/jpeg',base64:png.toString('base64')},{filename:'photo.png',mime:'image/png',base64:png.toString('base64')+'!!!'},{filename:'photo.png',mime:'image/png',base64:Buffer.alloc(3000001).toString('base64')},{filename:'photo.png',mime:'image/png',base64:png.toString('base64'),user_id:'operator'}])assert.throws(()=>decodeProfilePhoto(value));
});
test('Photo routes require authentication',async()=>{for(const method of ['GET','POST','DELETE'])assert.equal((await request('/api/profile-photo','',method,method==='POST'?{filename:'photo.png',mime:'image/png',base64:png.toString('base64')}:undefined)).status,401);});
test('A driver can save, retrieve, replace and persist a private photo across sign-ins',async()=>{
 const uploaded=await request('/api/profile-photo',driverCookie,'POST',{filename:'photo.png',mime:'image/png',base64:png.toString('base64')});assert.equal(uploaded.status,200);const first=await uploaded.json();assert.match(first.avatar_url,/^\/api\/profile-photo\?v=/);
 const image=await request(first.avatar_url,driverCookie);assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/png');assert.match(image.headers.get('cache-control')! ,/private.*no-store/);assert.deepEqual(Buffer.from(new Uint8Array(await image.arrayBuffer())),png);
 driverCookie=await login('driver@solair.local');assert.equal((await request('/api/me',driverCookie).then(r=>r.json())).avatar_url,first.avatar_url);
 await new Promise(r=>setTimeout(r,2));const replaced=await request('/api/profile-photo',driverCookie,'POST',{filename:'photo.png',mime:'image/png',base64:replacement.toString('base64')});assert.equal(replaced.status,200);assert.notEqual((await replaced.json()).avatar_url,first.avatar_url);const latestPhoto=await request('/api/profile-photo',driverCookie);const latestBytes=await latestPhoto.arrayBuffer();assert.deepEqual(Buffer.from(new Uint8Array(latestBytes)),replacement);
});
test('Photo access is restricted to the current account and ignores attempts to target someone else',async()=>{
 assert.equal((await request('/api/profile-photo?user_id=driver',operatorCookie)).status,404);
 assert.equal((await request('/api/profile-photo',operatorCookie,'POST',{filename:'photo.png',mime:'image/png',base64:png.toString('base64'),user_id:'driver'})).status,400);
 assert.equal((await request('/api/profile-photo?user_id=driver',operatorCookie,'DELETE')).status,200);
 assert.equal((await request('/api/profile-photo',driverCookie)).status,200);
});
test('Removal restores the initial avatar and account deletion cascades photo cleanup',async()=>{
 assert.equal((await request('/api/profile-photo',driverCookie,'DELETE')).status,200);assert.equal((await request('/api/profile-photo',driverCookie)).status,404);assert.equal((await request('/api/me',driverCookie).then(r=>r.json())).avatar_url,null);
 await db.run('INSERT INTO profiles(id,org_id,email,name,role,password_hash) VALUES (?,?,?,?,?,?)',['PHOTO-CASCADE','manila','photo-cascade@example.test','Fixture','driver','unused']);
 await db.run('INSERT INTO profile_photos VALUES (?,?,?,?)',['PHOTO-CASCADE','image/png',png.toString('base64'),new Date().toISOString()]);await db.run('DELETE FROM profiles WHERE id=?',['PHOTO-CASCADE']);assert.equal((await db.query('SELECT user_id FROM profile_photos WHERE user_id=?',['PHOTO-CASCADE'])).length,0);
});
