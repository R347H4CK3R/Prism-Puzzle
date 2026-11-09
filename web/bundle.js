const faces={U:[1,1],D:[1,-1],R:[0,1],L:[0,-1],F:[2,1],B:[2,-1]};
const rotate=(p,a,d)=>{let q=[...p],b=(a+1)%3,c=(a+2)%3;q[b]=-d*p[c];q[c]=d*p[b];return q.map(v=>v===0?0:v);};
class Cube {
 constructor(history=[]){this.stickers=[];this.history=[];for(const [f,[a,s]] of Object.entries(faces))for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const p=[0,0,0],n=[0,0,0];p[a]=s;p[(a+1)%3]=i;p[(a+2)%3]=j;n[a]=s;this.stickers.push({p,n,color:f});}for(const [f,d] of history)this.turn(f,d);}
 turn(f,d=1,record=true){if(!faces[f]||![1,-1].includes(d))throw Error('Invalid turn');const[a,s]=faces[f];for(const t of this.stickers)if(t.p[a]===s){t.p=rotate(t.p,a,-s*d);t.n=rotate(t.n,a,-s*d);}if(record){const prev=this.history[this.history.length-1];if(prev&&prev[0]===f&&prev[1]===-d)this.history.pop();else this.history.push([f,d]);}if(this.solved)this.history=[];}
 get solved(){return Object.values(faces).every(([a,s])=>new Set(this.stickers.filter(t=>t.n[a]===s).map(t=>t.color)).size===1);}
 scramble(n=24){for(let i=0;i<n;i++)this.turn(Object.keys(faces)[Math.floor(Math.random()*6)],Math.random()<.5?1:-1);if(this.solved)this.turn('R');}
 hint(){const m=this.history.pop();if(!m)return null;this.turn(m[0],-m[1],false);return[m[0],-m[1]];}
}
class Lights {
 constructor(){this.cells=Array(25).fill(false);this.pending=new Set();}
 toggle(i){if(!Number.isInteger(i)||i<0||i>=25)return false;for(const j of [i,i%5?i-1:-1,i%5<4?i+1:-1,i-5,i+5])if(j>=0&&j<25)this.cells[j]=!this.cells[j];if(this.pending.has(i))this.pending.delete(i);else this.pending.add(i);return true;}
 get solved(){return this.cells.every(x=>!x);}
 scramble(){for(let i=0;i<25;i++)if(Math.random()<.5)this.toggle(i);if(this.solved)this.toggle(12);}
 hint(){if(this.solved)return null;const i=this.pending.values().next().value;if(i===undefined)return null;this.toggle(i);return i;}
}
class Slide {
 constructor(){this.cells=[1,2,3,4,5,6,7,8,0];this.history=[];}
 move(i,record=true){const z=this.cells.indexOf(0);if(Math.abs(i%3-z%3)+Math.abs(Math.floor(i/3)-Math.floor(z/3))!==1||i<0||i>8)return false;[this.cells[i],this.cells[z]]=[this.cells[z],this.cells[i]];if(record){if(this.history[this.history.length-1]===i)this.history.pop();else this.history.push(z);}if(this.solved)this.history=[];return true;}
 get solved(){return this.cells.every((v,i)=>v===(i+1)%9);}
 scramble(n=50){for(let k=0;k<n;k++){const z=this.cells.indexOf(0),valid=[z-3,z+3,z%3?z-1:-1,z%3<2?z+1:-1].filter(i=>i>=0&&i<9&&i!==this.history[this.history.length-1]);this.move(valid[Math.floor(Math.random()*valid.length)]);}if(this.solved)this.move(7);}
 hint(){const i=this.history.pop();if(i===undefined)return null;this.move(i,false);return i;}
}

const $=id=>document.getElementById(id),colors={U:'#f1ede3',D:'#efd066',R:'#ee786c',L:'#eba45c',F:'#75c9b3',B:'#7f9ce8'};
let game='cube',models={cube:new Cube(),lights:new Lights(),slide:new Slide()},counts={cube:0,lights:0,slide:0},rx=-24,ry=-32,storageOK=true;
for(const m of Object.values(models))m.scramble();
try{const s=JSON.parse(localStorage.getItem('prism-v1'));if(s){models.cube=new Cube(s.cube);models.lights=new Lights();for(const i of s.lights)models.lights.toggle(i);models.slide=new Slide();for(const i of s.slide)models.slide.move(i);counts=s.counts;}}catch{}
function save(){try{const path=[];for(const old of models.slide.history){const next=models.slide.history[path.length+1]??models.slide.cells.indexOf(0);path.push(next);}localStorage.setItem('prism-v1',JSON.stringify({cube:models.cube.history,lights:[...models.lights.pending],slide:path,counts}));}catch{storageOK=false;}}
const transforms={F:'translateZ(80px)',B:'rotateY(180deg) translateZ(80px)',R:'rotateY(90deg) translateZ(80px)',L:'rotateY(-90deg) translateZ(80px)',U:'rotateX(90deg) translateZ(80px)',D:'rotateX(-90deg) translateZ(80px)'};
function coords(f,p){const[x,y,z]=p;return f==='F'?[x,-y]:f==='B'?[-x,-y]:f==='R'?[-z,-y]:f==='L'?[z,-y]:f==='U'?[x,z]:[x,-z];}
function render(){const m=models[game];$('moves').textContent=counts[game];$('cube').hidden=game!=='cube';$('board').hidden=game==='cube';$('turns').hidden=game!=='cube';$('instruction').textContent=game==='cube'?'Drag the space to look around. Swipe a face to turn it.':game==='lights'?'Tap a light to flip it and its neighbors. Turn them all off.':'Tap a tile next to the gap. Put 1–8 in order.';$('mode').textContent={cube:'THE CLASSIC, REIMAGINED',lights:'A SPARK OF LOGIC',slide:'MAKE ROOM FOR THE ANSWER'}[game];$('title').textContent=m.solved?'Beautifully solved.':'Find your next move.';document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.game===game));if(game==='cube'){$('cube').innerHTML='';for(const[f,[a,s]]of Object.entries(faces)){const face=document.createElement('div');face.className='face';face.dataset.face=f;face.style.transform=transforms[f];for(const t of m.stickers.filter(t=>t.n[a]===s).sort((a,b)=>{let A=coords(f,a.p),B=coords(f,b.p);return A[1]-B[1]||A[0]-B[0];})){const tile=document.createElement('div');tile.className='sticker';tile.style.background=colors[t.color];tile.textContent=t.color;face.append(tile);}$('cube').append(face);}}else{$('board').className=game;$('board').innerHTML='';m.cells.forEach((v,i)=>{const b=document.createElement('button');b.className='tile '+(game==='lights'?(v?'on':''):(v?'':'empty'));b.textContent=game==='lights'?(v?'✦':'·'):v;b.setAttribute('aria-label',game==='lights'?`Light ${i+1}, ${v?'on':'off'}`:`Tile ${v}`);b.onclick=()=>{if(game==='lights')m.toggle(i);else if(!m.move(i))return;counts[game]++;after();};$('board').append(b);});}save();}
function after(message){render();$('status').textContent=models[game].solved?'Solved! Take a breath. Start another when you’re ready.':message||(!storageOK?'Storage unavailable. This session still works offline.':'Unlimited hints. Zero pressure.');}
for(const f of Object.keys(faces))for(const d of [1,-1]){const b=document.createElement('button');b.textContent=f+(d<0?'′':'');b.setAttribute('aria-label',`Turn ${f} ${d>0?'clockwise':'counterclockwise'}`);b.onclick=()=>{models.cube.turn(f,d);counts.cube++;after();};$('turns').append(b);}
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>{game=b.dataset.game;after();});
$('hint').onclick=()=>{const step=models[game].hint();if(step!==null){counts[game]++;after(game==='cube'?`Try ${step[0]}${step[1]<0?'′':''}. Applied for you, one step closer.`:'One helpful move, on the house.');}else after();};
$('shuffle').onclick=()=>{models[game]=game==='cube'?new Cube():game==='lights'?new Lights():new Slide();models[game].scramble();counts[game]=0;after('Fresh puzzle. Find your flow.');};
$('reset').onclick=()=>{if(confirm('Erase all locally saved puzzle progress?')){try{localStorage.removeItem('prism-v1');}catch{}location.reload();}};
let drag=null;$('stage').onpointerdown=e=>{if(game!=='cube')return;drag={x:e.clientX,y:e.clientY,rx,ry,f:e.target.closest('.face')?.dataset.face};$('stage').setPointerCapture(e.pointerId);};$('stage').onpointermove=e=>{if(!drag||drag.f)return;ry=drag.ry+(e.clientX-drag.x)*.5;rx=drag.rx-(e.clientY-drag.y)*.5;$('cube').style.transform=`rotateX(${rx}deg) rotateY(${ry}deg)`;};$('stage').onpointerup=e=>{if(drag?.f&&Math.abs(e.clientX-drag.x)>25){models.cube.turn(drag.f,e.clientX>drag.x?1:-1);counts.cube++;after();}drag=null;};$('stage').onpointercancel=()=>drag=null;render();
