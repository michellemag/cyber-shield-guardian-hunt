export const ROOMS=['Data and Automation','Ideation Space','Atrium','Board Room','Podcast','Design Studio','Cyber Security Training Centre'];
export const ROUTES={Red:[0,1,2,3,4,5,6],Blue:[2,3,4,5,6,0,1],Gold:[4,5,6,0,1,2,3]};
export const CHECKPOINTS=['Luma','Volt','Astra','Echo','Flux','Nova','Cipher'].map((name,i)=>({id:String.fromCharCode(65+i),name,code:['SHIELD-7','PULSE-4','NOVA-9','ECHO-3','FLUX-8','SPARK-6','CIPHER-2'][i],color:['#b5f36b','#80dbff','#e9a7ff','#ffd080','#ff9ba8','#a0b3ff','#7de8d1'][i],key:[3,5,7,4,6,2,8][i]}));
export const DEFAULT_CONFIG={rooms:ROOMS,target:5,ready:false,startCode:'SHIELD'};
export const normalize=s=>String(s).trim().toUpperCase().replace(/\s+/g,' ');
export const caesar=(s,key)=>String(s).toUpperCase().replace(/[A-Z]/g,c=>String.fromCharCode((c.charCodeAt(0)-65+key%26+26)%26+65));
export function validConfig(c){return c&&c.ready===true&&Array.isArray(c.rooms)&&c.rooms.length===7&&c.rooms.every(s=>typeof s==='string'&&normalize(s).length>1&&normalize(s).length<=48&&normalize(s)!=='FORUM')&&new Set(c.rooms.map(normalize)).size===7&&Number.isInteger(c.target)&&c.target>=3&&c.target<=7;}
export function startCodeMatches(input,config){return normalize(input)===normalize(config.startCode||'SHIELD');}
export function begin(team,route,demo,config){team=String(team).trim();if(!team||team.length>32||!ROUTES[route])throw Error('Choose a short team name and route');if(!demo&&!validConfig(config))throw Error('Teacher setup is needed');return {team,route,demo,step:0,phase:'decode',collected:[],started:Date.now(),config:JSON.parse(JSON.stringify(config))};}
export function target(s){return CHECKPOINTS[ROUTES[s.route][s.step]];}
export function room(s){return s.config.rooms[ROUTES[s.route][s.step]];}
export function checkAnswer(s,key,direction,answer){return s.phase==='decode'&&Number(key)===target(s).key&&direction==='backward'&&normalize(answer)===normalize(room(s));}
export function solve(s,key,direction,answer){if(!checkAnswer(s,key,direction,answer))return false;s.phase='travel';return true;}
export function collect(s,code){if(s.phase!=='travel'||normalize(code)!==target(s).code)return false;s.collected.push(target(s).id);s.phase='collected';return true;}
export function advance(s){if(s.phase!=='collected')return false;s.step++;s.phase=s.step===s.config.target?'return':'decode';return true;}
export function returnToForum(s){if(s.phase!=='return')return false;s.phase='final';return true;}
export function finalCheck(s,key,direction,answer){if(s.phase!=='final'||Number(key)!==4||direction!=='backward'||normalize(answer)!=='SHIELD RESTORED')return false;s.phase='done';return true;}
export function isPass(s){return !!s&&!s.demo&&validConfig(s.config)&&s.phase==='done'&&s.collected.length===s.config.target&&s.collected.every((x,i)=>x===CHECKPOINTS[ROUTES[s.route][i]].id);}
export function validState(s){return !!s&&typeof s.team==='string'&&s.team.length>0&&s.team.length<=32&&!!ROUTES[s.route]&&typeof s.demo==='boolean'&&s.config&&Array.isArray(s.config.rooms)&&s.config.rooms.length===7&&s.config.rooms.every(x=>typeof x==='string')&&Number.isInteger(s.config.target)&&s.config.target>=3&&s.config.target<=7&&Number.isInteger(s.step)&&s.step>=0&&s.step<=s.config.target&&['decode','travel','collected','return','final','done'].includes(s.phase)&&Array.isArray(s.collected)&&(s.demo||validConfig(s.config))&&s.collected.every((x,i)=>x===CHECKPOINTS[ROUTES[s.route][i]]?.id)&&s.collected.length===s.step+(s.phase==='collected'?1:0)&&((s.step===s.config.target)===['return','final','done'].includes(s.phase));}
