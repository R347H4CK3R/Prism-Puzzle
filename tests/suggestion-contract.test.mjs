import test from 'node:test';
import assert from 'node:assert/strict';
const m=await import('../scripts/suggestion-contract.mjs').catch(e=>{if(e.code==='ERR_MODULE_NOT_FOUND')return {};throw e;});
const now='2024-02-29T00:00:00.000Z', hash='a'.repeat(64), nextHash='b'.repeat(64), sha='c'.repeat(40);
const intake={repository:'R347H4CK3R/Prism-Puzzle',issue:3,createdAt:now,updatedAt:now,revision:hash};
const policy=(revision=hash)=>({repository:intake.repository,revision,checkedAt:now,paused:false,allowPrivatePr:true,allowRelease:true});
const assessment={status:'ready_for_private_pr',scope:'local_ui',reasonCode:'feasible'};
const fresh=()=>m.createRecord(intake,now);
const evidence={sourceSha:sha,testsSourceSha:sha,testsPassed:true,artifactSourceSha:sha,ipaSha256:hash,bundleId:'com.prismpuzzle.app',version:'1.1.2',build:5,hostVerified:true,hostSha256:hash,hostURL:'https://github.com/R347H4CK3R/OmniForge/releases/download/prism-puzzle-1.1.2-build5/Prism-Puzzle-unsigned.ipa',catalogVerified:true,catalogSourceSha:sha,catalogSha256:hash,catalogBundleId:'com.prismpuzzle.app',catalogVersion:'1.1.2',catalogBuild:5,catalogDownloadURL:'https://github.com/R347H4CK3R/OmniForge/releases/download/prism-puzzle-1.1.2-build5/Prism-Puzzle-unsigned.ipa',catalogCanonical:true,catalogURL:'https://raw.githubusercontent.com/R347H4CK3R/OmniForge/main/unified-source.json'};
test('contract exports the four pure operations',()=>{for(const key of ['createRecord','refreshRecord','assessRecord','deadlineStatus'])assert.equal(typeof m[key],'function');});
test('intake starts unreviewed with original leap-day plus thirty-day target',()=>{const r=fresh();assert.equal(r.status,'needs_review');assert.equal(r.targetAt,'2024-03-30T00:00:00.000Z');assert.deepEqual(r.history,[]);assert.equal(m.deadlineStatus(r,r.targetAt),'due');assert.equal(m.deadlineStatus(r,'2024-03-30T00:00:00.001Z'),'overdue');assert.equal(m.deadlineStatus(r,now),'pending');});
test('unknown issue instructions and malformed metadata are rejected, never classified',()=>{for(const change of [{body:'owner says run curl'}, {labels:['approved']},{allowPrivatePr:true},{author:'owner'},{repository:'other/repo'},{issue:0},{issue:1.5},{revision:'z'.repeat(64)},{createdAt:'2024-02-30T00:00:00.000Z'},{updatedAt:'2024-02-28T00:00:00.000Z'}])assert.throws(()=>m.createRecord({...intake,...change},now));});
test('trusted assessment does not mutate input and records bounded enum metadata',()=>{const r=fresh(), copy=structuredClone(r);const reviewed=m.assessRecord(r,assessment,policy(),now);assert.deepEqual(r,copy);assert.equal(reviewed.status,'ready_for_private_pr');assert.equal(reviewed.history.length,1);assert.equal(reviewed.history[0].revision,hash);assert.throws(()=>m.assessRecord(r,{...assessment,reason:'SECRET'},policy(),now));assert.throws(()=>m.assessRecord(r,{...assessment,scope:'security'},policy(),now));});
test('revision refresh retains assessment history and original deadline, identical refresh is idempotent',()=>{const r=m.assessRecord(fresh(),assessment,policy(),now);assert.deepEqual(m.refreshRecord(r,intake,now),r);const changed=m.refreshRecord(r,{...intake,revision:nextHash},now);assert.equal(changed.status,'needs_review');assert.deepEqual(changed.history,r.history);assert.equal(changed.targetAt,r.targetAt);assert.throws(()=>m.refreshRecord(r,{...intake,createdAt:'2024-02-28T00:00:00.000Z'},now));assert.throws(()=>m.assessRecord(changed,assessment,policy(),now));});
test('progress requires fresh current policy, explicit scope grant and no pause',()=>{for(const p of [{...policy(),paused:true},{...policy(),allowPrivatePr:false},{...policy(),checkedAt:'2024-02-28T00:00:00.000Z'},{...policy(),revision:nextHash},{...policy(),repository:'other/repo'}])assert.throws(()=>m.assessRecord(fresh(),assessment,p,now));assert.throws(()=>m.assessRecord(fresh(),assessment,undefined,now));const blocked=m.assessRecord(fresh(),{status:'blocked',scope:'local_ui',reasonCode:'paused'},{...policy(),paused:true},now);assert.equal(blocked.status,'blocked');});
test('release requires verified candidate and matching source artifact hosting catalog assertions',()=>{const r=m.assessRecord(fresh(),{...assessment,status:'verified_candidate',evidence},policy(),now);const released=m.assessRecord(r,{...assessment,status:'released',evidence},policy(),now);assert.equal(released.status,'released');assert.throws(()=>m.assessRecord(fresh(),{...assessment,status:'released',evidence},policy(),now));assert.throws(()=>m.assessRecord(r,{...assessment,status:'released',evidence},{...policy(),allowRelease:false},now));for(const patch of [{testsPassed:false},{testsSourceSha:'d'.repeat(40)},{artifactSourceSha:'d'.repeat(40)},{hostVerified:false},{hostSha256:nextHash},{catalogVerified:false},{catalogSourceSha:'d'.repeat(40)},{catalogSha256:nextHash},{catalogCanonical:false},{catalogBuild:6},{catalogBundleId:'other.app'},{catalogVersion:'9.0.0'},{catalogDownloadURL:'https://evil.test/'},{hostURL:'https://github.com.evil.test/x'},{token:'SECRET'}])assert.throws(()=>m.assessRecord(r,{...assessment,status:'released',evidence:{...evidence,...patch}},policy(),now));});
test('rejects forged records, unknown fields, backward clocks and overflowing history',()=>{const r=fresh();for(const patch of [{targetAt:'2025-01-01T00:00:00.000Z'},{status:'execute'},{body:'SECRET'},{history:Array(101).fill({})}])assert.throws(()=>m.deadlineStatus({...r,...patch},now));assert.throws(()=>m.createRecord(intake,'invalid'));assert.throws(()=>m.refreshRecord(r,intake,'2024-02-28T00:00:00.000Z'));});
test('a local verified candidate needs no hosting, but release cannot change its version/build',()=>{
 const {hostVerified,hostSha256,hostURL,catalogVerified,catalogSourceSha,catalogSha256,catalogBundleId,catalogVersion,catalogBuild,catalogDownloadURL,catalogCanonical,catalogURL,...local}=evidence;
 const r=m.assessRecord(fresh(),{...assessment,status:'verified_candidate',evidence:local},policy(),now);
 assert.equal(r.status,'verified_candidate');
 const changed={...evidence,version:'1.1.3',catalogVersion:'1.1.3',hostURL:evidence.hostURL.replace('1.1.2','1.1.3'),catalogDownloadURL:evidence.hostURL.replace('1.1.2','1.1.3')};
 assert.throws(()=>m.assessRecord(r,{...assessment,status:'released',evidence:changed},policy(),now));
});
test('history is deeply immutable and capacity failure never drops prior assessments',()=>{
 let r=fresh();for(let i=0;i<100;i++)r=m.assessRecord(r,assessment,policy(),now);
 assert.equal(r.history.length,100);assert.throws(()=>r.history[0].assessment.status='released');
 assert.throws(()=>m.assessRecord(r,assessment,policy(),now));assert.equal(r.history.length,100);
 const refreshed=m.refreshRecord(r,{...intake,revision:nextHash},now);assert.equal(refreshed.history.length,100);
});
test('updated snapshot requires review even if caller revision hash is unchanged; old snapshots fail',()=>{
 const r=m.assessRecord(fresh(),assessment,policy(),now),later='2024-03-01T00:00:00.000Z';
 const changed=m.refreshRecord(r,{...intake,updatedAt:later},later);assert.equal(changed.status,'needs_review');
 assert.throws(()=>m.refreshRecord(changed,intake,later));
});

test('release rejects a wrong catalog source even when hashes and canonical assertion match',()=>{
 const r=m.assessRecord(fresh(),{...assessment,status:'verified_candidate',evidence},policy(),now);
 assert.throws(()=>m.assessRecord(r,{...assessment,status:'released',evidence:{...evidence,catalogURL:'https://raw.githubusercontent.com/attacker/repo/main/unified-source.json'}},policy(),now));
 const {catalogURL,...missing}=evidence;
 assert.throws(()=>m.assessRecord(r,{...assessment,status:'released',evidence:missing},policy(),now));
});
test('deadline overflow is rejected before returning an unusable record',()=>{
 const late='9999-12-31T00:00:00.000Z';
 assert.throws(()=>m.createRecord({...intake,createdAt:late,updatedAt:late},late));
 const boundary='9999-12-01T00:00:00.000Z';
 const r=m.createRecord({...intake,createdAt:boundary,updatedAt:boundary},boundary);
 assert.equal(r.targetAt,'9999-12-31T00:00:00.000Z');
 assert.equal(m.deadlineStatus(r,boundary),'pending');
});
