import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['data.js','body.js','cond.js','goals.js','meals.js','slots.js','edit.js','trends.js','app.js','holiday.js','scan.js'];
const fns=new Map(),lex=new Map();
function add(map,name,file){if(!map.has(name))map.set(name,[]);map.get(name).push(file)}
for(const file of files){
  const src=fs.readFileSync(path.join(root,file),'utf8');
  for(const m of src.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm))add(fns,m[1],file);
  for(const m of src.matchAll(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/gm))add(lex,m[1],file);
}
let fail=0;
function report(kind,map){
  for(const [name,where] of map){
    if(where.length<2)continue;
    fail++;
    console.error(kind+' '+name+' in '+where.join(', '));
  }
}
report('function',fns);
report('binding',lex);
if(!fns.has('renderHoliday')||!fns.has('trendSetStatus')||!fns.has('h50CheckPut')){
  fail++;
  console.error('expected new globals were not found');
}
const banned=/accounts\.google|googleapis|gsi\/client|oauth2|access_token|refresh_token|client_secret|YOUR_CLIENT_ID/i;
for(const file of ['holiday.js','app.js','index.html','sw.js','gcal.js']){
  const p=path.join(root,file);
  if(!fs.existsSync(p))continue;
  if(banned.test(fs.readFileSync(p,'utf8'))){fail++;console.error('oauth residue in '+file)}
}
console.log(fail?`failed ${fail}`:`passed, ${fns.size} functions and ${lex.size} top-level bindings`);
process.exit(fail?1:0);
