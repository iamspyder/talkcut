import React,{useEffect,useState} from 'react';
const defaults={sidebar:208,inspector:304,script:48,timeline:160};
export function useWorkspaceLayout(){
 const [sizes,setSizes]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('talkcut.workspace-layout.v1')||'{}');return Object.fromEntries(Object.entries(defaults).map(([k,v])=>[k,Number.isFinite(saved[k])?saved[k]:v]));}catch{return defaults;}});
 useEffect(()=>{const timer=setTimeout(()=>{try{localStorage.setItem('talkcut.workspace-layout.v1',JSON.stringify(sizes));}catch{}},150);return()=>clearTimeout(timer);},[sizes]);
 return {style:{'--sidebar-width':`${sizes.sidebar}px`,'--inspector-width':`${sizes.inspector}px`,'--script-width':`${sizes.script}%`,'--timeline-height':`${sizes.timeline}px`},divider:key=><LayoutDivider key={key} name={key} value={sizes[key]} onChange={v=>setSizes(s=>({...s,[key]:v}))} onReset={()=>setSizes(s=>({...s,[key]:defaults[key]}))}/>};
}
function LayoutDivider({name,value,onChange,onReset}){
 const vertical=name!=='timeline',labels={sidebar:'workspace sidebar',inspector:'tools panel',script:'Script and Preview',timeline:'timeline'};
 const bounds=()=>name==='script'?[25,75]:name==='timeline'?[96,Math.max(96,(document.querySelector('.editor')?.clientHeight||600)-288)]:name==='sidebar'?[160,Math.min(360,innerWidth*.22)]:[240,Math.min(480,innerWidth*.27)];
 const change=next=>{const [min,max]=bounds();onChange(Math.max(min,Math.min(max,next)));};
 const start=event=>{
  if(event.button!==0)return;event.preventDefault();const element=event.currentTarget,pointer=event.pointerId;
  const rect=document.querySelector({sidebar:'.project-sidebar',inspector:'.inspector',script:'.script-panel',timeline:'.timeline'}[name]).getBoundingClientRect(),width=document.querySelector('.editor-main').clientWidth;
  const initial=name==='script'?rect.width/width*100:vertical?rect.width:rect.height,position=vertical?event.clientX:event.clientY;
  element.setPointerCapture(pointer);document.body.classList.add(vertical?'resizing-columns':'resizing-rows');
  const move=e=>{let delta=(vertical?e.clientX:e.clientY)-position;if(name==='inspector'||name==='timeline')delta=-delta;change(initial+(name==='script'?delta/width*100:delta));};
  const end=()=>{document.body.classList.remove('resizing-columns','resizing-rows');for(const [type,fn] of [['pointermove',move],['pointerup',end],['pointercancel',end],['lostpointercapture',end]])element.removeEventListener(type,fn);if(element.hasPointerCapture(pointer))element.releasePointerCapture(pointer);};
  element.addEventListener('pointermove',move);element.addEventListener('pointerup',end);element.addEventListener('pointercancel',end);element.addEventListener('lostpointercapture',end);
 };
 return <div className={`layout-divider divider-${name}`} role="separator" tabIndex={0} aria-label={`Resize ${labels[name]}`} aria-orientation={vertical?'vertical':'horizontal'} aria-valuenow={Math.round(value)} aria-valuemin={bounds()[0]} aria-valuemax={Math.round(bounds()[1])} title="Drag to resize · Arrow keys to adjust · Double-click to reset" onPointerDown={start} onDoubleClick={onReset} onKeyDown={e=>{const direction=vertical?{ArrowLeft:-1,ArrowRight:1}:{ArrowUp:-1,ArrowDown:1};if(e.key==='Home'){e.preventDefault();onReset();}else if(direction[e.key]){e.preventDefault();change(value+direction[e.key]*(name==='inspector'||name==='timeline'?-1:1)*(name==='script'?1:e.shiftKey?32:8));}}}><span/></div>;
}
