import {test} from 'node:test';import assert from 'node:assert/strict';import {PointerGesture} from '../web/cube-view.mjs';
test('second finger cannot replace gesture owner',()=>{const g=new PointerGesture();assert.equal(g.begin(1,{face:'F'}),true);assert.equal(g.begin(2,{face:'R'}),false);assert.equal(g.current(1).face,'F');assert.equal(g.current(2),null);});
test('unrelated release cannot end active gesture',()=>{const g=new PointerGesture();g.begin(1,{face:'F'});assert.equal(g.end(2),null);assert.equal(g.end(1).face,'F');assert.equal(g.owner,null);});
test('clear permits a fresh gesture without stale data',()=>{const g=new PointerGesture();g.begin(1,{face:'F'});g.clear();assert.equal(g.current(1),null);assert.equal(g.begin(2,{face:'R'}),true);});
