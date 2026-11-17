'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { EMPTY, LIMITS, SAMPLE, PHOTO_FIELDS, UPLOAD_PHOTO_LENGTH, MAX_TOTAL_PHOTO_LENGTH, validateContent, type Content, type PhotoKey } from '@/lib/content';
import type { NewspaperRecord } from '@/lib/records';
import { Newspaper } from './newspaper';
import { PrintButton } from './print-button';
const fields: {key:keyof typeof LIMITS;label:string;rows?:number}[] = [
 {key:'name',label:'Member name'}, {key:'birthday',label:'Birthday'}, {key:'headline',label:'Main headline',rows:2},
 {key:'story',label:'Birthday story',rows:6}, {key:'memories',label:'Favorite memories',rows:5}, {key:'wishes',label:'Birthday wishes',rows:4}, {key:'closing',label:'Closing message',rows:3},
];
const subscribeToHydration = () => () => {};
export function Editor({local=false,initial,initialEtag,storageReady=false}:{local?:boolean;initial?:NewspaperRecord;initialEtag?:string;storageReady?:boolean}) {
 const hydrated=useSyncExternalStore(subscribeToHydration,()=>true,()=>false);
 const [content,setContent]=useState<Content>({...EMPTY,...(initial?.draft ?? (local ? SAMPLE : EMPTY))});
 const [record,setRecord]=useState(initial);
 const [etag,setEtag]=useState(initialEtag);
 const [dirty,setDirty]=useState(false);
 const [preview,setPreview]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState('');
 const [error,setError]=useState('');
 const formRef=useRef<HTMLFormElement>(null);
 const inFlight=useRef(false);
 useEffect(()=>{
  if(!dirty) return;
  const unload=(event:BeforeUnloadEvent)=>{event.preventDefault();};
  const navigate=(event:MouseEvent)=>{
   const link=(event.target as Element).closest('a[href]');
   if(link && !window.confirm('Leave this page? Your unsaved changes will be lost.')) event.preventDefault();
  };
  window.addEventListener('beforeunload',unload);document.addEventListener('click',navigate,true);
  return()=>{window.removeEventListener('beforeunload',unload);document.removeEventListener('click',navigate,true);};
 },[dirty]);
 function update(key:keyof Content,value:string) {setContent(c=>({...c,[key]:value}));setDirty(true);setMessage('');setError('');}
 async function upload(key:PhotoKey,file?:File) {
  if(!file || inFlight.current) return;
  inFlight.current=true;
  setError(''); setBusy(true);
  try {
   if(!['image/jpeg','image/png'].includes(file.type) || file.size>5*1024*1024) throw new Error('Choose a JPEG or PNG smaller than 5 MB.');
   const bitmap=await createImageBitmap(file);
   try {
    if(bitmap.width*bitmap.height>40_000_000) throw new Error('Choose a photo smaller than 40 megapixels.');
    const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));
    const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
    const context=canvas.getContext('2d');if(!context) throw new Error('Your browser could not resize this image.');
    context.fillStyle='#F8F4EA';context.fillRect(0,0,canvas.width,canvas.height);context.drawImage(bitmap,0,0,canvas.width,canvas.height);
    let photo=canvas.toDataURL('image/jpeg',0.85);
    for(const quality of [0.7,0.55,0.4]){if(photo.length<=UPLOAD_PHOTO_LENGTH)break;photo=canvas.toDataURL('image/jpeg',quality);}
    if(photo.length>UPLOAD_PHOTO_LENGTH) throw new Error('This image is too detailed. Choose a smaller photo.');
    const total=PHOTO_FIELDS.reduce((sum,field)=>sum+(field.key===key?photo.length:content[field.key].length),0);
    if(total>MAX_TOTAL_PHOTO_LENGTH)throw new Error('The combined photos are too large. Replace the existing larger photo first.');
    update(key,photo);
   } finally {bitmap.close();}
  } catch(e) {setError(e instanceof Error ? e.message : 'Could not read this photo.');} finally {inFlight.current=false;setBusy(false);}
 }
 async function save(operation:'save'|'publish') {
  if(local || !storageReady || inFlight.current) return;
  if(formRef.current && !formRef.current.reportValidity()) {setPreview(false);return;}
  inFlight.current=true;setBusy(true);setError('');setMessage('');
  try {
   const validated=validateContent(content);
   const response=await fetch(record ? `/api/newspapers/${record.id}` : '/api/newspapers',{method:record?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:validated,operation,etag})});
   const data=await response.json(); if(!response.ok) throw new Error(data.error || 'Could not save. Please retry.');
   setRecord(data.record);setEtag(data.etag);setContent(data.record.draft);setDirty(false);
   setMessage(operation==='publish'?'Published. Your birthday link is ready to share.':'Draft saved.');
   if(!record) window.history.replaceState(null,'',`/admin/edit/${data.record.id}`);
  } catch(e) {setError(e instanceof Error?e.message:'Could not save.');} finally {inFlight.current=false;setBusy(false);}
 }
 return <main className={`editor-shell ${preview?'preview-only':''}`}>
  <div className="editor-toolbar no-print"><div><a href={local?'/':'/admin'} className="back-link">← {local?'Home':'All newspapers'}</a><h1>{local?'Your birthday edition':record?'Edit newspaper':'Create newspaper'}</h1><p>{dirty?'Unsaved changes':record?.published?'Published edition · edits save privately':local?'Try the layout with a sample story':'Draft edition'}</p></div><div className="actions"><button className="button secondary" onClick={()=>setPreview(p=>!p)}>{preview?'Back to editor':'Preview'}</button><PrintButton/><button className="button secondary" disabled={busy || local || !storageReady} onClick={()=>save('save')}>Save Draft</button><button className="button" disabled={busy || local || !storageReady} onClick={()=>save('publish')}>{busy?'Working…':'Publish'}</button></div></div>
  {(local || !storageReady) && <div className="notice no-print">{local?'Local studio: changes stay in this tab and are not saved. You can preview and print.':'Storage is not connected. You can edit and preview, but saving and publishing are unavailable.'}</div>}
  <div className="no-print status-region" aria-live="polite">{error && <p className="error" role="alert">{error}</p>}{message && <p className="success">{message}</p>}{record?.published && <a href={`/birthday/${record.slug}`} target="_blank" rel="noreferrer">Open published birthday page ↗</a>}</div>
  <div className="editor-grid">
   <form ref={formRef} className="editor-form no-print" hidden={preview} onSubmit={e=>{e.preventDefault();save('save');}}>
    <div className="form-section-heading"><h2>Make it personal</h2><p>A few words today. A keepsake for years.</p></div>
    <fieldset disabled={busy || !hydrated}>
    {fields.map(({key,label,rows})=><label className="field" key={key}><span>{label}</span>{rows?<textarea aria-label={label} rows={rows} maxLength={LIMITS[key]} value={content[key]} required={key==='headline'} onChange={e=>update(key,e.target.value)} aria-describedby={`${key}-hint`}/>:<input aria-label={label} type={key==='birthday'?'date':'text'} required maxLength={LIMITS[key]} min={key==='birthday'?'1900-01-01':undefined} max={key==='birthday'?new Date().toISOString().slice(0,10):undefined} value={content[key]} onChange={e=>update(key,e.target.value)}/>}<small id={`${key}-hint`}>{key==='birthday'?'Only the month and day appear in the newspaper.':`${content[key].length} / ${LIMITS[key]} characters`}</small></label>)}
    {PHOTO_FIELDS.map(({key,label})=><div key={key}><label className="field photo-input"><span>{label}</span><input aria-label={label} type="file" accept="image/jpeg,image/png" onChange={e=>{upload(key,e.target.files?.[0]);e.target.value='';}}/><small>{key==='portrait'?'Page 1 · 3:4 frame.':key==='groupPhoto'?'Page 2 · landscape frame.':'Page 2 · memory frame.'} JPEG or PNG, up to 5 MB. Resized privately; proportions preserved.</small></label>{content[key] && <button className="text-button" type="button" onClick={()=>update(key,'')}>Remove {label.toLowerCase()}</button>}</div>)}
    </fieldset>
   </form>
   <section className="preview-area" aria-label="Live newspaper preview"><div className="preview-heading no-print"><span>Your keepsake</span><span>2 pages · A4 portrait</span></div><Newspaper content={content}/></section>
  </div>
 </main>;
}
