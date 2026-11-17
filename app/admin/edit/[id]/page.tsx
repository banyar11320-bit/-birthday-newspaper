import { redirect,notFound } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { readRecord,VALID_ID } from '@/lib/store';
import { Editor } from '@/components/editor';
// Never prerender authorization decisions when build-time credentials are absent.
export const dynamic='force-dynamic';
export default async function EditEdition({params}:{params:Promise<{id:string}>}){
 if(!await isAdmin())redirect('/admin');const {id}=await params;if(!VALID_ID.test(id))notFound();
 const current=await readRecord(id);if(!current || current.value.deleted)notFound();
 return <Editor initial={current.value} initialEtag={current.etag} storageReady/>;
}
