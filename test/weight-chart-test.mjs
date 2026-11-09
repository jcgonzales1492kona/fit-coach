import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx={S:{weights:[],settings:{unit:'lb',kcal:1800,p:150,c:160,f:50,tdee:2100},goals:{},meals:[],mig:{},log:{'2020-01-01':[{name:'Example oats',kcal:100}]},sessions:[]},saves:0};
ctx.save=()=>{ctx.saves++};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'data.js'),'utf8'),ctx,{filename:'data.js'});
vm.runInContext('function foodById(id){return FOODS.find(f=>f.id===id)||(S.custom||[]).find(f=>f.id===id)}',ctx,{filename:'foodById.js'});
vm.runInContext(fs.readFileSync(path.join(root,'goals.js'),'utf8'),ctx,{filename:'goals.js'});
vm.runInContext(fs.readFileSync(path.join(root,'meals.js'),'utf8'),ctx,{filename:'meals.js'});
const {wMA,weightAxisTicks,mealEnsureShipped,mealCalc,mealPer,mealCourse}=ctx;
const gDay=d=>vm.runInContext('gDay('+JSON.stringify(d)+')',ctx);
const gFmt=n=>vm.runInContext('gFmt('+n+')',ctx);

let pass=0,fail=0;
function assert(c,m){if(c){pass++;return}fail++;console.error('FAIL:',m)}
function eq(a,b,m){assert(a===b,m+' (got '+JSON.stringify(a)+', want '+JSON.stringify(b)+')')}

const before=JSON.stringify(ctx.S.log);
ctx.S.weights=[
 {d:'2026-10-13',w:170},{d:'2026-10-14',w:171},{d:'2026-10-16',w:169.5},
 {d:'2026-10-20',w:172},{d:'2026-10-23',w:168},{d:'2026-10-24',w:168.4},{d:'2026-10-24',w:180},
 {d:'2026-10-27',w:174},{d:'2026-10-30',w:166},
 {d:'2026-11-03',w:171},{d:'2026-11-04',w:170.5},{d:'2026-11-05',w:171.2},{d:'2026-11-06',w:173},
 {d:'2026-11-09',w:169}
];
const snap=JSON.stringify(ctx.S.weights);
const M=wMA();
eq(JSON.stringify(ctx.S.weights),snap,'reading the average does not change history');
eq(M.filter(x=>x.d==='2026-10-24').length,2,'two numbers on one date both stay on the chart');
eq(M.at(-1).d,'2026-11-09','the series ends on the latest date, after the gap');
eq(M.at(-1).w,169,'the latest dot is the logged number');
eq(Math.round(M.at(-1).ma*10)/10,170.9,'Nov 9 average is the mean of Nov 3, 4, 5, 6, and 9');
const nov6=M.filter(x=>x.d==='2026-11-06').at(-1);
eq(Math.round(nov6.ma*10)/10,171.4,'Nov 6 does not include the Nov 9 weigh-in');
const oct30=M.find(x=>x.d==='2026-10-30');
assert(Math.abs(oct30.ma-(168.4+180+174+166)/4)<1e-9,'a 3-day gap still uses only the dates inside the 6 days before');
eq(JSON.stringify(ctx.S.log),before,'weight math does not touch the food log');

const min=gDay('2026-10-13'),max=gDay('2026-12-14'),latest=gDay('2026-11-09');
const ticks=weightAxisTicks(min,max,[latest]);
eq(ticks[0],min,'axis starts at the first date');
eq(ticks.at(-1),max,'axis ends at the projection date');
assert(ticks.includes(latest),'the latest weigh-in is labeled');
assert(ticks.every((n,i)=>i===0||n>ticks[i-1]),'tick dates move forward');
assert(weightAxisTicks(latest,latest,[latest]).length===1,'one date does not invent extra ticks');
assert(!/—/.test(gFmt(latest)),'date labels stay plain');

ctx.S.meals=[{id:'m-keep',name:'Example leftover bowl',course:'lunch',servings:1,items:[],note:'keep'}];
ctx.S.mig={mealSeed:1,mealSeedCookbook4:1,mealSeedBurrito:1,mealDropPlainZiti:1,mealCompute:1};
const logBefore=JSON.stringify(ctx.S.log),kcal=ctx.S.settings.kcal;
mealEnsureShipped();
mealEnsureShipped();
const mash=ctx.S.meals.filter(m=>m.name==='Chicken + Gravy Protein Mash Bowls');
eq(mash.length,1,'the new dinner is added once');
eq(mealCourse(mash[0]),'dinner','it is filed under Dinner');
eq(mash[0].servings,4,'the recipe makes 4 bowls');
eq(mash[0].label.kcal,530,'calories are the card number');
eq(mash[0].label.p,56,'protein is the card number');
const calc=mealCalc(mash[0]);
eq(mash[0].label.c,calc.c,'carb estimate matches the ingredients');
eq(mash[0].label.f,calc.f,'fat estimate matches the ingredients');
eq(calc.c,66.1,'estimated carbs per serving');
eq(calc.f,11.7,'estimated fat per serving');
eq(mealPer(mash[0]).kcal,530,'logging uses the card calories');
assert(mash[0].note.includes('280 g protein mash')&&mash[0].note.includes('125 g sliced chicken')&&mash[0].note.includes('estimates'),'the note keeps the bowl portions and says the macros that are estimates');
eq(vm.runInContext(`(()=>{const m=S.meals.find(x=>x.name==='Chicken + Gravy Protein Mash Bowls');return m.items.find(it=>FOODS.find(f=>f.id===it.fid).name==='Potato, raw').g})()`,ctx),1005,'only the mash used in the bowls is counted');
eq(ctx.S.meals.find(m=>m.id==='m-keep').note,'keep','an existing meal stays');
eq(JSON.stringify(ctx.S.log),logBefore,'adding the meal does not change the food log');
eq(ctx.S.settings.kcal,kcal,'saved goals stay');
ctx.S.mig.mealHide={'chicken + gravy protein mash bowls':1};
ctx.S.meals=ctx.S.meals.filter(m=>m.name!=='Chicken + Gravy Protein Mash Bowls');
mealEnsureShipped();
assert(!ctx.S.meals.some(m=>m.name==='Chicken + Gravy Protein Mash Bowls'),'a deleted shipped meal is not put back');
assert(ctx.S.meals.some(m=>m.id==='m-keep'),'deleting one meal leaves the others');

console.log(fail?`failed ${fail}, passed ${pass}`:`passed ${pass}`);
process.exit(fail?1:0);
