import { createHmac, randomBytes, timingSafeEqual, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
const derive = promisify(scrypt);
export const SESSION_SECONDS = 8*60*60;
function key(secret:string) { if(secret.length<32) throw new Error('SESSION_SECRET must contain at least 32 characters.'); return secret; }
export function signSession(secret:string, now=Math.floor(Date.now()/1000)) {
 const payload=Buffer.from(JSON.stringify({exp:now+SESSION_SECONDS,nonce:randomBytes(16).toString('hex')})).toString('base64url');
 return `${payload}.${createHmac('sha256',key(secret)).update(payload).digest('base64url')}`;
}
export function verifySession(token:string|undefined,secret:string,now=Math.floor(Date.now()/1000)) {
 try {
  if(!token || token.length>512) return false;
  const [payload,signature,extra]=token.split('.'); if(extra || !signature) return false;
  const expected=createHmac('sha256',key(secret)).update(payload).digest('base64url');
  if(signature.length!==expected.length || !timingSafeEqual(Buffer.from(signature),Buffer.from(expected))) return false;
  const {exp,nonce}=JSON.parse(Buffer.from(payload,'base64url').toString());
  return Number.isInteger(exp) && exp>now && exp<=now+SESSION_SECONDS && typeof nonce==='string';
 } catch {return false;}
}
export function validPasswordHash(hash:string) { return /^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(hash); }
export async function verifyPassword(password:string,hash:string) {
 if(!validPasswordHash(hash) || password.length>1024) return false;
 const [,salt,expected]=hash.split(':');
 const actual=await derive(password,salt,64) as Buffer;
 return timingSafeEqual(actual,Buffer.from(expected,'hex'));
}
export type Attempts={start:number;count:number};
export function takeAttempt(state:Attempts|undefined, now=Date.now()):Attempts {
 if(!state || now>=state.start+15*60*1000) return {start:now,count:1};
 if(state.count>=10) throw new Error('Too many login attempts. Try again in 15 minutes.');
 return {...state,count:state.count+1};
}
