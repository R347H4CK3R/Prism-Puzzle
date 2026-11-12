import fs from 'node:fs';
const modules=['engine','progress','cube-view','brick-view','feedback','app'];
const identifier=name=>'__prism_'+name.replaceAll('-','_');
let bundle="'use strict';\n";
for(const name of modules){let source=fs.readFileSync(`web/${name}.mjs`,'utf8');const exports=[...source.matchAll(/export\s+(?:class|function|const|let)\s+([A-Za-z_$][\w$]*)/g)].map(m=>m[1]);source=source.replace(/import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\/([^'"]+)\.mjs['"];?/g,(_,names,dependency)=>`const {${names.replace(/\s+as\s+/g,':')}}=${identifier(dependency)};`).replace(/\bexport\s+(?=(?:class|function|const|let)\b)/g,'');bundle+=`const ${identifier(name)}=(()=>{\n${source}\nreturn {${exports.join(',')}};\n})();\n`;}
fs.writeFileSync('web/bundle.js',bundle);
for(const dir of ['android/app/src/main/assets','ios/PrismPuzzle/Web']){fs.mkdirSync(dir,{recursive:true});for(const f of ['index.html','style.css','cube-view.css','brick-view.css','bundle.js'])fs.copyFileSync('web/'+f,dir+'/'+f);}
