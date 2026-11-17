'use client';
import { useState } from 'react';
export function PrintButton() {
 const [busy,setBusy]=useState(false);
 return <button className="button secondary" disabled={busy} onClick={async()=>{
  setBusy(true);
  try { await document.fonts.ready; await Promise.all(Array.from(document.querySelectorAll('.newspaper img')).map(img=>(img as HTMLImageElement).decode().catch(()=>undefined))); window.print(); } finally {setBusy(false);}
 }}>{busy ? 'Preparing…' : 'Print / Save PDF'}</button>;
}
