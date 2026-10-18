import test from 'node:test';
import assert from 'node:assert/strict';
import {runFalVideo,trustedQueueURL} from '../fal-video.mjs';
const status_url='https://queue.fal.run/fal-ai/model/requests/123/status',response_url='https://queue.fal.run/fal-ai/model/requests/123';
const json=value=>new Response(JSON.stringify(value));
function mockQueue(states=['IN_QUEUE','IN_PROGRESS','COMPLETED']){const calls=[];return {calls,fetchImpl:async(url,options)=>{calls.push({url,...options});if(options.method==='POST')return json({request_id:'123',status_url,response_url});if(url===status_url)return json({status:states.shift()});return json({video:{url:'https://v3.fal.media/files/output.mp4'}});}};}
test('generative video submits fixed schema and polls genuine queue states',async()=>{
 const mock=mockQueue(),job={};const result=await runFalVideo('video',{apiKey:'secret',prompt:'Ocean',aspect:'9:16'},job,{...mock,sleep:async()=>{}});
 assert.equal(result.url,'https://v3.fal.media/files/output.mp4');assert.equal(mock.calls.length,5);assert.equal(job.providerRequestId,'123');assert.equal(job.progress,undefined);
 assert.deepEqual(JSON.parse(mock.calls[0].body),{prompt:'Ocean',aspect_ratio:'9:16',resolution:'720p',num_frames:81,frames_per_second:24});assert.equal(mock.calls[0].headers.Authorization,'Key secret');assert.equal(mock.calls[0].redirect,'error');
});
test('queue URL cannot exfiltrate authorization through host/credentials/protocol',async()=>{
 for(const url of ['http://queue.fal.run/a','https://evil.test/a','https://queue.fal.run.evil.test/a','https://user:pass@queue.fal.run/a'])assert.throws(()=>trustedQueueURL(url));
 let calls=0;await assert.rejects(runFalVideo('video',{key:'test',prompt:'Ocean'},{},{fetchImpl:async()=>{calls++;return json({status_url:'https://evil.test',response_url});}}),/untrusted queue URL/);assert.equal(calls,1);
});
test('lip sync only reads server catalog assets and supplies data URIs',async()=>{
 const mock=mockQueue(['COMPLETED']);await runFalVideo('lipsync',{key:'test',videoId:'v',audioId:'a',video_url:'https://evil.test'},{},{...mock,sleep:async()=>{},getAsset:id=>({type:id==='v'?'video':'audio',file:id==='v'?'v.mp4':'a.wav'}),readFile:async()=>Buffer.from('test')});const body=JSON.parse(mock.calls[0].body);assert.match(body.video_url,/^data:video\/mp4;base64,/);assert.match(body.audio_url,/^data:audio\/wav;base64,/);assert.equal(body.sync_mode,'cut_off');
});
test('oversized catalog inputs and wrong asset types fail before provider call',async()=>{
 let called=false;const context={fetchImpl:async()=>{called=true;},getAsset:()=>({type:'video',file:'v.mp4'}),readFile:async()=>Buffer.alloc(32*1024*1024+1)};
 await assert.rejects(runFalVideo('lipsync',{key:'test',videoId:'v',audioId:'a'},{},context),/32 MB/);assert.equal(called,false);
 await assert.rejects(runFalVideo('avatar',{key:'test',imageId:'v',text:'Hi'},{},context),/Select a image asset/);
});
test('provider failure terminates polling and never reports successful asset',async()=>{
 const mock=mockQueue(['FAILED']);await assert.rejects(runFalVideo('video',{key:'test',prompt:'Ocean'},{},{...mock,sleep:async()=>{}}),/failed/);
});
test('avatar request matches catalog image and stock voice schema',async()=>{
 const mock=mockQueue(['COMPLETED']);await runFalVideo('avatar',{key:'test',imageId:'i',text:'Hello'},{},{...mock,getAsset:()=>({type:'image',file:'i.jpg'}),readFile:async()=>Buffer.from('jpg'),sleep:async()=>{}});const input=JSON.parse(mock.calls[0].body);assert.equal(input.voice,'Aria');assert.equal(input.num_frames,145);assert.equal(input.text_input,'Hello');assert.match(input.image_url,/^data:image\/jpeg/);
});
test('background replacement sends documented solid color settings and rejects long inputs',async()=>{
 const mock=mockQueue(['COMPLETED']);const context={...mock,getAsset:()=>({type:'video',file:'v.mp4',duration:12}),readFile:async()=>Buffer.from('video'),sleep:async()=>{}};
 await runFalVideo('background',{key:'test',videoId:'v',backgroundColor:'Green'},{},context);
 const input=JSON.parse(mock.calls[0].body);assert.equal(input.background_color,'Green');assert.equal(input.output_container_and_codec,'mp4_h264');assert.equal(input.preserve_audio,true);assert.match(input.video_url,/^data:video\/mp4/);
 let called=false;await assert.rejects(runFalVideo('background',{key:'test',videoId:'v'},{},{...context,getAsset:()=>({type:'video',duration:30}),fetchImpl:async()=>{called=true;}}),/shorter than 30 seconds/);assert.equal(called,false);
});
