import {test} from 'node:test';import assert from 'node:assert/strict';
import {PocketCube,Slide15,Hanoi,Bricks} from '../web/engine.mjs';import {restoreProgress,serializeProgress} from '../web/progress.mjs';
test('pocket cube scrambles and rotated solved orientation survive save and hints',()=>{for(let n=0;n<300;n++){const p=new PocketCube();p.scramble(30);const q=new PocketCube(p.history);assert.deepEqual(q.stickers,p.stickers);for(let i=0;i<100&&!q.solved;i++)q.hint();assert.equal(q.solved,true);}const p=new PocketCube();p.turn('R');p.turn('L',-1);assert.equal(p.solved,true);assert.equal(p.hint(),null);assert.deepEqual(new PocketCube(p.history).stickers,p.stickers);});
test('15 tiles scramble and hints retain exact permutation',()=>{for(let n=0;n<300;n++){const p=new Slide15();p.scramble(80);assert.deepEqual([...p.cells].sort((a,b)=>a-b),Array.from({length:16},(_,i)=>i));for(let i=0;i<100&&!p.solved;i++)p.hint();assert.equal(p.solved,true);}});
test('tower hints solve every legal disk arrangement',()=>{for(let state=0;state<81;state++){let n=state;const rods=[[],[],[]],positions=[];for(let d=1;d<=4;d++){positions[d]=n%3;n=Math.floor(n/3);}for(let d=4;d>=1;d--)rods[positions[d]].push(d);const h=new Hanoi(rods);for(let i=0;i<30&&!h.solved;i++)assert.ok(h.hint());assert.equal(h.solved,true);assert.equal(h.hint(),null);}});
test('assembly fits rotations without collision and all hints terminate',()=>{for(let level=0;level<3;level++)for(let k=0;k<100;k++){const b=new Bricks(level);for(let j=0;j<15;j++)b.place(Math.floor(Math.random()*b.pieces.length),Math.floor(Math.random()*b.width),Math.floor(Math.random()*b.height),Math.floor(Math.random()*4));const r=new Bricks(level,b.placements);for(let j=0;j<20&&!r.solved;j++)assert.ok(r.hint());assert.equal(r.solved,true);assert.equal(r.hint(),null);}const b=new Bricks();assert.equal(b.place(0,0,1,0),true);assert.equal(b.hint().type,'remove');});
test('legacy and expanded save migration retain valid state and recovery input',()=>{const raw=JSON.stringify({cube:[['R',1]],lights:[99],slide:[7],counts:{cube:5}});const r=restoreProgress(raw);assert.equal(r.recovery,raw);assert.equal(r.counts.cube,5);assert.equal(r.models.slide.cells[7],0);r.models.hanoi.move(0,2);r.models.bricks.hint();const again=restoreProgress(serializeProgress(r.models,r.counts));assert.deepEqual(again.models.hanoi.rods,r.models.hanoi.rods);assert.deepEqual(again.models.bricks.placements,r.models.bricks.placements);assert.deepEqual(again.models.cube.stickers,r.models.cube.stickers);});

for(const schema of [3,0,-1,1.5,'2',null,{},[]])test(`unsupported save schema ${JSON.stringify(schema)} cannot be decoded or rewritten`,()=>{
 const restored=restoreProgress(JSON.stringify({schema,slide:[7],counts:{slide:19}}));
 assert.equal(restored.readOnly,true);
 assert.equal(restored.recovery,null);
 assert.equal(restored.counts.slide,0);
});
for(const schema of [undefined,1,2])test(`supported save schema ${schema??'legacy'} keeps progress writable`,()=>{
 const restored=restoreProgress(JSON.stringify({schema,slide:[7],counts:{slide:19}}));
 assert.notEqual(restored.readOnly,true);
 assert.equal(restored.recovery,null);
 assert.equal(restored.models.slide.cells[7],0);
 assert.equal(restored.counts.slide,19);
});
