import { takeAttempt, type Attempts } from './auth-core';
import { HttpError } from './http';
export type ConditionalStore<T>={read:()=>Promise<{value:T;etag:string}|null>;write:(value:T,etag?:string)=>Promise<string>};
export async function conditionalUpdate<T>(store:ConditionalStore<T>,expected:unknown,transform:(current:T)=>T){
 if(typeof expected!=='string' || !expected || expected.length>200)throw new HttpError(400,'Reload this newspaper before saving.');
 const current=await store.read();
 if(!current)throw new HttpError(404,'Newspaper not found.');
 if(current.etag!==expected)throw new HttpError(409,'This edition changed in another tab. Your changes have not been saved. Copy your unsaved text and keep your photo files, then reload to review the latest edition before reapplying your changes.');
 const value=transform(current.value);
 // The remote store must condition this write on expected as well: checking above alone is racy.
 const etag=await store.write(value,expected);
 return {value,etag};
}
export async function reserveAttempt(store:ConditionalStore<Attempts>,now=Date.now()){
 const current=await store.read();let next:Attempts;
 try{next=takeAttempt(current?.value,now);}catch(error){throw new HttpError(429,(error as Error).message);}
 try{await store.write(next,current?.etag);}catch{throw new HttpError(429,'Login is busy. Wait a moment before trying again.');}
}
