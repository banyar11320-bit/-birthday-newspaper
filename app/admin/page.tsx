import { authReady, isAdmin } from '@/lib/auth';
import { storageReady } from '@/lib/blob';
import { listRecords } from '@/lib/store';
import { LoginForm } from '@/components/login-form';
import { Dashboard } from '@/components/dashboard';
export const dynamic='force-dynamic';
export default async function Admin({searchParams}:{searchParams:Promise<{cursor?:string}>}){
 if(!await isAdmin())return <LoginForm ready={authReady()}/>;
 if(!storageReady())return <Dashboard items={[]} storageError="Private storage is not connected. Saving and publishing are unavailable. You can still create a preview."/>;
 let page;
 try{const {cursor}=await searchParams;page=await listRecords(typeof cursor==='string' && cursor.length<2000?cursor:undefined);}catch{return <Dashboard items={[]} storageError="Could not load the collection. Check the private storage connection and try again."/>;}
 return <Dashboard items={page.items} cursor={page.cursor}/>;
}
