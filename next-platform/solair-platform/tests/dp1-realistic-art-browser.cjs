const { chromium } = require('playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
process.chdir(path.resolve(__dirname, '..'));
(async () => {
 const dir = 'docs/cpe-evidence/2026-10-25-cpe-copy/art-regression'; fs.mkdirSync(dir, { recursive: true });
 const browser = await chromium.launch({headless:true,executablePath:'/home/ralphandreicastillo326/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome'});
 const page = await browser.newPage({viewport:{width:1560,height:1100}}), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const go=async id=>{await page.goto('http://127.0.0.1:8092/#'+id);await page.waitForTimeout(80);};
 await go('power-wiring');
 const figures=page.locator('[data-art-scene]'), count=await figures.count(), overflow=[];
 assert.ok(count>=28);
 for(let i=0;i<count;i++){
  const f=figures.nth(i),id=await f.getAttribute('data-art-scene');await go(id);
  const select=f.locator('[data-art-select]');
  if(await select.count()){
   const wires=JSON.parse(await f.locator('.art-data').textContent());
   const visible=()=>f.locator('.art-wire').evaluateAll(xs=>xs.filter(x=>x.style.display!=='none').length);
   assert.equal(await visible(),await f.getAttribute('data-art-default')==='all'?wires.length:1,id+' default');
   for(const wire of wires){await select.selectOption(wire.id);assert.equal(await visible(),1);assert.match(await f.locator('.art-readout').innerText(),new RegExp(wire.id));assert.equal(await f.locator('.art-wire').evaluateAll(xs=>xs.find(x=>x.style.display!=='none').dataset.wireId),wire.id);}
   await f.locator('[data-art-all]').click();assert.equal(await visible(),wires.length);
   await select.selectOption(wires[0].id);await f.locator('[data-art-next]').click();assert.equal(await select.inputValue(),wires[Math.min(1,wires.length-1)].id);
   if(await f.getAttribute('data-art-default')==='all')await f.locator('[data-art-all]').click();else await select.selectOption(wires[0].id);
  }
  const bad=await f.locator('svg').evaluate(svg=>[...svg.querySelectorAll('text')].filter(t=>!t.closest('defs')).flatMap(t=>{const b=t.getBBox(),m=t.getCTM(),s=svg.getCTM();if(!m||!s)return[];const tx=s.inverse().multiply(m);return [[b.x,b.y],[b.x+b.width,b.y+b.height]].map(([x,y])=>new DOMPoint(x,y).matrixTransform(tx)).some(p=>p.x<0||p.x>svg.viewBox.baseVal.width+2||p.y<0||p.y>svg.viewBox.baseVal.height+2)?[t.textContent]:[];}));
  if(bad.length)overflow.push({id,text:bad});
  if(['hub-full-return','hub-pack-placement','hub-solar-only','hub-branch-fuses','hub-wago-complete','hub-imu-mount','hub-bms','hub-protected-return','hub-wagos','hub-pzem','hub-rack','hub-contacts'].includes(id))await f.locator('svg').screenshot({path:dir+'/'+id+'.png',style:'nav{visibility:hidden!important}'});
 }
 assert.deepEqual(overflow,[],'SVG text outside viewport');
 const ids=await page.locator('[id]').evaluateAll(xs=>xs.map(x=>x.id));assert.equal(ids.length,new Set(ids).size,'unique IDs');
 assert.equal(await page.locator('#hub-charge,#hub-charging-socket-location,#charger-connector').count(),0,'removed wall-charge pictures/purchase');
 await go('still-to-buy');
 const buy=await page.locator('#still-to-buy').textContent();
 for(const needle of [/design currents/,/255 × 200 × 120/,/200 mm/,/35 mm/,/wall charger/i,/five WAGO/i,/still to buy/i])assert.match(buy,needle);
 await go('fuse-buy');const protection=await page.locator('#fuse-buy').textContent();
 for(const needle of [/inline/i,/22 AWG/,/12 AWG/,/5 A/,/1 A/,/54.6/,/not.*verified/i,/no imported/i])assert.match(protection,needle);
 const w5=JSON.parse(await page.locator('[data-art-scene="hub-wago-complete"] .art-data').textContent()).filter(x=>x.id.startsWith('W5-'));assert.deepEqual(w5.map(x=>x.id),['W5-1','W5-2']);assert.match(w5[0].ends,/P−/);assert.match(w5[1].ends,/ACS IP\+/);
 await go('battery-assembly');assert.equal(await page.locator('#hub-pack-placement image').count(),2);assert.equal(await page.locator('#hub-full-return').count(),1);const chain=JSON.parse(await page.locator('[data-art-scene="hub-full-return"] .art-data').textContent());assert.equal(chain.length,7);assert.match(chain[0].ends,/P−.*W5 opening 1/);assert.match(chain[1].gauge,/12 AWG BLACK/);assert.match(chain[3].ends,/IP−.*W2 opening 1/);assert.match(await page.locator('#hub-pack-placement').getAttribute('aria-label'),/P− → W5/);assert.match(await page.locator('#hub-pack-placement').locator('..').locator('..').textContent(),/original thick BLACK|original BLACK/i);await go('placement');assert.match(await page.locator('#hub-imu-mount').getAttribute('aria-label'),/FEMALE HEADER/);assert.match(await page.locator('#placement').textContent(),/No loose DuPont jumpers/);
 await go('fsm');await page.locator('#fsm-lid').click();assert.equal(await page.locator('#lid-moving').getAttribute('transform'),'translate(0,-65)');
 await page.setViewportSize({width:390,height:844});for(const id of ['still-to-buy','battery-assembly','power-wiring','placement','rail-layout','box-mounting']){await go(id);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2),false,id+' mobile width');}
 await go('still-to-buy');await page.screenshot({path:dir+'/shopping-mobile.png'});
 await page.goto('file:///home/ralphandreicastillo326/orca/workspaces/SolAir/mackerel/next-platform/solair-platform/docs/visual-workbench/dp1-hub/SOLAIR_DP1_ALL_IN_ONE.html#power-wiring');
 assert.equal(await page.locator('#hub-branch-fuses').count(),1);assert.equal(await page.locator('#hub-charge').count(),0);
 const offlineW5=JSON.parse(await page.locator('[data-art-scene="hub-wago-complete"] .art-data').textContent()).filter(x=>x.id.startsWith('W5-'));assert.equal(offlineW5.length,2);
 assert.ok(await page.locator('#reference-frame').getAttribute('srcdoc'));assert.deepEqual(errors,[]);
 fs.writeFileSync(dir+'/checks.json',JSON.stringify({softwareFixturesOnly:true,hardwarePass:false,scenes:count,checks:['all scene wire controls/defaults/next','all SVG text within bounds','unique IDs','solar-only plan, no charger purchase/branch pictures','W5 exactly P− and main-output negative, three spare holes','5Aconverter1APZEMdesignassumptions; unknown250Vinlinepartsnotapproved','protection boundary and ribbed-box supported mounting','IMUfemaleheader+fixedoppositesupport','originalmovinglid/FSMretained','390pxresponsive','offlineguide+originalartretained','zero JS errors'],errors},null,2));
 await browser.close();console.log('Solar-only visual guide PASS; '+count+' scenes; software fixtures only');
})().catch(e=>{console.error(e);process.exit(1)});
