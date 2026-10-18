import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID,createHash} from 'node:crypto';
export const validId=id=>typeof id==='string'&&/^[a-zA-Z0-9-]{1,80}$/.test(id);
function checkId(id){if(!validId(id))throw Error('Invalid project ID');}
export function validateProject(p){
 checkId(p?.id);if(typeof p.name!=='string'||p.name.length>300)throw Error('Project name must be at most 300 characters');
 if(!Array.isArray(p.compositions)||!p.compositions.length||p.compositions.length>100)throw Error('A project needs 1–100 compositions');
 for(const c of p.compositions){if(!validId(c.id)||typeof c.name!=='string'||!Array.isArray(c.words)||!Array.isArray(c.assetIds))throw Error('Invalid composition');if(c.words.length>100000||(c.layers?.length||0)>100)throw Error('Composition is too large');for(const w of c.words){if(!validId(w.id)||!validId(w.assetId)||typeof w.text!=='string'||w.text.length>3000||!Number.isFinite(w.start)||!Number.isFinite(w.end)||w.start<0||w.end<w.start)throw Error('Invalid transcript word or timing');}}
 return p;
}
export function createProjectStore(data){
 let pending=Promise.resolve();
 const file=(folder,id)=>{checkId(id);return path.join(data,folder,`${id}.json`);};
 const read=async(filename,fallback)=>{try{return JSON.parse(await fs.readFile(filename,'utf8'));}catch(e){if(e.code==='ENOENT')return fallback;throw e;}};
 const atomic=async(filename,value)=>{await fs.mkdir(path.dirname(filename),{recursive:true});const temp=filename+'.'+randomUUID()+'.tmp';await fs.writeFile(temp,JSON.stringify(value,null,2));await fs.rename(temp,filename);};
 const serial=fn=>{const result=pending.catch(()=>{}).then(fn);pending=result;return result;};
 const save=(project,{expectedRevision}={})=>serial(async()=>{
  validateProject(project);const filename=file('projects',project.id),previous=await read(filename,null),copy=structuredClone(project);
  const digest=p=>{const {updatedAt,revision,...content}=p;return createHash('sha256').update(JSON.stringify(content)).digest('hex');};
  if(previous&&digest(copy)===digest(previous)){const historyFile=file('history',project.id);const existing=await read(historyFile,[]);if(!existing.length)await atomic(historyFile,[{id:randomUUID(),revision:previous.revision||1,createdAt:previous.updatedAt||new Date().toISOString(),name:previous.name,project:previous}]);return previous;}
  if(expectedRevision!==undefined&&expectedRevision!==(previous?.revision||0)){const error=Error('This project changed in another session. Load the latest version before saving over it.');error.status=409;error.currentRevision=previous?.revision||0;throw error;}
  copy.updatedAt=new Date().toISOString();copy.revision=(previous?.revision||0)+1;
  const historyFile=file('history',project.id);const history=await read(historyFile,[]);
  history.unshift({id:randomUUID(),revision:copy.revision,createdAt:copy.updatedAt,name:copy.name,project:copy});
  await atomic(historyFile,history.slice(0,50));await atomic(filename,copy);return copy;
 });
 const list=async()=>{await fs.mkdir(path.join(data,'projects'),{recursive:true});const projects=[];for(const name of await fs.readdir(path.join(data,'projects'))){if(!name.endsWith('.json'))continue;const p=await read(path.join(data,'projects',name),null);if(p)projects.push(p);}return projects.sort((a,b)=>(b.updatedAt||'').localeCompare(a.updatedAt||''));};
 const history=async id=>(await read(file('history',id),[])).map(({project,...v})=>v);
 const version=async(id,versionId)=>{checkId(versionId);const item=(await read(file('history',id),[])).find(v=>v.id===versionId);if(!item)throw Error('Version not found');return item.project;};
 const comments=async id=>await read(file('comments',id),[]);
 const addComment=(id,input)=>serial(async()=>{const project=await read(file('projects',id),null);if(!project)throw Error('Project not found');if(typeof input.text!=='string'||!input.text.trim()||input.text.length>5000)throw Error('Write a comment of 1–5000 characters');if(!project.compositions.some(c=>c.id===input.compositionId))throw Error('Composition not found');const all=await comments(id);const comment={id:randomUUID(),compositionId:input.compositionId,text:input.text.trim(),time:Math.max(0,Math.min(86400,Number(input.time)||0)),author:String(input.author||'You').slice(0,60),createdAt:new Date().toISOString(),resolved:false};all.push(comment);await atomic(file('comments',id),all);return comment;});
 const resolveComment=(id,commentId,resolved)=>serial(async()=>{checkId(commentId);const all=await comments(id);const c=all.find(c=>c.id===commentId);if(!c)throw Error('Comment not found');c.resolved=!!resolved;await atomic(file('comments',id),all);return c;});
 const kits=()=>read(path.join(data,'brand-kits.json'),[]);
 const saveKit=input=>serial(async()=>{if(!/^#[a-f0-9]{6}$/i.test(input.color||''))throw Error('Choose a valid brand color');const all=await kits();const kit={id:randomUUID(),name:String(input.name||'My brand').slice(0,100),color:input.color,background:/^#[a-f0-9]{6}$/i.test(input.background||'')?input.background:'#161b23',titleColor:/^#[a-f0-9]{6}$/i.test(input.titleColor||'')?input.titleColor:'#ffffff',createdAt:new Date().toISOString()};all.push(kit);await atomic(path.join(data,'brand-kits.json'),all);return kit;});
 const templates=()=>read(path.join(data,'templates.json'),[]);
 const saveTemplate=input=>serial(async()=>{if(!input.composition)throw Error('Choose a composition');const c=input.composition;const template={id:randomUUID(),name:String(input.name||c.name||'Untitled template').slice(0,100),createdAt:new Date().toISOString(),style:Object.fromEntries(['aspect','background','captions','captionStyle','titlePosition','titleColor','brand','fadeIn','fadeOut'].filter(k=>c[k]!==undefined).map(k=>[k,c[k]]))};const all=await templates();all.push(template);await atomic(path.join(data,'templates.json'),all);return template;});
 return {save,list,history,version,comments,addComment,resolveComment,kits,saveKit,templates,saveTemplate};
}
