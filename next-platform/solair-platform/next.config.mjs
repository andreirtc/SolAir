import {readFileSync} from 'node:fs';

// Admit only the locally recorded phone tunnel to development-only endpoints.
// API authentication and same-origin checks remain unchanged.
const allowedDevOrigins=[];
try {
 const {url}=JSON.parse(readFileSync(new URL('./.tools/phone-tunnel-runtime/quick.json',import.meta.url),'utf8'));
 const origin=new URL(url);
 if(origin.protocol==='https:'&&origin.hostname.endsWith('.trycloudflare.com'))allowedDevOrigins.push(origin.hostname);
} catch { /* Local-only development needs no additional origin. */ }

export default {poweredByHeader:false,reactStrictMode:true,devIndicators:false,allowedDevOrigins,experimental:{cpus:2}};



// Phone tunnel refresh: TCP recovery 2026-10-29
