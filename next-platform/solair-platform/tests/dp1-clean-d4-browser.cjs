// Documentation QA. No hardware, firmware, working data or private config touched.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root='docs/schematic-reference/clean-d4',evidence='docs/cpe-evidence/2026-10-26-clean-d4';
function segments(w){return w.points.slice(1).map((p,i)=>[w.points[i],p]);}
function hits(a,b){const [[ax,ay],[bx,by]]=a,[[cx,cy],[dx,dy]]=b;
 const av=ax===bx,bv=cx===dx;
 if(av===bv){if((av&&ax!==cx)||(!av&&ay!==cy))return null;
  const lo=Math.max(Math.min(av?ay:ax,av?by:bx),Math.min(av?cy:cx,av?dy:dx)),hi=Math.min(Math.max(av?ay:ax,av?by:bx),Math.max(av?cy:cx,av?dy:dx));
  if(hi<lo)return null;if(hi>lo)return {overlap:true};return av?[ax,lo]:[lo,ay];}
 const v=av?a:b,h=av?b:a,x=v[0][0],y=h[0][1];
 return x>=Math.min(h[0][0],h[1][0])&&x<=Math.max(h[0][0],h[1][0])&&y>=Math.min(v[0][1],v[1][1])&&y<=Math.max(v[0][1],v[1][1])?[x,y]:null;
}
(async()=>{
 fs.mkdirSync(evidence,{recursive:true});
 const m=JSON.parse(fs.readFileSync(root+'/connectivity.json'));assert.equal(m.physical_acceptance,false);assert.equal(m.sheets.length,4);
 const ids=[];
 for(const s of m.sheets){
  for(const w of s.wires){ids.push(w.id);assert.ok(w.gauge);assert.deepEqual(w.points[0],s.ports[w.a]);assert.deepEqual(w.points.at(-1),s.ports[w.b]);for(const [a,b] of segments(w))assert.ok(a[0]===b[0]||a[1]===b[1]);}
  for(let i=0;i<s.wires.length;i++)for(let j=i+1;j<s.wires.length;j++)for(const a of segments(s.wires[i]))for(const b of segments(s.wires[j])){
   const h=hits(a,b);if(!h)continue;const wa=s.wires[i],wb=s.wires[j];
   const common=[wa.a,wa.b].filter(x=>x===wb.a||x===wb.b);
   assert.ok(!h.overlap&&common.some(x=>s.ports[x][0]===h[0]&&s.ports[x][1]===h[1]),`${s.key}: unintended ${wa.id}/${wb.id} intersection ${JSON.stringify(h)}`);
  }
 }
 assert.equal(ids.length,new Set(ids).size);
 const bsheet=m.sheets[1],c=m.sheets[2],d=m.sheets[3];
 assert.deepEqual(bsheet.wires.find(w=>w.id==='B05').a,'W5/2');assert.deepEqual(bsheet.wires.find(w=>w.id==='B05').b,'ACS.IP+');
 assert.equal(bsheet.wires.some(w=>w.a.startsWith('W5')&&w.b.startsWith('W2')),false);
 assert.ok(c.wires.find(w=>w.id==='C02').pending);assert.ok(d.wires.find(w=>w.id==='D02').pending);
 assert.ok(d.wires.filter(w=>['D07','D08','D09','D14'].includes(w.id)).every(w=>w.pending));
 const assets='/home/ralphandreicastillo326/solair-guide-current-account/dist';
 const server=http.createServer((req,res)=>{const p=path.resolve(assets,'.'+new URL(req.url,'http://localhost').pathname);if(p!==assets&&!p.startsWith(assets+'/')){res.writeHead(403).end();return;}let f=p;if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f+='/index.html';if(!fs.existsSync(f)){res.writeHead(404).end();return;}const ext=path.extname(f);res.setHeader('Content-Type',({'.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.zip':'application/zip'})[ext]||'application/octet-stream');res.end(fs.readFileSync(f));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 try{
  const p=await browser.newPage({viewport:{width:1536,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#electrical-clean-d4');assert.equal(await p.locator('#electrical').evaluate(e=>e.classList.contains('active')),true);
  assert.equal(await p.locator('#electrical-clean-d4 .d4-sheet').count(),4);assert.equal(await p.locator('.card-number').count(),39);
  // Prior connected drawings and all earlier C3 sheets remain present.
  assert.equal(await p.locator('svg.wired-svg').count(),16);assert.equal(await p.locator('#electrical-system-diagrams').count(),1);
  const idsOnPage=await p.locator('[id]').evaluateAll(xs=>xs.map(x=>x.id));assert.equal(idsOnPage.length,new Set(idsOnPage).size);
  let wireTextHits=[],textHits=[];
  for(const sheet of m.sheets){
   const el=p.locator('#'+sheet.key);await el.locator('xpath=ancestor::details[1]').evaluate(e=>e.open=true);
   const ts=await el.locator('text').evaluateAll(xs=>xs.map(e=>{const r=e.getBBox();return {t:e.textContent,x:r.x,y:r.y,w:r.width,h:r.height}}));
   for(let i=0;i<ts.length;i++)for(let j=i+1;j<ts.length;j++){const a=ts[i],b=ts[j];if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2)textHits.push([sheet.key,a.t,b.t]);}
   for(const w of sheet.wires)for(const [a,b] of segments(w))for(const t of ts){
    // Actual wires end at circle ports; names sit beside, never over, a wire.
    if(a[0]===b[0]&&a[0]>t.x+1&&a[0]<t.x+t.w-1&&Math.min(Math.max(a[1],b[1]),t.y+t.h)-Math.max(Math.min(a[1],b[1]),t.y)>2)wireTextHits.push([sheet.key,w.id,t.t]);
    if(a[1]===b[1]&&a[1]>t.y+1&&a[1]<t.y+t.h-1&&Math.min(Math.max(a[0],b[0]),t.x+t.w)-Math.max(Math.min(a[0],b[0]),t.x)>2)wireTextHits.push([sheet.key,w.id,t.t]);
   }
   for(const ext of ['svg','png']){const r=await p.request.get(origin+'/downloads/'+sheet.key+'.'+ext);assert.equal(r.status(),200);}
  }
  fs.writeFileSync(evidence+'/layout-check.json',JSON.stringify({textHits,wireTextHits},null,2));
  assert.deepEqual(textHits,[],'overlapping text');assert.deepEqual(wireTextHits,[],'wire over text');
  await p.screenshot({path:evidence+'/desktop.png'});
  await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:evidence+'/mobile.png'});
  const offline=await (await p.request.get(origin+'/downloads/SOLAIR_DP1_ALL_IN_ONE.html')).text();for(const s of m.sheets)assert.ok(offline.includes('id="'+s.key+'"'));
  assert.equal((await p.request.get(origin+'/downloads/SOLAIR_CLEAN_D4_SVG_PNG.zip')).status(),200);assert.deepEqual(errors,[]);
  fs.writeFileSync(evidence+'/verification.json',JSON.stringify({documentationOnly:true,physicalAcceptance:false,sheets:4,wireSegmentsChecked:true,wires:ids.length,unintendedWireCrossings:0,textCollisions:0,wireTextCollisions:0,priorDiagrams:16,originalCards:39,downloadAndOffline:true,mobileContained:true,browserErrors:errors},null,2));
  console.log('PASS: four connected D4 drawings; exact endpoint/gauge coverage, no wire crossings/text collisions; earlier artwork retained. No hardware PASS.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})();
