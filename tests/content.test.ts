import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, SAMPLE, LIMITS } from '../lib/content';
test('accepts content and normalizes whitespace to protect print layout', () => {
  assert.equal(validateContent({...SAMPLE, story:'One\n\n\n two'}).story,'One two');
});
test('rejects missing name, impossible dates and overflow', () => {
  for (const patch of [{name:''},{birthday:'2025-02-30'},{headline:'x'.repeat(LIMITS.headline+1)},{birthday:'anything'}]) assert.throws(()=>validateContent({...SAMPLE,...patch}));
});
test('rejects active, malformed and oversized portraits', () => {
  for(const portrait of ['data:image/svg+xml;base64,PHN2Zz4=', 'https://example.com/a.jpg','data:image/png;base64,AAAA','data:image/jpeg;base64,'+'a'.repeat(1500000)]) assert.throws(()=>validateContent({...SAMPLE,portrait}));
});
