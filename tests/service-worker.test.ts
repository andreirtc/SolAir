import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const source=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
function worker(failWrite=false){
 const listeners:Record<string,any>={},writes:string[]=[];
 let release!:()=>void;
 const opened=new Promise<void>(resolve=>{release=resolve;});
 const caches={open:async()=>{await opened;return {put:async(_request:unknown,response:Response)=>{if(failWrite)throw new Error('TEST FIXTURE quota failure');writes.push(await response.text());}};},match:async()=>undefined};
 runInNewContext(source,{URL,Response,location:{origin:'https://fixture.invalid'},self:{addEventListener:(name:string,fn:any)=>listeners[name]=fn},caches,fetch:async()=>new Response('TEST FIXTURE asset')});
 return {listeners,writes,release};
}

for(const path of ['/bemac-white.png','/_next/image?url=%2Fbemac-white.png&w=640&q=75'])test(`Service worker clones ${path.split('?')[0]} before the browser consumes its response`,async()=>{
 const w=worker(),lifetimes:Promise<unknown>[]=[];let response!:Promise<Response>;
 w.listeners.fetch({request:new Request('https://fixture.invalid'+path),respondWith:(p:Promise<Response>)=>response=p,waitUntil:(p:Promise<unknown>)=>lifetimes.push(p)});
 assert.equal(lifetimes.length,1,'Background cache writes must extend the fetch event lifetime');
 assert.equal(await (await response).text(),'TEST FIXTURE asset');
 w.release();await Promise.all(lifetimes);assert.deepEqual(w.writes,['TEST FIXTURE asset']);
});

test('A failed cache write cannot break a successful network response or reject the background task',async()=>{
 const w=worker(true),lifetimes:Promise<unknown>[]=[];let response!:Promise<Response>;
 w.listeners.fetch({request:new Request('https://fixture.invalid/_next/static/test.js'),respondWith:(p:Promise<Response>)=>response=p,waitUntil:(p:Promise<unknown>)=>lifetimes.push(p)});
 assert.equal(await (await response).text(),'TEST FIXTURE asset');w.release();await Promise.all(lifetimes);assert.deepEqual(w.writes,[]);
});

test('Service worker continues to bypass private APIs, remote origins, RSC, non-GET and unapproved optimized images',()=>{
 const w=worker();
 for(const request of [new Request('https://fixture.invalid/api/me'),new Request('https://other.invalid/image.png'),new Request('https://fixture.invalid/?_rsc=fixture'),new Request('https://fixture.invalid/',{headers:{RSC:'1'}}),new Request('https://fixture.invalid/',{method:'POST'}),new Request('https://fixture.invalid/_next/image?url=%2Fprivate-image.png'),new Request('https://fixture.invalid/private-image.png'),new Request('https://fixture.invalid/_next/image?url=%2Fapi%2Fprofile-photo')]){
  w.listeners.fetch({request,respondWith:()=>assert.fail('This request must bypass shell caching'),waitUntil:()=>assert.fail('Unexpected background write')});
 }
});

test('First-install shell includes public branding, renewable-energy images and the manual without API data',async()=>{
 const listeners:Record<string,any>={},installed:string[]=[];
 runInNewContext(source,{URL,Response,location:{origin:'https://fixture.invalid'},self:{addEventListener:(name:string,fn:any)=>listeners[name]=fn},caches:{open:async()=>({addAll:async(paths:string[])=>{installed.push(...paths);}})}});
 let completion!:Promise<void>;listeners.install({waitUntil:(task:Promise<void>)=>{completion=task;}});await completion;
 for(const path of ['/','/solair-logo-transparent.png','/energy-solar-panels.webp','/energy-vawt-cutout.webp','/downloads/SOLAIR-user-manual.pdf'])assert(installed.includes(path));
 assert.equal(installed.length,new Set(installed).size);assert(!installed.some(path=>path.startsWith('/api/')));
});
for(const image of ['/energy-solar-panels.webp','/energy-vawt-cutout.webp'])test(`Offline optimizer falls back only to the approved public image ${image}`,async()=>{
 const listeners:Record<string,any>={};
 runInNewContext(source,{URL,Response,location:{origin:'https://fixture.invalid'},self:{addEventListener:(name:string,fn:any)=>listeners[name]=fn},caches:{match:async(key:unknown)=>key===image?new Response('TEST FIXTURE approved image'):undefined},fetch:async()=>{throw new Error('TEST FIXTURE offline');}});
 let response!:Promise<Response>;const lifetimes:Promise<unknown>[]=[];
 listeners.fetch({request:new Request('https://fixture.invalid/_next/image?url='+encodeURIComponent(image)+'&w=640&q=75'),respondWith:(task:Promise<Response>)=>{response=task;},waitUntil:(task:Promise<unknown>)=>{lifetimes.push(task);}});
 assert.equal(await (await response).text(),'TEST FIXTURE approved image');await Promise.all(lifetimes);
});
test('Activation removes obsolete SOLAIR shells while preserving unrelated origin caches',async()=>{
 const listeners:Record<string,any>={},deleted:string[]=[];
 runInNewContext(source,{self:{addEventListener:(name:string,fn:any)=>listeners[name]=fn,clients:{claim:async()=>{}}},caches:{keys:async()=>['solair-shell-old','solair-shell-v1','another-app-cache'],delete:async(key:string)=>{deleted.push(key);return true;}}});
 let completion!:Promise<void>;listeners.activate({waitUntil:(task:Promise<void>)=>{completion=task;}});await completion;assert.deepEqual(deleted,['solair-shell-old']);
});
