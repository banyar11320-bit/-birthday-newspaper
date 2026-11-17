import { readRecord, VALID_ID } from '@/lib/store';
import { publicContent } from '@/lib/records';
import { storageReady } from '@/lib/blob';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const slot=new URL(request.url).searchParams.get('slot') ?? 'portrait';
 if((slot!=='portrait' && slot!=='groupPhoto' && slot!=='memoryPhoto') || !VALID_ID.test(id) || !storageReady())return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
 try{
  const current=await readRecord(id);const photo=current && publicContent(current.value)?.[slot];
  if(!photo)return new Response(null,{status:404,headers:{'Cache-Control':'no-store'}});
  const [header,data]=photo.split(',');
  return new Response(Buffer.from(data,'base64'),{headers:{'Content-Type':header.includes('image/png')?'image/png':'image/jpeg','Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff'}});
 }catch{return new Response(null,{status:503,headers:{'Cache-Control':'no-store'}});}
}
