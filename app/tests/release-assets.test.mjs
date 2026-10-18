import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
test('release assets retain versioned update files and hash stable aliases without build diagnostics',async()=>{
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'talkcut-release-'));
 try{
  await fs.mkdir(path.join(temp,'release'));await fs.writeFile(path.join(temp,'package.json'),JSON.stringify({version:'1.0.0'}));
  const suffix=process.platform==='win32'?'exe':process.platform==='darwin'?'dmg':'AppImage';
  const installer=`TalkCut-1.0.0.${suffix}`;
  await fs.writeFile(path.join(temp,'release',installer),'synthetic installer fixture');
  await fs.writeFile(path.join(temp,'release','latest.yml'),'version: 1.0.0\n');
  await fs.writeFile(path.join(temp,'release','builder-debug.yml'),'local diagnostic');
  execFileSync(process.execPath,[fileURLToPath(new URL('../scripts/release-assets.mjs',import.meta.url))],{cwd:temp,env:{...process.env,GITHUB_REF_NAME:'v1.0.0'},windowsHide:true});
  const lines=(await fs.readFile(path.join(temp,'release',`${process.platform}-SHA256SUMS.txt`),'utf8')).trim().split('\n');
  assert.equal(lines.length,3);assert(!lines.some(line=>line.includes('builder-debug')));
  for(const line of lines){const [hash,name]=line.split('  ');assert.equal(createHash('sha256').update(await fs.readFile(path.join(temp,'release',name))).digest('hex'),hash);}
 }finally{await fs.rm(temp,{recursive:true,force:true});}
});
