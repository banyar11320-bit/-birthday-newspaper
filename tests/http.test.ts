import test from 'node:test';
import assert from 'node:assert/strict';
import { sameOrigin,readJson } from '../lib/http';
test('same-origin uses browser-facing Host when Next rewrites internal hostname',()=>{
 assert.doesNotThrow(()=>sameOrigin(new Request('http://localhost:3017/api/auth/login',{headers:{host:'127.0.0.1:3017',origin:'http://127.0.0.1:3017'}})));
 for(const origin of ['https://evil.example','null','http://127.0.0.1:3017.evil.example'])assert.throws(()=>sameOrigin(new Request('http://localhost:3017/api/auth/login',{headers:{host:'127.0.0.1:3017',origin}})));
});
test('streamed oversized JSON is rejected even without content-length',async()=>{
 const req=new Request('http://localhost/api',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({data:'x'.repeat(100)})});
 await assert.rejects(readJson(req,20),/too large/);
});
