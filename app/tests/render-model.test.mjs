import test from 'node:test';
import assert from 'node:assert/strict';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawn} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
import {normalizeLayers,renderSize,renderComposition} from '../render.mjs';
const run=(exe,args,options={})=>new Promise((resolve,reject)=>{const child=spawn(exe,args,{windowsHide:true,...options});let output='',error='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>error+=b);child.on('error',reject);child.on('close',code=>code?reject(Error(error)):resolve(output));});
test('render geometry and layer validation constrain external project inputs',()=>{
 assert.deepEqual(renderSize('16:9','1080'),[1920,1080]);assert.deepEqual(renderSize('9:16','2160'),[2160,3840]);
 const layers=normalizeLayers([{type:'shape',start:-5,end:2,width:NaN,opacity:5,zIndex:2},{type:'text',start:2,end:1},{type:'audio',start:0,end:1,zIndex:1}],3);
 assert.equal(layers.length,2);assert.equal(layers[0].type,'audio');assert.equal(layers[1].opacity,1);assert.equal(layers[1].width,.35);
});
test('real FFmpeg exports picture-in-picture, text, shapes, music, fades and MP3',async()=>{
 const data=await fsp.mkdtemp(path.join(os.tmpdir(),'talkcut-render-'));
 try{
  const video=path.join(data,'video.mp4'),music=path.join(data,'music.wav'),image=path.join(data,'image.bmp');
  await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=blue:s=160x90:r=30:d=1','-f','lavfi','-i','sine=frequency=300:duration=1','-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',video]);
  await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','sine=frequency=600:duration=1',music]);
  await run(ffmpeg,['-hide_banner','-loglevel','error','-y','-f','lavfi','-i','color=c=yellow:s=32x32','-frames:v','1',image]);
  const catalog=[{id:'v',file:video,type:'video',duration:1,hasAudio:true},{id:'m',file:music,type:'audio',duration:1,hasAudio:true},{id:'i',file:image,type:'image',duration:1,hasAudio:false}];
  const comp={assetIds:['v'],words:[],aspect:'16:9',chromakey:true,chromeColor:'#0000ff',background:'#00ff00',volume:1,title:'literal %{test}',titleColor:'#ff0000',fadeIn:.1,fadeOut:.1,scenes:[{start:.5,end:1,transition:'fade',duration:.1}],layers:[{type:'video',assetId:'v',start:0,end:.8,x:.5,y:.1,width:.3,height:.3,volume:0,fadeIn:.1},{type:'image',assetId:'i',start:.2,end:.7,x:.1,y:.2,width:.2,height:.2},{type:'text',text:'safe %{text}: hello',start:0,end:1,fadeIn:.1,fadeOut:.1,x:.1,y:.7,color:'#ffffff'},{type:'shape',start:0,end:.2,fadeIn:.05,fadeOut:.05,color:'#ff0000',width:.1,height:.1},{type:'audio',assetId:'m',start:.2,end:.9,volume:.3,fadeIn:.1}]};
  const context={catalog,data,ffmpeg,run,getAsset:id=>{const a=catalog.find(a=>a.id===id);if(!a)throw Error('Asset missing');return a;}};
  const result=await renderComposition({composition:comp},{id:'video'},context);
  assert.ok(result.bytes>1000);const file=path.join(data,'jobs','video',result.filename);
  const meta=JSON.parse(await run(ffprobe.path,['-v','quiet','-show_streams','-show_format','-of','json',file]));assert.equal(meta.streams[0].width,1280);assert.ok(Number(meta.format.duration)>=.95);assert.ok(meta.streams.some(s=>s.codec_type==='audio'));
  const pixel=await run(ffmpeg,['-hide_banner','-loglevel','error','-ss','0.4','-i',file,'-frames:v','1','-vf','crop=2:2:200:250,signalstats,metadata=print:file=-','-f','null','-']);assert.ok(Number(pixel.match(/YAVG=(\d+(?:\.\d+)?)/)?.[1])>180,'image layer must render yellow pixels');
  const mp3=await renderComposition({composition:{...comp,title:'',layers:comp.layers.filter(l=>l.type==='audio')},format:'mp3'},{id:'audio'},context);assert.ok(mp3.bytes>1000);
  catalog[0].studioAudio=music;
  const cleaned=await renderComposition({composition:{...comp,studioSound:true,chromakey:false,title:'',layers:[]},format:'mp3'},{id:'studio'},context);
  const metrics=await run(ffmpeg,['-hide_banner','-loglevel','error','-i',path.join(data,'jobs','studio',cleaned.filename),'-af','astats=metadata=1:reset=0,ametadata=print:key=lavfi.astats.1.Zero_crossings_rate:file=-','-f','null','-']);
  const rates=[...metrics.matchAll(/Zero_crossings_rate=(\d+(?:\.\d+)?)/g)].map(m=>Number(m[1]));assert.ok(rates.length>0&&rates.at(-1)>.02,'Studio Sound export must contain the 600 Hz processed source rather than original 300 Hz audio');
 }finally{const resolved=path.resolve(data),parent=path.resolve(os.tmpdir())+path.sep;if(!resolved.startsWith(parent)||!path.basename(resolved).startsWith('talkcut-render-'))throw Error('Unsafe render test cleanup target');await fsp.rm(resolved,{recursive:true,force:true});}
});
