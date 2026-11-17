import { cookies } from 'next/headers';
import { timingSafeEqual, createHash } from 'node:crypto';
import { authReady, COOKIE, sessionKey } from '@/lib/auth';
import { verifyPassword, signSession, SESSION_SECONDS } from '@/lib/auth-core';
import { loginAttempt } from '@/lib/rate-limit';
import { sameOrigin, readJson, json, failure, HttpError } from '@/lib/http';
export async function POST(request:Request){
 try {
  sameOrigin(request);
  if(!authReady())throw new HttpError(503,'Admin login is not configured. Use the local studio to preview an edition.');
  const input=await readJson(request,4096);
  if(typeof input.username!=='string' || typeof input.password!=='string' || input.username.length>200 || input.password.length>1024)throw new HttpError(400,'Enter your username and password.');
  await loginAttempt();
  const validPassword=await verifyPassword(input.password,process.env.ADMIN_PASSWORD_HASH!);
  const digest=(s:string)=>createHash('sha256').update(s).digest();
  if(!validPassword || !timingSafeEqual(digest(input.username),digest(process.env.ADMIN_USERNAME!)))throw new HttpError(401,'Incorrect username or password.');
  (await cookies()).set(COOKIE,signSession(sessionKey()),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/',maxAge:SESSION_SECONDS});
  return json({ok:true});
 }catch(error){return failure(error);}
}
