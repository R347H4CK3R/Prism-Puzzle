import test from 'node:test';
import assert from 'node:assert/strict';
import {Cube,PocketCube,faces} from '../web/engine.mjs';
import {PhysicalCubeView,layerIndices} from '../web/cube-view.mjs';
class Element {
 constructor(doc){this.ownerDocument=doc;this.children=[];this.style={};this.dataset={};this.classList={add(){}};}
 addEventListener(){} setAttribute(){}
 append(child){if(child.parent){child.parent.children.splice(child.parent.children.indexOf(child),1);}this.children.push(child);child.parent=this;}
 replaceChildren(){for(const c of this.children)c.parent=null;this.children=[];}
}
const normals={F:'',B:'rotateY(180deg)',R:'rotateY(90deg)',L:'rotateY(-90deg)',U:'rotateX(90deg)',D:'rotateX(-90deg)'};
function viewFor(model){const doc={createElement(){return new Element(doc);}};const stage=new Element(doc),cube=new Element(doc);const view=new PhysicalCubeView(stage,cube,{getModel:()=>model,onTurn(){}});view.render(model);return view;}
for(const [label,Model,total] of [['3x3',Cube,102],['2x2',PocketCube,24]]){
 test(`${label} solid cores omit redundant outward surfaces beneath sticker backing`,()=>{
  const view=viewFor(new Model());
  let count=0;
  for(const core of view.cores){
   const actual=core.element.children.map(p=>p.style.transform.split(' translateZ(')[0]);
   const expected=Object.entries(faces).filter(([, [axis,sign]])=>core.p[axis]!==sign).map(([face])=>normals[face]);
   assert.deepEqual(actual,expected,`core ${core.p}: black outer planes must not compete with sticker backing`);
   count+=actual.length;
  }
  assert.equal(count,total,'Internal plastic surfaces stay present');
 });
}
test('a turn carries every affected core and sticker, without a stationary solid slice',()=>{
 const model=new Cube(),view=viewFor(model),[axis,sign]=faces.R;
 const affected=view.cores.filter(c=>c.p[axis]===sign),fixed=view.cores.filter(c=>c.p[axis]!==sign);
 const layer=view.layer('R');
 assert.equal(affected.length,9);
 assert(affected.every(c=>c.element.parent===layer));
 assert(fixed.every(c=>c.element.parent===view.cube));
 assert.equal(layer.children.length,affected.length+layerIndices(model,'R').length);
});
const normalFor={U:[0,1,0],D:[0,-1,0],R:[1,0,0],L:[-1,0,0],F:[0,0,1],B:[0,0,-1]};
for(const [label,Model,width] of [['3x3',Cube,3],['2x2',PocketCube,2]]){
 test(`${label} every omitted solid surface is backed by exactly one sticker after seeded turns`,()=>{
  const model=new Model();let seed=4217;
  for(let turn=0;turn<120;turn++){
   seed=(1664525*seed+1013904223)>>>0;
   model.turn(Object.keys(normalFor)[seed%6],seed&128?1:-1);
   const view=viewFor(model);
   for(const core of view.cores){
    const at=model.stickers.filter(t=>t.p.every((v,i)=>v===core.p[i]));
    const rendered=new Set(core.element.children.map(p=>p.style.transform.split(' translateZ(')[0]));
    assert.equal(rendered.size+at.length,6);
    for(const [face,n] of Object.entries(normalFor)){
     const covering=at.filter(t=>t.n.every((v,i)=>v===n[i]));
     assert.equal(covering.length,rendered.has(normals[face])?0:1,`turn ${turn}, core ${core.p}, ${face}`);
    }
   }
  }
 });
 test(`${label} each of six turn directions carries all and only its physical slice`,()=>{
  const model=new Model();model.turn('U',1);model.turn('F',-1);
  for(const [face,[axis,sign]] of Object.entries(faces)){
   const view=viewFor(model),layer=view.layer(face);
   const moved=view.cores.filter(c=>c.element.parent===layer);
   assert.equal(moved.length,width*width);
   assert(moved.every(c=>c.p[axis]===sign));
   assert(view.cores.filter(c=>c.p[axis]!==sign).every(c=>c.element.parent===view.cube));
   const stickers=layer.children.filter(c=>c.className==='face cubelet-face');
   assert.equal(stickers.length,layerIndices(model,face).length);
   assert(stickers.every(c=>Number(c.dataset.position.split(',')[axis])===sign));
  }
 });
}
