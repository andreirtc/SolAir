import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createElement} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import RecordedLineChart from '../src/RecordedLineChart';
import type {EnergyPoint} from '../src/energy-visual-data';
const render=(points:EnergyPoint[])=>renderToStaticMarkup(createElement(RecordedLineChart,{points,label:'Battery voltage',unit:'V'}));
test('Recorded line chart is absent without valid measurements',()=>assert.equal(render([{at:0,value:null}]),''));
test('One sample is an honest point without an invented trend',()=>{const html=render([{at:0,value:0}]);assert.ok(html.includes('One sample · no trend'));assert.ok(!html.includes('recorded-line-chart-trend'));assert.ok(!html.includes('NaN'));});
test('Line paths break at missing readings and long time gaps',()=>{
 const html=render([{at:0,value:70},{at:10000,value:71},{at:20000,value:null},{at:25000,value:72},{at:35000,value:73},{at:90000,value:74}]);
 assert.equal((html.match(/class="recorded-line-chart-trend"/g)||[]).length,2);
 assert.ok(html.includes('5 samples'));assert.ok(!html.includes('NaN'));
});
