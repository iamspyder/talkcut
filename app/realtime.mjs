import {WebSocketServer} from 'ws';
import {validId} from './project-store.mjs';
export function attachRealtime(server,{port,listProjects}){
 const wss=new WebSocketServer({noServer:true,maxPayload:8192});const rooms=new Map();
 const send=(ws,value)=>{if(ws.readyState===1)ws.send(JSON.stringify(value));};
 const presence=id=>{const peers=Array.from(rooms.get(id)||[]).map(ws=>({clientId:ws.clientId,name:ws.displayName||'Editor',playhead:ws.playhead||0,selectedWordId:ws.selectedWordId||null}));for(const ws of rooms.get(id)||[])send(ws,{type:'presence',peers});};
 const allowedOrigin=origin=>!origin||origin===`http://localhost:${port}`||origin===`http://127.0.0.1:${port}`;
 server.on('upgrade',async(req,socket,head)=>{
  if(process.env.TALKCUT_TOKEN&&req.headers['x-talkcut-token']!==process.env.TALKCUT_TOKEN){socket.destroy();return;}
  let url;try{url=new URL(req.url,'http://127.0.0.1');}catch{return;}
  if(!url.pathname.startsWith('/api/live/'))return;
  const projectId=url.pathname.split('/').at(-1),clientId=url.searchParams.get('client');
  if(!validId(projectId)||!validId(clientId)||!allowedOrigin(req.headers.origin)){socket.destroy();return;}
  try{if(!(await listProjects()).some(p=>p.id===projectId)){socket.destroy();return;}}catch{socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>{ws.projectId=projectId;ws.clientId=clientId;ws.displayName='Editor';ws.isAlive=true;ws.on('pong',()=>ws.isAlive=true);const room=rooms.get(projectId)||new Set();room.add(ws);rooms.set(projectId,room);presence(projectId);
   ws.on('message',bytes=>{try{const m=JSON.parse(bytes.toString());if(m.type!=='presence')return;ws.displayName=String(m.name||'Editor').slice(0,40);ws.playhead=Math.max(0,Math.min(86400,Number(m.playhead)||0));ws.selectedWordId=validId(m.selectedWordId)?m.selectedWordId:null;presence(projectId);}catch{}});
   ws.on('close',()=>{room.delete(ws);if(!room.size)rooms.delete(projectId);else presence(projectId);});
  });
 });
 const timer=setInterval(()=>{for(const ws of wss.clients){if(!ws.isAlive){ws.terminate();continue;}ws.isAlive=false;ws.ping();}},30000);timer.unref();server.on('close',()=>{clearInterval(timer);for(const ws of wss.clients)ws.terminate();wss.close();});
 return {projectSaved(project,clientId){for(const ws of rooms.get(project.id)||[])if(ws.clientId!==clientId)send(ws,{type:'project-updated',projectId:project.id,revision:project.revision||0});}};
}
