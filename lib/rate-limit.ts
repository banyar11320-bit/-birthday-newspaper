import 'server-only';
import { readObject, writeObject, storageReady } from './blob';
import { takeAttempt, type Attempts } from './auth-core';
import { HttpError } from './http';
import { reserveAttempt } from './concurrency';
let local:Attempts|undefined;
export async function loginAttempt(){
 if(!storageReady()){
  if(process.env.NODE_ENV==='production')throw new HttpError(503,'Connect private storage before enabling production login.');
  try{local=takeAttempt(local);}catch(error){throw new HttpError(429,(error as Error).message);}return;
 }
 // A global cap is deliberate: never trust caller-supplied forwarding headers.
 // CAS conflicts fail closed; no concurrent request gets an uncounted password check.
 const path='security/login-attempts.json';
 await reserveAttempt({read:()=>readObject<Attempts>(path),write:(value,etag)=>writeObject(path,value,etag)});
}
