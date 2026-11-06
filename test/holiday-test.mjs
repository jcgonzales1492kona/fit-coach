import vm from 'node:vm';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const ctx={};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root,'trends.js'),'utf8'),ctx,{filename:'trends.js'});
vm.runInContext(fs.readFileSync(path.join(root,'holiday.js'),'utf8'),ctx,{filename:'holiday.js'});
const H=ctx;

let pass=0,fail=0;
function assert(cond,msg){if(cond){pass++;return}fail++;console.error('FAIL:',msg)}
function eq(a,b,msg){assert(a===b,msg+' (got '+JSON.stringify(a)+', want '+JSON.stringify(b)+')')}

eq(H.h50Dates().length,50,'the challenge has 50 dates');
eq(H.h50Dates()[0],'2026-11-05','day 1 is Nov 5');
eq(H.h50Dates()[49],'2026-12-24','day 50 is Dec 24');
eq(H.h50Index('2026-11-04'),null,'Nov 4 is outside');
eq(H.h50Index('2026-11-05'),1,'Nov 5 is day 1');
eq(H.h50Index('2026-11-26'),22,'Thanksgiving is day 22');
eq(H.h50Index('2026-12-24'),50,'Dec 24 is day 50');
eq(H.h50Index('2026-12-25'),null,'Dec 25 is outside');
eq(H.h50Date('2026-11-05').getDay(),4,'Nov 5 2026 is Thursday');
eq(H.h50Date('2026-12-24').getDay(),4,'Dec 24 2026 is Thursday');

const seen=new Map();
H.h50Dates().forEach(d=>{const w=H.h50Week(d);assert(w,'every challenge day has one week');
 if(!seen.has(w.id))seen.set(w.id,{days:[],saturday:''});const rec=seen.get(w.id);rec.days.push(d);
 if(H.h50Date(d).getDay()===6)rec.saturday=d});
eq(seen.size,7,'there are 7 check-in weeks');
let covered=0;seen.forEach(rec=>{covered+=rec.days.length;assert(rec.saturday&&rec.days.includes(rec.saturday),'each week has its Saturday');eq(H.h50Date(rec.saturday).getDay(),6,'the check-in day is Saturday')});
eq(covered,50,'check-in weeks cover every challenge day once');
eq(H.h50Week('2026-11-05').id,1,'Nov 5 opens week 1');
eq(H.h50Week('2026-11-08').end,'2026-11-08','week 1 ends Sunday Nov 8');
eq(H.h50Week('2026-11-09').id,2,'Nov 9 opens week 2');
eq(H.h50Week('2026-11-26').id,4,'Thanksgiving is in week 4');
eq(H.h50Week('2026-12-14').id,7,'Dec 14 opens week 7');
eq(H.h50Week('2026-12-24').id,7,'Dec 24 stays in week 7');

const wins=new Map();
H.h50Dates().forEach(d=>{const w=H.h50Win(d);if(d==='2026-12-24'){eq(w,null,'Dec 24 has no 7-day window');return}
 assert(w,'Nov 5 through Dec 23 sit in a weight window');if(!wins.has(w.id))wins.set(w.id,[]);wins.get(w.id).push(d)});
eq(wins.size,7,'there are 7 weight windows');
let weighed=0,prev='';wins.forEach(days=>{eq(days.length,7,'each weight window is 7 days');weighed+=days.length;assert(!prev||days[0]>prev,'weight windows do not overlap');prev=days[days.length-1]});
eq(weighed,49,'seven windows cover Nov 5 through Dec 23');

const empty=H.h50Weight([],'2026-11-05','2026-11-11');
eq(empty.avg,null,'an empty window has no average');
eq(empty.n,0,'an empty window has n=0');
const two=H.h50Weight([{d:'2026-11-05',w:180},{d:'2026-11-07',w:182}],'2026-11-05','2026-11-11');
eq(two.n,2,'missing weigh-ins are skipped');
eq(two.avg,181,'the average is not pulled down by empty days');
assert(!two.enough,'two weigh-ins are not enough');
const three=H.h50Weight([{d:'2026-11-05',w:180},{d:'2026-11-06',w:181},{d:'2026-11-07',w:182}],'2026-11-05','2026-11-11');
assert(three.enough,'three weigh-ins can support a comparison');

const base={log:{'2026-11-05':[{slot:'b',kcal:1800,p:140,mealAt:'08:00'},{slot:'l',kcal:200,p:20,mealAt:'12:00'}]},weights:[{d:'2026-11-05',w:180}],sessions:[],settings:{kcal:1720,p:145,unit:'lb'}};
eq(H.h50Food(base,'2026-11-05').status,'unknown','existing food stays unknown until confirmed');
eq(JSON.stringify(base.log['2026-11-05']),JSON.stringify([{slot:'b',kcal:1800,p:140,mealAt:'08:00'},{slot:'l',kcal:200,p:20,mealAt:'12:00'}]),'food rows stay intact');
assert(!base.logStatus,'no status map is created by reading');

const enrolled={holiday50:{enrolled:'2026-11-06',days:{},weeks:{},flex:[],steps:{}},log:base.log,sessions:[],weights:[],settings:base.settings};
assert(H.h50Before(enrolled.holiday50,'2026-11-05'),'Nov 5 is before a Nov 6 start');
assert(!H.h50Before(enrolled.holiday50,'2026-11-06'),'the start date itself is in range');
assert(H.h50NotePut(enrolled,'2026-11-05','Optional backfill'),'a note can be added later');
eq(enrolled.holiday50.days['2026-11-05'].note,'Optional backfill','the backfill is stored');
assert(H.h50Before(enrolled.holiday50,'2026-11-05'),'a backfill does not make the day required');

const move={sessions:[{date:'2026-11-06',day:'Push',sets:[{ex:'Bench',w:45,r:8}]}],cond:{done:{w1A:{date:'2026-11-08'}},tests:[]},meso:{schedule:['Rest','Rest','Rest','Push','Pull','Legs','Cond']}};
assert(H.h50OnFile(move,'2026-11-06').any,'a finished session is on file');
assert(H.h50OnFile({sessions:[{date:'2026-11-06',sets:[]}]},'2026-11-06').any===false,'empty sets are not a session');
assert(H.h50OnFile(move,'2026-11-08').any,'conditioning counts without a duration');
assert(H.h50OnFile({sessions:[],holiday50:{cal:{events:[{date:'2026-11-06',title:'Push'}]}}},'2026-11-06').any===false,'a calendar title is not a completed workout');
eq(H.h50Program(move,'2026-11-05').name,'Push','Thursday shows the saved plan');
eq(H.h50Program(move,'2026-11-05').done,false,'the plan is not completed');
eq(H.h50Program(move,'2026-11-06').name,'Pull','Friday is Pull');
eq(H.h50Program(move,'2026-11-07').name,'Legs','Saturday is Legs');
eq(H.h50Program(move,'2026-11-08').name,'Cond','Sunday is conditioning');
assert(H.h50OnFile(move,'2026-11-05').any===false,'a planned Thursday with no session stays unknown');
H.h50TrainPut(move,'2026-11-05','clinic');
H.h50TrainPut(move,'2026-11-09','medical');
eq(move.holiday50.days['2026-11-05'].train,'clinic','clinic-restricted is stored as a note');
assert(H.h50OnFile(move,'2026-11-05').any===false,'clinic-restricted does not invent a walk or a row');
eq(move.holiday50.days['2026-11-09'].train,'medical','medical rest is stored');
assert(H.h50StepsPut(move,'2026-11-09',''),'steps can stay blank on medical rest');
eq(move.holiday50.days['2026-11-09'].steps,undefined,'blank steps are not stored as zero');

const goals={settings:{kcal:1720,p:145,unit:'lb'},log:{'2020-01-01':[{name:'Egg',kcal:70}]},sessions:[{date:'2020-01-02',sets:[{ex:'Squat'}]}],weights:[{d:'2020-01-01',w:199}]};
const snap=JSON.stringify(goals);
assert(H.h50FlexPut(goals,'2026-11-26','Dinner out').ok,'a planned meal can be saved');
assert(H.h50FlexPut(goals,'2026-11-27','Lunch out').ok,'a second planned meal can be saved');
assert(H.h50FlexPut(goals,'2026-11-28','Brunch').ok,'there is no two-meal cap');
eq(goals.log['2020-01-01'][0].name,'Egg','planned meals do not add food');
eq(goals.sessions.length,1,'planned meals do not add workouts');
eq(goals.settings.kcal,1720,'planned meals do not change saved goals');
eq(goals.log['2020-01-01'][0].kcal,70,'food calories survive planned meals');
eq(goals.weights[0].w,199,'weigh-ins survive planned meals');
eq(goals.settings.p,145,'saved protein survives planned meals');

const steps={};
eq(H.h50StepGoal({}).baseline,null,'baseline starts unknown');
eq(H.h50StepGoal({}).goal,null,'goal is not 7000');
assert(!H.h50GoalPut(steps,'8000').ok,'a goal without a baseline is refused');
eq(steps.holiday50,undefined,'a refused goal does not create challenge state');
assert(H.h50BaselinePut(steps,'4000').ok,'a baseline can be saved');
eq(H.h50StepGoal(steps.holiday50).goal,null,'a baseline does not invent a goal');
assert(H.h50GoalPut(steps,'5000').ok,'a goal can follow a baseline');
eq(H.h50StepGoal(steps.holiday50).goal,5000,'the entered goal is kept');
assert(H.h50BaselinePut(steps,'').ok,'clearing the baseline is reversible');
eq(H.h50StepGoal(steps.holiday50).goal,null,'clearing the baseline clears the goal too');

const track={settings:{kcal:1720,p:145,unit:'lb'},log:{'2020-01-01':[{name:'Egg',kcal:70}]},sessions:[{date:'2026-11-06',day:'Push',sets:[{ex:'Press',w:40,r:8}]}],weights:[{d:'2020-01-01',w:199}],logStatus:{}};
const trackSnap=JSON.stringify({log:track.log,sessions:track.sessions,weights:track.weights,settings:track.settings,logStatus:track.logStatus});
assert(H.h50CheckPut(track,'2026-11-05','move',true).ok,'a movement check can be backfilled');
assert(H.h50CheckPut(track,'2026-12-24','workout',true).ok,'day 50 can be checked');
assert(H.h50CheckPut(track,'2026-11-06','reflect',true).ok,'a reflection check is stored');
eq(track.holiday50.days['2026-11-05'].checks.move,1,'Nov 5 movement stays checked');
eq(track.holiday50.days['2026-11-05'].confirmed,'self','the check is marked self-confirmed');
eq(track.logStatus['2026-11-05'],undefined,'a check does not confirm the food log');
eq(JSON.stringify({log:track.log,sessions:track.sessions,weights:track.weights,settings:track.settings,logStatus:track.logStatus}),trackSnap,'checks do not change saved logs');
const saved=JSON.parse(JSON.stringify(track));
eq(saved.holiday50.days['2026-12-24'].checks.workout,1,'a check survives a save and reload');
assert(H.h50CheckPut(saved,'2026-11-05','move',false).ok,'a check can be cleared');
eq(saved.holiday50.days['2026-11-05'].checks,undefined,'unchecking removes the mark');
eq(H.h50Marks(saved,'2026-11-05').move,false,'the cleared day reads as open');
eq(H.h50Marks(track,'2026-11-06').onFile,true,'a finished workout can show as on file');
eq(H.h50Marks(track,'2026-11-06').workout,false,'a workout on file does not check the box');
eq(H.h50Marks({log:{'2026-11-06':[{kcal:2000,p:150},{kcal:100,p:10}]},logStatus:{}},'2026-11-06').food,'unknown','food stays unknown without a confirmation');
H.h50EnrollPut(track,'2026-11-06');
assert(H.h50Marks(track,'2026-11-05').before,'Nov 5 is before a Nov 6 start');
H.h50TrainPut(track,'2026-11-08','medical');
eq(H.h50Marks(track,'2026-11-08').train,'medical','medical rest is visible on the tracker');
eq(H.h50WeekChecked(track,H.h50Week('2026-12-24')),1,'week 7 counts the one workout check');
assert(!H.h50CheckPut(track,'2026-11-04','move',true).ok,'dates outside the 50 are refused');

const coachState={settings:{kcal:1720,p:145,unit:'lb'},log:{'2026-11-05':[{slot:'b',kcal:500,p:40,t:Date.now()}]},weights:[{d:'2026-11-05',w:180}],sessions:[],holiday50:{enrolled:'2026-11-06',days:{'2026-11-05':{note:'Walked the long way',privateNote:'Sample private line',context:'travel'}},weeks:{1:{habits:'Logged breakfast',obstacle:'Late meeting',adjust:'Pack lunch'}},flex:[{date:'2026-11-07',label:'Dinner out'}],steps:{}}};
coachState.logStatus={'2026-11-05':'complete'};
const coach=H.h50CoachText(coachState,1,{context:false,priv:false},'2026-11-08');
assert(coach.includes('Week 1, 2026-11-05 to 2026-11-08'),'check-in names the week');
assert(coach.includes('1 complete'),'check-in counts complete days');
assert(/Calories, complete days only: .+n=1/.test(coach),'check-in averages confirmed days');
assert(coach.includes('not marked medically approved'),'saved goals stay labeled');
assert(coach.includes('Walked the long way'),'reflections are in the preview');
assert(coach.includes('Dinner out'),'flexible meals are listed as plans');
assert(coach.includes('Private notes are not included.'),'private notes wait for a choice');
assert(coach.includes('Context tags are not included.'),'context tags wait for a choice');
assert(coach.includes('Log time is not used'),'evening is not inferred for the check-in');
assert(!/cheat|perfect day|7,000|7000|catch up|cut calories/i.test(coach),'the check-in does not grade or prescribe');
assert(!/[\u2013\u2014]/.test(coach),'check-in has no en dash or em dash');
const shown=H.h50CoachText(coachState,1,{context:true,priv:true},'2026-11-08');
assert(shown.includes('Sample private line'),'private notes can be included on purpose');
assert(shown.includes('travel'),'context tags can be included on purpose');

const round=JSON.parse(JSON.stringify(coachState));
eq(round.log['2026-11-05'][0].kcal,500,'export keeps food');
eq(round.holiday50.days['2026-11-05'].note,'Walked the long way','export keeps challenge notes');
eq(round.logStatus['2026-11-05'],'complete','export keeps logging status');
eq(round.settings.kcal,1720,'export keeps saved goals');

console.log(fail?`failed ${fail}, passed ${pass}`:`passed ${pass}`);
process.exit(fail?1:0);
