import test from 'node:test';
import assert from 'node:assert/strict';
import { gzipSync } from 'node:zlib';
import { MockAgent, setGlobalDispatcher, getGlobalDispatcher } from 'undici';
import { readObject } from '../lib/blob';
import { conditionalUpdate } from '../lib/concurrency';

test('compressed Blob downloads must not turn an unchanged edition into a revision conflict',async()=>{
 const previous=getGlobalDispatcher();const agent=new MockAgent();agent.disableNetConnect();
 const token=process.env.BLOB_READ_WRITE_TOKEN;
 process.env.BLOB_READ_WRITE_TOKEN='vercel_blob_rw_teststore_testtoken';setGlobalDispatcher(agent);
 try {
  const pool=agent.get('https://teststore.private.blob.vercel-storage.com');
  pool.intercept({path:'/edition.json?cache=0',method:'GET'}).reply(options=>{
   const identity=new Headers(options.headers as HeadersInit).get('accept-encoding')==='identity';
   const body=JSON.stringify({name:'Saved edition'});
   return {statusCode:200,data:identity?body:gzipSync(body),responseOptions:{headers:{etag:identity?'"revision-1"':'W/"revision-1"',...(identity?{}:{'content-encoding':'gzip'})}}};
  }).persist();
  let stored={name:'Saved edition'};
  const result=await conditionalUpdate({read:()=>readObject<typeof stored>('edition.json'),write:async(value,expected)=>{
   assert.equal(expected,'"revision-1"');stored=value;return '"revision-2"';
  }},'"revision-1"',()=>({name:'Published edition'}));
  assert.equal(result.value.name,'Published edition');assert.equal(stored.name,'Published edition');
 } finally {setGlobalDispatcher(previous);if(token===undefined)delete process.env.BLOB_READ_WRITE_TOKEN;else process.env.BLOB_READ_WRITE_TOKEN=token;await agent.close();}
});
