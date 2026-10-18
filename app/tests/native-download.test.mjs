import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {downloadArtifact} from '../scripts/native-download.mjs';
test('native download retries a closed connection and verifies cached files without refetching',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'talkcut-download-'));
 try{const file=path.join(dir,'helper'),body='synthetic helper',hash=createHash('sha256').update(body).digest('hex');let calls=0;
  await downloadArtifact('https://example.invalid/helper',file,hash,{retryDelay:0,fetchImpl:async()=>{if(++calls===1)throw Error('UND_ERR_SOCKET');return new Response(body);}});
  assert.equal(calls,2);assert.equal(await fs.readFile(file,'utf8'),body);
  assert.equal(await downloadArtifact('https://example.invalid/helper',file,hash,{fetchImpl:()=>{throw Error('Cache must not fetch');}}),hash);
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('native download discards interrupted streams and starts the retry from scratch',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'talkcut-download-'));
 try{const file=path.join(dir,'helper');let calls=0;await downloadArtifact('https://example.invalid/helper',file,undefined,{retryDelay:0,fetchImpl:async()=>{if(++calls>1)return new Response('complete');return {ok:true,body:(async function*(){yield Buffer.from('partial');throw Error('stream interrupted');})()};}});assert.equal(await fs.readFile(file,'utf8'),'complete');await assert.rejects(fs.stat(file+'.part'),{code:'ENOENT'});
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
test('native download never installs mismatched bytes or leaves partial files',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'talkcut-download-'));
 try{const file=path.join(dir,'helper');await assert.rejects(downloadArtifact('https://example.invalid/helper',file,'0'.repeat(64),{attempts:2,retryDelay:0,fetchImpl:async()=>new Response('bad bytes')}),/checksum mismatch/);await assert.rejects(fs.stat(file),{code:'ENOENT'});await assert.rejects(fs.stat(file+'.part'),{code:'ENOENT'});
 }finally{await fs.rm(dir,{recursive:true,force:true});}
});
