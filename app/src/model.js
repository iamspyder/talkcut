export const uid = () => globalThis.crypto.randomUUID();
export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function clock(t=0,decimal=false){t=Math.max(0,Number(t)||0);return `${Math.floor(t/60).toString().padStart(2,'0')}:${Math.floor(t%60).toString().padStart(2,'0')}${decimal?'.'+Math.floor((t%1)*10):''}`;}
export function prepareWords(raw,asset){
 const words=raw.map((w,i)=>({id:uid(),assetId:asset.id,text:w.text??w.word??'',start:clamp(Number(w.start)||0,0,asset.duration),end:clamp(Number(w.end)||0,0,asset.duration),speaker:w.speaker||'Speaker 1',deleted:false,hidden:false})).filter(w=>w.text.trim());
 words.sort((a,b)=>a.start-b.start);
 return words.map((w,i)=>({...w,end:Math.max(w.start,w.end),cutStart:i===0?0:(words[i-1].end+w.start)/2,cutEnd:i===words.length-1?asset.duration:(w.end+words[i+1].start)/2}));
}
export function intervals(comp,assets){
 if(!comp)return [];
 let cells=comp.words.length?comp.words.filter(w=>!w.deleted).map(w=>({assetId:w.assetId,start:w.cutStart??w.start,end:w.cutEnd??w.end,wordIds:[w.id]})):comp.assetIds.map(id=>({assetId:id,start:0,end:assets.find(a=>a.id===id)?.duration||0,wordIds:[]}));
 if(comp.trim){cells=cells.filter(c=>c.end>comp.trim.start&&c.start<comp.trim.end).map(c=>({...c,start:Math.max(c.start,comp.trim.start),end:Math.min(c.end,comp.trim.end)}));}
 const merged=[];
 for(const c of cells){if(c.end-c.start<.001)continue;const prev=merged.at(-1);if(prev&&prev.assetId===c.assetId&&Math.abs(prev.end-c.start)<.002){prev.end=c.end;prev.wordIds.push(...c.wordIds);}else merged.push({...c});}
 let offset=0;return merged.map(c=>{const result={...c,offset,duration:c.end-c.start};offset+=result.duration;return result;});
}
export function duration(segments){return segments.reduce((n,s)=>n+s.end-s.start,0);}
export function sourceAt(segments,t){const s=segments.find(s=>t>=s.offset&&t<s.offset+s.duration)||segments.at(-1);return s?{assetId:s.assetId,time:s.start+clamp(t-s.offset,0,s.duration),segment:s}:null;}
export function compositionTime(segments,assetId,sourceTime,near=0){const matching=segments.filter(s=>s.assetId===assetId&&sourceTime>=s.start-.002&&sourceTime<=s.end+.002);const s=matching.sort((a,b)=>Math.abs(a.offset-near)-Math.abs(b.offset-near))[0];return s?s.offset+sourceTime-s.start:null;}
export function transcriptSignature(comp){return JSON.stringify({words:comp.words.map(w=>[w.id,w.assetId,w.text,w.start,w.end,w.deleted,w.hidden,w.cutStart,w.cutEnd]),trim:comp.trim,assetIds:comp.assetIds});}
export function subtitles(comp,segments){
 if(comp.translation?.sourceSignature===transcriptSignature(comp)&&Array.isArray(comp.translation.cues))return comp.translation.cues.filter(c=>typeof c.text==='string'&&Number.isFinite(c.start)&&Number.isFinite(c.end)&&c.end>c.start).map(c=>({...c}));
 let cues=[];for(const s of segments){let words=comp.words.filter(w=>!w.deleted&&!w.hidden&&s.wordIds.includes(w.id)).map(w=>({...w,start:s.offset+Math.max(w.start,s.start)-s.start,end:s.offset+Math.min(w.end,s.end)-s.start})).filter(w=>w.end>w.start);
 for(let i=0;i<words.length;i+=7){const group=words.slice(i,i+7);if(group.length)cues.push({start:group[0].start,end:group.at(-1).end,text:group.map(w=>w.text).join(' ')});}}
 return cues;
}
export function srt(cues){const time=t=>{const ms=Math.round(Math.max(0,t)*1000);return `${Math.floor(ms/3600000).toString().padStart(2,'0')}:${Math.floor(ms/60000)%60}`.replace(/:(\d)$/g,':0$1')+`:${(Math.floor(ms/1000)%60).toString().padStart(2,'0')},${(ms%1000).toString().padStart(3,'0')}`;};return cues.map((c,i)=>`${i+1}\n${time(c.start)} --> ${time(c.end)}\n${c.text}\n`).join('\n');}
export function vtt(cues){return 'WEBVTT\n\n'+srt(cues).replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g,'$1.$2');}
export const isFiller=text=>/^(um+|uh+|erm+|hmm+|ah+)$/i.test(text.replace(/[^a-z]/gi,''));
export function emptyComposition(name,assetIds=[]){return {id:uid(),name,assetIds,words:[],aspect:'16:9',captions:false,captionStyle:'classic',background:'#161b23',audioCleanup:false,volume:1,zoom:1,brightness:1,contrast:1,saturation:1,title:'',titlePosition:'bottom',chromakey:false,chromeColor:'#00ff00',scenes:[],layers:[]};}
