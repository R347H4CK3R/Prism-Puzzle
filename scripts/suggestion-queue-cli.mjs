// No files, network, shell commands or external actions. Input is data, never authority.
import {emptyQueue,reconcileQueue,assessQueue,acknowledgeNotice} from './suggestion-queue.mjs';
try{
 let bytes=0;const chunks=[];for await(const chunk of process.stdin){bytes+=chunk.length;if(bytes>2_000_000)throw new Error();chunks.push(chunk);}
 const input=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 const fields={empty:['operation','now'],reconcile:['operation','checkpoint','snapshot','now'],assess:['operation','checkpoint','issue','assessment','policy','now'],ack:['operation','checkpoint','notice','now']}[input?.operation];
 if(!fields||Object.keys(input).length!==fields.length||!fields.every(k=>Object.hasOwn(input,k)))throw new Error();
 const result=input.operation==='empty'?emptyQueue(input.now):input.operation==='reconcile'?reconcileQueue(input.checkpoint,input.snapshot,input.now):input.operation==='assess'?assessQueue(input.checkpoint,input.issue,input.assessment,input.policy,input.now):acknowledgeNotice(input.checkpoint,input.notice,input.now);
 process.stdout.write(JSON.stringify(result,null,2)+'\n');
}catch{process.stderr.write('Queue input rejected; no checkpoint or external action was written.\n');process.exitCode=1;}
