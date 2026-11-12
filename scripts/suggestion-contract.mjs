// Pure metadata bookkeeping. Callers authenticate policy/reviewer inputs; this is not an authorization service.
const REPOSITORY='R347H4CK3R/Prism-Puzzle';
const DAY=86400000;
const statuses=['needs_review','needs_information','needs_approval','declined','ready_for_private_pr','in_progress','blocked','verified_candidate','released'];
const scopes=['local_ui','docs','ordinary_bug','requires_approval'];
const reasons=['feasible','information_missing','approval_required','out_of_scope','paused','checks_pending','checks_passed','released','blocked'];
const progresses=['ready_for_private_pr','in_progress','verified_candidate','released'];
const intakeKeys=['repository','issue','createdAt','updatedAt','revision'];
function requireThat(condition,message='Invalid suggestion metadata'){if(!condition)throw new Error(message);}
function shape(value,required,optional=[]){
 requireThat(value!==null&&typeof value==='object'&&!Array.isArray(value));
 requireThat(Object.getPrototypeOf(value)===Object.prototype||Object.getPrototypeOf(value)===null);
 requireThat(required.every(k=>Object.hasOwn(value,k)));
 requireThat(Reflect.ownKeys(value).every(k=>typeof k==='string'&&[...required,...optional].includes(k)));
 for(const key of Object.keys(value))requireThat(Object.getOwnPropertyDescriptor(value,key).get===undefined);
}
function timestamp(value){requireThat(typeof value==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value));const n=Date.parse(value);requireThat(Number.isFinite(n)&&new Date(n).toISOString()===value);return n;}
function digest(value,length){requireThat(typeof value==='string'&&new RegExp(`^[0-9a-f]{${length}}$`).test(value));}
function intakeCheck(value){
 shape(value,intakeKeys);requireThat(value.repository===REPOSITORY);requireThat(Number.isSafeInteger(value.issue)&&value.issue>0);
 requireThat(timestamp(value.updatedAt)>=timestamp(value.createdAt));digest(value.revision,64);
}
function frozenCopy(value){const copy=structuredClone(value);const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};return freeze(copy);}
const baseEvidence=['sourceSha','testsSourceSha','testsPassed','artifactSourceSha','ipaSha256','bundleId','version','build'];
const releaseEvidence=['hostVerified','hostSha256','hostURL','catalogVerified','catalogSourceSha','catalogSha256','catalogBundleId','catalogVersion','catalogBuild','catalogDownloadURL','catalogCanonical','catalogURL'];
function evidenceCheck(e,released){
 shape(e,baseEvidence,releaseEvidence);
 // Release evidence is all required at the release gate.
 if(released)shape(e,[...baseEvidence,...releaseEvidence]);
 digest(e.sourceSha,40);requireThat(e.testsSourceSha===e.sourceSha&&e.artifactSourceSha===e.sourceSha&&e.testsPassed===true);
 digest(e.ipaSha256,64);requireThat(e.bundleId==='com.prismpuzzle.app');requireThat(typeof e.version==='string'&&/^\d{1,4}\.\d{1,4}\.\d{1,4}$/.test(e.version));requireThat(Number.isSafeInteger(e.build)&&e.build>0);
 if(released||releaseEvidence.some(k=>Object.hasOwn(e,k))){
  shape(e,[...baseEvidence,...releaseEvidence]);
  const url=`https://github.com/R347H4CK3R/OmniForge/releases/download/prism-puzzle-${e.version}-build${e.build}/Prism-Puzzle-unsigned.ipa`;
  requireThat(e.hostVerified===true&&e.catalogVerified===true&&e.catalogCanonical===true);
  requireThat(e.catalogURL==='https://raw.githubusercontent.com/R347H4CK3R/OmniForge/main/unified-source.json','Wrong canonical catalog source');
  requireThat(e.hostURL===url&&e.catalogDownloadURL===url&&e.hostSha256===e.ipaSha256&&e.catalogSha256===e.ipaSha256);
  requireThat(e.catalogSourceSha===e.sourceSha&&e.catalogBundleId===e.bundleId&&e.catalogVersion===e.version&&e.catalogBuild===e.build);
 }
}
function assessmentCheck(a){
 shape(a,['status','scope','reasonCode'],['evidence']);
 requireThat(statuses.includes(a.status)&&a.status!=='needs_review'&&scopes.includes(a.scope)&&reasons.includes(a.reasonCode));
 if(progresses.includes(a.status))requireThat(a.scope!=='requires_approval');
 if(['verified_candidate','released'].includes(a.status))evidenceCheck(a.evidence,a.status==='released');
 else requireThat(!Object.hasOwn(a,'evidence'));
}
function recordCheck(r){
 shape(r,[...intakeKeys,'targetAt','status','history']);intakeCheck(Object.fromEntries(intakeKeys.map(k=>[k,r[k]])));
 requireThat(timestamp(r.targetAt)===timestamp(r.createdAt)+30*DAY);requireThat(statuses.includes(r.status));
 requireThat(Array.isArray(r.history)&&r.history.length<=100,'History capacity exceeded; archive through trusted review, never discard silently');
 let previous=timestamp(r.createdAt);
 for(const entry of r.history){
  shape(entry,['revision','at','assessment']);digest(entry.revision,64);const at=timestamp(entry.at);requireThat(at>=previous);previous=at;assessmentCheck(entry.assessment);
 }
 if(r.status!=='needs_review'){const last=r.history.at(-1);requireThat(last&&last.revision===r.revision&&last.assessment.status===r.status);}
}
function clockCheck(r,now){const time=timestamp(now);requireThat(time>=timestamp(r.updatedAt)&&time>=timestamp(r.history.at(-1)?.at??r.createdAt),'Clock precedes known evidence');return time;}
export function createRecord(intake,now){
 intakeCheck(intake);requireThat(timestamp(now)>=timestamp(intake.updatedAt));
 const targetAt=new Date(timestamp(intake.createdAt)+30*DAY).toISOString();
 timestamp(targetAt); // Fail before returning a target outside the supported canonical year range.
 return frozenCopy({...intake,targetAt,status:'needs_review',history:[]});
}
export function refreshRecord(record,intake,now){
 recordCheck(record);intakeCheck(intake);clockCheck(record,now);requireThat(timestamp(now)>=timestamp(intake.updatedAt));
 requireThat(record.repository===intake.repository&&record.issue===intake.issue&&record.createdAt===intake.createdAt);
 requireThat(timestamp(intake.updatedAt)>=timestamp(record.updatedAt),'Stale issue snapshot');
 const changed=record.revision!==intake.revision||record.updatedAt!==intake.updatedAt;
 return frozenCopy({...record,...intake,status:changed?'needs_review':record.status});
}
export function assessRecord(record,assessment,policy,now){
 recordCheck(record);clockCheck(record,now);assessmentCheck(assessment);
 shape(policy,['repository','revision','checkedAt','paused','allowPrivatePr','allowRelease']);
 requireThat(policy.repository===REPOSITORY&&policy.revision===record.revision&&policy.checkedAt===now,'Fresh trusted policy for this revision required');
 for(const key of ['paused','allowPrivatePr','allowRelease'])requireThat(typeof policy[key]==='boolean');
 if(progresses.includes(assessment.status))requireThat(!policy.paused&&policy.allowPrivatePr,'Current policy blocks progress');
 if(assessment.status==='released'){
  requireThat(policy.allowRelease&&record.status==='verified_candidate','Release requires authorized verified candidate');
  const candidate=record.history.at(-1).assessment.evidence;
  requireThat(baseEvidence.every(key=>candidate[key]===assessment.evidence[key]),'Release differs from verified candidate');
 }
 requireThat(record.history.length<100,'History capacity exceeded; trusted archival required');
 return frozenCopy({...record,status:assessment.status,history:[...record.history,{revision:record.revision,at:now,assessment}]});
}
export function deadlineStatus(record,now){
 recordCheck(record);const time=clockCheck(record,now),target=timestamp(record.targetAt);
 return time<target?'pending':time===target?'due':'overdue';
}
