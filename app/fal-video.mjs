import {readFile as readLocalFile,stat} from 'node:fs/promises';
import path from 'node:path';
const MAX_BYTES=32*1024*1024;
export const FAL_VIDEO_MODELS={lipsync:'fal-ai/sync-lipsync/v2',avatar:'fal-ai/ai-avatar/single-text',video:'fal-ai/wan/v2.2-5b/text-to-video',background:'bria/video/background-removal'};
const required=(value,label,max=4000)=>{if(typeof value!=='string'||!value.trim()||value.length>max)throw Error(`${label} is required (maximum ${max} characters)`);return value.trim();};
export function trustedQueueURL(value){let url;try{url=new URL(value);}catch{throw Error('Provider returned an invalid queue URL');}if(url.protocol!=='https:'||url.hostname!=='queue.fal.run'||url.port||url.username||url.password)throw Error('Provider returned an untrusted queue URL');return url.href;}
async function assetData(id,type,context){
 const asset=await context.getAsset(required(id,`${type} asset`,80));
 if(asset.type!==type)throw Error(`Select a ${type} asset`);
 const file=type==='video'?asset.proxy||asset.file:asset.file;if(!file)throw Error('Selected media is unavailable');
 // The path is resolved exclusively from the server catalog, never request paths/URLs.
 if(context.readFile===undefined&&(await stat(file)).size>MAX_BYTES)throw Error('Cloud media must be 32 MB or smaller. Import a shorter clip.');
 const bytes=Buffer.from(await(context.readFile||readLocalFile)(file));if(!bytes.length||bytes.length>MAX_BYTES)throw Error('Cloud media must be between 1 byte and 32 MB');
 const extension=path.extname(file).toLowerCase();
 const mime=type==='video'?({'webm':'video/webm','.webm':'video/webm','.mov':'video/quicktime'}[extension]||'video/mp4'):type==='image'?({'.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}[extension]||'image/png'):({'.wav':'audio/wav','.m4a':'audio/mp4','.ogg':'audio/ogg','.webm':'audio/webm'}[extension]||'audio/mpeg');
 return `data:${mime};base64,${bytes.toString('base64')}`;
}
async function request(url,key,fetchImpl,body){const response=await fetchImpl(trustedQueueURL(url),{method:body?'POST':'GET',headers:{Authorization:`Key ${key}`,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),redirect:'error',signal:AbortSignal.timeout(120000)});if(!response.ok){let detail;try{const data=await response.json();detail=typeof data.detail==='string'?data.detail:data.error;}catch{}throw Error(detail||`Cloud video provider returned ${response.status}`);}return response.json();}
export async function runFalVideo(action,input,job,context={}){
 const key=required(input.apiKey||input.key,'fal API key',500),endpoint=FAL_VIDEO_MODELS[action];if(!endpoint)throw Error('Unknown cloud video tool');
 const fetchImpl=context.fetchImpl||globalThis.fetch,sleep=context.sleep||((ms)=>new Promise(r=>setTimeout(r,ms)));
 job.stage='Preparing selected media';let payload;
 if(action==='lipsync')payload={video_url:await assetData(input.videoId,'video',context),audio_url:await assetData(input.audioId,'audio',context),model:'lipsync-2',sync_mode:'cut_off'};
 if(action==='avatar')payload={image_url:await assetData(input.imageId,'image',context),text_input:required(input.text,'Avatar script',1000),voice:'Aria',prompt:String(input.prompt||'A person speaking naturally to camera').slice(0,1000),num_frames:145,resolution:'480p'};
 if(action==='video')payload={prompt:required(input.prompt,'Video prompt',2000),aspect_ratio:['16:9','9:16','1:1'].includes(input.aspect)?input.aspect:'16:9',resolution:'720p',num_frames:81,frames_per_second:24};
 if(action==='background'){const a=await context.getAsset(required(input.videoId,'Video asset',80));if(a.duration>=30)throw Error('Background replacement needs a video shorter than 30 seconds. Create and export a short clip first.');payload={video_url:await assetData(input.videoId,'video',context),output_container_and_codec:'mp4_h264',preserve_audio:true,background_color:['Black','White','Gray','Green','Blue'].includes(input.backgroundColor)?input.backgroundColor:'Black'};}
 job.stage='Submitting to cloud video provider';const queued=await request(`https://queue.fal.run/${endpoint}`,key,fetchImpl,payload);
 const statusURL=trustedQueueURL(queued.status_url),responseURL=trustedQueueURL(queued.response_url);
 job.providerRequestId=String(queued.request_id||'');job.stage='Waiting in provider queue';
 const deadline=Date.now()+25*60*1000;
 for(let attempt=0;attempt<750&&Date.now()<deadline;attempt++){
  const status=await request(statusURL,key,fetchImpl);
  if(status.status==='COMPLETED'){
   job.stage='Retrieving generated video';const result=await request(responseURL,key,fetchImpl);const value=result.video?.url||result.data?.video?.url;
   let output;try{output=new URL(value);}catch{throw Error('Provider returned no generated video');}
   if(output.protocol!=='https:'||output.username||output.password||output.port)throw Error('Provider returned an invalid video URL');
   return {url:output.href,provider:'fal',model:endpoint,requestId:job.providerRequestId};
  }
  if(['FAILED','ERROR','CANCELLED'].includes(status.status))throw Error(typeof status.error==='string'?status.error:`Cloud video ${status.status.toLowerCase()}`);
  if(!['IN_QUEUE','IN_PROGRESS'].includes(status.status))throw Error('Provider returned an unknown queue status');
  job.stage=status.status==='IN_QUEUE'?'Waiting in provider queue':'Provider is generating video';
  await sleep(2000);
 }
 throw Error(`Cloud video timed out. Provider request ${job.providerRequestId} may still be running; check fal before retrying.`);
}
