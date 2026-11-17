import 'server-only';
import { get, put, list, BlobPreconditionFailedError } from '@vercel/blob';
import { HttpError } from './http';
export function storageReady(){return Boolean(process.env.BLOB_READ_WRITE_TOKEN);}
function configured(){if(!storageReady())throw new HttpError(503,'Private storage is not connected. Saving and publishing are unavailable.');}
export async function readObject<T>(path:string):Promise<{value:T;etag:string}|null>{
 configured();
 // Conditional writes need the origin's strong validator, not a compressed representation's ETag.
 const result=await get(path,{access:'private',useCache:false,headers:{'Accept-Encoding':'identity'}});
 if(!result) return null;
 if(result.statusCode!==200 || !result.stream)throw new HttpError(503,'Could not read the latest stored edition.');
 const value=await new Response(result.stream).json() as T;
 return {value,etag:result.blob.etag};
}
export async function writeObject(path:string,value:unknown,etag?:string){
 configured();
 try {
  const result=await put(path,JSON.stringify(value),{access:'private',addRandomSuffix:false,allowOverwrite:Boolean(etag),...(etag?{ifMatch:etag}:{}),contentType:'application/json',cacheControlMaxAge:60});
  return result.etag;
 }catch(error){
  if(error instanceof BlobPreconditionFailedError)throw new HttpError(409,'This edition changed in another tab. Your changes have not been saved. Copy your unsaved text and keep your photo files, then reload to review the latest edition before reapplying your changes.');
  throw error;
 }
}
export async function listObjects(prefix:string,cursor?:string){configured();return list({prefix,cursor,limit:20});}
