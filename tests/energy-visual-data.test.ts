import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Telemetry} from '../packages/telemetry-contract';
import {chartSegments,electricalValue,energySeries,parseEnergyHistory,sourcePower} from '../src/energy-visual-data';
const base=Date.now()-120000;
const frame=(sequence=0,overrides:Record<string,unknown>={})=>({device_id:'TEST-FIXTURE',boot_id:'test',sequence,source_type:'hardware',calibration_status:'calibrated',device_timestamp:new Date(base+sequence*1000).toISOString(),solar_voltage_v:38,solar_current_a:2,solar_output_voltage_v:54,solar_output_current_a:1,wind_voltage_v:10,wind_current_a:2,...overrides}) as Telemetry;

test('Energy visuals use their own electrical channels and retain zeroes',()=>{
 assert.equal(electricalValue(frame(0,{solar_current_a:0}),'solar_current_a'),0);
 assert.equal(sourcePower(frame(),'solar'),76);
 assert.equal(electricalValue(frame(),'solar_output_voltage_v'),54);
 assert.equal(sourcePower(frame(0,{solar_voltage_v:null,solar_current_a:null,cpe:{pzem:{power_w:999}}}),'solar'),null);
 assert.equal(sourcePower(frame(0,{calibration_status:'unverified'}),'solar'),null);
 assert.equal(electricalValue(frame(0,{solar_voltage_v:Infinity}),'solar_voltage_v'),null);
});
test('History windows exclude wrong modes, recovered events, invalid times and duplicates',()=>{
 const rows=Array.from({length:35},(_,i)=>({payload:JSON.stringify(frame(i))}));
 rows.push(rows[0],{payload:'invalid'},{payload:JSON.stringify(frame(40,{source_type:'demo'}))},{payload:JSON.stringify(frame(41,{cpe:{historical:true}}))},{payload:JSON.stringify(frame(42,{event_id:'recovered'}))},{payload:JSON.stringify(frame(43,{device_timestamp:null}))},{payload:JSON.stringify(frame(44,{device_timestamp:new Date(Date.now()+60000).toISOString()}))});
 const result=parseEnergyHistory(rows.reverse(),'hardware');assert.equal(result.length,24);assert.equal(result[0].t.sequence,11);assert.equal(result.at(-1)!.t.sequence,34);
});
test('Charts break at unavailable readings and long gaps instead of interpolating them',()=>{
 const result=chartSegments([{at:0,value:10},{at:15000,value:11},{at:60000,value:12},{at:65000,value:null},{at:70000,value:13}]);
 assert.deepEqual(result.map(segment=>segment.length),[2,1,1]);
});
test('Wind window energy integrates only valid short intervals and is distinct from full recorded totals',()=>{
 const samples=[0,15000,60000,75000].map((at,i)=>({at:base+at,t:frame(i)}));
 const points=energySeries(samples,'wind_window_wh');assert.equal(points[0].value,null);assert.equal(points[2].value,null);
 assert.ok(Math.abs(points[1].value!-20*15/3600)<1e-9);assert.ok(Math.abs(points[3].value!-40*15/3600)<1e-9);
 const zero=energySeries(samples.slice(0,2).map(s=>({...s,t:frame(0,{wind_current_a:0})})),'wind_window_wh');assert.equal(zero[1].value,0);
 const missing=energySeries(samples.slice(0,3).map((s,i)=>({...s,t:frame(i,{wind_current_a:i===1?null:2})})),'wind_window_wh');assert.ok(missing.every(p=>p.value===null));
});


test('Home solar energy integrates its own calibrated channel without bridging missing intervals',()=>{
 const samples=[0,15000,60000,75000].map((at,i)=>({at:base+at,t:frame(i)}));
 const points=energySeries(samples,'solar_window_wh');
 assert.equal(points[0].value,null);assert.equal(points[2].value,null);
 assert.ok(Math.abs(points[1].value!-76*15/3600)<1e-9);
 assert.ok(Math.abs(points[3].value!-76*30/3600)<1e-9);
 assert.ok(energySeries(samples.map(s=>({...s,t:frame(0,{calibration_status:'unverified'})})),'solar_window_wh').every(p=>p.value===null));
});

test('Battery trends retain signed current and zero, and mask unverified hardware',()=>{
 const samples=[{at:base,t:frame(0,{battery_voltage_v:72.4,battery_current_a:-2.3})},{at:base+1000,t:frame(1,{battery_voltage_v:0,battery_current_a:0})},{at:base+2000,t:frame(2,{battery_voltage_v:75,calibration_status:'unverified'})}];
 assert.deepEqual(energySeries(samples,'battery_voltage_v').map(p=>p.value),[72.4,0,null]);
 assert.deepEqual(energySeries(samples.slice(0,2),'battery_current_a').map(p=>p.value),[-2.3,0]);
});
