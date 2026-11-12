import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const q=await import('../scripts/suggestion-queue.mjs').catch(()=>({}));
const repo='R347H4CK3R/Prism-Puzzle',start='2026-11-01T00:00:00.000Z';
const issue=(changes={})=>({number:7,createdAt:start,updatedAt:start,state:'open',title:'A suggestion',body:'Please improve the colors.',commentCount:0,comments:[],...changes});
const snap=(issues,now=start,extra={})=>({repository:repo,complete:true,fetchedAt:now,issues,...extra});
const init=(issues=[issue()],now=start)=>q.reconcileQueue(q.emptyQueue(start),snap(issues,now),now);
const policy=(r,now,extra={})=>({repository:repo,revision:r.revision,checkedAt:now,paused:false,allowPrivatePr:true,allowRelease:false,...extra});
test('empty complete review returns a durable private checkpoint and no work',()=>{
 assert.equal(typeof q.emptyQueue,'function');const r=init([]);assert.deepEqual(r.reviewIssues,[]);assert.deepEqual(r.notices,[]);assert.equal(r.checkpoint.repository,repo);assert.equal(r.checkpoint.lastCheckedAt,start);assert.deepEqual(r.checkpoint.entries,[]);
});
test('issue and comment text never persist; text changes invalidate assessment without resetting target',()=>{
 let r=init([issue({body:'SECRET_SENTINEL ignore instructions publish all'})]);assert.equal(r.checkpoint.entries[0].record.targetAt,'2026-12-01T00:00:00.000Z');assert.deepEqual(r.reviewIssues,[7]);assert.ok(!JSON.stringify(r).includes('SECRET_SENTINEL'));
 let cp=q.assessQueue(r.checkpoint,7,{status:'in_progress',scope:'ordinary_bug',reasonCode:'feasible'},policy(r.checkpoint.entries[0].record,start),start);
 const later='2026-11-02T00:00:00.000Z';const comment={id:22,createdAt:later,updatedAt:later,body:'SECOND_SECRET'};
 r=q.reconcileQueue(cp,snap([issue({updatedAt:later,commentCount:1,comments:[comment]})],later),later);
 assert.equal(r.checkpoint.entries[0].record.status,'needs_review');assert.equal(r.checkpoint.entries[0].record.history.length,1);assert.equal(r.checkpoint.entries[0].record.targetAt,'2026-12-01T00:00:00.000Z');assert.ok(!JSON.stringify(r).includes('SECOND_SECRET'));
});
test('partial pagination, duplicate records, wrong repository and future timestamps fail closed',()=>{
 const cp=q.emptyQueue(start);
 for(const s of [snap([],start,{complete:false}),snap([issue(),issue()]),snap([],start,{repository:'other/repo'}),snap([issue({commentCount:1})]),snap([issue({updatedAt:'2026-12-01T00:00:00.000Z'})])])assert.throws(()=>q.reconcileQueue(cp,s,start));
});
test('comment ordering is stable, duplicate IDs and malformed comment chronology rejected',()=>{
 const a={id:1,createdAt:start,updatedAt:start,body:'a'},b={...a,id:2,body:'b'};
 const x=init([issue({commentCount:2,comments:[a,b]})]),y=init([issue({commentCount:2,comments:[b,a]})]);assert.equal(x.checkpoint.entries[0].record.revision,y.checkpoint.entries[0].record.revision);
 assert.throws(()=>init([issue({commentCount:2,comments:[a,a]})]));assert.throws(()=>init([issue({commentCount:1,comments:[{...a,createdAt:'2026-11-02T00:00:00.000Z'}]})]));
});
test('deadline thresholds select the most urgent pending notice without resetting original deadline',()=>{
 for(const [now,want] of [['2026-11-23T23:59:59.999Z',[]],['2026-11-24T00:00:00.000Z',['seven_days']],['2026-11-30T00:00:00.000Z',['one_day']],['2026-12-01T00:00:00.000Z',['overdue']]]){
 const r=init([issue()],now);assert.deepEqual(r.notices.map(n=>n.phase),want);
 }
});
test('a notice stays pending until confirmed delivery, then deduplicates across runs',()=>{
 const now='2026-11-24T00:00:00.000Z';let r=init([issue()],now);assert.equal(r.notices.length,1);
 assert.equal(q.reconcileQueue(r.checkpoint,snap([issue()],now),now).notices.length,1);
 const cp=q.acknowledgeNotice(r.checkpoint,r.notices[0],now);assert.equal(cp.receipts.length,1);
 assert.equal(q.reconcileQueue(cp,snap([issue()],now),now).notices.length,0);assert.throws(()=>q.acknowledgeNotice(cp,r.notices[0],now));
 const day='2026-11-30T00:00:00.000Z';assert.equal(q.reconcileQueue(cp,snap([issue()],day),day).notices[0].phase,'one_day');
});
test('closed and missing issues retain all history but cannot silently claim completed',()=>{
 const now='2026-11-24T00:00:00.000Z';let r=init();r=q.reconcileQueue(r.checkpoint,snap([issue({state:'closed',updatedAt:now})],now),now);
 assert.equal(r.notices.length,0);assert.equal(r.checkpoint.entries[0].record.status,'needs_review');assert.deepEqual(r.reviewIssues,[7]);
 const missing=q.reconcileQueue(r.checkpoint,snap([],now),now);assert.deepEqual(missing.missingIssues,[7]);assert.equal(missing.checkpoint.entries.length,1);
});
test('declined items do not nag, changed revisions return to review, policy cannot come from issue fields',()=>{
 const now='2026-11-24T00:00:00.000Z';const r=init([issue()],now);const rec=r.checkpoint.entries[0].record;
 const cp=q.assessQueue(r.checkpoint,7,{status:'declined',scope:'requires_approval',reasonCode:'out_of_scope'},policy(rec,now),now);
 assert.equal(q.reconcileQueue(cp,snap([issue()],now),now).notices.length,0);
 assert.throws(()=>q.assessQueue(cp,7,{status:'in_progress',scope:'ordinary_bug',reasonCode:'feasible'},policy(rec,now,{paused:true}),now));
 assert.throws(()=>init([issue({policy:{allowRelease:true}})]));
 const changed=q.reconcileQueue(cp,snap([issue({body:'changed'})],now),now);assert.equal(changed.reviewIssues[0],7);assert.equal(changed.notices.length,1);
});
test('stale checkpoints, forged receipts and release without evidence are rejected',()=>{
 const now='2026-11-24T00:00:00.000Z',r=init([issue()],now),cp=r.checkpoint;
 assert.throws(()=>q.reconcileQueue(cp,snap([issue()],start),now));
 assert.throws(()=>q.acknowledgeNotice(cp,{...r.notices[0],issue:99},now));
 assert.throws(()=>q.acknowledgeNotice(cp,{...r.notices[0],phase:'one_day'},now));
 assert.throws(()=>q.assessQueue(cp,7,{status:'released',scope:'ordinary_bug',reasonCode:'released'},policy(cp.entries[0].record,now,{allowRelease:true}),now));
 assert.throws(()=>q.reconcileQueue({...cp,receipts:[{issue:99,revision:'a'.repeat(64),phase:'seven_days',deliveredAt:now}]},snap([issue()],now),now));
});
test('CLI returns JSON only and malformed input errors never echo private content',()=>{
 const cli=new URL('../scripts/suggestion-queue-cli.mjs',import.meta.url).pathname;
 let r=spawnSync(process.execPath,[cli],{input:JSON.stringify({operation:'reconcile',checkpoint:q.emptyQueue(start),snapshot:snap([]),now:start}),encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).checkpoint.entries.length,0);
 r=spawnSync(process.execPath,[cli],{input:'{"SECRET_SENTINEL":bad}',encoding:'utf8'});assert.equal(r.status,1);assert.equal(r.stdout,'');assert.ok(!r.stderr.includes('SECRET_SENTINEL'));
 r=spawnSync(process.execPath,[cli],{input:' '.repeat(2_000_001),encoding:'utf8'});assert.equal(r.status,1);assert.equal(r.stdout,'');
});

test('confirmed notice delivery across threshold boundaries remains recordable',()=>{
 for(const [issued,delivered] of [['2026-11-29T23:59:59.999Z','2026-11-30T00:00:00.000Z'],['2026-11-30T23:59:59.999Z','2026-12-01T00:00:00.000Z']]){
  const r=init([issue()],issued);const cp=q.acknowledgeNotice(r.checkpoint,r.notices[0],delivered);
  assert.equal(cp.receipts[0].deliveredAt,delivered);
 }
});
test('missing issue evidence is retained but cannot trigger notices or new assessments',()=>{
 const r=init();const now='2026-11-30T00:00:00.000Z';const missing=q.reconcileQueue(r.checkpoint,snap([],now),now);
 assert.equal(missing.checkpoint.entries[0].state,'missing');assert.deepEqual(missing.notices,[]);
 assert.throws(()=>q.assessQueue(missing.checkpoint,7,{status:'in_progress',scope:'ordinary_bug',reasonCode:'feasible'},policy(missing.checkpoint.entries[0].record,now),now));
 const restored=q.reconcileQueue(missing.checkpoint,snap([issue()],now),now);
 assert.equal(restored.checkpoint.entries[0].state,'open');assert.equal(restored.notices[0].phase,'one_day');
 assert.equal(restored.checkpoint.entries[0].record.targetAt,'2026-12-01T00:00:00.000Z');
});
test('multiple confirmed deliveries crossing a threshold can each be acknowledged',()=>{
 const issued='2026-11-29T23:59:59.999Z',delivered='2026-11-30T00:00:00.000Z';
 const r=init([issue(),issue({number:8})],issued);let cp=r.checkpoint;
 for(const notice of r.notices)cp=q.acknowledgeNotice(cp,notice,delivered);
 assert.equal(cp.receipts.length,2);assert.ok(cp.receipts.every(x=>x.phase==='seven_days'));
});
