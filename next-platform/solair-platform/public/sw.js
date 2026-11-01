const CACHE='solair-shell-v1';
const ASSETS=/* BUILD_ASSETS */[];
const SHELL_ASSETS=["/","/icon-192.png","/icon-512.png","/icon.svg","/bemac-white.png","/manifest.webmanifest","/fonts/outfit-latin.woff2","/fonts/work-sans-latin.woff2","/solair-logo-transparent.png","/energy-solar-panels.webp","/energy-vawt-cutout.webp","/downloads/SOLAIR-user-manual.pdf"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll([...new Set([...SHELL_ASSETS,...ASSETS])]))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('solair-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
function networkFirst(event,cacheable,imageFallback=''){
 let cacheWrite=Promise.resolve();
 const response=fetch(event.request).then(result=>{
  if(result.ok&&cacheable){
   // Reserve the cache's body before returning the response to the browser.
   const copy=result.clone();
   cacheWrite=caches.open(CACHE).then(cache=>cache.put(event.request,copy)).catch(()=>{});
  }
  return result;
 }).catch(async()=>await caches.match(event.request)||(imageFallback?await caches.match(imageFallback):event.request.mode==='navigate'?await caches.match('/'):null)||Response.error());
 event.respondWith(response);
 // Register immediately, and keep background writes alive without failing a good network response.
 event.waitUntil(response.then(()=>cacheWrite).catch(()=>{}));
}
self.addEventListener('fetch',event=>{const u=new URL(event.request.url);if(u.origin!==location.origin||u.pathname.startsWith('/api/')||event.request.method!=='GET')return;
 if(u.searchParams.has('_rsc')||event.request.headers.get('RSC'))return;
 if(u.pathname==='/_next/image'){
  const image=u.searchParams.get('url')||'';
  if(!SHELL_ASSETS.includes(image)||!/[.](png|webp)$/.test(image))return;
  networkFirst(event,true,image);return;
 }
 const cacheable=u.pathname.startsWith('/_next/static/')||SHELL_ASSETS.includes(u.pathname);
 if(!cacheable&&event.request.mode!=='navigate')return;
 networkFirst(event,cacheable);
});
