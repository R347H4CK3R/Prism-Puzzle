'use strict';
const __prism_engine=(()=>{
const faces={U:[1,1],D:[1,-1],R:[0,1],L:[0,-1],F:[2,1],B:[2,-1]};
const rotate=(p,a,d)=>{let q=[...p],b=(a+1)%3,c=(a+2)%3;q[b]=-d*p[c];q[c]=d*p[b];return q.map(v=>v===0?0:v);};
class Cube {
 constructor(history=[]){this.stickers=[];this.history=[];for(const [f,[a,s]] of Object.entries(faces))for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const p=[0,0,0],n=[0,0,0];p[a]=s;p[(a+1)%3]=i;p[(a+2)%3]=j;n[a]=s;this.stickers.push({p,n,color:f});}for(const [f,d] of history)this.turn(f,d);}
 turn(f,d=1,record=true){if(!faces[f]||![1,-1].includes(d))throw Error('Invalid turn');const[a,s]=faces[f];for(const t of this.stickers)if(t.p[a]===s){t.p=rotate(t.p,a,-s*d);t.n=rotate(t.n,a,-s*d);}if(record){const prev=this.history[this.history.length-1];if(prev&&prev[0]===f&&prev[1]===-d)this.history.pop();else this.history.push([f,d]);}if(this.solved&&!this.preserveSolvedHistory)this.history=[];}
 get solved(){return Object.values(faces).every(([a,s])=>new Set(this.stickers.filter(t=>t.n[a]===s).map(t=>t.color)).size===1);}
 scramble(n=24){for(let i=0;i<n;i++)this.turn(Object.keys(faces)[Math.floor(Math.random()*6)],Math.random()<.5?1:-1);if(this.solved)this.turn('R');}
 hint(){const m=this.history.pop();if(!m)return null;this.turn(m[0],-m[1],false);return[m[0],-m[1]];}
}
class Lights {
 constructor(){this.cells=Array(25).fill(false);this.pending=new Set();}
 toggle(i){if(!Number.isInteger(i)||i<0||i>=25)return false;for(const j of [i,i%5?i-1:-1,i%5<4?i+1:-1,i-5,i+5])if(j>=0&&j<25)this.cells[j]=!this.cells[j];if(this.pending.has(i))this.pending.delete(i);else this.pending.add(i);return true;}
 get solved(){return this.cells.every(x=>!x);}
 scramble(){for(let i=0;i<25;i++)if(Math.random()<.5)this.toggle(i);if(this.solved)this.toggle(12);}
 hint(){if(this.solved)return null;const i=this.pending.values().next().value;if(i===undefined)return null;this.toggle(i);return i;}
}
class Slide {
 constructor(size=3){this.size=size;this.cells=Array.from({length:size*size},(_,i)=>(i+1)%(size*size));this.history=[];}
 move(i,record=true){const z=this.cells.indexOf(0),n=this.size;if(!Number.isInteger(i)||i<0||i>=n*n||Math.abs(i%n-z%n)+Math.abs(Math.floor(i/n)-Math.floor(z/n))!==1)return false;[this.cells[i],this.cells[z]]=[this.cells[z],this.cells[i]];if(record){if(this.history[this.history.length-1]===i)this.history.pop();else this.history.push(z);}if(this.solved)this.history=[];return true;}
 get solved(){return this.cells.every((v,i)=>v===(i+1)%this.cells.length);}
 scramble(n=50){for(let k=0;k<n;k++){const z=this.cells.indexOf(0),w=this.size,valid=[z-w,z+w,z%w?z-1:-1,z%w<w-1?z+1:-1].filter(i=>i>=0&&i<w*w&&i!==this.history[this.history.length-1]);this.move(valid[Math.floor(Math.random()*valid.length)]);}if(this.solved)this.move(this.cells.length-2);}
 hint(){const i=this.history.pop();if(i===undefined)return null;this.move(i,false);return i;}
}
class PocketCube extends Cube {
 get preserveSolvedHistory(){return true;}
 hint(){return this.solved?null:super.hint();}
 constructor(history=[]){super();this.stickers=this.stickers.filter(t=>t.p.every(v=>v!==0));for(const[f,d]of history)this.turn(f,d);}
}
class Slide15 extends Slide {constructor(){super(4);}}
class Hanoi {
 constructor(saved=null){this.rods=saved?JSON.parse(JSON.stringify(saved)):[[4,3,2,1],[],[]];if(!Array.isArray(this.rods)||this.rods.length!==3||this.rods.some(r=>!Array.isArray(r)||r.some((d,i)=>!Number.isInteger(d)||d<1||d>4||(i&&r[i-1]<d)))||this.rods.flat().slice().sort().join(',')!=='1,2,3,4')throw Error('Invalid tower save');}
 move(from,to){if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>2||to<0||to>2||from===to)return false;const a=this.rods[from],b=this.rods[to],disk=a[a.length-1];if(!disk||(b.length&&b[b.length-1]<disk))return false;b.push(a.pop());return true;}
 get solved(){return this.rods[2].length===4;}
 scramble(){this.rods=[[4,3,2,1],[],[]];}
 hint(){if(this.solved)return null;const start=Array(4);this.rods.forEach((r,i)=>r.forEach(d=>start[d-1]=i));const key=p=>p.join('');const queue=[[start,[]]],seen=new Set([key(start)]);for(let h=0;h<queue.length;h++){const[p,path]=queue[h];if(p.every(x=>x===2)){const m=path[0];this.move(...m);return m;}const top=[0,0,0];p.forEach((rod,d)=>{if(!top[rod])top[rod]=d+1;});for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(a!==b&&top[a]&&(!top[b]||top[a]<top[b])){const q=[...p];q[top[a]-1]=b;const k=key(q);if(!seen.has(k)){seen.add(k);queue.push([q,[...path,[a,b]]]);}}}throw Error('Unreachable tower state');}
}
const normalize=cells=>{const x=Math.min(...cells.map(p=>p[0])),y=Math.min(...cells.map(p=>p[1]));return cells.map(([a,b])=>[a-x,b-y]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);};
class Bricks {
 constructor(level=0,saved=null){this.level=((level%3)+3)%3;this.width=this.level===1?5:4;this.height=this.level===2?5:4;this.pieces=[[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[0,1]],[[0,0],[1,0],[0,1],[1,1]]];if(this.level)this.pieces.push([[0,0],[1,0],[2,0],[3,0]]);this.placements=this.pieces.map(()=>null);this.options=this.pieces.map((_,i)=>{const options=[],seen=new Set();for(let r=0;r<4;r++){const cells=this.shape(i,r),k=JSON.stringify(cells);if(seen.has(k))continue;seen.add(k);for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++){const mask=this.mask(i,x,y,r);if(mask!==null)options.push({x,y,r,mask});}}return options;});if(saved){if(!Array.isArray(saved)||saved.length!==this.pieces.length)throw Error('Invalid brick save');saved.forEach((p,i)=>{if(p&&!this.place(i,p.x,p.y,p.r))throw Error('Invalid brick placement');});}}
 shape(i,r=0){if(!Number.isInteger(i)||!this.pieces[i]||!Number.isInteger(r)||r<0||r>3)return [];let c=this.pieces[i].map(p=>[...p]);for(let k=0;k<r;k++)c=c.map(([x,y])=>[-y,x]);return normalize(c);}
 mask(i,x,y,r){if(!Number.isInteger(x)||!Number.isInteger(y))return null;const cells=this.shape(i,r);if(!cells.length||cells.some(([a,b])=>a+x<0||b+y<0||a+x>=this.width||b+y>=this.height))return null;return cells.reduce((m,[a,b])=>m|(1<<((b+y)*this.width+a+x)),0);}
 place(i,x,y,r=0){const mask=this.mask(i,x,y,r);if(mask===null)return false;for(let j=0;j<this.placements.length;j++){const p=this.placements[j];if(j!==i&&p&&(mask&this.mask(j,p.x,p.y,p.r)))return false;}this.placements[i]={x,y,r};return true;}
 remove(i){if(!Number.isInteger(i)||i<0||i>=this.pieces.length)return false;this.placements[i]=null;return true;}
 get solved(){return this.placements.every(Boolean);}
 solution(){const result=this.placements.map(p=>p?{...p}:null);let used=0;result.forEach((p,i)=>{if(p)used|=this.mask(i,p.x,p.y,p.r);});const search=mask=>{let chosen=-1,choices=null;for(let i=0;i<result.length;i++)if(!result[i]){const possible=this.options[i].filter(p=>!(mask&p.mask));if(!possible.length)return false;if(!choices||possible.length<choices.length){chosen=i;choices=possible;}}if(chosen<0)return true;for(const p of choices){result[chosen]={x:p.x,y:p.y,r:p.r};if(search(mask|p.mask))return true;}result[chosen]=null;return false;};return search(used)?result:null;}
 hint(){if(this.solved)return null;const solved=this.solution();if(solved){const i=this.placements.findIndex(p=>!p);this.place(i,solved[i].x,solved[i].y,solved[i].r);return{type:'place',piece:i,...solved[i]};}const i=this.placements.map(Boolean).lastIndexOf(true);this.remove(i);return{type:'remove',piece:i};}
 scramble(){this.placements=this.pieces.map(()=>null);}
}

return {faces,Cube,Lights,Slide,PocketCube,Slide15,Hanoi,Bricks};
})();
const __prism_progress=(()=>{
const {Cube,Lights,Slide,PocketCube,Slide15,Hanoi,Bricks,faces}=__prism_engine;
const newModels=()=>{const m={cube:new Cube(),lights:new Lights(),slide:new Slide(),pocket:new PocketCube(),slide15:new Slide15(),hanoi:new Hanoi(),bricks:new Bricks()};for(const[k,p]of Object.entries(m))p.scramble(k==='pocket'?12:24);return m;};
const history=(value,C)=>{if(!Array.isArray(value)||value.some(m=>!Array.isArray(m)||m.length!==2||!faces[m[0]]||![1,-1].includes(m[1])))throw Error('Invalid cube history');return new C(value);};
const sliding=(value,C)=>{if(!Array.isArray(value))throw Error('Invalid sliding history');const p=new C();for(const i of value)if(!p.move(i))throw Error('Illegal saved tile move');return p;};
function restoreProgress(raw){const models=newModels(),counts=Object.fromEntries(Object.keys(models).map(k=>[k,0]));let recovery=null,warning='';if(!raw)return{models,counts,recovery,warning};let saved;try{saved=JSON.parse(raw);if(!saved||typeof saved!=='object'||Array.isArray(saved))throw Error('Invalid save');}catch{return{models,counts,recovery:raw,warning:'Some saved data could not be read. A local recovery copy is kept.'};}
 // A newer or unrecognized schema cannot safely be decoded or rewritten by this app.
 // Keep the active bytes untouched; fresh puzzles remain playable for this session.
 if(Object.prototype.hasOwnProperty.call(saved,'schema')&&![1,2].includes(saved.schema))return{models,counts,recovery:null,readOnly:true,warning:'This save uses an unsupported format, possibly from a newer version. Your saved progress is untouched. New moves will only last this session.'};
 const readers={cube:v=>history(v,Cube),pocket:v=>history(v,PocketCube),slide:v=>sliding(v,Slide),slide15:v=>sliding(v,Slide15),lights:v=>{if(!Array.isArray(v)||v.some(i=>!Number.isInteger(i)||i<0||i>=25)||new Set(v).size!==v.length)throw Error('Invalid lights');const p=new Lights();v.forEach(i=>p.toggle(i));return p;},hanoi:v=>new Hanoi(v),bricks:v=>{if(!v||!Number.isInteger(v.level)||v.level<0||v.level>2)throw Error('Invalid brick level');return new Bricks(v.level,v.placements);}};
 for(const[k,read]of Object.entries(readers))if(Object.prototype.hasOwnProperty.call(saved,k)){try{models[k]=read(saved[k]);}catch{recovery=raw;warning='One puzzle save needed recovery. Your other progress is intact.';}}
 for(const k of Object.keys(counts)){const v=saved.counts?.[k];if(Number.isSafeInteger(v)&&v>=0)counts[k]=v;}
 return{models,counts,recovery,warning};
}
function serializeProgress(models,counts){const path=p=>p.history.map((_,i)=>p.history[i+1]??p.cells.indexOf(0));return JSON.stringify({schema:2,cube:models.cube.history,lights:[...models.lights.pending],slide:path(models.slide),pocket:models.pocket.history,slide15:path(models.slide15),hanoi:models.hanoi.rods,bricks:{level:models.bricks.level,placements:models.bricks.placements},counts});}

// Never replace a prior recovery. Exact duplicates can reuse a verified entry.
function preserveRecovery(storage,raw){
 try{
  for(let index=0;;index++){
   const key='prism-v1-recovery'+(index?'-'+index:'');
   const existing=storage.getItem(key);
   if(existing===raw)return true;
   if(existing===null){storage.setItem(key,raw);return storage.getItem(key)===raw;}
  }
 }catch{return false;}
}

return {restoreProgress,serializeProgress,preserveRecovery};
})();
const __prism_cube_view=(()=>{
const {faces}=__prism_engine;
const colors={U:'#f4f0df',D:'#f3cd55',R:'#ed7066',L:'#efa555',F:'#6ccbb1',B:'#809de8'};
const normals={F:'',B:'rotateY(180deg)',R:'rotateY(90deg)',L:'rotateY(-90deg)',U:'rotateX(90deg)',D:'rotateX(-90deg)'};
function stickerGeometry(t,n=3,size=180){
 const face=Object.keys(faces).find(f=>{const[a,s]=faces[f];return t.n[a]===s;});
 const position=t.p.map((v,a)=>t.n[a]?t.n[a]*size/2:v*size/(n===2?4:3));position[1]=-position[1];
 return {face,position,size:size/n,orientation:normals[face]};
}
function layerIndices(model,face){const[a,s]=faces[face];return model.stickers.flatMap((t,i)=>t.p[a]===s?[i]:[]);}
function turnTransform(face,amount){const[a,s]=faces[face];return `rotate${'XYZ'[a]}(${90*amount*s*(a===1?-1:1)}deg)`;}
function projectPoint(p,rx,ry){const x=rx*Math.PI/180,y=ry*Math.PI/180;const a=p[0]*Math.cos(y)+p[2]*Math.sin(y),z=-p[0]*Math.sin(y)+p[2]*Math.cos(y);return [a,-p[1]*Math.cos(x)-z*Math.sin(x)];}
function dragAmount(face,p,dx,dy,rx,ry){
 const[a,s]=faces[face],b=(a+1)%3,c=(a+2)%3,v=[0,0,0];v[b]=s*p[c];v[c]=-s*p[b];
 const tangent=projectPoint(v,rx,ry),length=Math.hypot(...tangent);
 // Center stickers have no rotational tangent: use the familiar horizontal swipe.
 const distance=length>.15?(dx*tangent[0]+dy*tangent[1])/length:dx;
 return Math.max(-1.15,Math.min(1.15,distance/85));
}
class PointerGesture{
 constructor(){this.owner=null;this.data=null;}
 begin(id,data){if(this.owner!==null)return false;this.owner=id;this.data=data;return true;}
 current(id){return this.owner===id?this.data:null;}
 end(id){if(this.owner!==id)return null;const data=this.data;this.clear();return data;}
 clear(){this.owner=null;this.data=null;}
}
class PhysicalCubeView{
 constructor(stageElement,cubeElement,{getModel,onTurn}){
  this.stage=stageElement;this.cube=cubeElement;this.getModel=getModel;this.onTurn=onTurn;
  this.mode='twist';this.rx=-24;this.ry=-32;this.gesture=new PointerGesture();this.busy=false;this.preview=null;
  this.cube.classList.add('physical-cube');this.stage.classList.add('physical-stage');
  this.stage.addEventListener('pointerdown',e=>this.pointerDown(e));
  this.stage.addEventListener('pointermove',e=>this.pointerMove(e));
  this.stage.addEventListener('pointerup',e=>this.pointerUp(e));
  for(const event of ['pointercancel','lostpointercapture'])this.stage.addEventListener(event,e=>{if(this.gesture.current(e.pointerId))this.cancelGesture();});
  this.orient();
 }
 orient(){this.cube.style.transform=`rotateX(${this.rx}deg) rotateY(${this.ry}deg)`;}
 setMode(mode){this.cancelGesture();this.mode=mode==='look'?'look':'twist';this.stage.dataset.cubeMode=this.mode;}
 cancelGesture(){const id=this.gesture.owner;this.gesture.clear();if(id!==null&&this.stage.hasPointerCapture?.(id))this.stage.releasePointerCapture(id);if(!this.busy&&this.preview)this.render(this.getModel());}
 render(model){
  if(this.busy)return;
  if(!model?.stickers){this.gesture.clear();this.preview=null;return;}
  this.preview=null;this.model=model;this.cube.replaceChildren();this.nodes=[];
  const doc=this.cube.ownerDocument,n=model.stickers.length===24?2:3,size=180;
  // Black plastic belongs to each cubie too: a full stationary core would
  // incorrectly hide rotating side strips halfway through a turn.
  this.cores=[];
  const positions=new Map(model.stickers.map(t=>[t.p.join(','),t.p]));
  for(const p of positions.values()){
   const core=doc.createElement('div');core.className='cube-core';core.setAttribute('aria-hidden','true');
   const span=size/n-1,spacing=n===2?size/4:size/3;
   core.style.transform=`translate3d(${p[0]*spacing}px,${-p[1]*spacing}px,${p[2]*spacing}px)`;
   for(const f of Object.keys(faces)){const plane=doc.createElement('div');plane.className='core-plane';plane.style.width=plane.style.height=`${span}px`;plane.style.marginLeft=plane.style.marginTop=`${-span/2}px`;plane.style.transform=`${normals[f]} translateZ(${span/2}px)`;core.append(plane);}
   this.cube.append(core);this.cores.push({p,element:core});
  }
  for(const t of model.stickers){const g=stickerGeometry(t,n,size),plane=doc.createElement('div');plane.className='face cubelet-face';plane.dataset.face=g.face;plane.dataset.position=t.p.join(',');plane.style.width=plane.style.height=`${g.size}px`;plane.style.marginLeft=plane.style.marginTop=`${-g.size/2}px`;plane.style.transform=`translate3d(${g.position[0]}px,${g.position[1]}px,${g.position[2]}px) ${g.orientation}`;
   const tile=doc.createElement('div');tile.className='sticker';tile.textContent=t.color;tile.style.background=colors[t.color];tile.setAttribute('aria-label',`${g.face} face, ${t.color} sticker`);plane.append(tile);this.cube.append(plane);this.nodes.push(plane);
  }
  this.orient();
 }
 layer(face){
  if(this.preview?.face===face)return this.preview.element;
  if(this.preview)this.render(this.model);
  const el=this.cube.ownerDocument.createElement('div');el.className='turning-layer';this.cube.append(el);
  for(const i of layerIndices(this.model,face))el.append(this.nodes[i]);
  const[a,s]=faces[face];for(const core of this.cores)if(core.p[a]===s)el.append(core.element);
  this.preview={face,element:el,amount:0};return el;
 }
 pointerDown(e){
  if(this.cube.hidden||this.busy||this.gesture.owner!==null||(e.button!==undefined&&e.button!==0))return;
  const node=e.target.closest?.('.cubelet-face');
  const index=node?this.nodes.indexOf(node):-1,face=this.mode==='twist'&&index>=0?node.dataset.face:null;
  this.gesture.begin(e.pointerId,{x:e.clientX,y:e.clientY,rx:this.rx,ry:this.ry,face,p:index>=0?[...this.model.stickers[index].p]:null,amount:0});
  try{this.stage.setPointerCapture(e.pointerId);}catch{}e.preventDefault();
 }
 pointerMove(e){
  const g=this.gesture.current(e.pointerId);if(!g)return;if(this.cube.hidden){this.cancelGesture();return;}
  const dx=e.clientX-g.x,dy=e.clientY-g.y;
  if(g.face){g.amount=dragAmount(g.face,g.p,dx,dy,g.rx,g.ry);if(Math.hypot(dx,dy)>3){const el=this.layer(g.face);this.preview.amount=g.amount;el.style.transform=turnTransform(g.face,g.amount);}}
  else{this.ry=g.ry+dx*.5;this.rx=Math.max(-85,Math.min(85,g.rx-dy*.5));this.orient();}
  e.preventDefault();
 }
 pointerUp(e){
  if(!this.gesture.current(e.pointerId))return;this.pointerMove(e);const g=this.gesture.end(e.pointerId);if(!g)return;
  if(this.stage.hasPointerCapture?.(e.pointerId))this.stage.releasePointerCapture(e.pointerId);
  if(g.face&&Math.abs(g.amount)>=.3){this.onTurn(g.face,g.amount>0?1:-1);}else if(this.preview)this.render(this.getModel());
 }
 async turn(face,d,applyCallback){
  if(this.busy||!faces[face]||![1,-1].includes(d))return false;
  this.gesture.clear();const model=this.getModel();if(!model?.stickers)return false;
  if(this.model!==model)this.render(model);
  const layer=this.layer(face),start=this.preview.amount;this.busy=true;
  try{
   const reduced=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   if(!reduced&&layer.animate){const animation=layer.animate([{transform:turnTransform(face,start)},{transform:turnTransform(face,d)}],{duration:180,easing:'cubic-bezier(.2,.7,.2,1)',fill:'forwards'});await animation.finished.catch(()=>{});}
   applyCallback();return true;
  }finally{this.busy=false;this.render(this.getModel());}
 }
}

return {stickerGeometry,layerIndices,turnTransform,projectPoint,dragAmount,PointerGesture,PhysicalCubeView};
})();
const __prism_brick_view=(()=>{
const COLORS=['#edaa51','#a797ef','#65c7b0','#e77d94','#7cb9ed'];
function snapBrick(clientX,clientY,rect,width,height,offset={x:0,y:0}) {
 if(!rect.width||!rect.height||clientX<rect.left||clientY<rect.top||clientX>=rect.left+rect.width||clientY>=rect.top+rect.height)return null;
 return {x:Math.floor((clientX-rect.left)/rect.width*width)-offset.x,y:Math.floor((clientY-rect.top)/rect.height*height)-offset.y};
}
function canFitBrick(model,i,x,y,r){
 const cells=model.shape(i,r);if(!cells.length)return false;
 if(cells.some(([a,b])=>x+a<0||y+b<0||x+a>=model.width||y+b>=model.height))return false;
 const occupied=new Set();model.placements.forEach((p,j)=>{if(p&&j!==i)model.shape(j,p.r).forEach(([a,b])=>occupied.add(`${p.x+a},${p.y+b}`));});
 return cells.every(([a,b])=>!occupied.has(`${x+a},${y+b}`));
}
class BrickDrag {
 constructor(model,piece,rotation,pointerId){Object.assign(this,{model,piece,rotation,pointerId,active:true});}
 drop(pointerId,cell){if(!this.active||pointerId!==this.pointerId)return false;this.active=false;return !!cell&&canFitBrick(this.model,this.piece,cell.x,cell.y,this.rotation)&&this.model.place(this.piece,cell.x,cell.y,this.rotation);}
 cancel(){this.active=false;}
}
class PhysicalBrickView {
 constructor(root,{getModel,onChange=()=>{}}){Object.assign(this,{root,getModel,onChange,mode:'fit',selected:null,rotation:0,orbit:{x:32,z:-18},drag:null,suppressClick:false});root.classList.add('physical-bricks');
 root.addEventListener('pointerdown',e=>this.pointerDown(e));root.addEventListener('pointermove',e=>this.pointerMove(e));root.addEventListener('pointerup',e=>this.pointerEnd(e));root.addEventListener('pointercancel',e=>this.cancel(e.pointerId));root.addEventListener('lostpointercapture',e=>this.cancel(e.pointerId));root.addEventListener('click',e=>this.click(e));root.addEventListener('keydown',e=>{if(e.key==='Escape'){this.cancel();this.say('Move cancelled.');}});this.render();}
 setMode(mode){this.cancel();this.mode=mode==='look'?'look':'fit';this.render();}
 say(message){const el=this.root.querySelector('.pb-status');if(el)el.textContent=message;}
 pieceHTML(i,r,extra='') {const cells=this.getModel().shape(i,r),w=1+Math.max(...cells.map(c=>c[0])),h=1+Math.max(...cells.map(c=>c[1]));return `<button type="button" class="pb-piece ${extra}" data-piece="${i}" aria-label="Piece ${i+1}, ${this.getModel().placements[i]?'on board':'in tray'}${this.selected===i?', selected':''}" aria-pressed="${this.selected===i}" style="--brick:${COLORS[i%COLORS.length]};--pw:${w};--ph:${h}">${cells.map(([x,y])=>`<span class="pb-block" data-bx="${x}" data-by="${y}" style="--bx:${x};--by:${y}"><span class="pb-stud">${i+1}</span></span>`).join('')}</button>`;}
 render(){this.cancel();const m=this.getModel();if(this.selected!==null&&!m.pieces[this.selected])this.selected=null;
 this.root.dataset.mode=this.mode;this.root.innerHTML=`<p class="pb-help">${this.mode==='look'?'Drag the plate to look around. Switch to Fit to assemble.':'Drag a piece onto the plate. Or select a piece, then tap a plate square.'}</p><div class="pb-scene"><div class="pb-plate" style="--cols:${m.width};--rows:${m.height}"><div class="pb-grid">${Array.from({length:m.width*m.height},(_,n)=>`<button type="button" class="pb-cell" data-cell="${n}" aria-label="Place selected piece at row ${Math.floor(n/m.width)+1}, column ${n%m.width+1}"></button>`).join('')}</div><div class="pb-placed">${m.placements.map((p,i)=>p?`<div class="pb-position" style="--px:${p.x};--py:${p.y}">${this.pieceHTML(i,p.r,this.selected===i?'pb-selected':'')}</div>`:'').join('')}</div></div></div><div class="pb-tools"><button type="button" data-action="rotate" ${this.selected===null||this.mode==='look'?'disabled':''}>Rotate 90° ↻</button><button type="button" data-action="return" ${this.selected===null||!m.placements[this.selected]||this.mode==='look'?'disabled':''}>Return to tray</button></div><div class="pb-tray" aria-label="Available pieces">${m.pieces.map((_,i)=>!m.placements[i]?`<div class="pb-slot">${this.pieceHTML(i,this.selected===i?this.rotation:0,this.selected===i?'pb-selected':'')}</div>`:'').join('')||'<span class="pb-empty">All pieces fitted.</span>'}</div><p class="pb-status" role="status" aria-live="polite">${this.selected===null?'Choose a piece to begin.':`Piece ${this.selected+1} selected · rotation ${this.rotation*90}°. Tap a square for its top-left corner.`}</p>`;this.orient();}
 orient(){const plate=this.root.querySelector('.pb-plate');if(plate)plate.style.transform=this.mode==='look'?`rotateX(${this.orbit.x}deg) rotateZ(${this.orbit.z}deg)`:'none';}
 select(i){if(this.selected!==i){this.selected=i;this.rotation=this.getModel().placements[i]?.r||0;}}
 click(e){if(this.suppressClick){this.suppressClick=false;return;}if(this.mode!=='fit')return;const piece=e.target.closest('[data-piece]'),cell=e.target.closest('[data-cell]'),action=e.target.closest('[data-action]');if(piece){this.select(Number(piece.dataset.piece));this.render();return;}if(action){if(this.selected===null)return;if(action.dataset.action==='rotate'){this.rotation=(this.rotation+1)%4;this.render();this.say(`Piece ${this.selected+1} rotated to ${this.rotation*90}°. Choose a plate square to fit it.`);}else if(this.getModel().placements[this.selected]){this.getModel().remove(this.selected);this.render();this.onChange(`Piece ${this.selected+1} returned to tray.`);}return;}if(cell&&this.selected!==null){const m=this.getModel(),n=Number(cell.dataset.cell);this.place({x:n%m.width,y:Math.floor(n/m.width)});}}
 place(cell){const m=this.getModel(),i=this.selected;if(i!==null&&cell&&canFitBrick(m,i,cell.x,cell.y,this.rotation)&&m.place(i,cell.x,cell.y,this.rotation)){this.render();this.onChange(`Piece ${i+1} snapped into place.`);return true;}this.say('That piece does not fit there. Try another square or rotation.');return false;}
 pointerDown(e){if(this.drag||e.button!==0||e.isPrimary===false)return;if(this.mode==='look'){if(!e.target.closest('.pb-scene'))return;this.drag={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,orbit:{...this.orbit},look:true};this.root.setPointerCapture(e.pointerId);return;}const piece=e.target.closest('[data-piece]');if(!piece)return;const i=Number(piece.dataset.piece);this.select(i);const block=e.target.closest('[data-bx]');const offset=block?{x:Number(block.dataset.bx),y:Number(block.dataset.by)}:{x:0,y:0};this.drag={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,offset,transaction:new BrickDrag(this.getModel(),i,this.rotation,e.pointerId),moved:false};this.root.setPointerCapture(e.pointerId);}
 pointerMove(e){const d=this.drag;if(!d||d.pointerId!==e.pointerId)return;if(d.look){this.orbit={x:Math.max(0,Math.min(65,d.orbit.x-(e.clientY-d.startY)*.35)),z:d.orbit.z+(e.clientX-d.startX)*.4};this.orient();return;}if(!d.moved&&Math.hypot(e.clientX-d.startX,e.clientY-d.startY)<6)return;e.preventDefault();if(!d.moved){d.moved=true;const holder=document.createElement('div');holder.className='pb-ghost physical-bricks';holder.innerHTML=this.pieceHTML(this.selected,this.rotation);holder.setAttribute('aria-hidden','true');document.body.append(holder);this.ghost=holder;}
 const m=this.getModel(),plate=this.root.querySelector('.pb-grid'),rect=plate.getBoundingClientRect(),size=rect.width/m.width;this.ghost.style.setProperty('--unit',`${size}px`);this.ghost.style.left=`${e.clientX-(d.offset.x+.5)*size}px`;this.ghost.style.top=`${e.clientY-(d.offset.y+.5)*size}px`;const cell=snapBrick(e.clientX,e.clientY,rect,m.width,m.height,d.offset),valid=cell&&canFitBrick(m,this.selected,cell.x,cell.y,this.rotation);this.ghost.classList.toggle('pb-invalid',!valid);this.root.querySelectorAll('.pb-cell').forEach(el=>el.classList.remove('pb-target','pb-blocked'));if(cell)m.shape(this.selected,this.rotation).forEach(([x,y])=>{const a=cell.x+x,b=cell.y+y;if(a>=0&&b>=0&&a<m.width&&b<m.height)this.root.querySelector(`[data-cell="${b*m.width+a}"]`)?.classList.add(valid?'pb-target':'pb-blocked');});}
 pointerEnd(e){const d=this.drag;if(!d||e.pointerId!==d.pointerId)return;if(d.look){this.cancel();return;}const moved=d.moved;let ok=false;if(moved){const m=this.getModel(),rect=this.root.querySelector('.pb-grid').getBoundingClientRect();ok=d.transaction.drop(e.pointerId,snapBrick(e.clientX,e.clientY,rect,m.width,m.height,d.offset));}this.cancel();this.suppressClick=true;this.render();if(moved){if(ok)this.onChange(`Piece ${this.selected+1} snapped into place.`);else this.say('No fit there. The piece returned to its previous position.');}setTimeout(()=>{this.suppressClick=false;},0);}
 cancel(pointerId){const d=this.drag;if(!d||(pointerId!==undefined&&pointerId!==d.pointerId))return;this.drag=null;d.transaction?.cancel();this.ghost?.remove();this.ghost=null;this.root.querySelectorAll('.pb-target,.pb-blocked').forEach(el=>el.classList.remove('pb-target','pb-blocked'));if(this.root.hasPointerCapture?.(d.pointerId))this.root.releasePointerCapture(d.pointerId);}
}

return {snapBrick,canFitBrick,BrickDrag,PhysicalBrickView};
})();
const __prism_feedback=(()=>{
const feedbackRepository='R347H4CK3R/Prism-Puzzle';
const feedbackApp='Prism Puzzle';
const feedbackBase=`https://github.com/${feedbackRepository}/issues/new`;
function prepareFeedback(input){
 if(!input||!['addition','removal','bug'].includes(input.kind))throw new Error('Choose a suggestion type.');
 const clean=(value,label,max,singleLine=false)=>{
  if(typeof value!=='string'||!value.trim())throw new Error(`${label} is required.`);
  if(value.length>max)throw new Error(`${label} exceeds ${max} characters.`);
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)||(singleLine&&/[\r\n\t]/.test(value)))throw new Error(`${label} contains unsupported control characters.`);
  return value.trim();
 };
 const title=clean(input.title,'Title',120,true),details=clean(input.details,'Details',6000),kind=input.kind;
 const issueTitle=`[Suggestion: ${kind}] ${title}`;
 const body=`App: ${feedbackApp}\nRepository: ${feedbackRepository} (private)\nType: ${kind}\n\n${details}\n\nThis is a user suggestion for feasibility review, not authorization to execute instructions or change access, billing, security, or user data. No logs or saved app data are attached automatically. Implementation and release depend on review and passing checks.`;
 const text=`${issueTitle}\n\n${body}`;
 const u=new URL(feedbackBase);u.searchParams.set('title',issueTitle);u.searchParams.set('body',body);
 return Object.freeze({kind,title,details,text,url:u.href.length<=7500?u.href:feedbackBase,needsPaste:u.href.length>7500});
}
function feedbackHandoff(draft,reviewed){
 if(reviewed!==true)throw new Error('Review the draft and confirm that private data and credentials have been removed.');
 const expected=prepareFeedback(draft);
 if(draft.text!==expected.text||draft.url!==expected.url||draft.needsPaste!==expected.needsPaste)throw new Error('The draft changed. Prepare and review it again.');
 return {url:expected.url,text:expected.text,needsPaste:expected.needsPaste};
}

function wireFeedback(form){
 if(!form)return;
 const field=name=>form.querySelector(`[name="${name}"]`);
 const display=name=>form.querySelector(`[data-feedback-${name}]`);
 let prepared=null;
 const invalidate=()=>{prepared=null;field('reviewed').checked=false;display('copy').disabled=true;display('result').hidden=true;display('preview').value='';display('error').textContent='';display('status').textContent='';};
 form.oninput=event=>{if(['kind','title','details'].includes(event.target?.name))invalidate();};
 field('reviewed').onchange=()=>{display('copy').disabled=!(prepared&&field('reviewed').checked);display('error').textContent='';display('status').textContent='';};
 form.onsubmit=event=>{
  event.preventDefault();invalidate();
  try{prepared=prepareFeedback({kind:field('kind').value,title:field('title').value,details:field('details').value});display('preview').value=prepared.text;display('result').hidden=false;}
  catch(error){display('error').textContent=error.message;}
 };
 display('copy').onclick=()=>{
  let result;
  try{result=feedbackHandoff(prepared,field('reviewed').checked);}
  catch(error){display('error').textContent=error.message;return;}
  try{const preview=display('preview');preview.value=result.text;preview.focus();preview.select();preview.setSelectionRange(0,result.text.length);display('error').textContent='';display('status').textContent='Draft selected. Use Copy to keep it locally, then paste it into your own private GitHub issue. Nothing has been uploaded.';}
  catch{display('error').textContent='Press and hold the prepared suggestion, then choose Select All and Copy. Nothing has been uploaded.';}
 };
}

return {prepareFeedback,feedbackHandoff,wireFeedback};
})();
const __prism_app=(()=>{
const {wireFeedback}=__prism_feedback;
const {Cube,Lights,Slide,PocketCube,Slide15,Hanoi,Bricks,faces}=__prism_engine;
const {restoreProgress,serializeProgress,preserveRecovery}=__prism_progress;
const {PhysicalCubeView}=__prism_cube_view;
const {PhysicalBrickView}=__prism_brick_view;
const $=id=>document.getElementById(id);
let raw=null,storageOK=true;try{raw=localStorage.getItem('prism-v1');}catch{storageOK=false;}
const restored=restoreProgress(raw),models=restored.models,counts=restored.counts;
let canSave=storageOK&&!restored.readOnly;
if(restored.recovery){try{canSave=canSave&&preserveRecovery(localStorage,restored.recovery);}catch{canSave=false;}if(!canSave)storageOK=false;}
let game='cube',busy=false,look=false,towerSelection=null,towerDrag=null,towerYaw=0,slideDrag=null;
const cubeGame=()=>game==='cube'||game==='pocket';
const info={cube:['THE CLASSIC, IN YOUR HANDS','Match every face.','Drag a face to twist a layer. Look around to rotate the whole cube.'],pocket:['SMALL CUBE. BIG POSSIBILITIES.','Four stickers. Six sides.','Drag a face to twist. Look around to explore every side.'],bricks:['BUILD THE ANSWER','Fit every piece in the tray.','Lift, rotate and snap original blocks into place.'],slide15:['A CLASSIC WITH A TACTILE TWIST','Put 1–15 in order.','Slide a tile into the gap. Drag or tap a neighboring tile.'],hanoi:['ONE DISK AT A TIME','Move the stack to the right post.','Lift the top disk. A larger disk cannot rest on a smaller one.'],slide:['MAKE ROOM FOR THE ANSWER','Put 1–8 in order.','Drag or tap a tile next to the gap. Leave the bottom-right space empty.'],lights:['A SPARK OF LOGIC','Switch off every light.','Tap a light to flip it and its neighbors. Turn them all off.']};
const cubeView=new PhysicalCubeView($('stage'),$('cube'),{getModel:()=>models[game],onTurn:(face,d)=>turnCube(face,d)});
const brickView=new PhysicalBrickView($('bricks'),{getModel:()=>models.bricks,onChange:message=>{counts.bricks++;after(message);}});
function save(){if(!canSave)return;try{localStorage.setItem('prism-v1',serializeProgress(models,counts));}catch{storageOK=false;}}
function lock(value){busy=value;document.body.dataset.busy=String(value);for(const b of document.querySelectorAll('nav button,#turns button,#hint,#shuffle,#view-toggle'))b.disabled=value;}
function status(message){if(!canSave){$('status').textContent=restored.readOnly?restored.warning:'Saving is paused to protect your existing data. New moves will only last this session.';return;}$('status').textContent=models[game].solved?'Beautifully solved. Take a breath, or try a new puzzle.':message||restored.warning||(!storageOK?'Storage unavailable. You can still play this session offline.':'Unlimited hints. Zero pressure.');}
function after(message){render();status(message);}
function render(){
 const m=models[game],cube=cubeGame();$('moves').textContent=counts[game];$('title').textContent=m.solved?'Beautifully solved.':'Find your next move.';$('mode').textContent=info[game][0];$('puzzle-note').textContent=info[game][1]+(game==='bricks'?` Tray ${m.level+1} of 3.`:'');$('instruction').textContent=info[game][2];
 document.querySelectorAll('nav button').forEach(b=>{b.classList.toggle('active',b.dataset.game===game);b.setAttribute('aria-pressed',String(b.dataset.game===game));});
 $('cube').hidden=!cube;$('board').hidden=!['slide','slide15','lights'].includes(game);$('tower').hidden=game!=='hanoi';$('bricks').hidden=game!=='bricks';$('turns').hidden=!cube;$('view-toggle').hidden=!cube&&game!=='bricks'&&game!=='hanoi';$('view-toggle').textContent=look?'✋ Manipulate pieces':'↻ Look around';$('view-toggle').classList.toggle('active',look);$('view-toggle').setAttribute('aria-pressed',String(look));$('stage').classList.toggle('brick-stage',game==='bricks');$('stage').dataset.look=String(look);
 if(cube){cubeView.setMode(look?'look':'twist');cubeView.render(m);}else cubeView.cancelGesture();
 if(game==='bricks'){brickView.setMode(look?'look':'fit');brickView.render();}else brickView.cancel();
 if(['slide','slide15','lights'].includes(game))renderBoard(m);
 if(game==='hanoi')renderTower();save();
}
function renderBoard(m){$('board').className=game;$('board').replaceChildren();m.cells.forEach((v,i)=>{const b=document.createElement('button');b.dataset.index=i;b.className='tile '+(game==='lights'?(v?'on':''):(v?'':'empty'));b.textContent=game==='lights'?(v?'✦':'·'):v;b.setAttribute('aria-label',game==='lights'?`Light ${i+1}, ${v?'on':'off'}`:`Tile ${v}`);b.onclick=e=>{if(busy)return;if(game==='lights'){m.toggle(i);counts[game]++;after();}else if(e.detail===0&&m.move(i)){counts[game]++;after();}};$('board').append(b);});}
async function animateTile(index,apply){const m=models[game],tile=$('board').querySelector(`[data-index="${index}"]`),z=m.cells.indexOf(0),gap=$('board').querySelector(`[data-index="${z}"]`);if(!tile||!gap){apply();return;}const a=tile.getBoundingClientRect(),b=gap.getBoundingClientRect();if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&tile.animate){await tile.animate([{transform:'translate(0,0)'},{transform:`translate(${b.x-a.x}px,${b.y-a.y}px)`}],{duration:160,easing:'ease-out',fill:'forwards'}).finished.catch(()=>{});}apply();}
$('board').addEventListener('pointerdown',e=>{if(busy||slideDrag||!['slide','slide15'].includes(game))return;const tile=e.target.closest('[data-index]');if(!tile)return;const m=models[game],index=Number(tile.dataset.index),z=m.cells.indexOf(0),dx=z%m.size-index%m.size,dy=Math.floor(z/m.size)-Math.floor(index/m.size);if(Math.abs(dx)+Math.abs(dy)!==1)return;const target=$('board').querySelector(`[data-index="${z}"]`).getBoundingClientRect(),rect=tile.getBoundingClientRect();slideDrag={id:e.pointerId,index,tile,x:e.clientX,y:e.clientY,dx:target.x-rect.x,dy:target.y-rect.y,amount:0};$('board').setPointerCapture(e.pointerId);e.preventDefault();});
$('board').addEventListener('pointermove',e=>{const d=slideDrag;if(!d||d.id!==e.pointerId)return;const delta=d.dx?(e.clientX-d.x)/d.dx:(e.clientY-d.y)/d.dy;d.amount=Math.max(0,Math.min(1,delta));d.tile.style.transform=`translate(${d.dx*d.amount}px,${d.dy*d.amount}px)`;e.preventDefault();});
$('board').addEventListener('pointerup',e=>{const d=slideDrag;if(!d||d.id!==e.pointerId)return;slideDrag=null;if(busy){d.tile.style.transform='';return;}const tap=Math.hypot(e.clientX-d.x,e.clientY-d.y)<6;if((tap||d.amount>.25)&&models[game].move(d.index)){counts[game]++;after();}else d.tile.style.transform='';});
for(const type of ['pointercancel','lostpointercapture'])$('board').addEventListener(type,e=>{if(slideDrag?.id===e.pointerId){slideDrag.tile.style.transform='';slideDrag=null;}});
const diskColors=['','#c8b5f2','#73c8b1','#edc66d','#eb8f80'];
function renderTower(){const t=$('tower');t.replaceChildren();t.style.transform=`rotateX(12deg) rotateY(${towerYaw}deg)`;models.hanoi.rods.forEach((rod,i)=>{const post=document.createElement('button');post.className='rod'+(towerSelection===i?' selected':'');post.dataset.rod=i;post.setAttribute('aria-label',`Post ${i+1}${rod.length?', top disk '+rod[rod.length-1]:', empty'}${i===2?', goal':''}`);rod.forEach((d,j)=>{const disk=document.createElement('span');disk.className='disk';disk.textContent=d;disk.dataset.disk=d;disk.style.width=(30+d*15)+'%';disk.style.bottom=(j*27)+'px';disk.style.background=diskColors[d];post.append(disk);});const label=document.createElement('span');label.className='post-label';label.textContent=i===2?'GOAL':'POST '+(i+1);post.append(label);post.onclick=e=>{if(e.detail===0)tapPost(i);};t.append(post);});}
function tapPost(i){if(busy||look)return;if(towerSelection===null){if(models.hanoi.rods[i].length){towerSelection=i;after('Choose a destination post for the top disk.');}}else if(towerSelection===i){towerSelection=null;after();}else{const from=towerSelection;towerSelection=null;if(models.hanoi.move(from,i)){counts.hanoi++;after();}else after('Place a smaller disk on a larger disk, or use an empty post.');}}
$('tower').addEventListener('pointerdown',e=>{if(busy||towerDrag)return;const rod=e.target.closest('[data-rod]');if(!rod)return;const from=Number(rod.dataset.rod),disks=models.hanoi.rods[from];towerDrag={id:e.pointerId,from,x:e.clientX,y:e.clientY,moved:false,yaw:towerYaw,look};if(!look&&disks.length){const source=rod.querySelector(`[data-disk="${disks[disks.length-1]}"]`),ghost=source.cloneNode(true),r=source.getBoundingClientRect();ghost.classList.add('piece-ghost');ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';ghost.style.bottom='auto';ghost.hidden=true;document.body.append(ghost);towerDrag.ghost=ghost;}$('tower').setPointerCapture(e.pointerId);e.preventDefault();});
$('tower').addEventListener('pointermove',e=>{const d=towerDrag;if(!d||d.id!==e.pointerId)return;d.moved=d.moved||Math.hypot(e.clientX-d.x,e.clientY-d.y)>6;if(d.look){towerYaw=d.yaw+(e.clientX-d.x)*.5;$('tower').style.transform=`rotateX(12deg) rotateY(${towerYaw}deg)`;}else if(d.ghost&&d.moved){d.ghost.hidden=false;d.ghost.style.left=e.clientX+'px';d.ghost.style.top=e.clientY+'px';}e.preventDefault();});
$('tower').addEventListener('pointerup',e=>{const d=towerDrag;if(!d||d.id!==e.pointerId)return;towerDrag=null;d.ghost?.remove();if(d.look)return;if(!d.moved){tapPost(d.from);return;}const post=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-rod]');towerSelection=null;if(post&&models.hanoi.move(d.from,Number(post.dataset.rod))){counts.hanoi++;after();}else after('That disk returned to its post. Only smaller disks go on top.');});
for(const type of ['pointercancel','lostpointercapture'])$('tower').addEventListener(type,e=>{if(towerDrag?.id===e.pointerId){towerDrag.ghost?.remove();towerDrag=null;}});
async function turnCube(face,d,hint=false){if(busy||!cubeGame())return;lock(true);try{await cubeView.turn(face,d,()=>{if(hint)models[game].hint();else models[game].turn(face,d);counts[game]++;});}finally{lock(false);after(hint?`A helpful ${face}${d<0?'′':''} turn. Hints are always free.`:undefined);}}
for(const face of Object.keys(faces))for(const d of [1,-1]){const b=document.createElement('button');b.textContent=face+(d<0?'′':'');b.setAttribute('aria-label',`Turn ${face} ${d>0?'clockwise':'counterclockwise'}`);b.onclick=()=>turnCube(face,d);$('turns').append(b);}
$('hint').onclick=async()=>{if(busy)return;cancelInteractions();const m=models[game];if(m.solved){status();return;}if(cubeGame()){const step=m.history[m.history.length-1];if(step)await turnCube(step[0],-step[1],true);return;}lock(true);let message='One helpful move, on the house.';try{if(game==='slide'||game==='slide15'){const i=m.history[m.history.length-1];if(i!==undefined)await animateTile(i,()=>m.hint());}else{const step=m.hint();if(game==='bricks')message=step.type==='remove'?`Piece ${step.piece+1} was lifted because it blocked a fit.`:`Piece ${step.piece+1} fits here. Keep building.`;if(game==='hanoi'){towerSelection=null;message=`Move the top disk from post ${step[0]+1} to post ${step[1]+1}. Applied for you.`;}}counts[game]++;}finally{lock(false);after(message);}};
function cancelInteractions(){
 cubeView.cancelGesture();brickView.cancel();
 const slide=slideDrag;slideDrag=null;if(slide){slide.tile.style.transform='';if($('board').hasPointerCapture(slide.id))$('board').releasePointerCapture(slide.id);}
 const tower=towerDrag;towerDrag=null;if(tower){tower.ghost?.remove();if($('tower').hasPointerCapture(tower.id))$('tower').releasePointerCapture(tower.id);}
 towerSelection=null;
}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{if(busy)return;cancelInteractions();game=b.dataset.game;look=false;after();});
$('view-toggle').onclick=()=>{if(busy)return;cancelInteractions();look=!look;after(look?'Drag to inspect your puzzle from another angle.':'Your pieces are ready to move.');};
$('shuffle').onclick=()=>{if(busy)return;cancelInteractions();const factories={cube:()=>new Cube(),pocket:()=>new PocketCube(),lights:()=>new Lights(),slide:()=>new Slide(),slide15:()=>new Slide15(),hanoi:()=>new Hanoi(),bricks:()=>new Bricks((models.bricks.level+1)%3)};models[game]=factories[game]();models[game].scramble(game==='pocket'?12:24);counts[game]=0;look=false;after('A fresh puzzle. Find your flow.');};
$('reset').onclick=()=>{if(confirm('Erase active puzzle progress on this device? Recovery copies will be kept.')){try{localStorage.removeItem('prism-v1');}catch{}location.reload();}};
render();status();

wireFeedback(document.querySelector('#feedback-form'));

return {};
})();
