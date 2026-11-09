import {Cube,Lights,Slide,PocketCube,Slide15,Hanoi,Bricks,faces} from './engine.mjs';
const newModels=()=>{const m={cube:new Cube(),lights:new Lights(),slide:new Slide(),pocket:new PocketCube(),slide15:new Slide15(),hanoi:new Hanoi(),bricks:new Bricks()};for(const[k,p]of Object.entries(m))p.scramble(k==='pocket'?12:24);return m;};
const history=(value,C)=>{if(!Array.isArray(value)||value.some(m=>!Array.isArray(m)||m.length!==2||!faces[m[0]]||![1,-1].includes(m[1])))throw Error('Invalid cube history');return new C(value);};
const sliding=(value,C)=>{if(!Array.isArray(value))throw Error('Invalid sliding history');const p=new C();for(const i of value)if(!p.move(i))throw Error('Illegal saved tile move');return p;};
export function restoreProgress(raw){const models=newModels(),counts=Object.fromEntries(Object.keys(models).map(k=>[k,0]));let recovery=null,warning='';if(!raw)return{models,counts,recovery,warning};let saved;try{saved=JSON.parse(raw);if(!saved||typeof saved!=='object'||Array.isArray(saved))throw Error('Invalid save');}catch{return{models,counts,recovery:raw,warning:'Some saved data could not be read. A local recovery copy is kept.'};}
 const readers={cube:v=>history(v,Cube),pocket:v=>history(v,PocketCube),slide:v=>sliding(v,Slide),slide15:v=>sliding(v,Slide15),lights:v=>{if(!Array.isArray(v)||v.some(i=>!Number.isInteger(i)||i<0||i>=25)||new Set(v).size!==v.length)throw Error('Invalid lights');const p=new Lights();v.forEach(i=>p.toggle(i));return p;},hanoi:v=>new Hanoi(v),bricks:v=>{if(!v||!Number.isInteger(v.level)||v.level<0||v.level>2)throw Error('Invalid brick level');return new Bricks(v.level,v.placements);}};
 for(const[k,read]of Object.entries(readers))if(Object.prototype.hasOwnProperty.call(saved,k)){try{models[k]=read(saved[k]);}catch{recovery=raw;warning='One puzzle save needed recovery. Your other progress is intact.';}}
 for(const k of Object.keys(counts)){const v=saved.counts?.[k];if(Number.isSafeInteger(v)&&v>=0)counts[k]=v;}
 return{models,counts,recovery,warning};
}
export function serializeProgress(models,counts){const path=p=>p.history.map((_,i)=>p.history[i+1]??p.cells.indexOf(0));return JSON.stringify({schema:2,cube:models.cube.history,lights:[...models.lights.pending],slide:path(models.slide),pocket:models.pocket.history,slide15:path(models.slide15),hanoi:models.hanoi.rods,bricks:{level:models.bricks.level,placements:models.bricks.placements},counts});}

// Never replace a prior recovery. Exact duplicates can reuse a verified entry.
export function preserveRecovery(storage,raw){
 try{
  for(let index=0;;index++){
   const key='prism-v1-recovery'+(index?'-'+index:'');
   const existing=storage.getItem(key);
   if(existing===raw)return true;
   if(existing===null){storage.setItem(key,raw);return storage.getItem(key)===raw;}
  }
 }catch{return false;}
}
