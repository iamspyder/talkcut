import fs from 'node:fs/promises';
import {existsSync,createReadStream} from 'node:fs';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
async function digest(file){const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);return hash.digest('hex');}
export async function downloadArtifact(url,file,expected,{fetchImpl=fetch,attempts=3,retryDelay=1000}={}){
 if(existsSync(file)){const hash=await digest(file);if(expected&&hash!==expected)throw Error('Cached artifact checksum mismatch: '+file);return hash;}
 const partial=file+'.part';
 for(let attempt=1;attempt<=attempts;attempt++){
  try{
   const response=await fetchImpl(url,{signal:AbortSignal.timeout(10*60*1000)});
   if(!response.ok||!response.body)throw Error(`Download failed (${response.status}): ${url}`);
   const handle=await fs.open(partial,'w');
   try{for await(const chunk of response.body)await handle.write(chunk);}finally{await handle.close();}
   const hash=await digest(partial);if(expected&&hash!==expected)throw Error('Downloaded artifact checksum mismatch: '+file);
   await fs.rename(partial,file);return hash;
  }catch(error){
   await fs.rm(partial,{force:true});
   if(attempt===attempts)throw error;
   console.warn(`Native download interrupted; retrying (${attempt}/${attempts-1}): ${new URL(url).pathname.split('/').at(-1)}`);
   await delay(retryDelay*attempt);
  }
 }
}
