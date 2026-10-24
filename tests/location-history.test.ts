import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inferRecordedStays,parseLocationHistory} from '../src/location-history';
const start=Date.parse('2026-10-20T00:00:00Z'),now=start+3600000;
const row=(sequence:number,extra:Record<string,unknown>={})=>({payload:JSON.stringify({device_id:'fixture',boot_id:'boot',sequence,device_timestamp:new Date(start+sequence*60000).toISOString(),source_type:'hardware',gps_fix:true,gps_fix_age_ms:0,latitude:14.6,longitude:120.98,...extra})});
test('stays require multiple fresh fixes across two minutes and retain real zero coordinates',()=>{
 assert.equal(inferRecordedStays(parseLocationHistory([row(0),row(1)],'hardware',now)).length,0);
 const stays=inferRecordedStays(parseLocationHistory([row(2,{latitude:0,longitude:0}),row(0,{latitude:0,longitude:0}),row(1,{latitude:0,longitude:0})],'hardware',now));
 assert.equal(stays.length,1);assert.equal(stays[0].latitude,0);assert.equal(stays[0].end-stays[0].start,120000);
});
test('moving positions, missing fixes, stale fixes and long gaps cannot imply a continuous stay',()=>{
 for(const rows of [[row(0),row(1,{latitude:14.7}),row(2)],[row(0),row(1,{gps_fix:false}),row(2)],[row(0),row(1,{gps_fix_age_ms:30001}),row(2)],[row(0),row(6),row(7)]])assert.equal(inferRecordedStays(parseLocationHistory(rows,'hardware',now)).length,0);
});
test('mode, recovered/event data, invalid coordinates and duplicate cached fixes are excluded',()=>{
 const filtered=parseLocationHistory([row(0,{source_type:'demo'}),row(1,{cpe:{historical:true}}),row(2,{event_id:'event'}),row(3,{device_timestamp:new Date(now+1).toISOString()}),{payload:'invalid'}],'hardware',now);
 assert.deepEqual(filtered,[]);
 assert.equal(parseLocationHistory([row(0,{latitude:91})],'hardware',now)[0].latitude,null);
 assert.equal(inferRecordedStays(parseLocationHistory([row(0),row(0),row(0)],'hardware',now)).length,0);
 assert.equal(parseLocationHistory([row(0,{gps_fix_age_ms:1000})],'hardware',now)[0].at,start-1000);
});
test('separate recorded places remain separate and newest appears first',()=>{
 const rows=[row(0),row(1),row(2),row(3,{latitude:14.7}),row(4,{latitude:14.7}),row(5,{latitude:14.7})];
 const stays=inferRecordedStays(parseLocationHistory(rows,'hardware',now));assert.equal(stays.length,2);assert.ok(stays[0].start>stays[1].start);assert.ok(Math.abs(stays[0].latitude-14.7)<.000001);
});
