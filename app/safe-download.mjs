import fs from 'node:fs/promises';
import {createWriteStream} from 'node:fs';
import {Readable,Transform} from 'node:stream';
import {pipeline} from 'node:stream/promises';
export function providerMediaURL(value){const u=new URL(value);const allowed=u.hostname==='fal.media'||u.hostname.endsWith('.fal.media')||(u.hostname==='storage.googleapis.com'&&u.pathname.startsWith('/falserverless/'))||['images.pexels.com','videos.pexels.com'].includes(u.hostname);if(u.protocol!=='https:'||!allowed||u.username||u.password||u.port)throw Error('The provider returned an unsupported media location');return u;}
export async function downloadProviderMedia(url,destination,{fetchImpl=fetch,maxBytes=512*1024*1024}={}){
 let current=providerMediaURL(url),response;
 for(let redirects=0;redirects<4;redirects++){
  response=await fetchImpl(current.href,{redirect:'manual',signal:AbortSignal.timeout(180000)});
  if([301,302,303,307,308].includes(response.status)){const next=response.headers.get('location');if(!next)throw Error('The provider media redirect was invalid');current=providerMediaURL(new URL(next,current).href);continue;}break;
 }
 if(!response?.ok||!response.body)throw Error(`Could not download generated media (HTTP ${response?.status||'unknown'})`);
 if(Number(response.headers.get('content-length'))>maxBytes)throw Error('Generated media exceeds the 512 MB import limit');
 let count=0;const limit=new Transform({transform(chunk,encoding,callback){count+=chunk.length;if(count>maxBytes)return callback(Error('Generated media exceeds the import limit'));callback(null,chunk);}});
 await pipeline(Readable.fromWeb(response.body),limit,createWriteStream(destination+'.part'));
 await fs.rename(destination+'.part',destination);return {bytes:count};
}
