import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readHelpQueue, saveHelpQueue, helpQueueReadError, helpQueueWriteError, type QueuedHelpItem} from '../src/help-queue';
function storage() { const values = new Map<string,string>(); return {values, getItem:(key:string)=>values.get(key)??null, setItem:(key:string,value:string)=>{values.set(key,value);}}; }
const item:QueuedHelpItem={mode:'hardware',body:{id:'TEST FIXTURE request',vehicle_id:'TEST FIXTURE vehicle',type:'Mechanical assistance',notes:'TEST FIXTURE notes'}};
test('Saved assistance requests round-trip without sharing another account queue',()=>{
 const store=storage();saveHelpQueue(store,'solair-unsent-first',[item]);
 assert.deepEqual(readHelpQueue(store,'solair-unsent-first'),[item]);assert.deepEqual(readHelpQueue(store,'solair-unsent-second'),[]);
});
test('Corrupt JSON is reported without deleting or replacing the stored request data',()=>{
 const store=storage();store.setItem('queue','{broken');assert.throws(()=>readHelpQueue(store,'queue'),{message:helpQueueReadError});assert.equal(store.getItem('queue'),'{broken');
});
test('Malformed queued records cannot crash a flush or silently discard valid neighbours',()=>{
 for(const value of [null,{},[null],[item,{mode:'hardware',body:{notes:'incomplete'}}],[{...item,mode:'unknown'}]]){
  const store=storage(),raw=JSON.stringify(value);store.setItem('queue',raw);assert.throws(()=>readHelpQueue(store,'queue'),{message:helpQueueReadError});assert.equal(store.getItem('queue'),raw);
 }
});
test('Blocked storage and exhausted quota produce safe errors rather than a false saved result',()=>{
 const store={getItem:()=>{throw new Error('TEST FIXTURE blocked');},setItem:()=>{throw new Error('TEST FIXTURE quota');}};
 assert.throws(()=>readHelpQueue(store,'queue'),{message:helpQueueReadError});assert.throws(()=>saveHelpQueue(store,'queue',[item]),{message:helpQueueWriteError});
});
