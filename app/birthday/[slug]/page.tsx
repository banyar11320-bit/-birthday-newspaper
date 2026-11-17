import { cache } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { readRecord, VALID_ID } from '@/lib/store';
import { publicContent } from '@/lib/records';
import { storageReady } from '@/lib/blob';
import { Newspaper } from '@/components/newspaper';
import { PrintButton } from '@/components/print-button';
export const dynamic='force-dynamic';
const published=cache(async(slug:string)=>{
 if(!VALID_ID.test(slug) || !storageReady())return null;
 const current=await readRecord(slug);return current?publicContent(current.value):null;
});
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const content=await published((await params).slug);
 return {title:content?`${content.name}’s birthday edition`:'Edition unavailable',robots:{index:false,follow:false,noarchive:true},openGraph:{title:content?`${content.name}’s birthday edition`:'Mon Family',description:'A special birthday edition of The Mon Family Times.',type:'article'}};
}
export default async function Birthday({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const content=await published(slug);if(!content)notFound();
 return <main className="public-page"><div className="public-tools no-print"><p>A birthday keepsake<br/>from the Mon family.</p><PrintButton/></div><Newspaper content={{...content,portrait:''}} portraitSrc={`/api/portrait/${slug}`}/></main>;
}
