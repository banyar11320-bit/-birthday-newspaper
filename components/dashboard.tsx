'use client';
/* Clear the client router cache when authentication changes. */
/* eslint-disable @next/next/no-location-assign-relative-destination */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { birthdayLabel } from '@/lib/content';
export type Summary={id:string;slug:string;name:string;birthday:string;published:boolean;updatedAt:string;etag:string};
export function Dashboard({items,storageError,cursor}:{items:Summary[];storageError?:string;cursor?:string}) {
 const router=useRouter();const [busy,setBusy]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('');
 async function mutate(item:Summary,operation:'publish'|'unpublish'|'delete') {
  if(operation==='delete' && !window.confirm(`Delete ${item.name}’s newspaper? Its public link will stop working. This cannot be undone.`))return;
  setBusy(item.id);setError('');setMessage('');
  try {
   let content;
   if(operation==='publish'){const response=await fetch(`/api/newspapers/${item.id}`,{cache:'no-store'});const data=await response.json();if(!response.ok)throw new Error(data.error);content=data.record.draft;}
   const response=await fetch(`/api/newspapers/${item.id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({operation,etag:item.etag,content})});
   const data=await response.json();if(!response.ok)throw new Error(data.error);
   setMessage(operation==='delete'?'Newspaper deleted.':operation==='unpublish'?'Newspaper unpublished.':'Newspaper published.');router.refresh();
  }catch(e){setError(e instanceof Error?e.message:'Could not complete this action.');}finally{setBusy('');}
 }
 return <main className="dashboard"><div className="dashboard-heading"><div><h1>The family collection.</h1><p>Little celebrations, kept together.</p></div><div className="actions"><a className="button" href="/admin/new">Create Newspaper</a><button className="button secondary" disabled={Boolean(busy)} onClick={async()=>{setBusy('logout');try{const response=await fetch('/api/auth/logout',{method:'POST'});if(!response.ok)throw new Error();window.location.assign('/admin');}catch{setError('Could not log out. Please retry.');setBusy('');}}}>Log out</button></div></div>
 {storageError && <div className="notice">{storageError}</div>}<div aria-live="polite">{message && <p className="success">{message}</p>}{error && <p className="error" role="alert">{error}</p>}</div>
 {!items.length ? <div className="empty-state"><h2>A birthday worth remembering.</h2><p>{storageError?'The collection is unavailable until storage is connected.':'Your family collection starts with its first edition.'}</p><a className="button secondary" href="/admin/new">Create your first newspaper</a></div> : <ul className="edition-list">{items.map(item=><li className="edition-row" key={item.id}><div><span className={`badge ${item.published?'published':''}`}>{item.published?'Published':'Draft'}</span><h2>{item.name}</h2><p>Birthday · {birthdayLabel(item.birthday)}</p></div><div className="actions"><a href={`/admin/edit/${item.id}`} className="button secondary">Edit / Preview</a>{item.published && <button className="button secondary" onClick={async()=>{try{await navigator.clipboard.writeText(`${window.location.origin}/birthday/${item.slug}`);setMessage('Birthday link copied.');}catch{setError('Could not copy. Open the public page and copy its address.');}}}>Copy Link</button>}{item.published && <a href={`/birthday/${item.slug}`} target="_blank" rel="noreferrer">View</a>}<button className="button secondary" disabled={Boolean(busy)} onClick={()=>mutate(item,item.published?'unpublish':'publish')}>{busy===item.id?'Working…':item.published?'Unpublish':'Publish'}</button><button className="button danger" disabled={Boolean(busy)} onClick={()=>mutate(item,'delete')}>Delete</button></div></li>)}</ul>}
 {cursor && <p style={{marginTop:24}}><a href={`/admin?cursor=${encodeURIComponent(cursor)}`}>Next editions →</a></p>}</main>;
}
