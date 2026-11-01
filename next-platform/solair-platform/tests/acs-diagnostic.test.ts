import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Telemetry} from '../packages/telemetry-contract';
import {acsUncalibratedDisplay} from '../src/acsDiagnostic';
const sample=()=>({source_type:'hardware',acs_output_v:2.40025,battery_current_a:null,calibration_status:'unverified',cpe:{historical:false,acs:{quality:'uncalibrated',current_a:null,adc_mv:1200.125,zero_v:2.34,sensitivity_v_per_a:0.04,adc_source:'ads1115_a1',adc_diagnostic:'ok_A1_config_0xD383_verified',adc_age_ms:20}}}) as Telemetry;
test('as-is amperes are display-only and keep all original flags/current values',()=>{
  const t=sample(),before=JSON.stringify(t),r=acsUncalibratedDisplay(t,true);
  assert.ok(r);assert.ok(Math.abs(r.currentA-1.50625)<1e-10);assert.equal(JSON.stringify(t),before);
  assert.equal(t.battery_current_a,null);assert.equal(t.cpe?.acs.current_a,null);assert.equal(t.calibration_status,'unverified');
  t.acs_output_v=2.30;assert.ok(acsUncalibratedDisplay(t,true)!.currentA<0,'no suppression of negative values or zero drift');
});
test('stale, unavailable, historical, absent coefficients and invalid/out-of-range inputs never become estimates',()=>{
  assert.equal(acsUncalibratedDisplay(sample(),false),null);assert.equal(acsUncalibratedDisplay(null,true),null);
  for(const change of [{quality:'fault'},{quality:'ok'},{adc_age_ms:501},{adc_age_ms:null},{adc_mv:0},{adc_mv:3300},{zero_v:null},{sensitivity_v_per_a:0},{sensitivity_v_per_a:null},{adc_diagnostic:'ADS1115_unavailable'},{adc_source:undefined}]){
    const t=sample();Object.assign(t.cpe!.acs,change);assert.equal(acsUncalibratedDisplay(t,true),null,JSON.stringify(change));
  }
  for(const out of [null,NaN,Infinity,6,0]){const t=sample();t.acs_output_v=out;assert.equal(acsUncalibratedDisplay(t,true),null);}
  const historical=sample();historical.cpe!.historical=true;assert.equal(acsUncalibratedDisplay(historical,true),null);
  const demo=sample();demo.source_type='demo';assert.equal(acsUncalibratedDisplay(demo,true),null);
});
