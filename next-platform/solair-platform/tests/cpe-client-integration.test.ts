import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hasMapPosition,hasFreshMapPosition} from '../src/map-reference';
import {parseLocationHistory,locationTrack} from '../src/location-history';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import CpeReadings from '../src/CpeReadings';
import {telemetrySchema,type Telemetry} from '../packages/telemetry-contract';
import type {Vehicle} from '../src/types';

const at=Date.parse('2026-10-28T12:00:00Z');
const iso=(offset=0)=>new Date(at+offset).toISOString();
const gps={quality:'ok',hdop:1.2,last_byte_age_ms:100};
const vehicle=(changes:Record<string,unknown>={}):Vehicle=>({
 id:'TEST-GPS',name:'TEST FIXTURE',model:'BEMAC',image_url:'/bemac-white.png',driver_name:null,driver_id:null,device_id:'TEST-GPS',status:'Online',nominal_voltage:48,nominal_capacity:10,solar_wh:null,wind_wh:null,
 gps:{latitude:14.6,longitude:121,measured_at:iso()},
 telemetry:{gps_fix:true,gps_fix_age_ms:500,satellites:8,latitude:14.6,longitude:121,transport:'lte',device_timestamp:iso(),received_at:iso(),measured_at:iso(),cpe:{historical:false,gps},...changes} as Vehicle['telemetry'],
});

test('map retains a reliable historical marker while live state ages without another fetch',()=>{
 const v=vehicle();assert.equal(hasMapPosition(v),true);
 assert.equal(hasFreshMapPosition(v,at+9000),true);
 assert.equal(hasFreshMapPosition(v,at+10000),false);
 assert.equal(hasMapPosition(v),true,'Staleness does not discard the labelled last-known position');
 assert.equal(hasFreshMapPosition(vehicle({measured_at:iso(-60000)}),at),false,'A recent upload cannot refresh an old measurement');
 assert.equal(hasFreshMapPosition(vehicle({received_at:'invalid'}),at),false);
});

test('GPS quality, invalid fixes and historical events cannot become a live map marker',()=>{
 for(const change of [{gps_fix:false},{satellites:3},{gps_fix_age_ms:5001},{cpe:{historical:false,gps:{...gps,hdop:8}}},{cpe:{historical:true,gps}},{cpe:{historical:false,gps:{...gps,quality:'fault'}}}]){
  assert.equal(hasFreshMapPosition(vehicle(change),at+1000),false);
 }
});

test('receipt-derived or future GPS timestamps cannot become a live position',()=>{
 assert.equal(hasFreshMapPosition(vehicle({device_timestamp:null}),at+1000),false);
 for(const key of ['device_timestamp','measured_at','received_at'])assert.equal(hasFreshMapPosition(vehicle({[key]:iso(30000)}),at+1000),false);
 const v=vehicle();v.gps!.measured_at=iso(30000);assert.equal(hasFreshMapPosition(v,at+1000),false);
});

test('CPE GPS freshness requires actual recent capture time, independently of recent receipt',()=>{
 // No CPE block is needed to exercise the legacy GPS path and its rendered label.
 const legacy=telemetrySchema.parse({schema_version:1,device_id:'TEST-GPS',firmware_version:'TEST FIXTURE legacy GPS',
  source_type:'hardware',transport:'usb',boot_id:'TEST-BOOT',sequence:1,device_uptime_ms:1000,sensor_health:{gps:'ok'},
  gps_fix:true,gps_fix_age_ms:500,satellites:8,latitude:14.6,longitude:121,device_timestamp:new Date().toISOString()});
 const render=(changes:Partial<Telemetry>)=>renderToStaticMarkup(createElement(CpeReadings,{t:{...legacy,...changes},reportFresh:true}));
 assert.match(render({}),/Fresh position reported/);
 for(const capture of [null,new Date(Date.now()+30000).toISOString()]){
  const html=render({device_timestamp:capture});assert.match(html,/Position time is unknown or invalid/);assert.doesNotMatch(html,/Fresh position reported/);
 }
 const stale=render({device_timestamp:new Date(Date.now()-15000).toISOString()});assert.match(stale,/Position is stale or has low quality/);assert.doesNotMatch(stale,/Fresh position reported/);
});

test('recorded tracks preserve gaps at rejected HDOP/satellite fixes instead of bridging them',()=>{
 const row=(sequence:number,changes:Record<string,unknown>={})=>({payload:JSON.stringify({device_id:'TEST-GPS',boot_id:'TEST-BOOT',sequence,source_type:'hardware',device_timestamp:iso(sequence*2000),gps_fix:true,gps_fix_age_ms:200,satellites:8,latitude:14.6+sequence/100000,longitude:121,cpe:{historical:false,gps},...changes})});
 for(const invalid of [{satellites:3},{gps_fix_age_ms:5001},{cpe:{historical:false,gps:{...gps,hdop:9}}}]){
  const samples=parseLocationHistory([row(0),row(1,invalid),row(2)],'hardware',at+60000);
  assert.equal(samples[1].latitude,null);assert.equal(locationTrack(samples).length,2);
 }
 const event=parseLocationHistory([row(1,{event_id:'offline-event',cpe:{historical:true,gps}})],'hardware',at+60000);
 assert.deepEqual(event,[]);
});
