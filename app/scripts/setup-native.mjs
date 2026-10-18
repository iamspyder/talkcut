import fs from 'node:fs/promises';
import {existsSync,createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
import ffprobe from 'ffprobe-static';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),native=path.join(root,'native',`${process.platform}-${process.arch}`);
await fs.mkdir(native,{recursive:true});
async function download(url,file,sha){if(!existsSync(file)){console.log('Downloading '+path.basename(file));const r=await fetch(url);if(!r.ok)throw Error(`${url}: ${r.status}`);const handle=await fs.open(file+'.part','w');try{for await(const chunk of r.body)await handle.write(chunk);}finally{await handle.close();}await fs.rename(file+'.part',file);}const hash=createHash('sha256');for await(const chunk of createReadStream(file))hash.update(chunk);const digest=hash.digest('hex');if(sha&&digest!==sha)throw Error('Checksum mismatch: '+file);return {file:path.relative(native,file),sha256:digest,source:url};}
function run(exe,args){const p=spawnSync(exe,args,{stdio:'inherit',windowsHide:true});if(p.status!==0)throw Error(`${exe} failed: ${p.error||p.status}`);}
const manifest=[];
if(process.platform==='win32'){
 if(process.arch!=='x64')throw Error('Windows helper currently supports x64');
 const zip=path.join(native,'whisper.zip');manifest.push(await download('https://github.com/ggml-org/whisper.cpp/releases/download/v1.8.3/whisper-bin-x64.zip',zip,'d824b1e37599f882b396e73f1ee0bfd5d0529f700314c48311dcbd00b803321d'));
 if(!existsSync(path.join(native,'whisper','Release','whisper-cli.exe')))run('powershell.exe',['-NoProfile','-Command',`Add-Type -AssemblyName System.IO.Compression.FileSystem; [IO.Compression.ZipFile]::ExtractToDirectory('${zip.replaceAll("'","''")}','${path.join(native,'whisper').replaceAll("'","''")}')`]);
}else{
 const source=path.join(native,'whisper-source'),zip=path.join(native,'whisper-source.tar.gz');manifest.push(await download('https://github.com/ggml-org/whisper.cpp/archive/refs/tags/v1.8.3.tar.gz',zip));await fs.mkdir(source,{recursive:true});run('tar',['-xzf',zip,'-C',source,'--strip-components=1']);
 const build=path.join(native,'whisper');run('cmake',['-S',source,'-B',build,'-DCMAKE_BUILD_TYPE=Release','-DBUILD_SHARED_LIBS=OFF','-DGGML_NATIVE=OFF','-DGGML_METAL=OFF',...(process.platform==='darwin'?[`-DCMAKE_OSX_ARCHITECTURES=${process.arch==='arm64'?'arm64':'x86_64'}`]:[]),'-DWHISPER_BUILD_TESTS=OFF','-DWHISPER_BUILD_SERVER=OFF']);run('cmake',['--build',build,'--config','Release','--target','whisper-cli','-j','2']);
}
const triple=process.platform==='win32'?'x86_64-pc-windows-msvc.exe':process.platform==='darwin'?(process.arch==='arm64'?'aarch64-apple-darwin':'x86_64-apple-darwin'):(process.arch==='arm64'?'aarch64-unknown-linux-gnu':'x86_64-unknown-linux-musl');
const df=path.join(native,'deep-filter'+(process.platform==='win32'?'.exe':''));manifest.push(await download(`https://github.com/Rikorose/DeepFilterNet/releases/download/v0.5.6/deep-filter-0.5.6-${triple}`,df,process.platform==='win32'?'75e11fa16445f560cb6b021521ddb89e89270d13b83089705d98776f58fd7915':undefined));if(process.platform!=='win32')await fs.chmod(df,0o755);
manifest.push(await download('https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/models/DeepFilterNet3_onnx.tar.gz',path.join(native,'DeepFilterNet3_onnx.tar.gz'),'c94d91f70911001c946e0fabb4aa9adc37045f45a03b56008cb0c8244cb63616'));
const licenses=path.join(root,'LICENSES');await fs.mkdir(licenses,{recursive:true});
for(const [name,url] of Object.entries({'whisper.cpp.txt':'https://raw.githubusercontent.com/ggml-org/whisper.cpp/v1.8.3/LICENSE','DeepFilterNet-MIT.txt':'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/LICENSE-MIT','DeepFilterNet-Apache-2.0.txt':'https://raw.githubusercontent.com/Rikorose/DeepFilterNet/v0.5.6/LICENSE-APACHE'}))await download(url,path.join(licenses,name));
for(const [suffix,name] of [['.LICENSE','FFmpeg-license.txt'],['.README','FFmpeg-build-source.txt']])if(existsSync(ffmpeg+suffix))await fs.copyFile(ffmpeg+suffix,path.join(licenses,name));
for(const [binary,label] of [[ffmpeg,'FFmpeg'],[ffprobe.path,'ffprobe']]){
 const parts=[];for(const option of ['-version','-L']){const result=spawnSync(binary,[option],{encoding:'utf8',windowsHide:true});if(result.status!==0)throw Error(`Cannot inspect ${label} license: ${result.error||result.status}`);parts.push(result.stdout+result.stderr);}
 await fs.writeFile(path.join(licenses,`${label}-runtime-build.txt`),parts.join('\n'));
}
await fs.writeFile(path.join(licenses,'ffprobe-build-source.txt'),'ffprobe supplied by ffprobe-static; see THIRD_PARTY_NOTICES.md. Upstream source: https://github.com/FFmpeg/FFmpeg/tree/n4.0.2\nBuild/configuration/license output: ffprobe-runtime-build.txt\nHistorical binary suppliers and dependency/build source must be verified before redistributing releases.\n');
await fs.writeFile(path.join(native,'manifest.json'),JSON.stringify({platform:process.platform,arch:process.arch,artifacts:manifest},null,2));console.log('Native helpers ready');
