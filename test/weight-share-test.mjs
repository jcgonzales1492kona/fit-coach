import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx={};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'edit.js'),'utf8'),ctx,{filename:'edit.js'});
vm.runInContext(fs.readFileSync(path.join(root,'trends.js'),'utf8'),ctx,{filename:'trends.js'});
vm.runInContext(fs.readFileSync(path.join(root,'holiday.js'),'utf8'),ctx,{filename:'holiday.js'});
const {weightSet,weightOn,h50Weight,h50Marks,trendBuild}=ctx;

let pass=0,fail=0;
function assert(c,m){if(c){pass++;return}fail++;console.error('FAIL:',m)}
function eq(a,b,m){assert(a===b,m+' (got '+JSON.stringify(a)+', want '+JSON.stringify(b)+')')}

const kept={d:'2020-01-01',w:150,note:'example'};
let list=[{...kept},{d:'2026-11-05',w:180},{d:'2026-11-05',w:181}];
const before=JSON.stringify(list);
const shown=weightOn(list,'2026-11-06');
eq(shown.length,0,'a different date is not this date');
eq(JSON.stringify(list),before,'reading weights does not change history');
eq(weightOn(list,'2026-11-05').length,2,'two saved numbers on one date both remain');

list=weightSet(list,'2026-11-06',184.2);
eq(weightOn(list,'2026-11-06').length,1,'Food entry is one weigh-in');
eq(weightOn(list,'2026-11-06')[0].w,184.2,'the typed number is stored');
eq(weightOn(list,'2026-11-05').length,2,'another date is not collapsed');
eq(list.find(x=>x.d==='2020-01-01').w,150,'older example weight stays');
list=weightSet(list,'2026-11-06',184.2);
eq(weightOn(list,'2026-11-06').length,1,'saving the same number does not add a second row');
list=weightSet(list,'2026-11-06',183.5);
eq(weightOn(list,'2026-11-06').length,1,'editing replaces that date');
eq(weightOn(list,'2026-11-06')[0].w,183.5,'the edited number is the one kept');

const state={settings:{kcal:1800,p:150,unit:'lb'},log:{'2020-01-01':[{name:'Example oats',kcal:100,p:10}]},weights:list,logStatus:{},sessions:[],holiday50:{days:{},weeks:{},flex:[],steps:{}}};
const snap=JSON.stringify({log:state.log,settings:state.settings,marker:state.log[0]});
eq(h50Marks(state,'2026-11-06').food,'unknown','a weigh-in does not confirm food');
const avg=h50Weight(state.weights,'2026-11-05','2026-11-11');
eq(avg.n,2,'the week counts November 5 once and November 6 once');
eq(Math.round(avg.avg*10)/10,182.3,'the week average uses the edited shared number');
eq(h50Weight(state.weights,'2026-11-07','2026-11-07').n,0,'November 7 does not show November 6');
const M=trendBuild(state,'2026-11-06',7);
assert(M.wCur.n>=1,'trends read the same weight list');
list=weightSet(list,'2026-11-06',null);
eq(weightOn(list,'2026-11-06').length,0,'delete removes only that date');
eq(weightOn(list,'2026-11-05').length,2,'delete does not remove the other date');
eq(JSON.stringify(state.log),JSON.stringify({ '2020-01-01':[{name:'Example oats',kcal:100,p:10}]}),'weight edits do not change food');
assert(!/healthPaste|Paste from Health|healthNudge/.test(fs.readFileSync(path.join(root,'app.js'),'utf8')+fs.readFileSync(path.join(root,'edit.js'),'utf8')),'Health shortcut UI is gone');

console.log(fail?`failed ${fail}, passed ${pass}`:`passed ${pass}`);
process.exit(fail?1:0);
