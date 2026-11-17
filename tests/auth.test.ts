import test from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { signSession, verifySession, verifyPassword, takeAttempt } from '../lib/auth-core';
const secret='s'.repeat(48);
test('signed sessions reject tampering, expiry and different secrets',()=>{
 const token=signSession(secret,1000);
 assert.equal(verifySession(token,secret,1001),true);
 assert.equal(verifySession(token+'a',secret,1001),false);
 assert.equal(verifySession(token,secret,1000+8*60*60),false);
 assert.equal(verifySession(token,'z'.repeat(48),1001),false);
 assert.equal(verifySession(undefined,secret,1001),false);
 assert.throws(()=>signSession('short',1000));
});
test('scrypt password verification rejects incorrect and malformed hashes',async()=>{
 const salt='12'.repeat(16); const hash=`scrypt:${salt}:${scryptSync('correct horse battery staple',salt,64).toString('hex')}`;
 assert.equal(await verifyPassword('correct horse battery staple',hash),true);
 assert.equal(await verifyPassword('wrong',hash),false);
 assert.equal(await verifyPassword('password','invalid'),false);
});
test('login throttle has a fixed window and cannot admit extra concurrent slots',()=>{
 let state=undefined;
 for(let i=0;i<10;i++) state=takeAttempt(state,1000);
 assert.throws(()=>takeAttempt(state,1001),/Too many/);
 assert.equal(takeAttempt(state,1000+15*60*1000).count,1);
});
