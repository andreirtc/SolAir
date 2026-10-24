import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import DriverEnergySummary from '../src/DriverEnergySummary';
import type {Vehicle} from '../src/types';

const vehicle:Vehicle={id:'TEST-ENERGY',name:'Fixture',model:'BEMAC',image_url:'/bemac-white.png',driver_name:null,driver_id:null,device_id:null,status:'Offline',nominal_voltage:72,nominal_capacity:100,solar_wh:null,wind_wh:null,telemetry:null,gps:null};
function render(overrides:Partial<Vehicle>={}){return renderToStaticMarkup(createElement(DriverEnergySummary,{vehicle:{...vehicle,...overrides},mode:'hardware',go:()=>{}}));}
function telemetry(overrides:Record<string,unknown>={}){return {source_type:'hardware',calibration_status:'calibrated',device_timestamp:new Date().toISOString(),received_at:new Date().toISOString(),sensor_health:{},sensor_age_ms:{},battery_voltage_v:72.4,battery_current_a:-2.3,solar_voltage_v:40,solar_current_a:2,...overrides} as NonNullable<Vehicle['telemetry']>;}

test('Home energy cards do not fabricate zeroes or remaining battery percentages',()=>{
 const html=render();assert.ok(html.includes('No reading'));assert.ok(html.includes('Not commissioned'));assert.ok(!html.includes('0.0'));assert.ok(!html.includes('%'));
});
test('Home energy cards retain signed current, valid zero totals and derived PV watts',()=>{
 const html=render({telemetry:telemetry(),solar_wh:0,wind_wh:1.25});
 for(const text of ['72.4','-2.3','80.0','0.00','1.25','Recorded total'])assert.ok(html.includes(text),text);
});
test('Uncalibrated hardware hides electrical numbers while retaining recorded history totals',()=>{
 const html=render({telemetry:telemetry({calibration_status:'unverified'}),solar_wh:12.5});
 assert.ok(html.includes('Calibration needed'));assert.ok(html.includes('12.50'));for(const text of ['72.4','-2.3','80.0'])assert.ok(!html.includes(text),text);
});
test('Old and unknown capture times are labeled rather than presented as live',()=>{
 assert.ok(render({telemetry:telemetry({device_timestamp:new Date(Date.now()-120000).toISOString()})}).includes('Old reading'));
 assert.ok(render({telemetry:telemetry({device_timestamp:null})}).includes('Time unknown'));
});
