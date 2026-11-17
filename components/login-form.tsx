'use client';
/* Clear the client router cache when authentication changes. */
/* eslint-disable @next/next/no-location-assign-relative-destination */
import { useState } from 'react';
export function LoginForm({ready}:{ready:boolean}) {
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 return <main className="login"><h1>Welcome back.</h1><p>Sign in to create and manage your family’s birthday editions.</p>{!ready && <div className="notice">Admin login is not configured yet. <a href="/studio">Try the local editor</a> while setup is completed.</div>}
 <form onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);try{const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:form.get('username'),password:form.get('password')})});const data=await response.json();if(!response.ok)throw new Error(data.error);window.location.assign('/admin');}catch(e){setError(e instanceof Error?e.message:'Could not sign in.');setBusy(false);}}}>
 <label>Username<input name="username" autoComplete="username" maxLength={200} required disabled={!ready || busy}/></label><label>Password<input name="password" type="password" autoComplete="current-password" maxLength={1024} required disabled={!ready || busy}/></label><button className="button" disabled={!ready || busy}>{busy?'Signing in…':'Log in'}</button>{error && <p className="error" role="alert">{error}</p>}</form><p style={{marginTop:24,fontSize:13}}>A private studio for the Mon family. No public registration.</p></main>;
}
