export const faces={U:[1,1],D:[1,-1],R:[0,1],L:[0,-1],F:[2,1],B:[2,-1]};
const rotate=(p,a,d)=>{let q=[...p],b=(a+1)%3,c=(a+2)%3;q[b]=-d*p[c];q[c]=d*p[b];return q.map(v=>v===0?0:v);};
export class Cube {
 constructor(history=[]){this.stickers=[];this.history=[];for(const [f,[a,s]] of Object.entries(faces))for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const p=[0,0,0],n=[0,0,0];p[a]=s;p[(a+1)%3]=i;p[(a+2)%3]=j;n[a]=s;this.stickers.push({p,n,color:f});}for(const [f,d] of history)this.turn(f,d);}
 turn(f,d=1,record=true){if(!faces[f]||![1,-1].includes(d))throw Error('Invalid turn');const[a,s]=faces[f];for(const t of this.stickers)if(t.p[a]===s){t.p=rotate(t.p,a,-s*d);t.n=rotate(t.n,a,-s*d);}if(record){const prev=this.history[this.history.length-1];if(prev&&prev[0]===f&&prev[1]===-d)this.history.pop();else this.history.push([f,d]);}if(this.solved)this.history=[];}
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
 constructor(){this.cells=[1,2,3,4,5,6,7,8,0];this.history=[];}
 move(i,record=true){const z=this.cells.indexOf(0);if(Math.abs(i%3-z%3)+Math.abs(Math.floor(i/3)-Math.floor(z/3))!==1||i<0||i>8)return false;[this.cells[i],this.cells[z]]=[this.cells[z],this.cells[i]];if(record){if(this.history[this.history.length-1]===i)this.history.pop();else this.history.push(z);}if(this.solved)this.history=[];return true;}
 get solved(){return this.cells.every((v,i)=>v===(i+1)%9);}
 scramble(n=50){for(let k=0;k<n;k++){const z=this.cells.indexOf(0),valid=[z-3,z+3,z%3?z-1:-1,z%3<2?z+1:-1].filter(i=>i>=0&&i<9&&i!==this.history[this.history.length-1]);this.move(valid[Math.floor(Math.random()*valid.length)]);}if(this.solved)this.move(7);}
 hint(){const i=this.history.pop();if(i===undefined)return null;this.move(i,false);return i;}
}
