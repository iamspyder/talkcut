import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const files=[...new Set(execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root}).toString().split('\0').filter(Boolean))];
const problems=[];
const forbiddenNames=(process.env.TALKCUT_FORBIDDEN_NAMES||'').split(',').map(name=>name.trim().toLowerCase().replace(/[^a-z0-9]/g,'')).filter(Boolean);
const privatePath=/(?:[A-Z]:[\\/]+Users[\\/]+[^\\/\s]+|\/(?:Users|home)\/[^/\s]+)/i;
const secretPatterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/\bAKIA[A-Z0-9]{16}\b/,/\bsk-(?:proj-)?[A-Za-z0-9_-]{35,}\b/];
for(const file of files){
 const full=path.join(root,file);if(!fs.existsSync(full))continue;
 const stat=fs.statSync(full);if(!stat.isFile())continue;
 if(stat.size>5*1024*1024)problems.push(`${file}: exceeds 5 MiB repository limit`);
 if(/(?:^|\/)(?:node_modules|dist|release|native|data|qa)\//.test(file)||/\.(?:exe|dll|dmg|AppImage|onnx|gguf|pfx|p12|pem|key|log)$/.test(file)||/(?:^|\/)\.env/.test(file))problems.push(`${file}: forbidden generated/private artifact`);
 const data=fs.readFileSync(full);if(data.subarray(0,8192).includes(0))continue;
 const text=data.toString('utf8');
 if(forbiddenNames.some(name=>text.toLowerCase().replace(/[^a-z0-9]/g,'').includes(name)))problems.push(`${file}: prohibited name reference`);
 if(privatePath.test(text))problems.push(`${file}: personal home path`);
 if(secretPatterns.some(re=>re.test(text)))problems.push(`${file}: possible secret (redacted)`);
}
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}else console.log(`Repository hygiene clean: ${files.length} candidate files; no prohibited name references, personal home paths, common secret formats or oversized/generated artifacts.`);
