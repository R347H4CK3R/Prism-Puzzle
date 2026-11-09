import fs from 'node:fs';
const bundle=fs.readFileSync('web/engine.mjs','utf8').replaceAll('export ','')+'\n'+fs.readFileSync('web/app.mjs','utf8').replace(/^import .*\n/,'');fs.writeFileSync('web/bundle.js',bundle);
for(const dir of ['android/app/src/main/assets','ios/PrismPuzzle/Web']){fs.mkdirSync(dir,{recursive:true});for(const f of ['index.html','style.css','bundle.js'])fs.copyFileSync('web/'+f,dir+'/'+f);}
