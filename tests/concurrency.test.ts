import test from 'node:test';
import assert from 'node:assert/strict';
import { conditionalUpdate, reserveAttempt, type ConditionalStore } from '../lib/concurrency';
import { newRecord, changeRecord, type NewspaperRecord } from '../lib/records';
import { SAMPLE } from '../lib/content';
import type { Attempts } from '../lib/auth-core';
const content={...SAMPLE,portrait:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1kAAAAASUVORK5CYII='};
function memory<T>(initial:T|undefined):ConditionalStore<T>{
 let value=initial,revision=initial?1:0;
 return {async read(){return value?{value:structuredClone(value),etag:String(revision)}:null;},async write(next,expected){if((expected===undefined && value!==undefined) || (expected!==undefined && expected!==String(revision)))throw new Error('Conflict');value=structuredClone(next);return String(++revision);}};
}
test('stale revisions reject without changing any data',async()=>{
 const store=memory(newRecord(content));
 await assert.rejects(conditionalUpdate(store,'stale',r=>changeRecord(r,'save',{...content,name:'Changed'})),/changed/);
 assert.equal((await store.read())!.value.draft!.name,content.name);
});
test('two same-revision saves admit one winner, preserving the other member',async()=>{
 const a=memory(newRecord(content)),b=memory(newRecord({...content,name:'Member B'}));
 const results=await Promise.allSettled(['First','Second'].map(name=>conditionalUpdate(a,'1',r=>changeRecord(r,'save',{...content,name}))));
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 assert.equal((await b.read())!.value.draft!.name,'Member B');
});
test('unpublish and delete racing with stale saves cannot be undone',async()=>{
 for(const operation of ['unpublish','delete'] as const){
  const store=memory<NewspaperRecord>(changeRecord(newRecord(content),'publish',content));
  const results=await Promise.allSettled([conditionalUpdate(store,'1',r=>changeRecord(r,operation)),conditionalUpdate(store,'1',r=>changeRecord(r,'save',content))]);
  assert.equal(results[0].status,'fulfilled');assert.equal(results[1].status,'rejected');
  assert.equal((await store.read())!.value.published,null);
 }
});
test('concurrent durable login reservations fail closed, including first creation',async()=>{
 for(const initial of [undefined,{start:1000,count:0}]){
  const store=memory<Attempts>(initial);
  const results=await Promise.allSettled([reserveAttempt(store,1001),reserveAttempt(store,1001)]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await store.read())!.value.count,1);
 }
});
