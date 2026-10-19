import {test} from 'node:test';
import assert from 'node:assert/strict';
import {deviceOnlyListener,privateIPv4} from '../server/ingress';
test('LAN listener exposes only non-browser device POST and validates private IPv4',async()=>{
 for(const host of ['127.0.0.1','0.0.0.0','8.8.8.8','192.168.999.1','::1'])assert.equal(privateIPv4(host),false);
 for(const host of ['192.168.1.20','10.0.0.2','172.16.1.2'])assert.equal(privateIPv4(host),true);
 const server=deviceOnlyListener((_req,res)=>{res.statusCode=401;res.end('Requires device token');});
 await new Promise<void>(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${(server.address() as any).port}`;
 try{assert.equal((await fetch(base+'/api/login',{method:'POST'})).status,404);assert.equal((await fetch(base+'/api/ingest')).status,404);assert.equal((await fetch(base+'/api/ingest',{method:'POST',headers:{Origin:base}})).status,404);assert.equal((await fetch(base+'/api/ingest',{method:'POST'})).status,401);}finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));}
});
