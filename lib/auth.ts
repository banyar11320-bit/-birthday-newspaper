import 'server-only';
import { cookies } from 'next/headers';
import { verifySession,validPasswordHash } from './auth-core';
import { HttpError } from './http';
export const COOKIE=process.env.NODE_ENV==='production'?'__Host-mon-session':'mon-session';
export function authReady(){return Boolean(process.env.ADMIN_USERNAME && validPasswordHash(process.env.ADMIN_PASSWORD_HASH||'') && (process.env.SESSION_SECRET?.length||0)>=32);}
// Changing either configured credential also invalidates all existing sessions.
export function sessionKey(){return `${process.env.SESSION_SECRET}|${process.env.ADMIN_USERNAME}|${process.env.ADMIN_PASSWORD_HASH}`;}
export async function isAdmin(){if(!authReady())return false;return verifySession((await cookies()).get(COOKIE)?.value,sessionKey());}
export async function requireAdmin(){if(!await isAdmin())throw new HttpError(401,'Please log in to continue.');}
