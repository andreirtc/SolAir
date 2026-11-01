const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const out='docs/cpe-evidence/2026-10-25-cpe-copy';fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 const p=await b.newPage({viewport:{width:1440,height:1000}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const go=async id=>{await p.goto('http://127.0.0.1:8092/#'+id);await p.waitForTimeout(100)};
 await go('cpe');assert.equal(await p.locator('.nav-tabs [role=tab]').count(),9);
 const ns=await p.locator('.card-number').allTextContents();assert.equal(ns.length,39);assert.deepEqual(ns,ns.map((_,i)=>'CARD '+(i+1)));
 const ids=await p.locator('[id]').evaluateAll(es=>es.map(e=>e.id));assert.equal(ids.length,new Set(ids).size);
 assert.match(await p.locator('#cpe-closure').innerText(),/do not wait for 12 AWG/);
 assert.match(await p.locator('#cpe-closure').innerText(),/original 12 V \/ 5 A adapter/);
 assert.match(await p.locator('#cpe-closure').innerText(),/Final CPE acceptance requires/);
 assert.match(await p.locator('#backend-checkpoints').locator('..').innerText(),/B0 · server/);
 const audit=await p.locator('#schematic-owner').innerText();assert.match(audit,/U10 VCC/);assert.match(audit,/3\.3V/);assert.match(audit,/PWR_EN unused/);assert.match(audit,/no separate EN/);assert.match(audit,/470/);assert.match(audit,/104/);assert.match(audit,/57 pin-to-pin/);
 assert.equal(await p.locator('#cpe-schematic-copy img').count(),5);assert.equal(await p.locator('#whole-schematic-copy img').count(),4);
 for(const img of await p.locator('#cpe-schematic-copy img, #whole-schematic-copy img').all()){assert.ok((await img.getAttribute('src')).startsWith('data:image/svg+xml;base64,'));assert.ok(await img.evaluate(i=>i.complete&&i.naturalWidth>0));}
 assert.equal(await p.locator('#acs > details').last().getAttribute('open'),null);
 const acsText=await p.locator('#acs').evaluate(e=>{const c=e.cloneNode(true);for(const x of c.querySelectorAll('details'))x.remove();return c.textContent});assert.doesNotMatch(acsText,/validation moves to DP2|accuracy.*deferred to DP2/);assert.match(acsText,/Final CPE acceptance/);
 for(const name of ['SOLAIR_WHOLE_ELECTRICAL_COPY_B1.pdf','SOLAIR_CPE_CIRCUIT_COPY_B1.pdf','SOLAIR_DP1_PIN_TO_PIN_COPY_B1.pdf','CPE_COPY_CONNECTIONS_B1.csv','DP1_CPE_SCOPE_2026-10-25.md','SOLAIR_COPY_B1_SVG.zip']){const r=await p.request.get('http://127.0.0.1:8092/downloads/'+name);assert.equal(r.status(),200,name);if(name.endsWith('.pdf'))assert.ok((await r.body()).subarray(0,5).toString()==='%PDF-');}
 // Existing local task dates/owners/evidence/trace survive the deadline migration.
 const seed=await p.evaluate(()=>{const data=JSON.parse(document.getElementById('hub-data').textContent);return {kind:'SOLAIR-DP1-PLAN',deadline:'2026-10-27',approved:true,schedule_revision:'old27',tasks:data.tasks.map((t,i)=>({...t,owner:'OWNER '+i,evidence:'SYNTHETIC EVIDENCE '+i,status:'active',start:'2026-10-24',end:'2026-10-26'})),trace:[{source:'fixture',time:'2026-10-25',owner:'owner',quote:'preserve',action:'keep'}]}});
 await p.evaluate(s=>localStorage.setItem('solair-dp1-hub-2026-10-23-v1',JSON.stringify(s)),seed);await p.reload();
 const migrated=await p.evaluate(()=>JSON.parse(localStorage.getItem('solair-dp1-hub-2026-10-23-v1')));assert.equal(migrated.deadline,'2026-10-28');assert.equal(migrated.defense_date,'2026-10-29');assert.equal(migrated.approved,false);assert.deepEqual(migrated.tasks,seed.tasks);assert.deepEqual(migrated.trace,seed.trace);
 await p.evaluate(()=>localStorage.clear());await go('schematic-owner');await p.locator('#cpe-schematic-copy details').nth(2).evaluate(e=>e.open=true);await p.locator('#cpe-schematic-copy details').nth(2).screenshot({path:out+'/cpe-modem-rs485-copy.png'});
 await go('whole-schematic-copy');await p.locator('#whole-schematic-copy details').first().evaluate(e=>e.open=true);await p.locator('#whole-schematic-copy details').first().screenshot({path:out+'/whole-solar-copy.png'});
 await p.setViewportSize({width:390,height:844});for(const id of ['start','electrical','calculations','cpe','mechanical','gantt','sop4','defense','reference']){await go(id);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,id+' overflow');}
 await go('schematic-owner');await p.locator('#cpe-schematic-copy details').first().evaluate(e=>e.open=true);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false);await p.screenshot({path:out+'/mobile-copy.png'});
 await p.goto('file://'+process.cwd()+'/docs/visual-workbench/dp1-hub/SOLAIR_DP1_ALL_IN_ONE.html#schematic-owner');assert.equal(await p.locator('#cpe-schematic-copy img').count(),5);assert.ok(await p.locator('#reference-frame').getAttribute('srcdoc'));assert.ok(await p.locator('#cpe-schematic-copy img').first().evaluate(i=>i.complete&&i.naturalWidth>0));
 assert.deepEqual(errors,[]);await b.close();fs.writeFileSync(out+'/scope-browser-results.json',JSON.stringify({softwareFixturesOnly:true,hardwarePass:false,cards:39,tabs:9,copyPagesEmbedded:9,connections:57,checks:['bench-first order','actual supplies/U references/capacitors','two schematic copy packs','download availability','current invalidity retained','local evidence migration preserved','mobile all tabs','offline SVG self-contained','no JS errors']},null,2));console.log('PASS: CPE scope, schematic packs, backend instructions, migration, mobile and offline. Documentation fixtures only.');
})().catch(e=>{console.error(e);process.exit(1)});
