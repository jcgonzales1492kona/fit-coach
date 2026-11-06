import vm from 'node:vm';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx={SLOT_NAMES:{b:'Breakfast',l:'Lunch',d:'Dinner',s:'Snack'}};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'trends.js'),'utf8'),ctx,{filename:'trends.js'});
const {trendBuild,trendSummaryText,trendDates,trendShift,trendDay,trendStatus,trendApplyStatus}=ctx;

let pass=0,fail=0;
function assert(cond,msg){if(cond){pass++;return}fail++;console.error('FAIL:',msg)}
function eq(a,b,msg){assert(a===b,msg+' (got '+JSON.stringify(a)+', want '+JSON.stringify(b)+')')}

const at=(iso,hh,mm=0)=>{const [Y,M,D]=iso.split('-').map(Number);return new Date(Y,M-1,D,hh,mm).getTime()};
const eat=(date,parts)=>parts.map(p=>({name:p.name||p.slot,slot:p.slot,kcal:p.kcal,p:p.p||0,c:0,f:0,t:p.t,mealAt:p.mealAt}));
const full=(date,kcal=1500,p=140)=>eat(date,[{slot:'b',kcal:Math.round(kcal*0.45),p:Math.round(p*0.5),mealAt:'08:00'},{slot:'l',kcal:kcal-Math.round(kcal*0.45),p:p-Math.round(p*0.5),mealAt:'12:30'}]);
const state=(log,weights,extra)=>({log,weights:weights||[],cycleDays:{},settings:{kcal:1720,p:145,unit:'lb'},...extra});

eq(trendDates('2026-11-03',7)[0],'2026-10-28','7-day window starts Oct 28');
eq(trendDates('2026-11-03',7).at(-1),'2026-11-03','7-day window ends Nov 3');
eq(trendDates('2026-01-02',5)[0],'2025-12-29','dates cross the new year');
eq(trendShift('2026-11-03',-7),'2026-10-27','shift back 7 days');

eq(trendStatus(undefined,'2026-11-03'),'unknown','missing map is unknown');
eq(trendStatus({},'2026-11-03'),'unknown','missing date is unknown');
eq(trendStatus({d:'logged'},'d'),'unknown','old heuristic words are not a status');
eq(trendDay({},'2026-11-03').status,'unknown','no rows and no choice is unknown');
eq(trendDay({d:full('d',1800,150)},'d').status,'unknown','1000 kcal and 2 meals stay unknown');
eq(trendDay({d:full('d',1800,150)},'d',{d:'complete'}).status,'complete','user can confirm complete');
eq(trendDay({d:[{slot:'b',kcal:200,p:10}]},'d',{d:'partial'}).status,'partial','user can confirm partial');
eq(trendDay({},'d',{d:'none'}).status,'none','user can confirm not logged');

const end='2026-11-03';
const days=trendDates(end,7);
const histLog={};
histLog[days[3]]=full(days[3],2100,160);
const hist=state(JSON.parse(JSON.stringify(histLog)));
const histBefore=JSON.stringify(hist);
let M=trendBuild(hist,end,7);
eq(JSON.stringify(hist),histBefore,'reading trends does not write status or change the log');
eq(hist.logStatus,undefined,'historical days are not backfilled');
eq(M.cur.find(d=>d.date===days[3]).status,'unknown','a full historical day stays unknown');
eq(M.avgKcal,null,'unknown calories are not averaged');
eq(M.avgN,0,'unknown days are not eligible');
eq(M.cov.unknown,7,'every unconfirmed day counts as unknown');
assert(M.notTracking==null&&M.hot==null&&M.stall==null&&M.snackDays==null&&M.overAvg==null&&M.pLow==null,'old off-track flags are gone');

const marked=state(JSON.parse(JSON.stringify(histLog)),[],{logStatus:{[days[3]]:'complete'}});
M=trendBuild(marked,end,7);
eq(Math.round(M.avgKcal),2100,'average uses the confirmed day');
eq(M.avgN,1,'n is the confirmed count');
eq(M.cov.complete,1,'coverage counts the confirmation');
eq(M.cov.unknown,6,'the other days stay unknown');

const mixedLog={};
mixedLog[days[1]]=full(days[1],1500,140);
mixedLog[days[2]]=full(days[2],4000,200);
mixedLog[days[4]]=eat(days[4],[{slot:'b',kcal:900,p:40,mealAt:'08:00'}]);
const mixed=state(mixedLog,[],{logStatus:{[days[1]]:'complete',[days[4]]:'partial'}});
M=trendBuild(mixed,end,7);
eq(Math.round(M.avgKcal),1500,'a large unknown day is left out of the average');
eq(M.avgN,1,'only the complete day is eligible');
eq(M.partial.n,1,'partial is counted separately');
eq(Math.round(M.partial.kcal),900,'partial total is visible and not treated as zero');
eq(M.cur.find(d=>d.date===days[2]).status,'unknown','the 4000 kcal day was not auto-completed');

const noneLog={};noneLog[days[0]]=full(days[0],1800,100);
const noneState=state(noneLog,[],{logStatus:{[days[0]]:'none',[days[1]]:'complete'}});
noneState.log[days[1]]=full(days[1],1600,120);
M=trendBuild(noneState,end,7);
eq(Math.round(M.avgKcal),1600,'not logged is excluded even if rows exist');
eq(JSON.stringify(noneState.log[days[0]]),JSON.stringify(noneLog[days[0]]),'not logged does not delete rows');

const holes=state({[days[6]]:full(days[6],1000,80)},[],{logStatus:{[days[6]]:'complete'}});
M=trendBuild(holes,end,7);
eq(Math.round(M.avgKcal),1000,'missing days are not zeros in the average');
eq(M.avgN,1,'one confirmed day is n=1, not n=7');

const stamp=eat(days[5],[{slot:'d',kcal:500,p:30,t:at(days[5],21,0)}]);
const stampDay=trendDay({d:stamp},'d');
eq(stampDay.evening,0,'a 9 pm log time is not an evening meal');
eq(stampDay.untimed,1,'log time does not count as a meal time');
let eve=trendBuild(state({[days[5]]:stamp}),end,7).eve;
assert(!eve.claim,'evening share is not claimed from log time');
assert(/Log time is not used/.test(eve.why),'the reason names log time');

const timed=eat(days[5],[{slot:'d',kcal:400,p:30,mealAt:'19:00',t:at(days[5],8,0)},{slot:'b',kcal:400,p:30,mealAt:'08:00'}]);
eve=trendBuild(state({[days[5]]:timed}),end,7).eve;
assert(eve.claim,'meal times can support an evening share');
eq(Math.round(eve.pct*100),50,'half the known calories are after 7 pm');
const early=eat(days[5],[{slot:'d',kcal:400,p:30,mealAt:'18:59'}]);
eve=trendBuild(state({[days[5]]:early}),end,7).eve;
eq(eve.pct,0,'6:59 pm is not evening');
const gapTime=eat(days[5],[{slot:'d',kcal:400,p:30,mealAt:'19:30'},{slot:'s',kcal:100,p:5,t:at(days[5],22,0)}]);
eve=trendBuild(state({[days[5]]:gapTime}),end,7).eve;
assert(!eve.claim,'one missing meal time blocks the evening share');

const snackLog={};
snackLog[days[0]]=eat(days[0],[{slot:'b',kcal:750,p:40,mealAt:'08:00'},{slot:'s',kcal:250,p:10,mealAt:'15:00'}]);
M=trendBuild(state(snackLog,[],{logStatus:{[days[0]]:'complete'}}),end,7);
eq(Math.round(M.snackPct*100),25,'snack share stays descriptive');
assert(M.snackDays==null,'snack share does not raise a flag');

const weights=[];
trendDates(end,14).forEach((d,i)=>weights.push({d,w:i<7?185:184}));
M=trendBuild(state({},weights),end,7);
eq(M.wCur.n,7,'current window counts weigh-ins');
eq(M.wPrev.n,7,'prior window is a separate 7 days');
assert(M.wCur.enough,'7 weigh-ins is enough');
assert(/Down 1 lb/.test(M.wNote),'enough data can show a change');
const sparse=[];
sparse.push({d:days[1],w:180},{d:days[2],w:182});
M=trendBuild(state({},sparse),end,7);
eq(M.wCur.n,2,'missing weigh-ins are not filled');
eq(Math.round(M.wCur.avg),181,'average uses the two real weigh-ins');
assert(!M.wCur.enough,'two weigh-ins are not enough for a trend');
assert(/Not enough weigh-ins/.test(M.wNote),'the copy says the data is short');
M=trendBuild(state({},[]),end,7);
eq(M.wCur.avg,null,'no weigh-ins is not a zero average');
assert(/No weigh-ins/.test(M.wNote),'empty window is named');

const custom=trendBuild(state({},[],{settings:{kcal:1800,p:150,unit:'lb'}}),end,7);
eq(custom.kcalT,1800,'saved calorie goal is read');
eq(custom.pT,150,'saved protein goal is read');
const bare=trendBuild({log:{},weights:[],settings:{}},end,7);
eq(bare.kcalT,null,'a missing goal is not replaced with 1720');
eq(bare.pT,null,'a missing protein goal is not replaced with 145');

const text=trendSummaryText(trendBuild(mixed,end,7));
assert(text.includes('Coverage: 1 complete, 1 partial, 0 not logged, 5 unknown'),'summary leads with coverage');
assert(text.includes('n=1'),'summary includes n');
assert(text.includes('Partial days, separate'),'summary keeps partial totals apart');
assert(text.includes('not counted as zero'),'summary says missing days are not zero');
assert(text.includes('not marked medically approved'),'saved goals are labeled');
assert(text.includes('Private notes are not included.'),'private notes are off by default');
assert(text.includes('Context tags are not included.'),'context tags are off by default');
assert(!/[\u2013\u2014]/.test(text),'summary has no en dash or em dash');
assert(!/cut calories|Not tracking|Way over|under 125/i.test(text),'summary does not flag or advise a cut');
const withPriv=trendSummaryText(trendBuild(mixed,end,7),{priv:true,notes:[{date:days[1],note:'Sample private line'}]});
assert(withPriv.includes('Sample private line'),'private notes appear only when asked');
const withTag=trendSummaryText(trendBuild(state(mixedLog,[],{logStatus:mixed.logStatus,cycleDays:{[days[1]]:1}}),end,7),{cycle:true});
assert(/Context tags: /.test(withTag),'context tags appear only when asked');

const wide=trendBuild(mixed,end,28);
eq(wide.win,28,'28-day window');
eq(wide.weeks.length,4,'28 days are 4 non-overlapping weeks');
wide.weeks.forEach(w=>eq(w.dates.length,7,'each weight and logging block is 7 days'));
assert(wide.weeks.every((w,i)=>i===0||w.start>wide.weeks[i-1].end),'week blocks do not overlap');

const apply=state(JSON.parse(JSON.stringify(histLog)));
const logBefore=JSON.stringify(apply.log);
assert(trendApplyStatus(apply,days[3],'complete'),'confirming a day returns ok');
eq(apply.logStatus[days[3]],'complete','status is stored by date');
eq(JSON.stringify(apply.log),logBefore,'confirming a day does not change food rows');
eq(apply.settings.kcal,1720,'confirming a day does not change saved goals');
assert(trendApplyStatus(apply,days[3],'unknown'),'unknown clears the choice');
eq(apply.logStatus[days[3]],undefined,'cleared status is absent again');
assert(!trendApplyStatus(apply,'nope','complete'),'bad dates are ignored');

console.log(fail?`failed ${fail}, passed ${pass}`:`passed ${pass}`);
process.exit(fail?1:0);
