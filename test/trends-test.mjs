import vm from 'node:vm';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx={SLOT_NAMES:{b:'Breakfast',l:'Lunch',d:'Dinner',s:'Snack'}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'trends.js'),'utf8'),ctx,{filename:'trends.js'});
const {trendBuild,trendSummaryText,trendDates,trendShift,trendDay}=ctx;

let pass=0,fail=0;
function assert(cond,msg){if(cond){pass++;return}fail++;console.error('FAIL:',msg)}
function eq(a,b,msg){assert(a===b,msg+' (got '+JSON.stringify(a)+', want '+JSON.stringify(b)+')')}

const at=(iso,hh,mm=0)=>{const [Y,M,D]=iso.split('-').map(Number);return new Date(Y,M-1,D,hh,mm).getTime()};
const eat=(date,parts)=>parts.map(p=>({name:p.name||p.slot,slot:p.slot,kcal:p.kcal,p:p.p||0,c:0,f:0,t:p.hh==null?undefined:at(date,p.hh,p.mm||0)}));
const full=(date,kcal=1500,p=140)=>eat(date,[{slot:'b',kcal:Math.round(kcal*0.45),p:Math.round(p*0.5),hh:8},{slot:'l',kcal:kcal-Math.round(kcal*0.45),p:p-Math.round(p*0.5),hh:12}]);
const state=(log,weights,extra)=>({log,weights:weights||[],cycleDays:{},settings:{kcal:1720,p:145,unit:'lb'},...extra});

eq(trendDates('2026-11-03',7)[0],'2026-10-28','7-day window starts Oct 28');
eq(trendDates('2026-11-03',7).at(-1),'2026-11-03','7-day window ends Nov 3');
eq(trendDates('2026-01-02',5)[0],'2025-12-29','dates cross the new year');
eq(trendShift('2026-11-03',-7),'2026-10-27','shift back 7 days');

eq(trendDay({},'2026-11-03').status,'unlogged','missing day is unlogged');
eq(trendDay({d:[]},'d').status,'unlogged','empty day is unlogged');
eq(trendDay({d:[{slot:'b',kcal:1500,p:100}] },'d').status,'partial','one meal is partial');
eq(trendDay({d:[{slot:'s',kcal:800,p:20},{slot:'s',kcal:700,p:20}] },'d').status,'partial','two snacks are one meal');
eq(trendDay({d:[{slot:'b',kcal:400,p:30},{slot:'l',kcal:599,p:40}] },'d').status,'partial','under 1000 kcal is partial');
eq(trendDay({d:[{slot:'b',kcal:400,p:30},{slot:'l',kcal:600,p:40}] },'d').status,'logged','1000 kcal and 2 meals is logged');
eq(trendDay({d:[{slot:'b',kcal:400.2,p:30},{slot:'l',kcal:599.4,p:40}] },'d').status,'logged','kcal that rounds to 1000 counts');

const end='2026-11-03';
const days=trendDates(end,14);
const log={};
days.forEach((d,i)=>{if(i>=7)log[d]=full(d,1690,140)});
let M=trendBuild(state(log),end,7);
eq(M.logged7,7,'full week is 7 of 7');
eq(M.logged14,7,'prior empty week stays out of the 7');
eq(M.notTracking,false,'a solid week does not alert for an older empty week');
eq(Math.round(M.avgKcal),1690,'average uses logged days');
eq(M.loggedN,7,'count is logged days');
eq(M.overAvg,false,'1690 is not 150 over 1720');
eq(M.pLow,false,'140 g is not under 125');
eq(M.pHits,7,'each 140 g day hits 130');

const boundary={};
days.slice(7).forEach(d=>{boundary[d]=full(d,1870,130)});
M=trendBuild(state(boundary),end,7);
eq(Math.round(M.avgKcal),1870,'1870 average');
eq(M.overAvg,false,'exactly 150 over target does not flag');
boundary[days[7]]=full(days[7],1877,130);
M=trendBuild(state(boundary),end,7);
assert(M.overAvg,'more than 150 over the rounded average flags');

const hotLog={};
days.slice(7).forEach((d,i)=>{
 if(i===1||i===2)return;
 if(i===3)hotLog[d]=eat(d,[{slot:'b',kcal:800,p:40,hh:8},{slot:'l',kcal:800,p:40,hh:12},{slot:'s',kcal:700,p:10,hh:21}]);
 else if(i===4)hotLog[d]=eat(d,[{slot:'s',kcal:400,p:20,hh:21,mm:5}]);
 else hotLog[d]=full(d,2000,140);
});
M=trendBuild(state(hotLog),end,7);
eq(M.logged7,4,'two unlogged and one partial leave 4 logged');
assert(M.notTracking,'gap plus under 5 logged alerts');
assert(M.reasons.some(r=>/in a row were unlogged/.test(r)),'names the unlogged run');
eq(M.hot.length,1,'one day more than 400 over target');
eq(Math.round(M.hot[0].kcal),2300,'hot day total');
assert(M.overAvg,'average more than 150 over target flags');
eq(M.snackDays.length,2,'snack share over 25% on two days');
eq(Math.round(M.evePct*100)>0,true,'evening calories counted');
assert(M.snackDays.every(d=>d.snack/d.kcal>0.25),'snack flag is strict');

const edge={};
const eDays=trendDates(end,7);
eDays.forEach(d=>{edge[d]=eat(d,[{slot:'b',kcal:800,p:60,hh:8},{slot:'l',kcal:920,p:60,hh:12}])});
edge[eDays[0]]=eat(eDays[0],[{slot:'b',kcal:1000,p:60,hh:8},{slot:'l',kcal:1120,p:60,hh:18,mm:59}]);
let edgeM=trendBuild(state(edge),end,7);
eq(edgeM.hot.length,0,'2120 is not more than 400 over 1720');
eq(edgeM.evePct,0,'6:59 pm is not after 7 pm');
edge[eDays[1]]=eat(eDays[1],[{slot:'b',kcal:1060,p:60,hh:8},{slot:'l',kcal:1061,p:60,hh:19}]);
edgeM=trendBuild(state(edge),end,7);
assert(edgeM.hot.some(d=>d.date===eDays[1]),'2121 flags the day');
assert(edgeM.evePct>0,'7:00 pm counts as evening');

const pLog={};
eDays.forEach(d=>{pLog[d]=full(d,1500,125)});
pLog[eDays[0]]=full(eDays[0],1500,129.4);
let pM=trendBuild(state(pLog),end,7);
eq(pM.pHits,0,'129.4 g rounds below 130');
eq(Math.round(pM.avgP)>=125,true,'125 g average is not under 125');
eq(pM.pLow,false,'125 g average does not flag');
eDays.forEach(d=>{pLog[d]=full(d,1500,120)});
pLog[eDays[0]]=full(eDays[0],1500,129.6);
pM=trendBuild(state(pLog),end,7);
eq(pM.pHits,1,'129.6 g rounds to a 130 g hit');
assert(pM.pLow,'rounded average under 125 flags');

const sLog={};
sLog[eDays[0]]=eat(eDays[0],[{slot:'b',kcal:750,p:40,hh:8},{slot:'s',kcal:250,p:10,hh:15}]);
sLog[eDays[1]]=eat(eDays[1],[{slot:'b',kcal:749,p:40,hh:8},{slot:'s',kcal:251,p:10,hh:15}]);
const sM=trendBuild(state(sLog),end,7);
eq(sM.snackDays.length,1,'25% snacks do not flag, just over does');
eq(sM.notTracking,true,'only 2 logged days alerts');

const quiet={};
trendDates(end,7).forEach((d,i)=>{if(i===1||i===4)return;quiet[d]=full(d)});
const qM=trendBuild(state(quiet),end,7);
eq(qM.logged7,5,'5 of 7');
eq(qM.notTracking,false,'separated misses are not a 2-day gap');
delete quiet[eDays[2]];
quiet[eDays[1]]=undefined;
const gapLog={};trendDates(end,7).forEach((d,i)=>{if(i===1||i===2)return;gapLog[d]=full(d)});
const gM=trendBuild(state(gapLog),end,7);
eq(gM.logged7,5,'5 logged with a pair of misses');
assert(gM.notTracking,'two consecutive misses alert even at 5 of 7');

const prior={};
trendDates(end,14).forEach((d,i)=>{if(i===6||i===7)return;prior[d]=full(d,1600,130)});
const cross=trendBuild(state(prior),end,7);
assert(cross.notTracking,'a gap that runs into this week alerts');
assert(cross.gap.some(d=>d.date===trendDates(end,7)[0]),'the run reaches this week');
const olderOnly={};
trendDates(end,14).forEach((d,i)=>{if(i<4)return;olderOnly[d]=full(d)});
const oldM=trendBuild(state(olderOnly),end,7);
eq(oldM.logged7,7,'this week is full');
eq(oldM.notTracking,false,'a gap that stays in the prior week does not alert');

function weigh(start,endDate,fn){const out=[];trendDates(endDate,40).forEach(d=>{const w=fn(d);if(w!=null)out.push({d,w})});return out}
const flatDays=trendDates(end,21);
const weights=[];
flatDays.forEach((d,i)=>weights.push({d,w:i<7?180:i<14?180.1:180.2}));
const stallLog={};
trendDates(end,7).forEach((d,i)=>{if(i===3)return;stallLog[d]=full(d)});
let stall=trendBuild(state(stallLog,weights),end,7);
assert(stall.stall,'flat weekly averages with 6 of 7 logged flag a stall');
eq(stall.logged7,6,'stall fixture logged 6');
const five={};trendDates(end,7).forEach((d,i)=>{if(i===2||i===5)return;five[d]=full(d)});
stall=trendBuild(state(five,weights),end,7);
eq(stall.logged7,5,'five logged');
assert(!stall.stall,'5 of 7 does not stall-flag');
const six={};trendDates(end,7).forEach((d,i)=>{if(i===3)return;six[d]=full(d)});
const suppressed=trendBuild(state(six,weights,{cycleDays:{[flatDays[0]]:1}}),end,7);
assert(suppressed.wouldStall&&!suppressed.stall,'a cycle day in the stretch suppresses the stall');
assert(/stall flag is off/.test(suppressed.stallNote),'suppression note is shown');
const outside=trendBuild(state(six,weights,{cycleDays:{[trendShift(flatDays[0],-1)]:1}}),end,7);
assert(outside.stall,'a cycle day outside the 3 weeks does not suppress');
const kgW=[];flatDays.forEach((d,i)=>kgW.push({d,w:i<7?80:i<14?80.05:80.1}));
const kg=trendBuild(state(six,kgW,{settings:{kcal:1720,p:145,unit:'kg'}}),end,7);
assert(kg.stall,'0.10 kg is inside 0.3 lb');
const kgWide=[];flatDays.forEach((d,i)=>kgWide.push({d,w:i<7?80:i<14?80.1:80.2}));
assert(!trendBuild(state(six,kgWide,{settings:{kcal:1720,p:145,unit:'kg'}}),end,7).stall,'0.20 kg is outside 0.3 lb');

const custom=trendBuild(state(six,weights,{settings:{kcal:1800,p:150,unit:'lb'}}),end,7);
eq(custom.kcalT,1800,'calorie target comes from settings');
eq(custom.pT,150,'protein target comes from settings');

const none=trendBuild(state({},[],{settings:{kcal:1720,p:145,unit:'lb'}}),end,7);
assert(none.notTracking,'empty history is not tracking');
eq(none.avgKcal,null,'no average without logged days');
assert(/No weigh-ins yet/.test(none.wSub),'empty weight copy');

const snap=state(JSON.parse(JSON.stringify(six)),weights.map(w=>({...w})),{cycleDays:{'2020-01-01':1},marker:'keep'});
const before=JSON.stringify(snap);
trendBuild(snap,end,28);
eq(JSON.stringify(snap),before,'trend math does not mutate saved data');
eq(snap.marker,'keep','extra saved keys stay put');
eq(snap.cycleDays['2020-01-01'],1,'existing cycle marks stay put');

const summaryState=state(hotLog,[{d:'2026-10-28',w:185.4},{d:'2026-10-29',w:185.4},{d:'2026-10-30',w:185.4},{d:'2026-10-31',w:185.4},{d:'2026-11-01',w:185.4},{d:'2026-11-02',w:185.4},{d:'2026-11-03',w:184.6}]);
const text=trendSummaryText(trendBuild(summaryState,end,7));
assert(text.startsWith('FitCoach weekly summary\n'),'summary title');
assert(text.includes('Oct 28 to Nov 3, 2026'),'summary date range');
assert(text.includes('Days logged: 4/7'),'summary logged count');
assert(/Avg calories: [\d,]+ over 4 days \(target 1,720\)/.test(text),'summary calories');
assert(/Avg protein: \d+ g over 4 days \(target 145 g\)/.test(text),'summary protein');
assert(text.includes('Days protein hit (130 g+): '), 'summary protein hits');
assert(/Highest day: .+2,300 kcal/.test(text),'summary highest day');
assert(/Snack share: \d+%/.test(text),'summary snack share');
assert(/Weight: .+7-day avg,/.test(text),'summary weight');
assert(/Unlogged: /.test(text),'summary unlogged list');
assert(/Partial: /.test(text),'summary partial list');
assert(!/[\u2013\u2014]/.test(text),'summary has no en dash or em dash');
const ui=JSON.stringify(trendBuild(summaryState,end,7));
assert(!/[\u2013\u2014]/.test(ui),'model text has no en dash or em dash');

const wide=trendBuild(state(hotLog),end,28);
eq(wide.win,28,'28-day window');
eq(wide.weeks.length,4,'28 days are 4 weeks');
eq(wide.logged7,M.logged7,'logged /7 does not follow the chart window');

console.log(fail?`failed ${fail}, passed ${pass}`:`passed ${pass}`);
process.exit(fail?1:0);
