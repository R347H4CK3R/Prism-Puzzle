// Offline bookkeeping only. Caller verifies connector completeness, owner policy and actual delivery.
import {createHash} from 'node:crypto';
import {createRecord,refreshRecord,assessRecord} from './suggestion-contract.mjs';
const repository='R347H4CK3R/Prism-Puzzle',DAY=86400000;
const phases=['seven_days','one_day','overdue'];
function need(x){if(!x)throw new Error('Invalid or incomplete queue metadata');}
function shape(x,keys){
 need(x&&typeof x==='object'&&!Array.isArray(x));need([Object.prototype,null].includes(Object.getPrototypeOf(x)));
 need(Reflect.ownKeys(x).length===keys.length&&keys.every(k=>Object.hasOwn(x,k)));
 for(const k of keys)need(!Object.getOwnPropertyDescriptor(x,k).get&&!Object.getOwnPropertyDescriptor(x,k).set);
}
function time(x){need(typeof x==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(x));const n=Date.parse(x);need(Number.isFinite(n)&&new Date(n).toISOString()===x);return n;}
function integer(x){need(Number.isSafeInteger(x)&&x>0);}
function list(x,max){need(Array.isArray(x)&&x.length<=max);}
function digest(x){need(typeof x==='string'&&/^[0-9a-f]{64}$/.test(x));}
function text(x,max){need(typeof x==='string'&&x.length<=max);}
function frozen(x){const c=structuredClone(x);const f=v=>{if(v&&typeof v==='object'){Object.values(v).forEach(f);Object.freeze(v);}return v;};return f(c);}
function intake(r){return Object.fromEntries(['repository','issue','createdAt','updatedAt','revision'].map(k=>[k,r[k]]));}
function receiptKey(r){return `${r.issue}:${r.revision}:${r.phase}`;}
function queueCheck(q,now){
 shape(q,['schema','repository','lastCheckedAt','entries','receipts']);need(q.schema===1&&q.repository===repository);need(time(q.lastCheckedAt)<=time(now));list(q.entries,500);list(q.receipts,5000);
 const ids=new Set();for(const e of q.entries){shape(e,['record','state']);need(['open','closed','missing'].includes(e.state));refreshRecord(e.record,intake(e.record),q.lastCheckedAt);need(!ids.has(e.record.issue));ids.add(e.record.issue);}
 const keys=new Set();for(const r of q.receipts){shape(r,['issue','revision','phase','deliveredAt']);integer(r.issue);digest(r.revision);need(ids.has(r.issue)&&phases.includes(r.phase));const at=time(r.deliveredAt);need(at<=time(q.lastCheckedAt)&&at>=time(q.entries.find(e=>e.record.issue===r.issue).record.createdAt));need(!keys.has(receiptKey(r)));keys.add(receiptKey(r));}
}
function issueIntake(i,now){
 shape(i,['number','createdAt','updatedAt','state','title','body','commentCount','comments']);integer(i.number);need(['open','closed'].includes(i.state));text(i.title,1000);text(i.body,100000);need(time(i.createdAt)<=time(i.updatedAt)&&time(i.updatedAt)<=time(now));
 list(i.comments,1000);need(Number.isSafeInteger(i.commentCount)&&i.commentCount===i.comments.length);const ids=new Set();
 for(const c of i.comments){shape(c,['id','createdAt','updatedAt','body']);integer(c.id);need(!ids.has(c.id));ids.add(c.id);text(c.body,100000);need(time(c.createdAt)>=time(i.createdAt)&&time(c.createdAt)<=time(c.updatedAt)&&time(c.updatedAt)<=time(now));}
 // Explicit fields and stable comment ordering, never incoming object key ordering or claimed authority.
 const data=[i.number,i.createdAt,i.updatedAt,i.state,i.title,i.body,[...i.comments].sort((a,b)=>a.id-b.id).map(c=>[c.id,c.createdAt,c.updatedAt,c.body])];
 return {repository,issue:i.number,createdAt:i.createdAt,updatedAt:i.updatedAt,revision:createHash('sha256').update(JSON.stringify(data)).digest('hex')};
}
function noticesFor(q,now){
 const receipts=new Set(q.receipts.map(receiptKey));const notices=[];
 for(const {record:r,state} of q.entries){
  if(state!=='open'||['released','declined'].includes(r.status))continue;
  const left=time(r.targetAt)-time(now);const phase=left<=0?'overdue':left<=DAY?'one_day':left<=7*DAY?'seven_days':null;
  if(phase){const n={issue:r.issue,revision:r.revision,phase,targetAt:r.targetAt};if(!receipts.has(receiptKey(n)))notices.push(n);}
 }
 return notices;
}
export function emptyQueue(now){time(now);return frozen({schema:1,repository,lastCheckedAt:now,entries:[],receipts:[]});}
export function reconcileQueue(checkpoint,snapshot,now){
 queueCheck(checkpoint,now);shape(snapshot,['repository','complete','fetchedAt','issues']);need(snapshot.repository===repository&&snapshot.complete===true);need(time(snapshot.fetchedAt)>=time(checkpoint.lastCheckedAt)&&time(snapshot.fetchedAt)<=time(now));list(snapshot.issues,500);
 const entries=new Map(checkpoint.entries.map(e=>[e.record.issue,structuredClone(e)])),seen=new Set();
 for(const i of snapshot.issues){const data=issueIntake(i,snapshot.fetchedAt);need(!seen.has(i.number));seen.add(i.number);const prior=entries.get(i.number);entries.set(i.number,{record:prior?refreshRecord(prior.record,data,now):createRecord(data,now),state:i.state});}
 for(const [id,entry] of entries)if(!seen.has(id))entries.set(id,{...entry,state:'missing'});
 need(entries.size<=500);const next={...checkpoint,lastCheckedAt:now,entries:[...entries.values()].sort((a,b)=>a.record.issue-b.record.issue)};
 queueCheck(next,now);
 return frozen({checkpoint:next,reviewIssues:next.entries.filter(e=>e.state!=='missing'&&e.record.status==='needs_review').map(e=>e.record.issue),missingIssues:checkpoint.entries.filter(e=>!seen.has(e.record.issue)).map(e=>e.record.issue),notices:noticesFor(next,now)});
}
export function assessQueue(checkpoint,issue,assessment,policy,now){
 queueCheck(checkpoint,now);integer(issue);need(checkpoint.entries.some(e=>e.record.issue===issue&&e.state!=='missing'));
 const next={...checkpoint,lastCheckedAt:now,entries:checkpoint.entries.map(e=>e.record.issue===issue?{...e,record:assessRecord(e.record,assessment,policy,now)}:e)};queueCheck(next,now);return frozen(next);
}
export function acknowledgeNotice(checkpoint,notice,now){
 queueCheck(checkpoint,now);shape(notice,['issue','revision','phase','targetAt']);const entry=checkpoint.entries.find(e=>e.record.issue===notice.issue);
 need(entry&&entry.state==='open'&&!['released','declined'].includes(entry.record.status));
 need(entry.record.revision===notice.revision&&entry.record.targetAt===notice.targetAt&&phases.includes(notice.phase));
 const threshold=time(notice.targetAt)-({seven_days:7*DAY,one_day:DAY,overdue:0}[notice.phase]);
 need(time(now)>=threshold&&!checkpoint.receipts.some(r=>receiptKey(r)===receiptKey(notice)));need(checkpoint.receipts.length<5000);
 const next={...checkpoint,lastCheckedAt:now,receipts:[...checkpoint.receipts,{issue:notice.issue,revision:notice.revision,phase:notice.phase,deliveredAt:now}]};queueCheck(next,now);return frozen(next);
}
