import {createServer,type RequestListener} from 'node:http';
import {isIP} from 'node:net';
export function privateIPv4(host:string){if(isIP(host)!==4)return false;const n=host.split('.').map(Number);return n[0]===10||(n[0]===192&&n[1]===168)||(n[0]===172&&n[1]>=16&&n[1]<=31);}
export function deviceOnlyListener(app:RequestListener){return createServer((req,res)=>{
  if(req.method!=='POST'||req.url!=='/api/ingest'||req.headers.origin){res.writeHead(404,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end('{"error":"Device ingress only"}');return;}
  app(req,res);
});}
