import test from 'node:test';
import assert from 'node:assert/strict';
import {runAIAction} from '../ai-services.mjs';
const cues=[{id:'a',start:0,end:20,text:'Welcome to this lesson.'},{id:'b',start:20,end:40,text:'Here are useful ideas.'}];
const response=value=>async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]}),{status:200});
test('translation preserves original timing and requires every caption identity',async()=>{
 const translated=await runAIAction('translate',{apiKey:'test',cues,language:'Spanish'},{fetchImpl:response({translations:[{id:'b',text:'Ideas útiles.'},{id:'a',text:'Bienvenidos.'}]})});
 assert.deepEqual(translated.cues.map(c=>[c.id,c.start,c.end]),[['a',0,20],['b',20,40]]);
 assert.equal(translated.cues[0].text,'Bienvenidos.');
 await assert.rejects(runAIAction('translate',{apiKey:'test',cues,language:'Spanish'},{fetchImpl:response({translations:[{id:'a',text:'Hola'},{id:'a',text:'Hola'}]})}),/invalid caption IDs/);
});
test('clip bounds are checked independently of model schema',async()=>{
 await assert.rejects(runAIAction('clips',{apiKey:'test',cues},{fetchImpl:response({clips:[{title:'Invalid',reason:'outside media',start:0,end:90}]})}),/time bounds/);
 const result=await runAIAction('clips',{apiKey:'test',cues},{fetchImpl:response({clips:[{title:'Lesson',reason:'Good introduction',start:0,end:20}]})});assert.equal(result.clips.length,1);
});
test('speech uses stock voice, explicit model and binary bytes',async()=>{
 let request;const result=await runAIAction('speech',{apiKey:'secret',text:'Hello',voice:'coral'},{fetchImpl:async(url,init)=>{request={url,...init};return new Response(new Uint8Array([1,2,3]));}});
 assert.equal(result.base64,'AQID');assert.equal(JSON.parse(request.body).model,'gpt-4o-mini-tts');assert.equal(request.headers.Authorization,'Bearer secret');
 await assert.rejects(runAIAction('speech',{apiKey:'test',text:'Hello',voice:'cloned-person'}),/stock voice/);
});
test('provider failures and missing key are actionable',async()=>{
 await assert.rejects(runAIAction('speech',{text:'Hello'}),/API key/);
 await assert.rejects(runAIAction('image',{apiKey:'test',prompt:'Landscape'},{fetchImpl:async()=>new Response(JSON.stringify({error:{message:'Invalid API key'}}),{status:401})}),/Invalid API key/);
});
test('show notes reject invented chapter times',async()=>{
 const notes={title:'Lesson',summary:'Useful ideas.',social:'Watch our lesson.',chapters:[{time:45,title:'Outside source'}]};
 await assert.rejects(runAIAction('show-notes',{apiKey:'test',cues},{fetchImpl:response(notes)}),/invalid show notes/);
 notes.chapters[0].time=20;assert.equal((await runAIAction('show-notes',{apiKey:'test',cues},{fetchImpl:response(notes)})).chapters[0].time,20);
});
test('image requests use documented sizes and return a downloadable asset',async()=>{
 let sent;const result=await runAIAction('image',{apiKey:'test',prompt:'Landscape',size:'unsafe-value'},{fetchImpl:async(url,init)=>{sent=JSON.parse(init.body);return new Response(JSON.stringify({data:[{b64_json:'aW1hZ2U='}]}));}});
 assert.equal(sent.size,'1536x1024');assert.equal(result.mime,'image/png');assert.equal(result.filename,'ai-image.png');
});
