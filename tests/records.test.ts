import test from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE as sample } from '../lib/content';
const SAMPLE = {...sample, portrait:'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1kAAAAASUVORK5CYII='};
import { changeRecord, newRecord, publicContent } from '../lib/records';
test('member IDs and slugs are unique and stable across name edits',()=>{
 const a=newRecord(SAMPLE), b=newRecord(SAMPLE);
 assert.notEqual(a.id,b.id);
 const edit=changeRecord(a,'save',{...SAMPLE,name:'Another name'});
 assert.equal(edit.slug,a.slug); assert.equal(edit.id,a.id); assert.deepEqual(b.draft,SAMPLE);
});
test('draft edits cannot change published snapshot; unpublish and delete revoke access',()=>{
 let a=newRecord(SAMPLE); assert.equal(publicContent(a),null);
 a=changeRecord(a,'publish',SAMPLE);
 const saved=changeRecord(a,'save',{...SAMPLE,story:'Private revision'});
 assert.equal(publicContent(saved)?.story,SAMPLE.story);
 assert.equal(saved.draft!.story,'Private revision');
 assert.equal(publicContent(changeRecord(saved,'unpublish')),null);
 const deleted=changeRecord(saved,'delete');
 assert.equal(publicContent(deleted),null);
 assert.equal(deleted.draft,null);
 assert.throws(()=>changeRecord(deleted,'publish',SAMPLE));
});
