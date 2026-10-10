const CACHE='solair-shell-v1';
const ASSETS=/* BUILD_ASSETS */[];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/icon-192.png','/icon-512.png','/bemac-white.png','/manifest.webmanifest',...ASSETS]))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/')||event.request.method!=='GET')return;
 if(u.searchParams.has('_rsc')||event.request.headers.get('RSC'))return;
 if(u.pathname==='/_next/image'){
  if(u.searchParams.get('url')!=='/bemac-white.png')return;
  event.respondWith(fetch(event.request).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(event.request,r.clone()));return r;}).catch(async()=>await caches.match(event.request)||await caches.match('/bemac-white.png')||Response.error()));return;
 }
 event.respondWith(fetch(event.request).then(response=>{if(response.ok&&(u.pathname.startsWith('/_next/static/')||u.pathname==='/'||u.pathname.endsWith('.png')))caches.open(CACHE).then(c=>c.put(event.request,response.clone()));return response;}).catch(()=>caches.match(event.request).then(r=>r||(event.request.mode==='navigate'?caches.match('/'):Response.error()))));
});
