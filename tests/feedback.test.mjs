import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareFeedback,feedbackHandoff,wireFeedback} from '../web/feedback.mjs';
const input={kind:'addition',title:'  Better offline help  ',details:'  Explain the controls without a connection.  '};
test('routes a reviewed suggestion only to the app private repository',()=>{
 const draft=prepareFeedback(input);
 const url=new URL(feedbackHandoff(draft,true).url);
 assert.equal(url.origin,'https://github.com');
 assert.equal(url.pathname,'/R347H4CK3R/Prism-Puzzle/issues/new');
 assert.equal(url.searchParams.get('title'),'[Suggestion: addition] Better offline help');
 assert.match(url.searchParams.get('body'),/Explain the controls without a connection\./);
 assert.equal(url.username,'');assert.equal(url.password,'');
});
test('does not include unexpected app state or caller routing instructions',()=>{
 const draft=prepareFeedback({...input,repository:'attacker/repo',logs:'SECRET_LOG',savedData:'SAVED_PRIVATE_DATA'});
 assert.ok(!draft.text.includes('SECRET_LOG'));assert.ok(!draft.text.includes('SAVED_PRIVATE_DATA'));
 assert.ok(!draft.text.includes('attacker/repo'));
 assert.match(draft.text,/R347H4CK3R\/Prism-Puzzle/);
});
test('requires explicit review and rejects a modified prepared draft',()=>{
 const draft=prepareFeedback(input);
 assert.throws(()=>feedbackHandoff(draft,false),/review/i);
 assert.throws(()=>feedbackHandoff({...draft,text:'changed'},true),/prepare|changed/i);
 assert.throws(()=>feedbackHandoff({...draft,url:'https://evil.test/'},true),/prepare|changed/i);
});
test('supports additions removals and bugs without automatic implementation promises',()=>{
 for(const kind of ['addition','removal','bug']){
  const draft=prepareFeedback({...input,kind});
  assert.match(draft.text,/untrusted|review/i);
  assert.equal(new URL(feedbackHandoff(draft,true).url).searchParams.get('labels'),null);
 }
 assert.throws(()=>prepareFeedback({...input,kind:'execute-command'}),/type/i);
});
test('rejects empty malformed and oversized text without truncating it',()=>{
 for(const change of [{title:''},{details:' '},{title:23},{details:null},{title:'x'.repeat(121)},{details:'x'.repeat(6001)},{title:'bad\nline'},{details:'bad\u0000text'}]) assert.throws(()=>prepareFeedback({...input,...change}));
 assert.equal(prepareFeedback({...input,title:'x'.repeat(120),details:'y'.repeat(6000)}).details.length,6000);
});
test('long Unicode suggestions keep a local draft and never emit an oversized URL',()=>{
 const draft=prepareFeedback({...input,details:'界'.repeat(1800)});
 assert.ok(draft.text.includes('界'.repeat(1800)));
 const handoff=feedbackHandoff(draft,true);
 assert.equal(handoff.url,'https://github.com/R347H4CK3R/Prism-Puzzle/issues/new');assert.equal(handoff.needsPaste,true);
});
test('encodes query-shaped text as content not extra GitHub parameters',()=>{
 const draft=prepareFeedback({...input,title:'Safe & assignees=someone # title',details:'?labels=run-now&body=replace'});
 const url=new URL(feedbackHandoff(draft,true).url);
 assert.deepEqual([...url.searchParams.keys()],['title','body']);
 assert.match(url.searchParams.get('body'),/\?labels=run-now&body=replace/);
});

function formFixture(){
 const selections=[];
 const nodes={kind:{name:'kind',value:'addition'},title:{name:'title',value:'Offline guide'},details:{name:'details',value:'Explain the controls.'},reviewed:{name:'reviewed',checked:false},error:{textContent:''},preview:{value:'',focus(){selections.push('focus');},select(){selections.push('select');},setSelectionRange(start,end){selections.push([start,end]);}},result:{hidden:true},copy:{disabled:true},status:{textContent:''}};
 const form={querySelector(selector){const key=selector.match(/name="([^" ]+)"/)?.[1]||selector.match(/data-feedback-([^\]]+)/)?.[1];return nodes[key];}};
 wireFeedback(form);
 return {nodes,form,selections,prepare(){form.onsubmit({preventDefault(){}});},review(){nodes.reviewed.checked=true;nodes.reviewed.onchange();}};
}
test('preparation and review stay local and only explicit copy selection selects the draft',()=>{
 const f=formFixture();f.prepare();assert.equal(f.nodes.result.hidden,false);assert.equal(f.selections.length,0);assert.equal(f.nodes.copy.disabled,true);
 f.nodes.copy.onclick();assert.equal(f.selections.length,0);assert.match(f.nodes.error.textContent,/review/i);
 f.review();assert.equal(f.selections.length,0);f.nodes.copy.onclick();assert.deepEqual(f.selections,['focus','select',[0,f.nodes.preview.value.length]]);assert.match(f.nodes.status.textContent,/select|Copy/i);
});
test('editing a prepared suggestion invalidates approval and prevents stale copy selection',()=>{
 const f=formFixture();f.prepare();f.review();f.nodes.details.value='Changed suggestion';f.form.oninput({target:f.nodes.details});
 assert.equal(f.nodes.reviewed.checked,false);assert.equal(f.nodes.copy.disabled,true);assert.equal(f.nodes.result.hidden,true);
 f.nodes.copy.onclick();assert.equal(f.selections.length,0);f.prepare();f.review();f.nodes.copy.onclick();assert.match(f.nodes.preview.value,/Changed suggestion/);
});
test('draft preview treats markup as text and selection failure shows a manual copy instruction',()=>{
 const f=formFixture();f.nodes.details.value='<script>secret()</script>';f.prepare();f.review();
 assert.match(f.nodes.preview.value,/<script>secret\(\)<\/script>/);assert.equal(f.nodes.preview.innerHTML,undefined);
 f.nodes.preview.select=()=>{throw Error('unavailable');};f.nodes.copy.onclick();assert.match(f.nodes.error.textContent,/press|select|copy/i);
});
