import fs from 'node:fs';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';

const root=process.cwd(),folder=path.join(root,'qa','demo'),docs=path.resolve(root,'../docs');
const recording=JSON.parse(fs.readFileSync(path.join(folder,'recording.json'),'utf8'));
if(!recording.passed)throw Error('Finish a successful real UI recording first.');
const intro=2.8,outro=3.8,speedStart=recording.exportSubmitted??76,speedEnd=recording.exportCompleted??recording.duration-2.2;
const waitLength=Math.min(8,speedEnd-speedStart),speedFactor=(speedEnd-speedStart)/waitLength;
const uiDuration=speedStart+waitLength+recording.duration-speedEnd,total=intro+uiDuration+outro;
const run=(exe,args)=>new Promise((resolve,reject)=>{const child=spawn(exe,args,{cwd:folder,windowsHide:true});let output='',error='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>error=(error+b).slice(-14000));child.on('error',reject);child.on('close',code=>code?reject(Error(error)):resolve(output));});
const browser=await chromium.launch({channel:'chrome',executablePath:process.env.CHROME_PATH||undefined,headless:true});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080},deviceScaleFactor:1});
 const logo='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'public/brand/talkcut-mark.svg')).toString('base64');
 const card=async(type)=>{
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;width:1920px;height:1080px;background:radial-gradient(ellipse at 50% 18%,#39235c 0,#171321 52%,#101019 100%);color:#faf8ff;font-family:'Segoe UI',Arial,sans-serif;display:flex;align-items:center;justify-content:center;text-align:center}.eyebrow{letter-spacing:5px;font-size:20px;color:#bda7fa;margin:24px 0}img{width:104px;height:104px;border-radius:26px;box-shadow:0 16px 80px #8b59ff40}h1{font-size:${type==='intro'?80:88}px;line-height:1.1;letter-spacing:-3px;margin:24px 0;font-weight:650}p{font-size:30px;color:#cec6dd;margin:24px 0;line-height:1.6}.accent{color:#bb9bff}.url{display:inline-block;font-size:27px;border:1px solid #7553af;border-radius:16px;padding:18px 32px;background:#7357e915}.credit{position:absolute;bottom:42px;left:0;right:0;color:#9d90b1;font-size:19px}</style><main><img src="${logo}"/><div class="eyebrow">${type==='intro'?'MEET TALKCUT':'YOUR FILES. YOUR STORY.'}</div><h1>${type==='intro'?'Your story.<br/><span class="accent">A little sharper.</span>':'Keep the story.<br/><span class="accent">Cut the noise.</span>'}</h1><p>${type==='intro'?'Edit video by editing text.<br/>Free. Offline. No watermark.':'Try TalkCut. Make your first clean cut.'}</p>${type==='outro'?'<div class="url">github.com/iamspyder/talkcut</div>':''}</main><div class="credit">Created by Rajan Gupta · Open-source desktop video editing</div>`);
  await page.screenshot({path:path.join(folder,type+'.png')});
 };
 await card('intro');await card('outro');
}finally{await browser.close();}
const font=process.env.DEMO_FONT||(process.platform==='win32'?path.join(process.env.WINDIR||'C:/Windows','Fonts','segoeui.ttf'):process.platform==='darwin'?'/System/Library/Fonts/Supplemental/Arial.ttf':'/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf');
fs.copyFileSync(font,path.join(folder,'font.ttf')); // OS font is used locally, never committed/distributed.
fs.copyFileSync(path.join(root,'build/icons/talkcut.png'),path.join(folder,'mark.png'));
const files=recording.frames.filter(f=>f.time<=recording.duration),concat=[];
const entry=(frame,duration)=>{concat.push(`file '${recording.framesFolder}/${frame.file}'`,`duration ${Math.max(.001,duration).toFixed(6)}`);};
if(files[0].time>0)entry(files[0],files[0].time);
files.forEach((f,i)=>entry(f,(files[i+1]?.time??recording.duration)-f.time));concat.push(`file '${recording.framesFolder}/${files.at(-1).file}'`);fs.writeFileSync(path.join(folder,'frames.txt'),concat.join('\n')+'\n');
fs.writeFileSync(path.join(folder,'brand.txt'),'talkcut.');
const graph=[`[0:v]fps=30,scale=1728:972:flags=lanczos,setsar=1,trim=duration=${recording.duration},setpts=PTS-STARTPTS,split=3[pre][wait][post]`,`[pre]trim=end=${speedStart},setpts=PTS-STARTPTS[p0]`,`[wait]trim=start=${speedStart}:end=${speedEnd},setpts=(PTS-STARTPTS)/${speedFactor}[p1]`,`[post]trim=start=${speedEnd},setpts=PTS-STARTPTS[p2]`,'[p0][p1][p2]concat=n=3:v=1:a=0,fps=30[screen]',`color=c=0x111019:s=1920x1080:r=30:d=${uiDuration}[bg]`,'[bg][screen]overlay=96:92:shortest=1[framed]','[3:v]scale=56:56[logo]','[framed][logo]overlay=40:17[branded]',"[branded]drawtext=fontfile=font.ttf:textfile=brand.txt:expansion=none:fontcolor=white:fontsize=37:x=110:y=24[h0]"];
let current='h0';
recording.scenes.forEach((scene,i)=>{
 const detail=scene.title.startsWith('05')?`A real local 1080p export • export wait sped up ${speedFactor.toFixed(1)}×.`:scene.detail;
 for(const [kind,text,y,size,color] of [['title',scene.title,16,30,'white'],['detail',detail,56,19,'0xbeb3ce']]){
  const file=`${kind}-${i}.txt`;fs.writeFileSync(path.join(folder,file),text);
  const next=`${kind}${i}`,end=recording.scenes[i+1]?.start??uiDuration;
  graph.push(`[${current}]drawtext=fontfile=font.ttf:textfile=${file}:expansion=none:fontcolor=${color}:fontsize=${size}:x=390:y=${y}:enable='between(t,${scene.start},${end})'[${next}]`);current=next;
 }
});
graph.push(`[${current}]format=yuv420p[ui]`,'[1:v]fps=30,setsar=1,format=yuv420p[intro]','[2:v]fps=30,setsar=1,format=yuv420p[outro]','[intro][ui][outro]concat=n=3:v=1:a=0[vout]',`anullsrc=r=48000:cl=stereo,atrim=duration=${total}[silence]`);
recording.audio.forEach((audio,i)=>{const delay=Math.round((intro+audio.start)*1000);graph.push(`[${audio.kind==='before'?4:5}:a]atrim=start=${audio.sourceStart}:duration=${audio.duration},asetpts=PTS-STARTPTS,aresample=48000,aformat=sample_fmts=fltp:channel_layouts=stereo,afade=t=in:d=0.04,afade=t=out:st=${audio.duration-.04}:d=0.04,adelay=${delay}:all=1[a${i}]`);});
graph.push(`[silence]${recording.audio.map((_,i)=>`[a${i}]`).join('')}amix=inputs=${recording.audio.length+1}:duration=first:normalize=0,alimiter=limit=0.98[aout]`);
fs.writeFileSync(path.join(folder,'demo-filter.txt'),graph.join(';\n'));
const master=path.join(folder,'TalkCut-demo-1080p.mp4');
await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i','frames.txt','-loop','1','-framerate','30','-t',String(intro),'-i','intro.png','-loop','1','-framerate','30','-t',String(outro),'-i','outro.png','-i','mark.png','-i',path.join(root,'samples/sample.mp4'),'-i',path.join(root,'samples/sample-after.wav'),'-filter_complex_threads','2','-filter_complex_script','demo-filter.txt','-map','[vout]','-map','[aout]','-c:v','libx264','-threads','4','-preset','medium','-crf','22','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart','-t',String(total),master]);
const published=path.join(docs,'demo.mp4');fs.copyFileSync(master,published);
if(fs.statSync(published).size>4.8*1024*1024)await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',master,'-c:v','libx264','-preset','slow','-crf','28','-c:a','aac','-b:a','96k','-movflags','+faststart',published]);
const scene=(prefix)=>recording.scenes.find(s=>s.title.startsWith(prefix));
const clips=[[0,1.8],[intro+scene('02').start-2,2],[intro+scene('02').start+2,3],[intro+scene('03').start+2,2.5],[intro+recording.scenes.find(s=>s.title.endsWith('AFTER')).start+2,2.5],[intro+scene('04').start+2,2.5],[intro+uiDuration-2.1,2.1]];
const gifGraph=[`[0:v]split=${clips.length}${clips.map((_,i)=>`[g${i}]`).join('')}`,...clips.map(([start,duration],i)=>`[g${i}]trim=start=${start}:duration=${duration},setpts=PTS-STARTPTS[t${i}]`),`${clips.map((_,i)=>`[t${i}]`).join('')}concat=n=${clips.length}:v=1:a=0,fps=8,scale=960:-2:flags=lanczos,split[colors][pixels]`,'[colors]palettegen=max_colors=128:stats_mode=diff[palette]','[pixels][palette]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle[gif]'];
await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',published,'-filter_complex',gifGraph.join(';'),'-map','[gif]','-loop','0',path.join(docs,'demo.gif')]);
const times=[1,intro+scene('02').start+3,intro+scene('03').start+4,intro+recording.scenes.find(s=>s.title.endsWith('AFTER')).start+4,intro+scene('04').start+4,intro+uiDuration-1];
for(let i=0;i<times.length;i++)await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(times[i]),'-i',published,'-frames:v','1','-vf','scale=640:-2',`review-${i}.png`]);
await run(ffmpeg,['-hide_banner','-loglevel','error','-y',...times.flatMap((_,i)=>['-i',`review-${i}.png`]),'-filter_complex','[0:v][1:v][2:v]hstack=inputs=3[top];[3:v][4:v][5:v]hstack=inputs=3[bottom];[top][bottom]vstack=inputs=2','-frames:v','1','review-sheet.png']);
const metadata=JSON.parse(await run(ffprobe.path,['-v','quiet','-show_format','-show_streams','-of','json',published]));
if(metadata.streams[0].width!==1920||metadata.streams[0].height!==1080||!metadata.streams.some(s=>s.codec_type==='audio'))throw Error('Demo media validation failed');
for(const file of [published,path.join(docs,'demo.gif')])if(fs.statSync(file).size>5*1024*1024)throw Error('Published demo exceeds repository size policy: '+file);
await run(ffmpeg,['-hide_banner','-loglevel','error','-i',published,'-f','null','-']);
fs.writeFileSync(path.join(folder,'verification.json'),JSON.stringify({passed:true,duration:Number(metadata.format.duration),mp4Bytes:fs.statSync(published).size,gifBytes:fs.statSync(path.join(docs,'demo.gif')).size,width:1920,height:1080,recordingChecks:recording.checks,master,published},null,2));
console.log(fs.readFileSync(path.join(folder,'verification.json'),'utf8'));
