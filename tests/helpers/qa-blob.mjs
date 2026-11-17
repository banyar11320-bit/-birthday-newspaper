import { mockBlob } from './blob-mock.mjs';
if(process.env.NODE_ENV==='production')throw new Error('Mock Blob is only for local QA.');
mockBlob({allowLocal:true});
