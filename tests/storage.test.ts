import test from 'node:test';
import assert from 'node:assert/strict';
import { mockBlob } from './helpers/blob-mock.mjs';
import { createRecord, readRecord, updateRecord } from '../lib/store';
import { publicContent, newRecord } from '../lib/records';
import { SAMPLE } from '../lib/content';
import { GET as photoRoute } from '../app/api/portrait/[id]/route';
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1kAAAAASUVORK5CYII=';
const content={...SAMPLE,portrait:photo,groupPhoto:photo,memoryPhoto:photo};
test('legacy portrait-only records remain readable and draft saves preserve their published snapshot',async()=>{
 const mock=mockBlob();
 try{
  const legacyContent={...content};Reflect.deleteProperty(legacyContent,'groupPhoto');Reflect.deleteProperty(legacyContent,'memoryPhoto');
  const legacy={...newRecord(content),draft:legacyContent,published:legacyContent};
  mock.objects.set(`newspapers/${legacy.id}.json`,{body:JSON.stringify(legacy),etag:'"legacy"'});
  const read=(await readRecord(legacy.id))!;assert.deepEqual(read.value,legacy);
  const saved=await updateRecord(legacy.id,'save',read.etag,legacyContent);
  assert.equal(saved.record.id,legacy.id);assert.equal(saved.record.slug,legacy.slug);
  assert.deepEqual(saved.record.published,legacyContent);assert.equal(saved.record.draft!.groupPhoto,'');
 }finally{await mock.close();}
});
test('real SDK save, reload, publish and photo replacement preserve revisions and public snapshots',async()=>{
 const mock=mockBlob();
 try {
  const created=await createRecord(content,'save');const id=created.record.id;
  const context={params:Promise.resolve({id})};
  assert.equal(publicContent(created.record),null);
  for(const slot of ['portrait','groupPhoto','memoryPhoto'])assert.equal((await photoRoute(new Request(`http://localhost/api/portrait/${id}?slot=${slot}`),context)).status,404);
  const reloaded=(await readRecord(id))!;
  assert.equal(reloaded.etag,created.etag);assert.deepEqual(reloaded.value.draft,content);
  const published=await updateRecord(id,'publish',reloaded.etag,reloaded.value.draft);
  assert.equal(published.record.slug,created.record.slug);assert.deepEqual(publicContent(published.record),content);
  for(const slot of ['portrait','groupPhoto','memoryPhoto']){
   const response=await photoRoute(new Request(`http://localhost/api/portrait/${id}?slot=${slot}`),context);
   assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/png');assert.ok((await response.arrayBuffer()).byteLength>0);
  }
  assert.equal((await photoRoute(new Request(`http://localhost/api/portrait/${id}?slot=draft`),context)).status,404);
  const saved=await updateRecord(id,'save',published.etag,{...content,groupPhoto:'',story:'Private replacement'});
  assert.equal(saved.record.draft!.groupPhoto,'');assert.equal(saved.record.draft!.portrait,photo);assert.equal(saved.record.published!.groupPhoto,photo);
  await assert.rejects(updateRecord(id,'publish',published.etag,content),/changed in another tab/);
  assert.equal((await readRecord(id))!.value.draft!.story,'Private replacement');
  const races=await Promise.allSettled(['First writer','Second writer'].map(story=>updateRecord(id,'save',saved.etag,{...content,story})));
  assert.equal(races.filter(result=>result.status==='fulfilled').length,1);
  const current=(await readRecord(id))!;await updateRecord(id,'unpublish',current.etag);
  assert.equal((await photoRoute(new Request(`http://localhost/api/portrait/${id}?slot=groupPhoto`),context)).status,404);
 } finally {await mock.close();}
});
