import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {emptyComposition} from '../src/model.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const base=process.env.TALKCUT_URL||'http://127.0.0.1:5173';
const id=randomUUID(),initialName=`QA realtime ${Date.now()}`;
const project={id,name:initialName,compositions:[emptyComposition('Realtime test composition')],createdAt:new Date().toISOString()};
const creation=await fetch(base+'/api/projects',{method:'POST',headers:{'Content-Type':'application/json','X-Talkcut-Revision':'0'},body:JSON.stringify(project)});
assert.equal(creation.status,200,'isolated QA project should be created');
const stored=await(await fetch(base+'/api/projects/'+id)).json();
const browser=await chromium.launch({channel:'chrome',executablePath:process.env.CHROME_PATH||undefined,headless:true});
const contextA=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true});
const contextB=await browser.newContext({viewport:{width:1600,height:1000},acceptDownloads:true});
const a=await contextA.newPage(),b=await contextB.newPage(),errors=[],checks=[];
for(const page of [a,b]){
 page.on('pageerror',e=>errors.push(e.message));
 // Boot only the isolated fixture; all saves, live sockets and reloads use real endpoints.
 await page.route('**/api/projects',route=>route.request().method()==='GET'?route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([stored])}):route.continue());
}
const saved=(page,status)=>page.waitForResponse(response=>response.url()===base+'/api/projects'&&response.request().method()==='POST'&&response.request().postDataJSON()?.id===id&&response.status()===status);
const read=async()=>{const response=await fetch(base+'/api/projects/'+id);assert.equal(response.status,200);return response.json();};
await fs.mkdir(path.join(root,'qa'),{recursive:true});
try{
 await Promise.all([a.goto(base,{waitUntil:'networkidle'}),b.goto(base,{waitUntil:'networkidle'})]);
 assert.equal(await a.getByRole('textbox',{name:'Project name',exact:true}).inputValue(),initialName);
 assert.equal(await b.getByRole('textbox',{name:'Project name',exact:true}).inputValue(),initialName);
 await Promise.all([a,b].map(page=>page.waitForFunction(()=>document.querySelector('.save-state')?.title.includes('2 same-server sessions'))));
 checks.push('Two independent browser contexts appear as same-server sessions');
 const aName=initialName+' saved A';
 const aSaved=saved(a,200);await a.getByRole('textbox',{name:'Project name',exact:true}).fill(aName);await aSaved;
 await b.getByRole('status').filter({hasText:'New version from another session'}).waitFor();
 assert.equal((await read()).name,aName);checks.push('Session A save reaches session B as a remote-version notification');
 const draftName=initialName+' unsaved B draft';
 const rejected=saved(b,409);await b.getByRole('textbox',{name:'Project name',exact:true}).fill(draftName);await rejected;
 await b.getByRole('status').filter({hasText:'Your local changes are retained'}).waitFor();
 assert.equal(await b.getByRole('textbox',{name:'Project name',exact:true}).inputValue(),draftName);
 const afterConflict=await read();assert.equal(afterConflict.name,aName);checks.push('Stale save returns 409 and retains B draft without overwriting A');
 const downloading=b.waitForEvent('download');await b.getByRole('button',{name:'Download local project',exact:true}).click();const downloaded=await downloading;
 const local=JSON.parse(await fs.readFile(await downloaded.path(),'utf8'));assert.equal(local.id,id);assert.equal(local.name,draftName);checks.push('Conflict download contains the retained local draft');
 await b.getByRole('button',{name:'Load latest',exact:true}).click();
 await b.waitForFunction(expected=>document.querySelector('input[aria-label="Project name"]')?.value===expected,aName);
 await b.waitForFunction(()=>!document.querySelector('.remote-version-banner'));
 await b.waitForTimeout(1100);
 assert.equal((await read()).revision,afterConflict.revision,'loading latest must not trigger an autosave loop');checks.push('Load latest restores A and does not create another save');
 const bName=initialName+' resumed B';const bSaved=saved(b,200);await b.getByRole('textbox',{name:'Project name',exact:true}).fill(bName);await bSaved;
 assert.equal((await read()).name,bName);await a.getByRole('status').filter({hasText:'New version from another session'}).waitFor();checks.push('Editing resumes at the new revision after explicit reload');
 await b.screenshot({path:path.join(root,'qa','realtime-sessions.png'),fullPage:true});
 assert.deepEqual(errors,[],'no browser runtime errors');
 await fs.writeFile(path.join(root,'qa','realtime-browser-results.json'),JSON.stringify({passed:true,projectId:id,checks,runtimeErrors:errors},null,2));
 console.log('Realtime browser checks passed:',checks.length,'checks. Isolated project:',id);
}catch(error){
 await b.screenshot({path:path.join(root,'qa','realtime-failure.png'),fullPage:true}).catch(()=>{});
 await fs.writeFile(path.join(root,'qa','realtime-browser-results.json'),JSON.stringify({passed:false,projectId:id,error:error.message,checks,runtimeErrors:errors},null,2));throw error;
}finally{await browser.close();}
