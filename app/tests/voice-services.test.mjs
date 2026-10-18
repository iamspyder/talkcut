import test from 'node:test';
import assert from 'node:assert/strict';
import {runVoiceAction} from '../voice-services.mjs';
const json=data=>new Response(JSON.stringify(data));
test('voice listing uses current endpoint, auth and bounded metadata',async()=>{
 let sent;const result=await runVoiceAction('voices',{key:'secret'},{fetchImpl:async(url,init)=>{sent={url,...init};return json({voices:[{voice_id:'voice1',name:'My voice',category:'cloned',samples:['private']}],has_more:true,next_page_token:'next'});}});
 assert.match(sent.url,/\/v2\/voices\?page_size=100/);assert.equal(sent.headers['xi-api-key'],'secret');assert.equal(result.voices[0].id,'voice1');assert.equal(result.voices[0].samples,undefined);assert.equal(result.nextPageToken,'next');
});
test('clone uploads catalog audio in multipart files and propagates verification',async()=>{
 let sent;const result=await runVoiceAction('clone',{key:'secret',name:'My voice',sampleIds:['a'],consent:true},{getAsset:()=>({type:'audio',file:'sample.wav'}),readFile:async()=>Buffer.from('sample'),fetchImpl:async(url,init)=>{sent={url,...init};return json({voice_id:'clone1',requires_verification:true});}});
 assert.equal(sent.url,'https://api.elevenlabs.io/v1/voices/add');assert.equal(sent.body.get('name'),'My voice');assert.equal(sent.body.getAll('files').length,1);assert.equal(sent.body.get('files').type,'audio/wav');assert.equal(sent.headers['Content-Type'],undefined);assert.equal(result.voice.requiresVerification,true);
});
test('clone requires permission, catalog audio and byte cap before provider call',async()=>{
 const input={key:'test',name:'Voice',sampleIds:['a']};await assert.rejects(runVoiceAction('clone',input),/permission/);
 let called=false;const context={getAsset:()=>({type:'audio',file:'sample.mp3'}),readFile:async()=>Buffer.alloc(20*1024*1024+1),fetchImpl:async()=>{called=true;}};
 await assert.rejects(runVoiceAction('clone',{...input,consent:true},context),/20 MB/);assert.equal(called,false);
 context.getAsset=()=>({type:'video',file:'sample.mp4'});await assert.rejects(runVoiceAction('clone',{...input,consent:true},context),/audio assets/);
});
test('synthesize validates voice identity and emits downloadable MP3',async()=>{
 let sent;const result=await runVoiceAction('synthesize',{key:'test',voiceId:'voice1',text:'Hello'},{fetchImpl:async(url,init)=>{sent={url,...init};return new Response(new Uint8Array([1,2,3]));}});
 assert.equal(result.base64,'AQID');assert.equal(result.mime,'audio/mpeg');assert.equal(JSON.parse(sent.body).model_id,'eleven_multilingual_v2');assert.match(sent.url,/voice1\?output_format=mp3_44100_128$/);
 await assert.rejects(runVoiceAction('synthesize',{key:'test',voiceId:'../bad',text:'Hello'}),/Invalid voice ID/);
});
test('provider errors remain actionable and credentials never redirect',async()=>{
 await assert.rejects(runVoiceAction('voices',{key:'test'},{fetchImpl:async(url,init)=>{assert.equal(init.redirect,'error');return new Response(JSON.stringify({detail:{message:'Insufficient permissions'}}),{status:403});}}),/Insufficient permissions/);
});
