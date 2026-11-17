// Test transport only. Real Blob SDK + application logic, no remote storage or credentials.
import { MockAgent, getGlobalDispatcher, setGlobalDispatcher } from 'undici';
import { gzipSync } from 'node:zlib';
export function mockBlob({allowLocal=false}={}){
 const previous=getGlobalDispatcher();const agent=new MockAgent();agent.disableNetConnect();
 if(allowLocal)agent.enableNetConnect(/^(127\.0\.0\.1|localhost)(:\d+)?$/);
 const oldToken=process.env.BLOB_READ_WRITE_TOKEN,oldApi=process.env.VERCEL_BLOB_API_URL;
 process.env.BLOB_READ_WRITE_TOKEN='vercel_blob_rw_teststore_testtoken';
 process.env.VERCEL_BLOB_API_URL='https://blob-api.test';
 setGlobalDispatcher(agent);
 const objects=new Map();let revision=0;
 const metadata=(pathname,entry)=>({pathname,url:`https://teststore.private.blob.vercel-storage.com/${pathname}`,downloadUrl:`https://teststore.private.blob.vercel-storage.com/${pathname}?download=1`,contentType:'application/json',contentDisposition:'inline',etag:entry.etag,size:Buffer.byteLength(entry.body),uploadedAt:new Date().toISOString()});
 agent.get('https://teststore.private.blob.vercel-storage.com').intercept({path:/.*/,method:'GET'}).reply(options=>{
  const url=new URL(options.path,'https://teststore.private.blob.vercel-storage.com');
  const entry=objects.get(decodeURIComponent(url.pathname.slice(1)));
  if(!entry)return {statusCode:404,data:''};
  const identity=new Headers(options.headers).get('accept-encoding')==='identity';
  return {statusCode:200,data:identity?entry.body:gzipSync(entry.body),responseOptions:{headers:{'content-type':'application/json',etag:identity?entry.etag:`W/${entry.etag}`,...(identity?{}:{'content-encoding':'gzip'})}}};
 }).persist();
 const api=agent.get('https://blob-api.test');
 api.intercept({path:/.*/,method:'PUT'}).reply(options=>{
  const path=new URL(options.path,'https://blob-api.test').searchParams.get('pathname');
  const current=objects.get(path),headers=new Headers(options.headers),expected=headers.get('x-if-match');
  if((current && (!expected || expected!==current.etag)) || (!current && expected))return {statusCode:412,data:JSON.stringify({error:{code:'precondition_failed',message:'Revision conflict'}})};
  const entry={body:String(options.body),etag:`"revision-${++revision}"`};objects.set(path,entry);
  return {statusCode:200,data:JSON.stringify(metadata(path,entry))};
 }).persist();
 api.intercept({path:/.*/,method:'GET'}).reply(options=>{
  const prefix=new URL(options.path,'https://blob-api.test').searchParams.get('prefix') || '';
  return {statusCode:200,data:JSON.stringify({blobs:[...objects].filter(([path])=>path.startsWith(prefix)).map(([path,entry])=>metadata(path,entry)),hasMore:false,cursor:''})};
 }).persist();
 return {objects,async close(){setGlobalDispatcher(previous);await agent.close();for(const [key,value] of [['BLOB_READ_WRITE_TOKEN',oldToken],['VERCEL_BLOB_API_URL',oldApi]]){if(value===undefined)delete process.env[key];else process.env[key]=value;}}};
}
