import { randomUUID } from 'node:crypto';
import { validateContent, type Content } from './content';
export type NewspaperRecord = { id:string; slug:string; draft:Content|null; published:Content|null; deleted:boolean; updatedAt:string };
export type Operation = 'save'|'publish'|'unpublish'|'delete';
export function newRecord(input:unknown):NewspaperRecord {
 const id=randomUUID();
 return {id,slug:id,draft:validateContent(input),published:null,deleted:false,updatedAt:new Date().toISOString()};
}
export function publicContent(record:NewspaperRecord) {return record.deleted ? null : record.published;}
export function changeRecord(record:NewspaperRecord, operation:Operation, input?:unknown):NewspaperRecord {
 if(record.deleted) throw new Error('This newspaper has been deleted.');
 const next={...record,updatedAt:new Date().toISOString()};
 if(operation==='delete') return {...next,draft:null,published:null,deleted:true};
 if(operation==='unpublish') return {...next,published:null};
 const content=validateContent(input);
 if(operation==='save') return {...next,draft:content};
 if(operation==='publish') {
  if(!content.story || !content.memories || !content.wishes || !content.closing || !content.portrait || !content.groupPhoto || !content.memoryPhoto) throw new Error('Add all three photos and complete every story field before publishing.');
  return {...next,draft:content,published:{...content}};
 }
 throw new Error('Invalid action.');
}
