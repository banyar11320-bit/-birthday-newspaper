import { requireAdmin } from '@/lib/auth';
import { readRecord, updateRecord } from '@/lib/store';
import { sameOrigin, readJson, json, failure, HttpError } from '@/lib/http';
type Context={params:Promise<{id:string}>};
export async function GET(_request:Request,{params}:Context){try{await requireAdmin();const current=await readRecord((await params).id);if(!current || current.value.deleted)throw new HttpError(404,'Newspaper not found.');return json({record:current.value,etag:current.etag});}catch(error){return failure(error);}}
export async function PATCH(request:Request,{params}:Context){try{
 sameOrigin(request);await requireAdmin();const input=await readJson(request);
 if(input.operation!=='save' && input.operation!=='publish' && input.operation!=='unpublish' && input.operation!=='delete')throw new HttpError(400,'Invalid action.');
 return json(await updateRecord((await params).id,input.operation,input.etag,input.content));
}catch(error){return failure(error);}}
