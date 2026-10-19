const CACHE='solair-shell-v1';
const ASSETS=/* BUILD_ASSETS */[];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(['/','/icon-192.png','/icon-512.png','/bemac-white.png','/manifest.webmanifest',...ASSETS]))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function networkFirst(event,cacheable,imageFallback=false){
 let cacheWrite=Promise.resolve();
 const response=fetch(event.request).then(result=>{
  if(result.ok&&cacheable){
   // Reserve the cache's body before returning the response to the browser.
   const copy=result.clone();
   cacheWrite=caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
  }
  return result;
 }).catch(async()=>await caches.match(event.request)||(imageFallback?await caches.match('/bemac-white.png'):event.request.mode==='navigate'?await caches.match('/'):null)||Response.error());
 event.respondWith(response);
 // Register immediately, and keep background writes alive without failing a good network response.
 event.waitUntil(response.then(()=>cacheWrite).catch(()=>{}));
}
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/')||event.request.method!=='GET')return;
 if(u.searchParams.has('_rsc')||event.request.headers.get('RSC'))return;
 if(u.pathname==='/_next/image'){
  if(u.searchParams.get('url')!=='/bemac-white.png')return;
  networkFirst(event,true,true);return;
 }
 networkFirst(event,u.pathname.startsWith('/_next/static/')||u.pathname==='/'||u.pathname.endsWith('.png'));
});
