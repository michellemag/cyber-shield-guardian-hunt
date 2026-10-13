export const ROOMS=['Atrium','Podcast','Design Studio'];
export const ROUTES={Red:[0,1,2],Blue:[1,2,0],Gold:[2,0,1]};
export const CHECKPOINTS=[{id:'A',name:'Astra',code:'NOVA-9',color:'#e9a7ff',key:7},{id:'B',name:'Flux',code:'FLUX-8',color:'#ff9ba8',key:6},{id:'C',name:'Nova',code:'SPARK-6',color:'#a0b3ff',key:2}];
export const DEFAULT_CONFIG={rooms:ROOMS,target:3,ready:false,startCode:'SHIELD',finalMode:'digital'};
export const normalize=s=>String(s).trim().toUpperCase().replace(/\s+/g,' ');
export const caesar=(s,key)=>String(s).toUpperCase().replace(/[A-Z]/g,c=>String.fromCharCode((c.charCodeAt(0)-65+key%26+26)%26+65));
export function validConfig(c){return c&&c.ready===true&&Array.isArray(c.rooms)&&c.rooms.length===3&&c.rooms.every((s,i)=>typeof s==='string'&&normalize(s)===normalize(ROOMS[i]))&&c.target===3&&['digital','physical'].includes(c.finalMode||'digital');}
export function startCodeMatches(input,config){return normalize(input)===normalize(config.startCode||'SHIELD');}
export function begin(team,route,demo,config){team=String(team).trim();if(!team||team.length>32||!ROUTES[route])throw Error('Choose a short team name and route');if(!validConfig({...config,ready:true}))throw Error('Use the three-room setup');if(!demo&&!validConfig(config))throw Error('Teacher setup is needed');return {team,route,demo,step:0,phase:'decode',collected:[],started:Date.now(),config:JSON.parse(JSON.stringify(config))};}
export function target(s){return CHECKPOINTS[ROUTES[s.route][s.step]];}
export function room(s){return s.config.rooms[ROUTES[s.route][s.step]];}
export function checkAnswer(s,key,direction,answer){return s.phase==='decode'&&Number(key)===target(s).key&&direction==='backward'&&normalize(answer)===normalize(room(s));}
export function solve(s,key,direction,answer){if(!checkAnswer(s,key,direction,answer))return false;s.phase='travel';return true;}
export function collect(s,code){if(s.phase!=='travel'||normalize(code)!==target(s).code)return false;s.collected.push(target(s).id);s.phase='collected';return true;}
export function advance(s){if(s.phase!=='collected')return false;s.step++;s.phase=s.step===3?'return':'decode';return true;}
export function returnToForum(s){if(s.phase!=='return')return false;s.phase='final';return true;}
export function finalCheck(s,key,direction,answer){if(s.phase!=='final'||Number(key)!==4||direction!=='backward'||normalize(answer)!=='SHIELD RESTORED')return false;s.phase='done';return true;}
export function isPass(s){return !!s&&!s.demo&&validConfig(s.config)&&s.phase==='done'&&s.collected.length===3&&s.collected.every((x,i)=>x===CHECKPOINTS[ROUTES[s.route][i]].id);}
export function validState(s){return !!s&&typeof s.team==='string'&&s.team.length>0&&s.team.length<=32&&!!ROUTES[s.route]&&typeof s.demo==='boolean'&&validConfig({...s.config,ready:true})&&Number.isInteger(s.step)&&s.step>=0&&s.step<=3&&['decode','travel','collected','return','final','done'].includes(s.phase)&&Array.isArray(s.collected)&&(s.demo||validConfig(s.config))&&s.collected.every((x,i)=>x===CHECKPOINTS[ROUTES[s.route][i]]?.id)&&s.collected.length===s.step+(s.phase==='collected'?1:0)&&((s.step===3)===['return','final','done'].includes(s.phase));}
