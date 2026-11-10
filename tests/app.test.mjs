import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as engine from '../web/engine.mjs';
import * as progress from '../web/progress.mjs';

// Exercise the real app handlers with only the browser boundary replaced.
function appFixture({saved=null,recovery=null,backupFailure=false}={}){
 const values=new Map();if(saved!==null)values.set('prism-v1',saved);if(recovery!==null)values.set('prism-v1-recovery',recovery);
 class Element{
  constructor(){this.children=[];this.dataset={};this.style={};this.events={};this.captures=new Set();this.classList={toggle(){},add(){}};}
  append(e){this.children.push(e);} replaceChildren(){this.children=[];} setAttribute(){}
  addEventListener(name,fn){this.events[name]=fn;}
  setPointerCapture(id){this.captures.add(id);}hasPointerCapture(id){return this.captures.has(id);}releasePointerCapture(id){this.captures.delete(id);}
  getBoundingClientRect(){return{x:Number(this.dataset.index||0)*50,y:0,width:50,height:50};}
  querySelector(selector){const match=selector.match(/data-(index|disk)="(\d+)"/);return match?this.children.find(e=>e.dataset[match[1]]==match[2]):null;}
  cloneNode(){const copy=new Element();copy.dataset={...this.dataset};return copy;}remove(){this.removed=true;}
  closest(selector){return selector==='[data-index]'?this:null;}
 }
 const ids=new Map(),get=id=>{if(!ids.has(id))ids.set(id,new Element());return ids.get(id);};
 const nav=[];for(const game of ['cube','pocket','lights','slide','slide15','hanoi','bricks']){const e=new Element();e.dataset.game=game;nav.push(e);}
 const document={getElementById:get,createElement:()=>new Element(),body:new Element(),querySelectorAll:selector=>selector==='nav button'?nav:[...nav,...get('turns').children,get('hint'),get('shuffle'),get('view-toggle')]};
 const view=class{setMode(){}render(){}cancelGesture(){}cancel(){}};
 const storage={getItem:k=>values.get(k)??null,setItem(k,v){if(k.startsWith('prism-v1-recovery')&&backupFailure){if(backupFailure==='throw')throw Error('quota');return;}values.set(k,v);},removeItem:k=>values.delete(k)};
 const context=vm.createContext({...engine,...progress,PhysicalCubeView:view,PhysicalBrickView:view,document,localStorage:storage,matchMedia:()=>({matches:false}),confirm:()=>false,location:{reload(){}},console,setTimeout});
 const source=fs.readFileSync(new URL('../web/app.mjs',import.meta.url),'utf8').replace(/^import .*;\n/gm,'');vm.runInContext(source,context);
 return {get,values,context,game(name){nav.find(e=>e.dataset.game===name).onclick();},evaluate:code=>vm.runInContext(code,context)};
}
const broken='{"cube":[["not-a-face",1]],"slide":[7]}';
test('second damaged save is backed up without deleting first recovery',()=>{
 const f=appFixture({saved:broken,recovery:'older damage'});
 assert.equal(f.values.get('prism-v1-recovery'),'older damage');
 assert.ok([...f.values.entries()].some(([k,v])=>k.startsWith('prism-v1-recovery')&&v===broken));
 assert.notEqual(f.values.get('prism-v1'),broken);
});
for(const backupFailure of ['throw','silent'])test(`unverified ${backupFailure} recovery cannot overwrite original save`,()=>{
 const f=appFixture({saved:broken,backupFailure});
 assert.equal(f.values.get('prism-v1'),broken);
 f.get('shuffle').onclick();assert.equal(f.values.get('prism-v1'),broken);
 assert.match(f.get('status').textContent,/sav|recover|storage/i);
});
test('hint cancels held slide gesture and releases capture before animation',async()=>{
 const f=appFixture({saved:JSON.stringify({slide:[7]})});f.game('slide');
 const board=f.get('board'),tile=board.querySelector('[data-index="8"]');
 board.events.pointerdown({target:tile,pointerId:1,clientX:400,clientY:0,preventDefault(){}});
 board.events.pointermove({pointerId:1,clientX:380,clientY:0,preventDefault(){}});
 assert.notEqual(tile.style.transform,'');let finish;tile.animate=()=>({finished:new Promise(resolve=>{finish=resolve;})});
 const hint=f.get('hint').onclick();
 assert.equal(board.hasPointerCapture(1),false);assert.equal(tile.style.transform,'');
 board.events.pointerup({pointerId:1,clientX:370,clientY:0});
 assert.equal(f.evaluate('counts.slide'),0);
 finish();await hint;assert.equal(f.evaluate('models.slide.solved'),true);assert.equal(f.evaluate('counts.slide'),1);
});
test('hint cancels held tower gesture so it cannot apply after the hinted move',async()=>{
 const f=appFixture();f.game('hanoi');
 const tower=f.get('tower'),rod=tower.children[0];rod.closest=()=>rod;
 tower.events.pointerdown({target:rod,pointerId:9,clientX:10,clientY:10,preventDefault(){}});
 const ghost=f.evaluate('towerDrag.ghost');
 await f.get('hint').onclick();assert.equal(f.evaluate('towerDrag'),null);assert.equal(f.evaluate('towerSelection'),null);assert.equal(ghost.removed,true);assert.equal(tower.hasPointerCapture(9),false);
 tower.events.pointerup({pointerId:9,clientX:100,clientY:10});assert.equal(f.evaluate('counts.hanoi'),1);
});

test('existing identical recovery is reused without extra writes',()=>{
 const f=appFixture({saved:broken,recovery:broken,backupFailure:'throw'});
 assert.notEqual(f.values.get('prism-v1'),broken);assert.equal([...f.values.keys()].filter(k=>k.startsWith('prism-v1-recovery')).length,1);
});
test('busy slide completion cannot change the model',()=>{
 const f=appFixture({saved:JSON.stringify({slide:[7]})});f.game('slide');const board=f.get('board'),tile=board.querySelector('[data-index="8"]');
 board.events.pointerdown({target:tile,pointerId:1,clientX:400,clientY:0,preventDefault(){}});
 f.evaluate('lock(true)');board.events.pointerup({pointerId:1,clientX:400,clientY:0});assert.equal(f.evaluate('models.slide.solved'),false);assert.equal(f.evaluate('counts.slide'),0);
});
test('explicit active-progress reset keeps every recovery copy as promised',()=>{
 const f=appFixture({saved:broken,recovery:'older damage'});f.context.confirm=()=>true;f.get('reset').onclick();
 assert.equal(f.values.has('prism-v1'),false);assert.equal(f.values.get('prism-v1-recovery'),'older damage');assert.equal(f.values.get('prism-v1-recovery-1'),broken);
});

test('an older app never overwrites a newer save format during launch or play',()=>{
 const future=JSON.stringify({schema:3,cube:{futureFormat:true},counts:{cube:17},newPuzzle:{progress:[1,2,3]}});
 const f=appFixture({saved:future});
 assert.equal(f.values.get('prism-v1'),future);
 f.get('shuffle').onclick();
 f.game('lights');f.get('board').children[0].onclick({detail:1});
 assert.equal(f.evaluate('counts.lights'),1);
 assert.equal(f.values.get('prism-v1'),future);
 assert.match(f.get('status').textContent,/newer|version|format/i);
});
