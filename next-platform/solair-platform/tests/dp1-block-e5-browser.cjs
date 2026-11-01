// Documentation QA. No hardware, firmware, working data or private config touched.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root='docs/schematic-reference/presentation-e5',evidence='docs/cpe-evidence/2026-10-26-block-e5';
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
 for(const filename of [root+'/connectivity.json','docs/schematic-reference/clean-d4/connectivity.json']){const pv=JSON.parse(fs.readFileSync(filename)).sheets[0];for(const id of ['PV02','PV03','PV04','PV05'])assert.equal(pv.wires.find(w=>w.id===id).gauge,'12 AWG Cu');assert.match(pv.wires.find(w=>w.id==='PV01').gauge,/factory/);assert.equal(pv.wires.find(w=>w.id==='PV04').a,'TZout+');assert.equal(pv.wires.find(w=>w.id==='PV04').b,'MPTin+');}
 const bsheet=m.sheets[1],c=m.sheets[2],d=m.sheets[3];
 assert.deepEqual(bsheet.wires.find(w=>w.id==='B05').a,'W5/2');assert.deepEqual(bsheet.wires.find(w=>w.id==='B05').b,'ACS.IP+');
 assert.equal(bsheet.wires.some(w=>w.a.startsWith('W5')&&w.b.startsWith('W2')),false);
 assert.ok(c.wires.find(w=>w.id==='C01').pending);assert.ok(d.wires.find(w=>w.id==='E02').pending);
 assert.ok(d.wires.filter(w=>['E07','E08','E09','E10'].includes(w.id)).every(w=>w.pending));
 const assets='/home/ralphandreicastillo326/solair-guide-current-account/dist';
 const server=http.createServer((req,res)=>{const p=path.resolve(assets,'.'+new URL(req.url,'http://localhost').pathname);if(p!==assets&&!p.startsWith(assets+'/')){res.writeHead(403).end();return;}let f=p;if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f+='/index.html';if(!fs.existsSync(f)){res.writeHead(404).end();return;}const ext=path.extname(f);res.setHeader('Content-Type',({'.html':'text/html','.svg':'image/svg+xml','.png':'image/png','.zip':'application/zip'})[ext]||'application/octet-stream');res.end(fs.readFileSync(f));});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 try{
  const p=await browser.newPage({viewport:{width:1536,height:1100}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(origin+'/#electrical-block-e5');assert.equal(await p.locator('#electrical').evaluate(e=>e.classList.contains('active')),true);
  assert.match(await p.locator('#'+m.sheets[0].key).textContent(),/PV04 · 12 AWG Cu/);
  await p.goto(origin+'/#pv-connections');assert.match(await p.locator('#hub-pv-mc4 .wire-size-legend').textContent(),/12 AWG Cu/);assert.match(await p.locator('#hub-pv-mc4 .wire-size-legend').textContent(),/Factory PV lead/);await p.goto(origin+'/#electrical-block-e5');
  assert.equal(await p.locator('#electrical-block-e5 .d4-sheet').count(),4);assert.equal(await p.locator('.card-number').count(),39);
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
  assert.equal((await p.request.get(origin+'/downloads/SOLAIR_BLOCK_E5_SVG_PNG.zip')).status(),200);assert.deepEqual(errors,[]);
  fs.writeFileSync(evidence+'/verification.json',JSON.stringify({documentationOnly:true,physicalAcceptance:false,sheets:4,wireSegmentsChecked:true,wires:ids.length,unintendedWireCrossings:0,textCollisions:0,wireTextCollisions:0,priorDiagrams:16,originalCards:39,downloadAndOffline:true,mobileContained:true,browserErrors:errors},null,2));
  await p.goto(origin+'/#finish-prototype');
  assert.equal(await p.locator('#start').evaluate(e=>e.classList.contains('active')),true);
  assert.equal(await p.locator('#finish-prototype .today-step').count(),11);
  const actionRoot=p.locator('#finish-prototype');
  assert.equal(await actionRoot.locator('.action-stage').count(),11);
  assert.equal(await actionRoot.locator('.action-next').count(),10);
  const first=actionRoot.locator('.action-stage').first();
  assert.match(await first.locator('.do-now li').first().innerText(),/Switch OFF.*adapter.*Unplug.*USB/);
  assert.match(await first.locator('.do-now li').nth(1).innerText(),/Pull the jumper.*5\s*V male header/);
  assert.equal(await first.locator(':scope > .table-wrap').count(),0);
  assert.equal(await first.locator(':scope > details').evaluate(e=>e.open),false);
  assert.equal(await actionRoot.locator(':scope > details').last().evaluate(e=>e.open),false);
  fs.mkdirSync('docs/cpe-evidence/2026-10-26-action-first',{recursive:true});
  await p.setViewportSize({width:1440,height:1050});
  await p.goto(origin+'/#finish-power');
  await p.screenshot({path:'docs/cpe-evidence/2026-10-26-action-first/desktop.png'});
  await p.setViewportSize({width:390,height:844});
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:'docs/cpe-evidence/2026-10-26-action-first/mobile.png'});
  for(const id of ['finish-power','finish-mount','finish-bms','finish-protection','finish-converter','finish-alarm','finish-acs','finish-firmware','finish-solar','finish-lte']){
   await p.goto(origin+'/#'+id);
   const step=p.locator('#'+id).locator('xpath=parent::details');assert.equal(await step.evaluate(e=>e.open),true);
   const next=await step.locator(':scope > p > .action-next').getAttribute('href');
   await step.locator(':scope > p > .action-next').click();assert.equal(new URL(p.url()).hash,next);
   assert.equal(await p.locator(next).locator('xpath=parent::details').evaluate(e=>e.open),true);
  }
  await p.goto(origin+'/#cpe-enclosure-layout');
  assert.equal(await p.locator('#start').evaluate(e=>e.classList.contains('active')),true);
  const enc=p.locator('#cpe-enclosure-layout');
  assert.equal(await enc.locator('img').count(),2);
  const encText=await enc.textContent();
  for(const phrase of ['245×185mm','205×145mm','180×120mm','lid removed','W5/2','W2/1','5A12Voutputfuse','120×24.6×18mm'])assert.ok(encText.includes(phrase),phrase);
  assert.ok(!encText.includes('CT measurement'));
  for(const name of ['CPE_BOX_UPRIGHT.png','CPE_BOX_FLAT.png','CPE_BOX_PLAN.svg'])assert.equal((await p.request.get(origin+'/downloads/'+name)).status(),200);
  const fullOffline=await (await p.request.get(origin+'/downloads/SOLAIR_DP1_ALL_IN_ONE.html')).text();
  assert.ok(!fullOffline.includes('src="downloads/CPE_BOX_'));assert.ok(fullOffline.includes('src="data:image/png;base64,'));
  fs.mkdirSync('docs/cpe-evidence/2026-10-26-cpe-enclosure',{recursive:true});
  await p.setViewportSize({width:1440,height:1050});
  await p.screenshot({path:'docs/cpe-evidence/2026-10-26-cpe-enclosure/site-desktop.png'});
  await p.setViewportSize({width:390,height:844});assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:'docs/cpe-evidence/2026-10-26-cpe-enclosure/site-mobile.png'});
  fs.writeFileSync('docs/cpe-evidence/2026-10-26-cpe-enclosure/verification.json',JSON.stringify({documentationOnly:true,physicalAcceptance:false,flatFootprintFits:180<=205&&120<=145,uprightLidFits:120<=70,boardCrossWidthFits:180<=185,correctEndpointLabels:true,images:2,measuredPlan:true,downloads:true,offlineEmbedded:true,mobileContained:true},null,2));
  fs.writeFileSync('docs/cpe-evidence/2026-10-26-action-first/verification.json',JSON.stringify({documentationOnly:true,physicalAcceptance:false,tasks:11,numberedActionsFirst:true,backgroundClosed:true,allNextLinksOpen:true,mobileContained:true},null,2));

  const guide=await p.locator('#finish-prototype').textContent();
  for(const phrase of ['USB unplugged','53/53','35.500mV','10.12V','2.0.20','removable','1A/5A','DT830B'])assert.ok(guide.includes(phrase),phrase);
  const fw=await p.request.get(origin+'/downloads/SOLAIR_CPE_2_0_20.zip');assert.equal(fw.status(),200);
  const monitor=await (await p.request.get(origin+'/downloads/SOLAIR_ASSEMBLY_MONITOR.html')).text();
  for(const phrase of ['Arm bench','Enable standalone arming','Pause LTE for ACS test'])assert.ok(monitor.includes(phrase));
  console.log('PASS: concise E5 blocks + returned-perfboard/USB-free guide, routes, downloads/offline/mobile; no hardware PASS.');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})();
