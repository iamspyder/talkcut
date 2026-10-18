// Actions expands unset optional secrets to empty strings. The signer treats an
// empty certificate path as the working directory, so remove these values.
for(const key of ['CSC_LINK','CSC_KEY_PASSWORD','WIN_CSC_LINK','WIN_CSC_KEY_PASSWORD','APPLE_ID','APPLE_APP_SPECIFIC_PASSWORD','APPLE_TEAM_ID'])if(process.env[key]==='')delete process.env[key];
const release=require('./release-config.json');
const notarize=Boolean(process.env.APPLE_ID&&process.env.APPLE_APP_SPECIFIC_PASSWORD&&process.env.APPLE_TEAM_ID&&process.env.CSC_LINK);
module.exports={
 appId:'com.talkcut.studio',productName:'TalkCut',copyright:'Copyright © 2026 Rajan Gupta',asar:true,
 directories:{output:'release'},
 files:['dist/**/*','desktop/**/*','*.mjs','src/model.js','package.json','release-config.json','LICENSE','THIRD_PARTY_NOTICES.md','LICENSES/**/*','!eslint.config.mjs','!data/**/*','!qa/**/*','!scripts/**/*','!tests/**/*'],
 asarUnpack:['node_modules/ffmpeg-static/**','node_modules/ffprobe-static/**'],
 extraResources:[{from:'build/icons',to:'icons'},{from:'samples',to:'samples',filter:['sample*']},{from:'native/'+process.platform+'-'+process.arch,to:'native/'+process.platform+'-'+process.arch,filter:['manifest.json','deep-filter*','DeepFilterNet3_onnx.tar.gz','whisper/Release/**/*','whisper/bin/whisper-cli','whisper/bin/*.so*','whisper/bin/*.dylib']}],
 win:{target:[{target:'nsis',arch:['x64']}],icon:'build/icons/talkcut.ico',signExecutable:Boolean(process.env.WIN_CSC_LINK||process.env.CSC_LINK)},
 nsis:{oneClick:false,perMachine:false,allowToChangeInstallationDirectory:true,createDesktopShortcut:true,createStartMenuShortcut:true,artifactName:'TalkCut-Setup-${version}-${arch}.${ext}',license:'LICENSE'},
 mac:{icon:'build/icons/talkcut.icns',target:['dmg','zip'],identity:process.env.CSC_LINK?undefined:null,category:'public.app-category.video',hardenedRuntime:true,notarize,extendInfo:{NSMicrophoneUsageDescription:'Record audio in TalkCut.',NSCameraUsageDescription:'Record camera video in TalkCut.'}},
 linux:{icon:'build/icons/talkcut.png',target:['AppImage'],category:'AudioVideo',maintainer:'Rajan Gupta'},
 publish:[{provider:'github',owner:release.owner,repo:release.repo,releaseType:'release'}]
};
