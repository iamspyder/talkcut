import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const inspect=env=>JSON.parse(execFileSync(process.execPath,['-e',"const config=require('./electron-builder.cjs');console.log(JSON.stringify({mac:config.mac,win:config.win,certificate:process.env.CSC_LINK}))"],{cwd:root,encoding:'utf8',windowsHide:true,env:{...process.env,CSC_LINK:'',CSC_KEY_PASSWORD:'',WIN_CSC_LINK:'',WIN_CSC_KEY_PASSWORD:'',APPLE_ID:'',APPLE_APP_SPECIFIC_PASSWORD:'',APPLE_TEAM_ID:'',...env}}));
test('unset Actions signing secrets produce an explicitly unsigned macOS package',()=>{const result=inspect({});assert.equal(result.certificate,undefined);assert.equal(result.mac.identity,null);assert.equal(result.mac.notarize,false);assert.equal(result.win.signExecutable,false);});
test('configured certificate paths are retained for signed builds',()=>{const result=inspect({CSC_LINK:'test-certificate.p12'});assert.equal(result.certificate,'test-certificate.p12');assert.equal(result.mac.identity,undefined);assert.equal(result.win.signExecutable,true);});
