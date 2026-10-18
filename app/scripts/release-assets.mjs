import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),output=path.join(root,'release');
const version=JSON.parse(fs.readFileSync('package.json')).version;
if(process.env.GITHUB_REF_NAME&&process.env.GITHUB_REF_NAME!==`v${version}`)throw Error('Tag must match package version');
const platform=process.platform;
const alias=platform==='win32'?['.exe','TalkCut-Windows-x64.exe']:platform==='darwin'?['.dmg','TalkCut-macOS-x64.dmg']:['.AppImage','TalkCut-Linux-x86_64.AppImage'];
const files=fs.readdirSync(output).filter(f=>new RegExp(`\\${alias[0]}$`,'i').test(f)&&f.includes(version)&&!f.includes('__uninstaller'));
if(files.length!==1)throw Error(`Expected one ${alias[0]} installer, found ${files.length}`);
fs.copyFileSync(path.join(output,files[0]),path.join(output,alias[1]));
const assets=fs.readdirSync(output).filter(f=>(/\.(exe|dmg|zip|AppImage|blockmap)$/.test(f)||/^latest.*\.yml$/.test(f))&&!f.includes('__uninstaller')).sort();
const checksums=[];
for(const file of assets){const hash=createHash('sha256');for await(const chunk of fs.createReadStream(path.join(output,file)))hash.update(chunk);checksums.push(`${hash.digest('hex')}  ${file}`);}
fs.writeFileSync(path.join(output,`${platform}-SHA256SUMS.txt`),checksums.join('\n')+'\n');
console.log(`Prepared ${assets.length} assets with SHA-256 checksums.`);
