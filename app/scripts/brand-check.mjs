import {electronPath} from './runtime-paths.mjs';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {_electron} from 'playwright-core';
const root=process.cwd();const errors=[];
const desktop=await _electron.launch({executablePath:electronPath,args:[root],env:{...process.env,TALKCUT_TEST_OFFLINE:'1',TALKCUT_TEST_DATA:path.join(root,'qa/brand/profile-'+Date.now())}});
try{const page=await desktop.firstWindow();page.on('pageerror',e=>errors.push(e.message));await page.getByRole('button',{name:'TalkCut projects',exact:true}).waitFor();const mark=page.locator('.brand img');await mark.evaluate(img=>img.decode());assert.equal(await mark.getAttribute('src'),'/brand/talkcut-mark.svg');for(const route of ['/favicon.svg','/favicon.ico','/favicon-32.png','/apple-touch-icon.png']){const status=await page.evaluate(async route=>(await fetch(route)).status,route);assert.equal(status,200,route);}
for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);await page.setViewportSize({width:1280,height:720});await page.screenshot({path:`qa/brand/app-${theme}.png`});}assert.deepEqual(errors,[]);fs.writeFileSync('qa/brand/results.json',JSON.stringify({passed:true,errors,assets:['SVG','ICO','ICNS','PNG'],screenshots:['app-light.png','app-dark.png']},null,2));console.log('Brand assets served; header image decoded; light/dark screenshots captured; no renderer errors.');}finally{await desktop.close();}
