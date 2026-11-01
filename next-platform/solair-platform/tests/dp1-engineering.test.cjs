const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const filename=path.join(__dirname,'../docs/visual-workbench/dp1-hub/calculation-controls.js');
const evidence=JSON.parse(fs.readFileSync(path.join(path.dirname(filename),'calculation-evidence.json'),'utf8'));
const context={module:{exports:{}},globalThis:{SolairCalculationEvidence:evidence}};vm.runInNewContext(fs.readFileSync(filename,'utf8'),context);
const {compute,defaults,markdown}=context.module.exports;
assert.deepEqual(evidence.parameters.map(p=>p.key).sort(),Object.keys(defaults).sort(),'Every adjustable input needs provenance');
assert.equal(new Set(evidence.parameters.map(p=>p.key)).size,evidence.parameters.length);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const base=compute();
near((27.6*2)*(40*2),1104*4);near(4416/480,9.2);
near(base.arrayCurrent,400/39.38);near(base.solarBus,264.6);near(base.prototypeInput,109.2);
near(base.rangeProxy,73.6);near(base.referencePower,1472);
near(base.daySolar,1058.4);near(base.dayAux,12/.85*24+24);
near(base.netDay,645.68);near(base.protoNetDay,5);
near(base.protoWindow,89.37823529411766);
near(base.addedMinutes,base.addedKm/20*60);
near(base.protoWindowPercent/base.protoSameWhBemacPercent,9.2);
// Conservation with all efficiencies ideal and no loads: energy equals available input.
const ideal=compute({field:100,wire:100,mppt:100,buck:100,store:100,cpeW:0,otherW:0});
near(ideal.netDay,400*4);near(ideal.protoWindow,Math.min(400,54.6*2));assert.equal(ideal.protoRuntime,null);
// Zero irradiance cannot charge the battery, and counts every auxiliary hour once.
const dark=compute({psh:0});near(dark.netDay,-dark.dayAux);near(dark.protoNetDay,-dark.dayAux);
const noArray=compute({pvW:0});near(noArray.netDay,-noArray.dayAux);assert.equal(noArray.proto20to80,null);
// Direct-solar CPE consumption is not charged and discharged a second time.
const simple=compute({pvW:100,field:100,wire:100,mppt:100,buck:100,store:100,psh:4,cpeW:10,cpeHours:24,otherW:0});near(simple.netDay,400-240);
const chargeLoss=compute({pvW:100,field:100,wire:100,mppt:100,buck:100,store:50,psh:4,cpeW:10,cpeHours:24,otherW:0});near(chargeLoss.netDay,(100-10)*4*.5-10*20);
const daytimeOnly=compute({pvW:100,field:100,wire:100,mppt:100,buck:100,store:100,psh:4,cpeW:10,cpeHours:2,otherW:0});near(daytimeOnly.netDay,400-20);
near(compute({addedPenaltyWh:100}).netDay,base.netDay-100);
assert.ok(compute({cpeW:60}).netDay<0,'High parasitic demand must be allowed to erase benefit');
assert.ok(compute({protoLimit:0}).protoWindow<0,'No charge-current allowance means net battery discharge');
for(const bad of [{buck:0},{store:101},{vmp:0},{psh:25},{cpeW:-1},{cpeW:NaN}])assert.throws(()=>compute(bad));
const exported=markdown(defaults,base);assert.match(exported,/4416 Wh/);assert.match(exported,/645\.6800/);assert.match(exported,/not measured|not physical/i);assert.match(exported,/design search targets/);assert.match(exported,/5\/48 = 0.1042 A/);
for(const p of evidence.parameters){assert.ok(p.origin&&p.replace&&p.kind&&p.unit,p.key);assert.ok(exported.includes(p.origin),p.key+' source missing from export');}
assert.match(markdown({...defaults,cpeW:10},compute({cpeW:10})),/USER-EDITED/);
// Wind accounting is an explicit hypothetical scenario, not hardware acceptance.
near(base.windArea,.54);near(base.parkedWind,7.0284375);
near(base.hybridDay,672.3880625);near(base.hybridIncrement,7.0284375*4*.95);
near(base.ridingWindIncrement,base.ridingWindGross-base.ridingDragWh);
assert.ok(base.ridingWindIncrement<0,'Still-air turbine drag must exceed recovered electrical energy');
near(base.ridingSolarAssist,base.ridingSolarFlow-base.ridingBaseline);
near(base.ridingHybridAssist,base.ridingHybridFlow-base.ridingBaseline);
near(base.prototypeHybridWindow,base.protoWindow); // Solar already reaches the chosen source cap.
const noWind=compute({windSpeed:0});near(noWind.hybridDay,noWind.netDay);
const noWindTime=compute({windHours:0});near(noWindTime.hybridDay,noWindTime.netDay);
const noRide=compute({rideHours:0});near(noRide.ridingSolarFlow,noRide.netDay);near(noRide.ridingWindIncrement,0);
const idealWind=compute({store:100,windHours:24});near(idealWind.hybridDay-idealWind.netDay,idealWind.parkedWind*24);
const nonOverlap=compute({psh:0,cpeHours:3,windHours:5});
const expected= (nonOverlap.parkedWind-nonOverlap.auxBus)*3+(nonOverlap.parkedWind-1)*2*.95-19;
near(nonOverlap.hybridDay,expected); // independent window accounting; no double-counted CPE
near(compute({addedPenaltyWh:100}).hybridDay,base.hybridDay-100);
near(compute({addedPenaltyWh:100}).ridingHybridAssist,base.ridingHybridAssist-100);
assert.ok(compute({headwind:2}).apparentWind>base.apparentWind);
for(const bad of [{cp:.6},{ct:.1},{windH:0},{windSpeed:13},{rideHours:25},{headwind:20},{genEfficiency:0}])assert.throws(()=>compute(bad));
assert.match(exported,/solar versus solar/);assert.match(exported,/672\.3881/);assert.match(exported,/Component selection and justification/);assert.match(exported,/not a fitted or measured curve/i);
console.log('PASS: 2S2P arithmetic, reference scenario, current cap, energy conservation, storage-boundary accounting, negative benefit, invalid input and reproducible export. Software calculations only.');
