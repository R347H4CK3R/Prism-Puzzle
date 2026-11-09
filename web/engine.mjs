export const faces={U:[1,1],D:[1,-1],R:[0,1],L:[0,-1],F:[2,1],B:[2,-1]};
const rotate=(p,a,d)=>{let q=[...p],b=(a+1)%3,c=(a+2)%3;q[b]=-d*p[c];q[c]=d*p[b];return q.map(v=>v===0?0:v);};
export class Cube {
 constructor(history=[]){this.stickers=[];this.history=[];for(const [f,[a,s]] of Object.entries(faces))for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const p=[0,0,0],n=[0,0,0];p[a]=s;p[(a+1)%3]=i;p[(a+2)%3]=j;n[a]=s;this.stickers.push({p,n,color:f});}for(const [f,d] of history)this.turn(f,d);}
 turn(f,d=1,record=true){if(!faces[f]||![1,-1].includes(d))throw Error('Invalid turn');const[a,s]=faces[f];for(const t of this.stickers)if(t.p[a]===s){t.p=rotate(t.p,a,-s*d);t.n=rotate(t.n,a,-s*d);}if(record){const prev=this.history[this.history.length-1];if(prev&&prev[0]===f&&prev[1]===-d)this.history.pop();else this.history.push([f,d]);}if(this.solved&&!this.preserveSolvedHistory)this.history=[];}
 get solved(){return Object.values(faces).every(([a,s])=>new Set(this.stickers.filter(t=>t.n[a]===s).map(t=>t.color)).size===1);}
 scramble(n=24){for(let i=0;i<n;i++)this.turn(Object.keys(faces)[Math.floor(Math.random()*6)],Math.random()<.5?1:-1);if(this.solved)this.turn('R');}
 hint(){const m=this.history.pop();if(!m)return null;this.turn(m[0],-m[1],false);return[m[0],-m[1]];}
}
export class Lights {
 constructor(){this.cells=Array(25).fill(false);this.pending=new Set();}
 toggle(i){if(!Number.isInteger(i)||i<0||i>=25)return false;for(const j of [i,i%5?i-1:-1,i%5<4?i+1:-1,i-5,i+5])if(j>=0&&j<25)this.cells[j]=!this.cells[j];if(this.pending.has(i))this.pending.delete(i);else this.pending.add(i);return true;}
 get solved(){return this.cells.every(x=>!x);}
 scramble(){for(let i=0;i<25;i++)if(Math.random()<.5)this.toggle(i);if(this.solved)this.toggle(12);}
 hint(){if(this.solved)return null;const i=this.pending.values().next().value;if(i===undefined)return null;this.toggle(i);return i;}
}
export class Slide {
 constructor(size=3){this.size=size;this.cells=Array.from({length:size*size},(_,i)=>(i+1)%(size*size));this.history=[];}
 move(i,record=true){const z=this.cells.indexOf(0),n=this.size;if(!Number.isInteger(i)||i<0||i>=n*n||Math.abs(i%n-z%n)+Math.abs(Math.floor(i/n)-Math.floor(z/n))!==1)return false;[this.cells[i],this.cells[z]]=[this.cells[z],this.cells[i]];if(record){if(this.history[this.history.length-1]===i)this.history.pop();else this.history.push(z);}if(this.solved)this.history=[];return true;}
 get solved(){return this.cells.every((v,i)=>v===(i+1)%this.cells.length);}
 scramble(n=50){for(let k=0;k<n;k++){const z=this.cells.indexOf(0),w=this.size,valid=[z-w,z+w,z%w?z-1:-1,z%w<w-1?z+1:-1].filter(i=>i>=0&&i<w*w&&i!==this.history[this.history.length-1]);this.move(valid[Math.floor(Math.random()*valid.length)]);}if(this.solved)this.move(this.cells.length-2);}
 hint(){const i=this.history.pop();if(i===undefined)return null;this.move(i,false);return i;}
}
export class PocketCube extends Cube {
 get preserveSolvedHistory(){return true;}
 hint(){return this.solved?null:super.hint();}
 constructor(history=[]){super();this.stickers=this.stickers.filter(t=>t.p.every(v=>v!==0));for(const[f,d]of history)this.turn(f,d);}
}
export class Slide15 extends Slide {constructor(){super(4);}}
export class Hanoi {
 constructor(saved=null){this.rods=saved?JSON.parse(JSON.stringify(saved)):[[4,3,2,1],[],[]];if(!Array.isArray(this.rods)||this.rods.length!==3||this.rods.some(r=>!Array.isArray(r)||r.some((d,i)=>!Number.isInteger(d)||d<1||d>4||(i&&r[i-1]<d)))||this.rods.flat().slice().sort().join(',')!=='1,2,3,4')throw Error('Invalid tower save');}
 move(from,to){if(!Number.isInteger(from)||!Number.isInteger(to)||from<0||from>2||to<0||to>2||from===to)return false;const a=this.rods[from],b=this.rods[to],disk=a[a.length-1];if(!disk||(b.length&&b[b.length-1]<disk))return false;b.push(a.pop());return true;}
 get solved(){return this.rods[2].length===4;}
 scramble(){this.rods=[[4,3,2,1],[],[]];}
 hint(){if(this.solved)return null;const start=Array(4);this.rods.forEach((r,i)=>r.forEach(d=>start[d-1]=i));const key=p=>p.join('');const queue=[[start,[]]],seen=new Set([key(start)]);for(let h=0;h<queue.length;h++){const[p,path]=queue[h];if(p.every(x=>x===2)){const m=path[0];this.move(...m);return m;}const top=[0,0,0];p.forEach((rod,d)=>{if(!top[rod])top[rod]=d+1;});for(let a=0;a<3;a++)for(let b=0;b<3;b++)if(a!==b&&top[a]&&(!top[b]||top[a]<top[b])){const q=[...p];q[top[a]-1]=b;const k=key(q);if(!seen.has(k)){seen.add(k);queue.push([q,[...path,[a,b]]]);}}}throw Error('Unreachable tower state');}
}
const normalize=cells=>{const x=Math.min(...cells.map(p=>p[0])),y=Math.min(...cells.map(p=>p[1]));return cells.map(([a,b])=>[a-x,b-y]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]);};
export class Bricks {
 constructor(level=0,saved=null){this.level=((level%3)+3)%3;this.width=this.level===1?5:4;this.height=this.level===2?5:4;this.pieces=[[[0,0],[1,0],[2,0],[3,0]],[[0,0],[0,1],[0,2],[1,2]],[[0,0],[1,0],[2,0],[0,1]],[[0,0],[1,0],[0,1],[1,1]]];if(this.level)this.pieces.push([[0,0],[1,0],[2,0],[3,0]]);this.placements=this.pieces.map(()=>null);this.options=this.pieces.map((_,i)=>{const options=[],seen=new Set();for(let r=0;r<4;r++){const cells=this.shape(i,r),k=JSON.stringify(cells);if(seen.has(k))continue;seen.add(k);for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++){const mask=this.mask(i,x,y,r);if(mask!==null)options.push({x,y,r,mask});}}return options;});if(saved){if(!Array.isArray(saved)||saved.length!==this.pieces.length)throw Error('Invalid brick save');saved.forEach((p,i)=>{if(p&&!this.place(i,p.x,p.y,p.r))throw Error('Invalid brick placement');});}}
 shape(i,r=0){if(!Number.isInteger(i)||!this.pieces[i]||!Number.isInteger(r)||r<0||r>3)return [];let c=this.pieces[i].map(p=>[...p]);for(let k=0;k<r;k++)c=c.map(([x,y])=>[-y,x]);return normalize(c);}
 mask(i,x,y,r){if(!Number.isInteger(x)||!Number.isInteger(y))return null;const cells=this.shape(i,r);if(!cells.length||cells.some(([a,b])=>a+x<0||b+y<0||a+x>=this.width||b+y>=this.height))return null;return cells.reduce((m,[a,b])=>m|(1<<((b+y)*this.width+a+x)),0);}
 place(i,x,y,r=0){const mask=this.mask(i,x,y,r);if(mask===null)return false;for(let j=0;j<this.placements.length;j++){const p=this.placements[j];if(j!==i&&p&&(mask&this.mask(j,p.x,p.y,p.r)))return false;}this.placements[i]={x,y,r};return true;}
 remove(i){if(!Number.isInteger(i)||i<0||i>=this.pieces.length)return false;this.placements[i]=null;return true;}
 get solved(){return this.placements.every(Boolean);}
 solution(){const result=this.placements.map(p=>p?{...p}:null);let used=0;result.forEach((p,i)=>{if(p)used|=this.mask(i,p.x,p.y,p.r);});const search=mask=>{let chosen=-1,choices=null;for(let i=0;i<result.length;i++)if(!result[i]){const possible=this.options[i].filter(p=>!(mask&p.mask));if(!possible.length)return false;if(!choices||possible.length<choices.length){chosen=i;choices=possible;}}if(chosen<0)return true;for(const p of choices){result[chosen]={x:p.x,y:p.y,r:p.r};if(search(mask|p.mask))return true;}result[chosen]=null;return false;};return search(used)?result:null;}
 hint(){if(this.solved)return null;const solved=this.solution();if(solved){const i=this.placements.findIndex(p=>!p);this.place(i,solved[i].x,solved[i].y,solved[i].r);return{type:'place',piece:i,...solved[i]};}const i=this.placements.map(Boolean).lastIndexOf(true);this.remove(i);return{type:'remove',piece:i};}
 scramble(){this.placements=this.pieces.map(()=>null);}
}
