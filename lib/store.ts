import 'server-only';
import { readObject, writeObject, listObjects } from './blob';
import { changeRecord, newRecord, type NewspaperRecord, type Operation } from './records';
import { HttpError } from './http';
import { conditionalUpdate } from './concurrency';
export const VALID_ID=/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
function path(id:string){if(!VALID_ID.test(id))throw new HttpError(404,'Newspaper not found.');return `newspapers/${id}.json`;}
export async function readRecord(id:string){return readObject<NewspaperRecord>(path(id));}
export async function createRecord(content:unknown,operation:'save'|'publish'){
 let record:NewspaperRecord;
 try {record=newRecord(content);if(operation==='publish')record=changeRecord(record,operation,content);}catch(error){throw new HttpError(400,(error as Error).message);}
 const etag=await writeObject(path(record.id),record);
 return {record,etag};
}
export async function updateRecord(id:string,operation:Operation,expected:unknown,content?:unknown){
 const result=await conditionalUpdate<NewspaperRecord>({read:()=>readRecord(id),write:(value,etag)=>writeObject(path(id),value,etag)},expected,current=>{
  if(current.deleted)throw new HttpError(404,'Newspaper not found.');
  try{return changeRecord(current,operation,content);}catch(error){throw new HttpError(400,(error as Error).message);}
 });
 return {record:result.value,etag:result.etag};
}
export async function listRecords(cursor?:string){
 const page=await listObjects('newspapers/',cursor);
 const entries=await Promise.all(page.blobs.map(blob=>readObject<NewspaperRecord>(blob.pathname)));
 return {items:entries.filter(entry=>entry && !entry.value.deleted).map(entry=>({id:entry!.value.id,slug:entry!.value.slug,name:entry!.value.draft!.name,birthday:entry!.value.draft!.birthday,published:Boolean(entry!.value.published),updatedAt:entry!.value.updatedAt,etag:entry!.etag})),cursor:page.hasMore?page.cursor:undefined};
}
