import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const lock=JSON.parse(fs.readFileSync(path.join(root,'package-lock.json'),'utf8'));
const rows=[],texts=[];
for(const [location,pkg] of Object.entries(lock.packages||{}).sort(([a],[b])=>a.localeCompare(b))){
 if(!location)continue;
 const name=location.split('node_modules/').at(-1);
 // This old package uses the pre-SPDX `licenses` field; its included text is BSD-3-Clause.
 const license=typeof pkg.license==='string'?pkg.license:pkg.license?.type||(name==='parse-cache-control'?'BSD-3-Clause':'SEE UPSTREAM LICENSE');
 rows.push(`| ${name} | ${pkg.version} | ${license.replaceAll('|','\\|')} | ${pkg.dev?'development':'runtime/optional'} | \`${location}\` |`);
 const folder=path.join(root,location);
 if(!fs.existsSync(folder))continue;
 const licenses=fs.readdirSync(folder).filter(name=>/^(licen[sc]e|copying|notice)([._-].*)?$/i.test(name));
 for(const file of licenses){const full=path.join(folder,file);if(fs.statSync(full).isFile())texts.push(`\n${'='.repeat(72)}\n${name}@${pkg.version} — ${license} — ${file}\n${'='.repeat(72)}\n${fs.readFileSync(full,'utf8')}`);}
}
fs.mkdirSync(path.join(root,'LICENSES'),{recursive:true});
for(const file of ['LICENSE','THIRD_PARTY_NOTICES.md'])fs.copyFileSync(path.join(root,'..',file),path.join(root,file));
fs.writeFileSync(path.join(root,'LICENSES/npm-notices.txt'),'Third-party npm notices. Original copyright and license terms follow.\n'+texts.join('\n'));
fs.writeFileSync(path.join(root,'../docs/DEPENDENCIES.md'),`# Dependency inventory\n\nGenerated from app/package-lock.json by npm run notices. Includes direct/transitive and optional platform/build packages. Some optional packages are not installed on every OS. Full installed license texts are in app/LICENSES/npm-notices.txt. Electron Chromium/native-helper notices are described separately in THIRD_PARTY_NOTICES.md.\n\n| Package | Version | Declared license | Scope | Lockfile path |\n| --- | --- | --- | --- | --- |\n${rows.join('\n')}\n`);
console.log(`Recorded ${rows.length} locked packages and ${texts.length} installed license/notice files.`);
