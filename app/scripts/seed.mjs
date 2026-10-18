import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import {prepareWords,emptyComposition} from '../src/model.js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const folder=path.join(root,'data','seed');
await fs.mkdir(folder,{recursive:true});
const run=(exe,args,opts={})=>new Promise((resolve,reject)=>{const p=spawn(exe,args,{cwd:folder,windowsHide:true,...opts});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err=(err+b).slice(-5000));p.on('error',reject);p.on('close',c=>c?reject(Error(err)):resolve(out));});
try{await fs.access(path.join(folder,'narration.wav'));}catch{await run('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(root,'scripts','seed-speech.ps1')]);}
const meta=JSON.parse(await run(ffprobe.path,['-v','quiet','-show_format','-of','json',path.join(folder,'narration.wav')]));
const seconds=Number(meta.format.duration);
const W=1280,H=720,pixels=Buffer.alloc(W*H*3);
for(let y=0;y<H;y++)for(let x=0;x<W;x++){
 const t=y/H;let c=[232-37*t,204-47*t,174-49*t];
 const sun=(x-1000)**2+(y-170)**2<78**2;if(sun)c=[249,224,169];
 if(y>480+Math.sin(x/230)*55+Math.cos(x/330)*28)c=[135,146,122];
 if(y>565+Math.sin(x/280+1.3)*57)c=[89,112,98];
 if(y>670+Math.cos(x/250)*50)c=[53,81,74];
 const noise=Math.sin(x*12.9898+y*78.233)*1.8;const i=(y*W+x)*3;pixels[i]=c[0]+noise;pixels[i+1]=c[1]+noise;pixels[i+2]=c[2]+noise;
}
await fs.writeFile(path.join(folder,'landscape.ppm'),Buffer.concat([Buffer.from(`P6\n${W} ${H}\n255\n`),pixels]));
await fs.writeFile(path.join(folder,'line1.txt'),'Small ideas.');await fs.writeFile(path.join(folder,'line2.txt'),'Big possibilities.');await fs.writeFile(path.join(folder,'eyebrow.txt'),'THE CREATIVE PROCESS     /     01');
const font=process.platform==='win32'?"fontfile='C\\:/Windows/Fonts/georgia.ttf'":'font=serif';
const sans=process.platform==='win32'?"fontfile='C\\:/Windows/Fonts/arial.ttf'":'font=sans';
const vf=`drawtext=${sans}:textfile=eyebrow.txt:fontcolor=0x4e594e:fontsize=17:x=90:y=150,drawtext=${font}:textfile=line1.txt:fontcolor=0x354f46:fontsize=83:x=85:y=225,drawtext=${font}:textfile=line2.txt:fontcolor=0x354f46:fontsize=83:x=85:y=325`;
const video=path.join(folder,'A-little-room-to-create.mp4');
await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-loop','1','-i','landscape.ppm','-i','narration.wav','-vf',vf,'-t',String(seconds),'-r','30','-c:v','libx264','-preset','veryfast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',video]);
console.log('Created original demo video',seconds.toFixed(2),'seconds');
// Import through the same API used by the editor, then save a real project.
const response=await fetch('http://127.0.0.1:5173/api/upload',{method:'POST',headers:{'X-Filename':'A-little-room-to-create.mp4'},body:await fs.readFile(video)});
const asset=await response.json();if(!response.ok)throw Error(asset.error);
const raw=JSON.parse((await fs.readFile(path.join(folder,'words.json'),'utf8')).replace(/^\uFEFF/,''));
const marked=raw.filter(w=>w.word.trim()).map((w,i,a)=>({...w,end:i<a.length-1?a[i+1].start:seconds,speaker:'Alex · Demo narrator'}));
const composition=emptyComposition('A little room to create',[asset.id]);composition.words=prepareWords(marked,asset);composition.captions=false;composition.transcriptTiming='speech-events';
const project={id:crypto.randomUUID(),name:'The creative process',compositions:[composition],createdAt:new Date().toISOString(),demo:true};
const saved=await fetch('http://127.0.0.1:5173/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(project)});if(!saved.ok)throw Error(await saved.text());
await fs.writeFile(path.join(folder,'project.json'),JSON.stringify(project,null,2));console.log('Demo project saved:',project.id,composition.words.length,'timestamped words');
