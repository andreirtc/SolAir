import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
import {chromium,type Page} from 'playwright';

// Fleet/GPS and tiles are browser-only fixtures, never saved vehicle positions.
// Run through regression-preview.ts for an isolated account database.
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const browser=await chromium.launch();
mkdirSync('test-results/map',{recursive:true});
async function center(page:Page){
 await page.locator('.fleet-map .leaflet-tile[src^="https://tile.openstreetmap.org/"]').first().waitFor();
 return page.locator('.fleet-map').evaluate(map=>{
  const tile=map.querySelector<HTMLImageElement>('.leaflet-tile[src^="https://tile.openstreetmap.org/"]');
  const match=tile?.src.match(/\/(\d+)\/(\d+)\/(\d+)\.png/);
  if(!tile||!match)throw new Error('No basemap tile coordinates');
  const [,z,x,y]=match.map(Number),bounds=map.getBoundingClientRect(),image=tile.getBoundingClientRect();
  const worldX=x*256+bounds.left+bounds.width/2-image.left,worldY=y*256+bounds.top+bounds.height/2-image.top,size=256*2**z;
  return {zoom:z,longitude:worldX/size*360-180,latitude:Math.atan(Math.sinh(Math.PI*(1-2*worldY/size)))*180/Math.PI};
 });
}
async function assertPosition(page:Page,latitude:number,longitude:number,zoom=14){
 const position=await center(page);assert.equal(position.zoom,zoom);
 assert.ok(Math.abs(position.latitude-latitude)<.001,JSON.stringify(position));
 assert.ok(Math.abs(position.longitude-longitude)<.001,JSON.stringify(position));
}
try{
 for(const width of [1440,390]){
  const page=await browser.newPage({viewport:{width,height:1050}});
  let emptyFleet=false,model='BEMAC 68VM',extraVehicle=false,gpsAge=60000;
  let hardwareFix:{latitude:number;longitude:number;measured_at:string}|null=null;
  const errors:string[]=[],tileReferrers:(string|null)[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://tile.openstreetmap.org/**',async route=>{
   tileReferrers.push(await route.request().headerValue('referer'));
   await route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#e8efe8"/></svg>'});
  });
  await page.route(/\/api\/fleet\?/,async route=>{
   const demo=new URL(route.request().url()).searchParams.get('mode')==='demo';
   const vehicle={id:'ET-01',name:'Map test vehicle',model,image_url:'/bemac-white.png',driver_name:'Map test driver',driver_id:'driver',device_id:'SOL-ET-01',status:'Online',nominal_voltage:60,nominal_capacity:100,solar_wh:null,wind_wh:null,
    telemetry:!demo&&hardwareFix?{gps_fix:true,gps_fix_age_ms:gpsAge,received_at:new Date().toISOString(),sensor_health:{}}:null,
    gps:demo?{latitude:14.61,longitude:121.03,measured_at:new Date().toISOString()}:hardwareFix};
   await route.fulfill({json:emptyFleet?[]:extraVehicle?[vehicle,{...vehicle,id:'ET-02',model:'NWOW',device_id:'SOL-ET-02',gps:null,telemetry:null}]:[vehicle]});
  });
  await page.goto(base);if(width<=650)await page.getByRole('button',{name:'Get started',exact:true}).click();await page.getByLabel('Email address').fill('operator@solair.local');await page.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.getByRole('heading',{name:'Fleet overview'}).waitFor();
  async function refresh(){const response=page.waitForResponse(r=>r.url().includes('/api/fleet?'));await page.getByRole('button',{name:'Refresh',exact:true}).click();await response;await page.waitForTimeout(300);}
  await page.getByLabel('Data mode').selectOption('demo');await refresh();await page.locator('.leaflet-tile-loaded').first().waitFor();
  await assertPosition(page,14.61,121.03);
  await page.getByRole('button',{name:'Manila reference',exact:true}).click();await assertPosition(page,14.5995,120.9842);
  await page.getByRole('button',{name:'Show vehicles',exact:true}).click();await assertPosition(page,14.61,121.03);
  await page.locator('.leaflet-control-zoom-in').click();const before=await center(page);await refresh();assert.deepEqual(await center(page),before);
  if(width<768)await page.getByRole('button',{name:'Toggle menu'}).click();
  await page.locator('.sidebar nav').getByRole('button',{name:'Live Fleet Map',exact:true}).click();await page.locator('.full-map .leaflet-tile-loaded').first().waitFor();await assertPosition(page,14.61,121.03);
  await page.getByLabel('Data mode').selectOption('hardware');await page.getByText('No valid GPS positions',{exact:true}).waitFor();await assertPosition(page,14.5995,120.9842);
  assert.equal(await page.locator('.map-vehicle').count(),0);assert.equal(await page.getByRole('button',{name:'Show vehicles',exact:true}).isDisabled(),true);
  await page.screenshot({path:'test-results/map/bemac-'+width+'.png',fullPage:true});
  model='NWOW';await refresh();await page.getByRole('button',{name:'Malabon reference',exact:true}).waitFor();await assertPosition(page,14.668,120.965);
  await page.screenshot({path:'test-results/map/nwow-'+width+'.png',fullPage:true});
  model='BEMAC 68VM';extraVehicle=true;await refresh();await assertPosition(page,14.5995,120.9842);
  await page.getByLabel('Selected vehicle',{exact:true}).selectOption('ET-02');await assertPosition(page,14.668,120.965);
  await page.getByLabel('Selected vehicle',{exact:true}).selectOption('ET-01');await assertPosition(page,14.5995,120.9842);
  extraVehicle=false;
  hardwareFix={latitude:14.61,longitude:121.03,measured_at:new Date().toISOString()};await refresh();await page.locator('.map-vehicle .offline').waitFor();await assertPosition(page,14.61,121.03);
  gpsAge=0;await refresh();await page.locator('.map-vehicle .online').waitFor();
  const previousMarker=await page.locator('.map-vehicle').getAttribute('style');hardwareFix={...hardwareFix,longitude:121.032};await refresh();
  await page.waitForFunction(previous=>document.querySelector('.map-vehicle')?.getAttribute('style')!==previous,previousMarker);
  await assertPosition(page,14.61,121.03);
  await page.getByRole('button',{name:'Show vehicles',exact:true}).click();await assertPosition(page,14.61,121.032);
  hardwareFix={...hardwareFix,latitude:999};await refresh();await page.getByText('No valid GPS positions',{exact:true}).waitFor();assert.equal(await page.locator('.map-vehicle').count(),0);await assertPosition(page,14.5995,120.9842);
  hardwareFix=null;model='Unspecified model';await refresh();await page.getByRole('button',{name:'Metro Manila reference',exact:true}).waitFor();await assertPosition(page,14.5995,120.9842,12);
  emptyFleet=true;await refresh();await page.getByText('No assigned vehicles. Showing Metro Manila as a reference.',{exact:true}).waitFor();await assertPosition(page,14.5995,120.9842,12);
  assert.ok(tileReferrers.length>0);assert.ok(tileReferrers.every(value=>value===new URL(base).origin+'/'));assert.deepEqual(errors,[]);
  console.log('PASS '+width+'px: BEMAC/Manila, NWOW/Malabon, vehicle switching, GPS priority, first fix, preserved zoom, invalid GPS and unassigned fallback');
  await page.close();
  // Driver Location uses the assigned vehicle model, not a signup preference.
  const driver=await browser.newPage({viewport:{width,height:1050}});
  let driverModel='NWOW';
  await driver.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"/>'}));
  await driver.route(/\/api\/fleet\?/,route=>route.fulfill({json:[{id:'ET-01',name:'Driver assigned vehicle',model:driverModel,image_url:'/bemac-white.png',driver_name:'Map test driver',driver_id:'driver',device_id:'SOL-ET-01',status:'Never connected',nominal_voltage:60,nominal_capacity:100,solar_wh:null,wind_wh:null,telemetry:null,gps:null}]}));
  await driver.goto(base);if(width<=650)await driver.getByRole('button',{name:'Get started',exact:true}).click();await driver.getByLabel('Email address').fill('driver@solair.local');await driver.getByLabel('Password',{exact:true}).fill('SolairDemo!2026');await driver.getByRole('button',{name:'Sign in',exact:true}).click();
  await driver.getByRole('button',{name:'Open account menu',exact:true}).waitFor();
  if(width<768)await driver.getByRole('button',{name:'Toggle menu'}).click();
  await driver.locator('.sidebar nav').getByRole('button',{name:'Location',exact:true}).click();await driver.getByRole('button',{name:'Malabon reference',exact:true}).waitFor();await assertPosition(driver,14.668,120.965);
  driverModel='BEMAC 68VM';const changed=driver.waitForResponse(r=>r.url().includes('/api/fleet?'));await driver.getByRole('button',{name:'Refresh',exact:true}).click();await changed;await driver.getByRole('button',{name:'Manila reference',exact:true}).waitFor();await assertPosition(driver,14.5995,120.9842);
  assert.equal(await driver.locator('.map-vehicle').count(),0);await driver.close();console.log('PASS '+width+'px: driver assigned vehicle reference switches without inventing GPS');
 }
}finally{await browser.close();}
