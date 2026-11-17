export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store, max-age=0'}});}
export function failure(error:unknown){
 if(error instanceof HttpError) return json({error:error.message},error.status);
 // Never send provider errors, tokens, object URLs, or submitted content to clients/logs.
 return json({error:'The operation could not be completed. Check the private storage connection and try again.'},503);
}
export function sameOrigin(request:Request){
 const origin=request.headers.get('origin');
 const url=new URL(request.url);
 // Next may normalize request.url to localhost; Host is the browser-facing authority.
 const host=request.headers.get('host') || url.host;
 if(!origin || origin!==`${url.protocol}//${host}` || request.headers.get('sec-fetch-site')==='cross-site') throw new HttpError(403,'This request is not allowed.');
}
export async function readJson(request:Request,limit=1_500_000):Promise<Record<string,unknown>> {
 if(!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415,'Use a JSON request.');
 if(Number(request.headers.get('content-length')||0)>limit) throw new HttpError(413,'The request is too large.');
 const reader=request.body?.getReader(); if(!reader) throw new HttpError(400,'Missing request body.');
 let size=0; const chunks:Uint8Array[]=[];
 try {while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new HttpError(413,'The request is too large.');}chunks.push(value);}}finally{reader.releaseLock();}
 try {const value=JSON.parse(Buffer.concat(chunks).toString('utf8'));if(!value || typeof value!=='object' || Array.isArray(value))throw new Error();return value;}catch{throw new HttpError(400,'Invalid request data.');}
}
