import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, SAMPLE, LIMITS } from '../lib/content';
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jJ1kAAAAASUVORK5CYII=';
test('three independent photos survive validation; legacy records default missing slots',()=>{
 const legacy=validateContent({...SAMPLE,portrait:photo});
 assert.equal(legacy.groupPhoto,'');assert.equal(legacy.memoryPhoto,'');
 const current=validateContent({...SAMPLE,portrait:photo,groupPhoto:photo,memoryPhoto:photo});
 assert.equal(current.groupPhoto,photo);assert.equal(current.memoryPhoto,photo);
 for(const key of ['groupPhoto','memoryPhoto'])for(const value of [null,42,'data:image/svg+xml;base64,PHN2Zz4=',photo+'A'.repeat(1_400_000)])assert.throws(()=>validateContent({...current,[key]:value}));
});
test('combined photos are bounded below the request and duplicated snapshot response limits',()=>{
 const large='data:image/jpeg;base64,/9j/'+ 'AAAA'.repeat(170_000);
 assert.throws(()=>validateContent({...SAMPLE,portrait:large,groupPhoto:large,memoryPhoto:large}),/combined|together|total/i);
});
test('legacy full-size portraits remain valid within the combined budget',()=>{
 const portrait='data:image/jpeg;base64,/9j/'+ 'AAAA'.repeat(349_993);
 assert.equal(validateContent({...SAMPLE,portrait}).portrait,portrait);
});
test('accepts content and normalizes whitespace to protect print layout', () => {
  assert.equal(validateContent({...SAMPLE, story:'One\n\n\n two'}).story,'One two');
});
test('rejects missing name, impossible dates and overflow', () => {
  for (const patch of [{name:''},{birthday:'2025-02-30'},{headline:'x'.repeat(LIMITS.headline+1)},{birthday:'anything'}]) assert.throws(()=>validateContent({...SAMPLE,...patch}));
});
test('rejects active, malformed and oversized portraits', () => {
  for(const portrait of ['data:image/svg+xml;base64,PHN2Zz4=', 'https://example.com/a.jpg','data:image/png;base64,AAAA','data:image/jpeg;base64,'+'a'.repeat(1500000)]) assert.throws(()=>validateContent({...SAMPLE,portrait}));
});
