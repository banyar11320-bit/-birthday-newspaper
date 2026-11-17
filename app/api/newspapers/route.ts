import { requireAdmin } from '@/lib/auth';
import { createRecord } from '@/lib/store';
import { sameOrigin, readJson, json, failure, HttpError } from '@/lib/http';
export async function POST(request:Request){try{
 sameOrigin(request);await requireAdmin();const input=await readJson(request);
 if(input.operation!=='save' && input.operation!=='publish')throw new HttpError(400,'Invalid action.');
 return json(await createRecord(input.content,input.operation),201);
}catch(error){return failure(error);}}
