import fsp from 'node:fs/promises';
import path from 'node:path';
import {intervals,duration,subtitles,srt} from './src/model.js';

const number=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,a,b,f=a)=>Math.max(a,Math.min(b,number(v,f)));
const color=v=>/^#[a-f\d]{6}$/i.test(v||'')?v:'#161b23';
export function renderSize(aspect,resolution){const n=['720','1080','2160'].includes(String(resolution))?Number(resolution):720;return aspect==='9:16'?[n,Math.round(n*16/9/2)*2]:aspect==='1:1'?[n,n]:[Math.round(n*16/9/2)*2,n];}
export function normalizeLayers(layers,total){return (Array.isArray(layers)?layers:[]).slice(0,100).filter(l=>['video','image','audio','text','shape'].includes(l.type)).map(l=>({...l,start:clamp(l.start,0,total),end:clamp(l.end,0,total,total),sourceStart:Math.max(0,number(l.sourceStart)),x:clamp(l.x,-1,1),y:clamp(l.y,-1,1),width:clamp(l.width,.01,2,.35),height:clamp(l.height,.01,2,.35),opacity:clamp(l.opacity,0,1,1),volume:clamp(l.volume,0,4,1),zIndex:number(l.zIndex),fadeIn:clamp(l.fadeIn,0,total),fadeOut:clamp(l.fadeOut,0,total)})).filter(l=>l.end>l.start).sort((a,b)=>a.zIndex-b.zIndex);}

export async function renderComposition({composition:comp,format='mp4',resolution='720',burnCaptions=true},j,{catalog,data,ffmpeg,run,getAsset}){
 if(!comp)throw Error('A composition is required');
 const segments=intervals(comp,catalog),total=duration(segments);
 if(!segments.length)throw Error('Your composition has no media to export');
 if(segments.length>250)throw Error('Please export fewer than 250 separate cuts at once');
 for(const s of segments){const a=getAsset(s.assetId);if(!Number.isFinite(s.start)||!Number.isFinite(s.end)||s.start<0||s.end>a.duration+.1)throw Error('An edit is outside its source media');}
 const layers=normalizeLayers(comp.layers,total),dir=path.join(data,'jobs',j.id);await fsp.mkdir(dir,{recursive:true});
 const encode=(args,options={})=>run(ffmpeg,['-hide_banner','-loglevel','error','-y',...args],options);
 const [w,h]=renderSize(comp.aspect,resolution),cues=subtitles(comp,segments);
 await fsp.writeFile(path.join(dir,'captions.srt'),srt(cues));await fsp.writeFile(path.join(dir,'title.txt'),String(comp.title||'').slice(0,300));
 const parts=[];
 for(let i=0;i<segments.length;i++){
  const s=segments[i],a=getAsset(s.assetId),out=path.join(dir,`part-${i}.mp4`),len=s.end-s.start;
  j.stage=`Rendering cut ${i+1} of ${segments.length}`;j.progress=Math.round(i/segments.length*65);
  const args=['-ss',String(s.start),'-t',String(len),'-i',a.file];let vi='0:v:0',ai='0:a:0',extra=1;
  if(comp.studioSound&&a.studioAudio){args.push('-ss',String(s.start),'-t',String(len),'-i',a.studioAudio);ai=`${extra++}:a:0`;}
  if(a.type!=='video'){args.push('-f','lavfi','-i',`color=c=${color(comp.background)}:s=${w}x${h}:r=30`);vi=`${extra++}:v:0`;}
  if(!a.hasAudio){args.push('-f','lavfi','-i','anullsrc=r=48000:cl=stereo');ai=`${extra++}:a:0`;}
  const zoom=clamp(comp.zoom,1,2,1),vf=[`scale=${Math.round(w*zoom/2)*2}:${Math.round(h*zoom/2)*2}:force_original_aspect_ratio=increase`,`crop=${w}:${h}`,'setsar=1','fps=30',`eq=brightness=${clamp(number(comp.brightness,1)-1,-.5,.5)}:contrast=${clamp(comp.contrast,.5,2,1)}:saturation=${clamp(comp.saturation,0,2,1)}`];
  if(comp.chromakey)vf.push(`chromakey=${color(comp.chromeColor)}:0.12:0.08`);
  const af=[`volume=${clamp(comp.volume,0,4,1)}`,comp.audioCleanup?'highpass=f=80,lowpass=f=12000,afftdn=nf=-25,loudnorm=I=-16:TP=-1.5:LRA=11':'anull','aresample=48000','aformat=sample_fmts=fltp:channel_layouts=stereo'];
  const visual=comp.chromakey?`[${vi}]${vf.join(',')}[fg];color=c=${color(comp.background)}:s=${w}x${h}:r=30:d=${len}[bg];[bg][fg]overlay=shortest=1[v]`:`[${vi}]${vf.join(',')}[v]`;
  args.push('-filter_complex',`${visual};[${ai}]${af.join(',')}[a]`,'-map','[v]','-map','[a]','-t',String(len),'-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-ar','48000',out);await encode(args);parts.push(`file 'part-${i}.mp4'`);
 }
 await fsp.writeFile(path.join(dir,'concat.txt'),parts.join('\n'));await encode(['-f','concat','-safe','0','-i','concat.txt','-c','copy','base.mp4'],{cwd:dir});
 j.stage='Compositing layers and mixing audio';j.progress=72;
 const args=['-i','base.mp4'],graph=[],audio=['abase'];let nextInput=1,current='vbase',serial=0;
 graph.push('[0:v]setpts=PTS-STARTPTS[vbase]','[0:a]asetpts=PTS-STARTPTS[abase]');
 const chain=(filter)=>{const out=`v${serial++}`;graph.push(`[${current}]${filter}[${out}]`);current=out;};
 // Scene backgrounds are visible for audio-only projects. Video remains the scene's main image.
 const audioOnly=segments.every(s=>getAsset(s.assetId).type!=='video');
 for(const scene of (comp.scenes||[]).slice(0,100)){
  const start=clamp(scene.start,0,total),end=clamp(scene.end,0,total,total);
  if(end<=start)continue;
  if(audioOnly&&scene.background)chain(`drawbox=x=0:y=0:w=iw:h=ih:color=${color(scene.background)}:t=fill:enable='between(t,${start},${end})'`);
  if(scene.transition==='fade'&&start>0){const d=clamp(scene.duration,.04,2,.3);chain(`fade=t=out:st=${Math.max(0,start-d)}:d=${d}:enable='between(t,${Math.max(0,start-d)},${start})',fade=t=in:st=${start}:d=${d}:enable='between(t,${start},${start+d})'`);}
 }
 for(let i=0;i<layers.length;i++){
  const l=layers[i],len=l.end-l.start,enable=`between(t,${l.start},${l.end})`,lw=Math.max(2,Math.round(w*l.width/2)*2),lh=Math.max(2,Math.round(h*l.height/2)*2),lx=Math.round(w*l.x),ly=Math.round(h*l.y);
  if(l.type==='text'){
   const file=`layer-${i}.txt`;await fsp.writeFile(path.join(dir,file),String(l.text||'').slice(0,5000));
   const alpha=`${l.opacity}*max(0,min(1,min(${l.fadeIn?`(t-${l.start})/${l.fadeIn}`:'1'},${l.fadeOut?`(${l.end}-t)/${l.fadeOut}`:'1'})))`;
   chain(`drawtext=textfile=${file}:expansion=none:fontcolor=${color(l.color||'#ffffff')}:alpha='${alpha}':fontsize=${clamp(l.fontSize,8,300,42)}:x=${lx}+(${lw}-text_w)/2:y=${ly}+(${lh}-text_h)/2:enable='${enable}'`);continue;
  }
  if(l.type==='shape'){
   const label=`shape${i}`,effects=[`color=c=${color(l.color)}:s=${lw}x${lh}:r=30:d=${len}`,'format=rgba',`colorchannelmixer=aa=${l.opacity}`];
   if(l.fadeIn)effects.push(`fade=t=in:st=0:d=${Math.min(l.fadeIn,len)}:alpha=1`);
   if(l.fadeOut)effects.push(`fade=t=out:st=${Math.max(0,len-l.fadeOut)}:d=${Math.min(l.fadeOut,len)}:alpha=1`);
   effects.push(`setpts=PTS-STARTPTS+${l.start}/TB`);graph.push(`${effects.join(',')}[${label}]`);
   const out=`v${serial++}`;graph.push(`[${current}][${label}]overlay=x=${lx}:y=${ly}:eof_action=pass:enable='${enable}'[${out}]`);current=out;continue;
  }
  const a=getAsset(l.assetId),input=nextInput++;
  if(l.type==='image')args.push('-loop','1','-t',String(len),'-i',a.file);else args.push('-ss',String(l.sourceStart),'-t',String(len),'-i',a.file);
  let audioInput=input;
  if(comp.studioSound&&a.studioAudio&&l.volume>0){audioInput=nextInput++;args.push('-ss',String(l.sourceStart),'-t',String(len),'-i',a.studioAudio);}
  if(l.type!=='audio'){
   if(l.type==='video'&&a.type!=='video')throw Error('A video layer requires a video asset');
   const label=`layer${i}`,effects=[`scale=${lw}:${lh}:force_original_aspect_ratio=decrease`,`pad=${lw}:${lh}:(ow-iw)/2:(oh-ih)/2:color=black@0`,'setsar=1','fps=30','format=rgba',`colorchannelmixer=aa=${l.opacity}`];
   if(l.fadeIn)effects.push(`fade=t=in:st=0:d=${Math.min(l.fadeIn,len)}:alpha=1`);
   if(l.fadeOut)effects.push(`fade=t=out:st=${Math.max(0,len-l.fadeOut)}:d=${Math.min(l.fadeOut,len)}:alpha=1`);
   effects.push(`setpts=PTS-STARTPTS+${l.start}/TB`);graph.push(`[${input}:v]${effects.join(',')}[${label}]`);
   const out=`v${serial++}`;graph.push(`[${current}][${label}]overlay=x=${lx}:y=${ly}:eof_action=pass:enable='${enable}'[${out}]`);current=out;
  }
  if(l.type!=='image'&&a.hasAudio&&l.volume>0){
   const label=`audio${i}`,effects=['aresample=48000','aformat=sample_fmts=fltp:channel_layouts=stereo',`volume=${l.volume}`,'asetpts=PTS-STARTPTS'];
   if(l.fadeIn)effects.push(`afade=t=in:st=0:d=${Math.min(l.fadeIn,len)}`);
   if(l.fadeOut)effects.push(`afade=t=out:st=${Math.max(0,len-l.fadeOut)}:d=${Math.min(l.fadeOut,len)}`);
   effects.push(`adelay=${Math.round(l.start*1000)}:all=1`);graph.push(`[${audioInput}:a]${effects.join(',')}[${label}]`);audio.push(label);
  }
 }
 if(burnCaptions&&comp.captions&&cues.length)chain(`subtitles=filename=captions.srt:force_style='FontName=Arial,FontSize=${comp.captionStyle==='bold'?30:22},PrimaryColour=&H00FFFFFF,OutlineColour=&H00101010,BorderStyle=1,Outline=2,Alignment=2,MarginV=36'`);
 if(comp.title)chain(`drawtext=textfile=title.txt:expansion=none:fontcolor=${color(comp.titleColor||'#ffffff')}:fontsize=${Math.round(w*.04)}:box=1:boxcolor=black@0.5:boxborderw=14:x=(w-text_w)/2:y=${comp.titlePosition==='top'?'h*0.1':'h*0.78'}`);
 let afin=audio.length>1?`${audio.map(a=>`[${a}]`).join('')}amix=inputs=${audio.length}:duration=first:normalize=0,alimiter=limit=0.95`:'[abase]anull';
 const fi=clamp(comp.fadeIn,0,total),fo=clamp(comp.fadeOut,0,total);
 if(fi){chain(`fade=t=in:st=0:d=${fi}`);afin+=`,afade=t=in:st=0:d=${fi}`;}
 if(fo){chain(`fade=t=out:st=${total-fo}:d=${fo}`);afin+=`,afade=t=out:st=${total-fo}:d=${fo}`;}
 graph.push(`${afin}[aout]`);
 const output=path.join(dir,`talkcut-export.${format==='mp3'?'mp3':'mp4'}`);
 args.push('-filter_complex_threads','1','-filter_complex',graph.join(';'),'-map',`[${current}]`,'-map','[aout]','-t',String(total));
 if(format==='mp3')args.push('-vn','-c:a','libmp3lame','-b:a','192k');else args.push('-c:v','libx264','-preset','veryfast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-movflags','+faststart');
 args.push(output);await encode(args,{cwd:dir});j.progress=99;
 return {url:`/exports/${j.id}/${path.basename(output)}`,filename:path.basename(output),duration:total,bytes:(await fsp.stat(output)).size};
}
