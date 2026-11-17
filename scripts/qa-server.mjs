// Local verification only. Never used by dev/start/build or deployed routes.
import { spawn } from 'node:child_process';
import { randomBytes, scryptSync } from 'node:crypto';
if(process.env.NODE_ENV==='production')throw new Error('QA server is development-only.');
const salt=randomBytes(16).toString('hex');
const child=spawn(process.execPath,[...(process.env.QA_MOCK_BLOB==='1'?['--import',new URL('../tests/helpers/qa-blob.mjs',import.meta.url).href]:[]),'node_modules/next/dist/bin/next','dev','--hostname','127.0.0.1','--port','3027'],{stdio:'inherit',env:{...process.env,ADMIN_USERNAME:'qa-admin',ADMIN_PASSWORD_HASH:`scrypt:${salt}:${scryptSync('local-qa-password-only',salt,64).toString('hex')}`,SESSION_SECRET:randomBytes(32).toString('hex'),BLOB_READ_WRITE_TOKEN:''}});
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code||0));
