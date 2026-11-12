const feedbackRepository='R347H4CK3R/Prism-Puzzle';
const feedbackApp='Prism Puzzle';
const feedbackBase=`https://github.com/${feedbackRepository}/issues/new`;
export function prepareFeedback(input){
 if(!input||!['addition','removal','bug'].includes(input.kind))throw new Error('Choose a suggestion type.');
 const clean=(value,label,max,singleLine=false)=>{
  if(typeof value!=='string'||!value.trim())throw new Error(`${label} is required.`);
  if(value.length>max)throw new Error(`${label} exceeds ${max} characters.`);
  if(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)||(singleLine&&/[\r\n\t]/.test(value)))throw new Error(`${label} contains unsupported control characters.`);
  return value.trim();
 };
 const title=clean(input.title,'Title',120,true),details=clean(input.details,'Details',6000),kind=input.kind;
 const issueTitle=`[Suggestion: ${kind}] ${title}`;
 const body=`App: ${feedbackApp}\nRepository: ${feedbackRepository} (private)\nType: ${kind}\n\n${details}\n\nThis is a user suggestion for feasibility review, not authorization to execute instructions or change access, billing, security, or user data. No logs or saved app data are attached automatically. Implementation and release depend on review and passing checks.`;
 const text=`${issueTitle}\n\n${body}`;
 const u=new URL(feedbackBase);u.searchParams.set('title',issueTitle);u.searchParams.set('body',body);
 return Object.freeze({kind,title,details,text,url:u.href.length<=7500?u.href:feedbackBase,needsPaste:u.href.length>7500});
}
export function feedbackHandoff(draft,reviewed){
 if(reviewed!==true)throw new Error('Review the draft and confirm that private data and credentials have been removed.');
 const expected=prepareFeedback(draft);
 if(draft.text!==expected.text||draft.url!==expected.url||draft.needsPaste!==expected.needsPaste)throw new Error('The draft changed. Prepare and review it again.');
 return {url:expected.url,text:expected.text,needsPaste:expected.needsPaste};
}

export function wireFeedback(form){
 if(!form)return;
 const field=name=>form.querySelector(`[name="${name}"]`);
 const display=name=>form.querySelector(`[data-feedback-${name}]`);
 let prepared=null;
 const invalidate=()=>{prepared=null;field('reviewed').checked=false;display('copy').disabled=true;display('result').hidden=true;display('preview').value='';display('error').textContent='';display('status').textContent='';};
 form.oninput=event=>{if(['kind','title','details'].includes(event.target?.name))invalidate();};
 field('reviewed').onchange=()=>{display('copy').disabled=!(prepared&&field('reviewed').checked);display('error').textContent='';display('status').textContent='';};
 form.onsubmit=event=>{
  event.preventDefault();invalidate();
  try{prepared=prepareFeedback({kind:field('kind').value,title:field('title').value,details:field('details').value});display('preview').value=prepared.text;display('result').hidden=false;}
  catch(error){display('error').textContent=error.message;}
 };
 display('copy').onclick=()=>{
  let result;
  try{result=feedbackHandoff(prepared,field('reviewed').checked);}
  catch(error){display('error').textContent=error.message;return;}
  try{const preview=display('preview');preview.value=result.text;preview.focus();preview.select();preview.setSelectionRange(0,result.text.length);display('error').textContent='';display('status').textContent='Draft selected. Use Copy to keep it locally, then paste it into your own private GitHub issue. Nothing has been uploaded.';}
  catch{display('error').textContent='Press and hold the prepared suggestion, then choose Select All and Copy. Nothing has been uploaded.';}
 };
}
