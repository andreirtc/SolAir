import {test} from 'node:test';
import assert from 'node:assert/strict';
import {inferRecordedStays,parseLocationHistory,locationTrack,stopLegs,trackDistance,mergeLocationSamples,locationTime} from '../src/location-history';
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
test('stop duration filter changes detected points without inventing longer stops',()=>{
 const samples=parseLocationHistory([row(0),row(1),row(2)],'hardware',now);
 assert.equal(inferRecordedStays(samples,60000).length,1);assert.equal(inferRecordedStays(samples,300000).length,0);
});
test('GPS track and stop-to-stop distance sum only the recorded connecting points',()=>{
 const samples=parseLocationHistory(Array.from({length:7},(_,i)=>row(i,{latitude:0,longitude:i<3?0:i===3?.0006:.002})),'hardware',now);
 const segments=locationTrack(samples),stays=inferRecordedStays(samples),legs=stopLegs(samples,stays);
 assert.equal(segments.length,1);assert.equal(stays.length,2);assert.equal(legs.length,1);assert.ok(Math.abs(legs[0].distanceMeters!-222.39)<.02);assert.ok(Math.abs(trackDistance(segments)-222.39)<.02);
 assert.equal(legs[0].from.start,start);assert.equal(legs[0].to.start,start+240000);
});
test('missing fixes, long gaps and implausible jumps break the track and withhold connecting distance',()=>{
 const rows=Array.from({length:7},(_,i)=>row(i,{latitude:0,longitude:i<3?0:.001,...(i===3?{gps_fix:false}:{})}));
 const samples=parseLocationHistory(rows,'hardware',now);assert.equal(locationTrack(samples).length,2);assert.equal(stopLegs(samples,inferRecordedStays(samples))[0].distanceMeters,null);
 assert.equal(locationTrack([{at:0,latitude:0,longitude:0},{at:400000,latitude:0,longitude:.001}]).length,2);
 assert.equal(locationTrack([{at:0,latitude:0,longitude:0},{at:1000,latitude:1,longitude:1}]).length,2);
});
test('cached report windows remain bounded and time formatting uses Manila with seconds',()=>{
 const samples=Array.from({length:600},(_,i)=>({at:start+i*1000,latitude:0,longitude:0}));
 const merged=mergeLocationSamples(samples.slice(0,400),samples.slice(300));assert.equal(merged.length,500);assert.equal(merged[0].at,start+100000);
 assert.match(locationTime(start),/2026/);assert.match(locationTime(start),/8:00:00/);
});
