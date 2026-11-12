import {faces} from './engine.mjs';
const colors={U:'#f4f0df',D:'#f3cd55',R:'#ed7066',L:'#efa555',F:'#6ccbb1',B:'#809de8'};
const normals={F:'',B:'rotateY(180deg)',R:'rotateY(90deg)',L:'rotateY(-90deg)',U:'rotateX(90deg)',D:'rotateX(-90deg)'};
export function stickerGeometry(t,n=3,size=180){
 const face=Object.keys(faces).find(f=>{const[a,s]=faces[f];return t.n[a]===s;});
 const position=t.p.map((v,a)=>t.n[a]?t.n[a]*size/2:v*size/(n===2?4:3));position[1]=-position[1];
 return {face,position,size:size/n,orientation:normals[face]};
}
export function layerIndices(model,face){const[a,s]=faces[face];return model.stickers.flatMap((t,i)=>t.p[a]===s?[i]:[]);}
export function turnTransform(face,amount){const[a,s]=faces[face];return `rotate${'XYZ'[a]}(${90*amount*s*(a===1?-1:1)}deg)`;}
export function projectPoint(p,rx,ry){const x=rx*Math.PI/180,y=ry*Math.PI/180;const a=p[0]*Math.cos(y)+p[2]*Math.sin(y),z=-p[0]*Math.sin(y)+p[2]*Math.cos(y);return [a,-p[1]*Math.cos(x)-z*Math.sin(x)];}
export function dragAmount(face,p,dx,dy,rx,ry){
 const[a,s]=faces[face],b=(a+1)%3,c=(a+2)%3,v=[0,0,0];v[b]=s*p[c];v[c]=-s*p[b];
 const tangent=projectPoint(v,rx,ry),length=Math.hypot(...tangent);
 // Center stickers have no rotational tangent: use the familiar horizontal swipe.
 const distance=length>.15?(dx*tangent[0]+dy*tangent[1])/length:dx;
 return Math.max(-1.15,Math.min(1.15,distance/85));
}
export class PointerGesture{
 constructor(){this.owner=null;this.data=null;}
 begin(id,data){if(this.owner!==null)return false;this.owner=id;this.data=data;return true;}
 current(id){return this.owner===id?this.data:null;}
 end(id){if(this.owner!==id)return null;const data=this.data;this.clear();return data;}
 clear(){this.owner=null;this.data=null;}
}
export class PhysicalCubeView{
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
   // Sticker planes already provide the outer black backing. Keeping a second
   // near-coplanar core face here can occlude them in WebKit's 3D compositor.
   for(const f of Object.keys(faces)){const[axis,sign]=faces[f];if(p[axis]===sign)continue;const plane=doc.createElement('div');plane.className='core-plane';plane.style.width=plane.style.height=`${span}px`;plane.style.marginLeft=plane.style.marginTop=`${-span/2}px`;plane.style.transform=`${normals[f]} translateZ(${span/2}px)`;core.append(plane);}
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
