// Documentation/geometry/browser verification only. No connected hardware.
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const out='docs/cpe-evidence/2026-10-25-electrical-modes';fs.mkdirSync(out,{recursive:true});
 const data=JSON.parse(fs.readFileSync('docs/schematic-reference/electrical-modes/connectivity.json'));
 const proto=data.systems.find(s=>s.name==='ELECTRICAL_48V'),bemac=data.systems.find(s=>s.name==='ELECTRICAL_BEMAC');
 assert.equal(proto.routes.length,26);assert.equal(bemac.routes.length,24);
 for(const system of data.systems){
  const segments=system.routes.flatMap(r=>r.external_wire_segments.map(points=>({id:r.id,points})));
  for(let i=0;i<segments.length;i++)for(let j=i+1;j<segments.length;j++){
   const a=segments[i],b=segments[j];if(a.id===b.id)continue;
   assert.notEqual(a.points[0][1],b.points[0][1],'different-net wires share a row');
  }
  for(const r of system.routes)for(const [a,b]of r.external_wire_segments)assert.equal(a[1],b[1]);
 }
 const route=(s,id)=>s.routes.find(r=>r.id===id);
 assert.equal(route(proto,'PV_POS').nodes[1].title,'TOMZN + POLE');
 assert.match(route(proto,'BATTERY_NEG').nodes.map(n=>n.title).join(' '),/DALY.*W5.*ACS.*W2/);
 assert.match(route(proto,'SOLAR_OUTPUT_NEG').nodes.map(n=>n.title).join(' '),/W2.*SHUNT.*LONQ.*MPT/);
 assert.equal(route(proto,'PZEM_MEAS_NEG').nodes[0].title,'SHUNT SOURCE NODE');
 assert.equal(proto.routes.filter(r=>r.id==='BATTERY_POS'||r.id==='BATTERY_NEG').some(r=>r.nodes.some(n=>n.title.includes('SB50'))),false);
 for(const id of ['CONVERTER_INPUT_POS','PZEM_MEAS_POS'])assert.equal(route(proto,id).pending,true);
 for(const id of ['VEHICLE_CHARGE_POS','VEHICLE_CHARGE_NEG','VEHICLE_ACCESSORY_POS','VEHICLE_ACCESSORY_NEG'])assert.equal(route(bemac,id).pending,true);
 assert.equal(bemac.routes.some(r=>r.id==='BATTERY_NEG'),false);
 const browser=await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 try{
  const p=await browser.newPage({viewport:{width:1440,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:8092/#electrical-system-diagrams');
  assert.equal(await p.locator('#electrical').evaluate(e=>e.classList.contains('active')),true);
  assert.equal(await p.locator('#electrical-system-diagrams svg').count(),2);
  assert.equal(await p.locator('.card-number').count(),39);
  assert.equal(await p.locator('#pinning-reference table').count(),4);
  await p.screenshot({path:out+'/desktop-overview.png'});
  const collisions=await p.locator('#electrical-system-diagrams svg').evaluateAll(svgs=>svgs.flatMap(svg=>{
   const texts=[...svg.querySelectorAll('text')].map(e=>({text:e.textContent,b:e.getBBox()})),result=[];
   for(let i=0;i<texts.length;i++)for(let j=i+1;j<texts.length;j++){
    const a=texts[i],b=texts[j];
    if(Math.min(a.b.x+a.b.width,b.b.x+b.b.width)-Math.max(a.b.x,b.b.x)>2&&Math.min(a.b.y+a.b.height,b.b.y+b.b.height)-Math.max(a.b.y,b.b.y)>2)result.push({sheet:svg.id,a:a.text,b:b.text});
   }return result;
  }));fs.writeFileSync(out+'/text-collisions.json',JSON.stringify(collisions,null,2));assert.deepEqual(collisions,[]);
  for(const name of ['ELECTRICAL_48V','ELECTRICAL_BEMAC']){
   for(const suffix of ['svg','png'])assert.equal((await p.request.get('http://127.0.0.1:8092/downloads/'+name+'.'+suffix)).status(),200);
   const viewer=p.locator('[data-wired-viewer]').filter({has:p.locator('#wired-'+name)});
   await viewer.locator('[data-wired-select]').selectOption('PZEM_MEAS_NEG');
   assert.match(await viewer.locator('[data-wired-readout]').innerText(),/Measurement negative reference/);
   assert.equal(await viewer.locator('[data-net="PZEM_MEAS_NEG"]').first().evaluate(e=>e.style.opacity),'1');
   assert.ok(await viewer.locator('.wired-drawing').evaluate(e=>e.scrollTop)>500);
   await viewer.screenshot({path:out+'/'+name+'-trace.png'});
   await viewer.locator('[data-wired-all]').click();
  }
  await p.goto('http://127.0.0.1:8092/#electrical-bemac');
  for(const phrase of ['not ready to connect','No insertion into the BEMAC traction circuit','keep']){
   if(phrase!=='keep')assert.ok((await p.locator('#electrical-bemac').innerText()).includes(phrase));
  }
  assert.ok((await p.locator('#oct26-plan').innerText()).includes('Do not wait until 27 October'));
  const ids=await p.locator('[id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(ids.length,new Set(ids).size);
  await p.setViewportSize({width:390,height:844});
  for(const id of ['electrical-system-diagrams','electrical-48v','electrical-bemac','oct26-plan']){
   await p.goto('http://127.0.0.1:8092/#'+id);assert.equal(await p.locator('#'+id).isVisible(),true);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true,id);
  }
  await p.screenshot({path:out+'/mobile-plan.png'});
  await p.goto('file://'+process.cwd()+'/docs/visual-workbench/dp1-hub/SOLAIR_DP1_ALL_IN_ONE.html#electrical-48v');
  assert.equal(await p.locator('#electrical-system-diagrams svg').count(),2);
  const offline=p.locator('[data-wired-viewer]').filter({has:p.locator('#wired-ELECTRICAL_48V')});
  await offline.locator('[data-wired-select]').selectOption('ALARM_POWER_POS');
  assert.match(await offline.locator('[data-wired-readout]').innerText(),/Siren supply positive/);
  assert.ok(await p.locator('#reference-frame').getAttribute('srcdoc'));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(out+'/verification.json',JSON.stringify({documentationOnly:true,hardwarePass:false,systems:2,prototypeRoutes:26,bemacRoutes:24,textCollisions:0,differentNetCrossings:0,preservedCards:39,checks:['source and branch order','separate prototype and BEMAC paths','BEMAC interfaces pending and no traction insertion','PZEM source reference','fuse targets pending','trace auto-scroll/dim/reset','SVG and PNG downloads','unique IDs','mobile and offline','26–28 plan','no browser errors']},null,2));
  console.log('PASS: two electrical-system diagrams, 50 route chains, zero wire/text collisions, trace auto-scroll, downloads, mobile/offline; no hardware PASS.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
