import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { storageReady } from '@/lib/blob';
import { Editor } from '@/components/editor';
// Never prerender authorization decisions when build-time credentials are absent.
export const dynamic='force-dynamic';
export default async function NewEdition(){if(!await isAdmin())redirect('/admin');return <Editor storageReady={storageReady()}/>;}
