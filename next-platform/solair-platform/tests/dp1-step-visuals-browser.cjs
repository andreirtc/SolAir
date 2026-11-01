// Documentation-only QA. Uses an isolated HTTP port; no app/device writes.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const assets='/home/ralphandreicastillo326/solair-guide-current-account/dist';
const evidence='docs/cpe-evidence/2026-10-26-all-step-visuals';
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('docs/schematic-reference/commissioning-visuals/manifest.json'));
 assert.equal(manifest.physical_acceptance,false);
 assert.deepEqual(manifest.mpt_mm,[103.7,91.5,55]);
 assert.deepEqual(manifest.power_box_outside_mm,[255,200,120]);
 assert.equal(manifest.boxes.FUSE[0],'POWER BOX · MAIN FUSE');
 assert.match(manifest.boxes.MPT[0],/POWER BOX/);
 const stages=Object.entries(manifest.stages);assert.equal(stages.length,9);
 const bms=manifest.stages['finish-bms'].routes;
 assert.ok(bms.some(r=>r.from==='W5 opening 2'&&r.to==='ACS large IP+'&&r.to_box==='CPE'));
 assert.ok(bms.some(r=>r.from==='ACS large IP−'&&r.to==='W2 opening 1'&&r.to_box==='PWR'));
 assert.equal(bms.some(r=>r.from.startsWith('W5')&&r.to.startsWith('W2')),false);
 assert.equal(manifest.stages['finish-protection'].routes.find(r=>r.state==='held').from_box,'PWR');
 const server=http.createServer((req,res)=>{
  let f=path.resolve(assets,'.'+new URL(req.url,'http://localhost').pathname);
  if(!f.startsWith(assets+'/')&&f!==assets){res.writeHead(403).end();return;}
  if(fs.existsSync(f)&&fs.statSync(f).isDirectory())f+='/index.html';
  if(!fs.existsSync(f)){res.writeHead(404).end();return;}
  res.setHeader('Content-Type',({'.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'})[path.extname(f)]||'application/octet-stream');res.end(fs.readFileSync(f));
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin='http://127.0.0.1:'+server.address().port;
 const browser=await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 fs.mkdirSync(evidence,{recursive:true});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[],collisions=[],wireTextCollisions=[];
  p.on('pageerror',e=>errors.push(e.message));
  for(const [id,d] of stages){
   await p.goto(origin+'/#'+id);
   const stage=p.locator('#'+id).locator('xpath=parent::details');assert.equal(await stage.evaluate(e=>e.open),true);
   const visual=stage.locator(':scope > .commission-visual');assert.equal(await visual.count(),1);
   assert.ok(await visual.evaluate(e=>Boolean(e.compareDocumentPosition(e.parentElement.querySelector('.do-now'))&Node.DOCUMENT_POSITION_FOLLOWING)));
   assert.equal(await visual.locator('.box-location-key span').count(),d.places.length);
   const img=visual.locator('img');await img.scrollIntoViewIfNeeded();await img.evaluate(e=>e.decode());
   assert.ok(await img.evaluate(e=>e.naturalWidth>=1024));
   for(const ext of ['.png','.webp','_MAP.svg'])assert.equal((await p.request.get(origin+'/downloads/'+d.asset+ext)).status(),200);
   await visual.locator('details').evaluate(e=>e.open=true);
   const texts=await visual.locator('svg text').evaluateAll(es=>es.map(e=>{const b=e.getBBox();return {t:e.textContent,x:b.x,y:b.y,w:b.width,h:b.height};}));
   const wires=await visual.locator('svg path').evaluateAll(es=>es.map(e=>{const b=e.getBBox();return {x:b.x-2.5,y:b.y-2.5,w:b.width+5,h:b.height+5};}));
   for(const w of wires)for(const t of texts)if(Math.min(w.x+w.w,t.x+t.w)-Math.max(w.x,t.x)>1&&Math.min(w.y+w.h,t.y+t.h)-Math.max(w.y,t.y)>1)wireTextCollisions.push({step:d.number,text:t.t});
   for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    const a=texts[i],b=texts[j];if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2&&Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2)collisions.push({step:d.number,a:a.t,b:b.t});
   }
   await visual.locator('details').evaluate(e=>e.open=false);
   if([3,5,9,10].includes(d.number)){await visual.scrollIntoViewIfNeeded();await p.screenshot({path:evidence+'/step-'+d.number+'-desktop.png'});}
  }
  fs.writeFileSync(evidence+'/text-layout.json',JSON.stringify({collisions,wireTextCollisions},null,2));assert.deepEqual(collisions,[]);assert.deepEqual(wireTextCollisions,[]);
  await p.setViewportSize({width:390,height:844});
  for(const [id,d] of stages){await p.goto(origin+'/#'+id);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));if(d.number===3)await p.screenshot({path:evidence+'/step-3-mobile.png'});}
  const offline=fs.readFileSync(assets+'/downloads/SOLAIR_DP1_ALL_IN_ONE.html','utf8');
  for(const [,d] of stages)assert.ok(!offline.includes('src="downloads/'+d.asset+'.webp"'));
  assert.equal((offline.match(/src="data:image\/webp;base64,/g)||[]).length,9);
  assert.ok(Buffer.byteLength(offline)<25*1024*1024,'offline static asset exceeds limit');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(evidence+'/verification.json',JSON.stringify({documentationOnly:true,physicalAcceptance:false,steps:9,imagesLoaded:9,nativeMaps:9,boxKeys:true,mainFuseSharesPowerBox:true,mptDimensions:[103.7,91.5,55],downloads:true,offlineEmbedded:true,offlineBytes:Buffer.byteLength(offline),mobileContained:true,textCollisions:0,wireTextCollisions:0,browserErrors:errors},null,2));
  console.log('PASS: Steps 3–11 images, box identities, exact maps, downloads, offline size and mobile layout. No hardware PASS.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})();
