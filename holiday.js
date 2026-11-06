/* Holiday 50, Thu Nov 5 through Thu Dec 24 2026.
   Reads food, weigh-ins, finished workouts, and conditioning.
   Writes only S.holiday50 plus the shared logging status the user sets.
   Does not change saved goals, does not add food or health rows, and does not edit a calendar. */
const H50_START='2026-11-05',H50_END='2026-12-24',H50_W_MIN=3;
const H50_WEEKS=[
 {id:1,start:'2026-11-05',end:'2026-11-08',saturday:'2026-11-07',prompt:'These four days open the challenge. Which habit is already familiar, and which one is new?'},
 {id:2,start:'2026-11-09',end:'2026-11-15',saturday:'2026-11-14',prompt:'This is the first full Monday to Sunday week. What got in the way, and what is one realistic change for next week?'},
 {id:3,start:'2026-11-16',end:'2026-11-22',saturday:'2026-11-21',prompt:'What do you want in place before Thanksgiving on Thu Nov 26?'},
 {id:4,start:'2026-11-23',end:'2026-11-29',saturday:'2026-11-28',prompt:'Thanksgiving is Thu Nov 26, in this week. Logging the day is enough. One weigh-in is not the whole week.'},
 {id:5,start:'2026-11-30',end:'2026-12-06',saturday:'2026-12-05',prompt:'If your plans are busier, which meals did you choose ahead of time?'},
 {id:6,start:'2026-12-07',end:'2026-12-13',saturday:'2026-12-12',prompt:'What do you want to keep noticing this week?'},
 {id:7,start:'2026-12-14',end:'2026-12-24',saturday:'2026-12-19',prompt:'This stretch runs through Thu Dec 24. The Saturday check-in is Dec 19. What is one thing you want to keep after the 24th?'}
];
const H50_WINS=[
 {id:1,start:'2026-11-05',end:'2026-11-11'},
 {id:2,start:'2026-11-12',end:'2026-11-18'},
 {id:3,start:'2026-11-19',end:'2026-11-25'},
 {id:4,start:'2026-11-26',end:'2026-12-02'},
 {id:5,start:'2026-12-03',end:'2026-12-09'},
 {id:6,start:'2026-12-10',end:'2026-12-16'},
 {id:7,start:'2026-12-17',end:'2026-12-23'}
];
const H50_TRAIN={plan:'Planned training',rest:'Planned rest',clinic:'Clinic-restricted',medical:'Medical rest'};
let h50Sel='',h50Seq=0,h50CopyOpts={context:false,priv:false};

function h50Esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function h50Iso(s){return /^\d{4}-\d{2}-\d{2}$/.test(s||'')}
function h50Date(iso){const [y,m,d]=String(iso||'').split('-').map(Number);return new Date(y,(m||1)-1,d||1,12,0,0,0)}
function h50ISO(dt){return dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0')+'-'+String(dt.getDate()).padStart(2,'0')}
function h50Shift(iso,n){const d=h50Date(iso);d.setDate(d.getDate()+n);return h50ISO(d)}
function h50Diff(a,b){return Math.round((h50Date(b)-h50Date(a))/86400000)}
function h50Index(iso){if(!h50Iso(iso)||iso<H50_START||iso>H50_END)return null;return h50Diff(H50_START,iso)+1}
function h50Range(a,b){const out=[];let d=a;while(d<=b&&out.length<80){out.push(d);d=h50Shift(d,1)}return out}
function h50Dates(){return h50Range(H50_START,H50_END)}
function h50Week(iso){return H50_WEEKS.find(w=>iso>=w.start&&iso<=w.end)||null}
function h50Win(iso){return H50_WINS.find(w=>iso>=w.start&&iso<=w.end)||null}
function h50Nice(iso){const d=h50Date(iso);return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}
function h50Bag(state,make){const cur=state&&state.holiday50;
 if(!cur||typeof cur!=='object'){const blank={v:1,days:{},weeks:{},flex:[],steps:{}};if(make&&state)state.holiday50=blank;return blank}
 if(make){cur.days||={};cur.weeks||={};cur.flex||=[];cur.steps||={}}
 return cur}
function h50Read(state){const h=h50Bag(state,false);return {v:h.v||1,days:h.days||{},weeks:h.weeks||{},flex:h.flex||[],steps:h.steps||{},enrolled:h.enrolled,moveLabel:h.moveLabel||''}}
function h50Write(){return h50Bag(S,true)}
function h50DayBag(state,iso,make){const h=h50Bag(state,!!make);const days=h.days||(make?h.days={}: {});if(!make)return days[iso]||{};days[iso]||={};return days[iso]}
function h50Before(h,iso){return !!(h&&h50Iso(h.enrolled)&&iso<h.enrolled)}
function h50Train(v){return H50_TRAIN[v]?v:'unknown'}
function h50Id(){h50Seq+=1;return 'f'+h50Seq.toString(36)}

function h50OnFile(state,iso){
 const sessions=(state&&state.sessions||[]).filter(s=>s&&s.date===iso&&Array.isArray(s.sets)&&s.sets.length>0);
 const done=state&&state.cond&&state.cond.done||{};
 const cond=Object.keys(done).filter(k=>done[k]&&done[k].date===iso).map(k=>done[k]);
 const tests=(state&&state.cond&&state.cond.tests||[]).filter(t=>t&&t.date===iso);
 return {sessions,cond,tests,any:!!(sessions.length||cond.length||tests.length)}}
function h50Program(state,iso){
 const meso=state&&state.meso,plan=state&&state.myPlan;
 const sched=meso&&Array.isArray(meso.schedule)&&meso.schedule.length===7?meso.schedule:(plan&&Array.isArray(plan.schedule)&&plan.schedule.length===7?plan.schedule:null);
 if(!sched)return null;
 const name=sched[(h50Date(iso).getDay()+6)%7];
 return name?{name:String(name),done:false}:null}
function h50Food(state,iso){
 if(typeof trendDay==='function')return trendDay(state&&state.log,iso,state&&state.logStatus);
 const rows=state&&state.log&&state.log[iso];
 const n=Array.isArray(rows)?rows.filter(Boolean).length:0;
 return {date:iso,status:'unknown',kcal:0,p:0,n,snack:0,timed:0,untimed:n,evening:0}}
function h50Weight(weights,start,end){
 const dates=h50Range(start,end),map={};
 (weights||[]).forEach(x=>{if(!x||!h50Iso(x.d))return;const w=+x.w;if(!isFinite(w))return;map[x.d]=w});
 const got=dates.filter(d=>map[d]!=null);
 if(!got.length)return {avg:null,n:0,days:dates.length,missing:dates.length,enough:false};
 return {avg:got.reduce((a,d)=>a+map[d],0)/got.length,n:got.length,days:dates.length,missing:dates.length-got.length,enough:got.length>=H50_W_MIN}}
function h50StepGoal(h){const s=h&&h.steps||{},base=isFinite(+s.baseline)?+s.baseline:null,goal=base!=null&&isFinite(+s.goal)?+s.goal:null;return {baseline:base,goal}}
function h50Marks(state,iso){
 const h=h50Read(state),day=h.days[iso]||{},c=day.checks||{},food=h50Food(state,iso);
 return {move:!!c.move,workout:!!c.workout,reflect:!!c.reflect,food:food.status||'unknown',train:h50Train(day.train),before:h50Before(h,iso),onFile:h50OnFile(state,iso).any}}
function h50WeekChecked(state,week){let n=0;h50Range(week.start,week.end).forEach(d=>{if(h50Marks(state,d).workout)n++});return n}
function h50CheckPut(state,iso,key,on){
 if(!h50Index(iso)||(key!=='move'&&key!=='workout'&&key!=='reflect'))return {ok:false,error:'That check is not on the tracker.'};
 const snap=JSON.stringify({log:state.log||null,sessions:state.sessions||null,weights:state.weights||null,settings:state.settings||null,logStatus:state.logStatus||null});
 const d=h50DayBag(state,iso,true);d.checks||={};
 if(on){d.checks[key]=1;d.confirmed='self'}else delete d.checks[key];
 if(!d.checks.move&&!d.checks.workout&&!d.checks.reflect)delete d.checks;
 if(!d.checks&&d.confirmed==='self')delete d.confirmed;
 const same=JSON.stringify({log:state.log||null,sessions:state.sessions||null,weights:state.weights||null,settings:state.settings||null,logStatus:state.logStatus||null})===snap;
 return same?{ok:true,self:true}:{ok:false,error:'Shared logs changed.'}}

function h50NotePut(state,iso,text){if(!h50Index(iso))return false;const d=h50DayBag(state,iso,true);
 const v=String(text||'').replace(/[\r\n]+/g,' ').trim().slice(0,280);if(v)d.note=v;else delete d.note;return true}
function h50TrainPut(state,iso,train){if(!h50Index(iso))return false;const d=h50DayBag(state,iso,true);
 if(H50_TRAIN[train])d.train=train;else delete d.train;return true}
function h50StepsPut(state,iso,raw){if(!h50Index(iso))return false;const d=h50DayBag(state,iso,true);
 if(raw===''||raw==null){delete d.steps;return true}const n=+raw;if(!isFinite(n)||n<0)return false;d.steps=Math.round(n);return true}
function h50ContextPut(state,iso,tag){if(!h50Index(iso))return false;const d=h50DayBag(state,iso,true);
 if(tag==='cycle'||tag==='travel'||tag==='event'||tag==='other')d.context=tag;else delete d.context;return true}
function h50PrivatePut(state,iso,text){if(!h50Index(iso))return false;const d=h50DayBag(state,iso,true);
 const v=String(text||'').replace(/\s+/g,' ').trim().slice(0,500);if(v)d.privateNote=v;else delete d.privateNote;return true}
function h50FlexPut(state,date,label){
 const log=JSON.stringify(state.log||null),sessions=JSON.stringify(state.sessions||null),settings=JSON.stringify(state.settings||null);
 if(!h50Index(date))return {ok:false,error:'Pick a date inside Nov 5 to Dec 24.'};
 const name=String(label||'').replace(/\s+/g,' ').trim().slice(0,80);
 if(!name)return {ok:false,error:'Add a short name for the planned meal.'};
 h50Bag(state,true).flex.push({id:h50Id(),date,label:name});
 const same=JSON.stringify(state.log||null)===log&&JSON.stringify(state.sessions||null)===sessions&&JSON.stringify(state.settings||null)===settings;
 return same?{ok:true}:{ok:false,error:'Shared logs changed.'}}
function h50FlexDel(state,id){const h=h50Bag(state,true);h.flex=h.flex.filter(f=>f&&f.id!==id)}
function h50BaselinePut(state,raw){const h=h50Bag(state,true);
 if(raw===''||raw==null){delete h.steps.baseline;delete h.steps.goal;return {ok:true,baseline:null,goal:null}}
 const n=+raw;if(!isFinite(n)||n<0)return {ok:false,error:'Enter a baseline as a number, or leave it blank.'};
 h.steps.baseline=Math.round(n);return {ok:true,baseline:h.steps.baseline,goal:h50StepGoal(h).goal}}
function h50GoalPut(state,raw){if(h50StepGoal(state&&state.holiday50).baseline==null)return {ok:false,error:'Enter a baseline first. There is no default goal.'};const h=h50Bag(state,true);
 if(raw===''||raw==null){delete h.steps.goal;return {ok:true,goal:null}}
 const n=+raw;if(!isFinite(n)||n<0)return {ok:false,error:'Enter a goal as a number, or leave it blank.'};
 h.steps.goal=Math.round(n);return {ok:true,goal:h.steps.goal}}
function h50WeekPut(state,id,key,value){if(!H50_WEEKS.some(w=>w.id===+id))return false;if(key!=='habits'&&key!=='obstacle'&&key!=='adjust')return false;
 const h=h50Bag(state,true);h.weeks[id]||={};
 const v=String(value||'').replace(/\s+/g,' ').trim().slice(0,500);if(v)h.weeks[id][key]=v;else delete h.weeks[id][key];return true}
function h50EnrollPut(state,iso){if(!h50Index(iso))return false;h50Bag(state,true).enrolled=iso;return true}
function h50MoveLabelPut(state,text){const h=h50Bag(state,true);const v=String(text||'').replace(/\s+/g,' ').trim().slice(0,80);if(v)h.moveLabel=v;else delete h.moveLabel;return true}

function h50Counts(state,dates){const c={complete:0,partial:0,none:0,unknown:0,total:dates.length},food=[];
 dates.forEach(d=>{const f=h50Food(state,d);c[f.status]++;food.push(f)});
 const done=food.filter(d=>d.status==='complete'),part=food.filter(d=>d.status==='partial');
 const avg=key=>done.length?done.reduce((a,d)=>a+(+d[key]||0),0)/done.length:null;
 return {c,avgKcal:avg('kcal'),avgP:avg('p'),n:done.length,partialN:part.length,partialKcal:part.reduce((a,d)=>a+d.kcal,0),partialP:part.reduce((a,d)=>a+d.p,0)}}
function h50TrainCounts(state,dates){const c={plan:0,rest:0,clinic:0,medical:0,unknown:0},h=h50Read(state);
 dates.forEach(d=>{c[h50Train(h.days[d]&&h.days[d].train)]++});return c}
function h50CoachText(state,weekId,opts,asOf){
 opts=opts||{};const week=H50_WEEKS.find(w=>w.id===+weekId)||h50Week(asOf||H50_START)||H50_WEEKS[0];
 const dates=h50Range(week.start,week.end),food=h50Counts(state,dates),tr=h50TrainCounts(state,dates),h=h50Read(state);
 const settings=state&&state.settings||{},kcal=isFinite(+settings.kcal)?Math.round(+settings.kcal):null,p=isFinite(+settings.p)?Math.round(+settings.p):null;
 const on=dates.filter(d=>h50OnFile(state,d).any).length;
 const win=h50Win(week.saturday),wA=win?h50Weight(state&&state.weights,win.start,win.end):h50Weight(state&&state.weights,week.end,week.end);
 const prev=win?H50_WINS.find(w=>w.id===win.id-1):null,wB=prev?h50Weight(state&&state.weights,prev.start,prev.end):null;
 const open=win&&asOf&&asOf<=win.end;
 let weight;
 if(!win)weight='Dec 24 is outside the 7-day windows. It is not folded into the previous average.';
 else if(wA.n===0)weight='No weigh-ins in '+win.start+' to '+win.end+' (n=0). Missing days are not counted as zero.';
 else if(open)weight=h50Num(wA.avg)+' '+((settings.unit==='kg')?'kg':'lb')+' so far, n='+wA.n+' of '+wA.days+'. This 7-day window is still open.';
 else if(!wA.enough||!wB||!wB.enough)weight=h50Num(wA.avg)+' '+((settings.unit==='kg')?'kg':'lb')+', n='+wA.n+'. Not enough weigh-ins to call a trend'+(wB?(' (prior n='+wB.n+')'):'')+'.';
 else{const d=Math.round((wA.avg-wB.avg)*10)/10;weight=h50Num(wA.avg)+' vs prior '+h50Num(wB.avg)+' '+((settings.unit==='kg')?'kg':'lb')+', n='+wA.n+' and n='+wB.n+'. Change '+h50Num(d)+'.'}
 const lines=['Holiday 50 check-in','Week '+week.id+', '+week.start+' to '+week.end,'Saturday check-in: '+week.saturday,'',
  'Coverage: '+food.c.complete+' complete, '+food.c.partial+' partial, '+food.c.none+' not logged, '+food.c.unknown+' unknown',
  'Calories, complete days only: '+(food.avgKcal==null?'none':h50Num(food.avgKcal)+' avg, n='+food.n),
  'Protein, complete days only: '+(food.avgP==null?'none':Math.round(food.avgP)+' g avg, n='+food.n),
  'Saved calorie goal: '+(kcal==null?'none on this phone':kcal+' (not marked medically approved)'),
  'Saved protein goal: '+(p==null?'none on this phone':p+' g (not marked medically approved)'),
  'Partial days, separate: '+(food.partialN?'n='+food.partialN+', '+h50Num(food.partialKcal)+' kcal and '+Math.round(food.partialP)+' g protein on file':'none'),
  'Weight: '+weight,
  'Completed sessions on file: '+on,
  'Training notes: planned training '+tr.plan+', planned rest '+tr.rest+', clinic-restricted '+tr.clinic+', medical rest '+tr.medical+', unknown '+tr.unknown,
  'Program plans are not counted as completed. Checks are self-confirmed and do not add records.',
  'Workout checks this week: '+h50WeekChecked(state,week)+'. There is no daily workout requirement.',
  'No session is marked missed. Blank days stay unknown.'];
 const steps=h50StepGoal(h);
 lines.push('Step baseline: '+(steps.baseline==null?'not set':String(steps.baseline)),'Step goal: '+(steps.goal==null?'not set':String(steps.goal)));
 const stepDays=dates.filter(d=>h.days[d]&&isFinite(+h.days[d].steps));
 lines.push(stepDays.length?'Steps entered: '+stepDays.map(d=>d+' '+h.days[d].steps).join(', '):'No step numbers entered.');
 dates.forEach(d=>{const note=h.days[d]&&h.days[d].note;if(note)lines.push('Reflection '+d+': '+note)});
 if(!dates.some(d=>h.days[d]&&h.days[d].note))lines.push('No reflections in this week.');
 const eve=typeof trendEvening==='function'?trendEvening(dates.map(d=>h50Food(state,d))):{claim:false,why:'Meal times are not available.'};
 lines.push('Evening: '+(eve.claim?Math.round((eve.pct||0)*100)+'% from meal times you entered':eve.why));
 const flex=(h.flex||[]).filter(f=>f&&f.date>=week.start&&f.date<=week.end);
 lines.push(flex.length?'Planned flexible meals: '+flex.map(f=>f.date+' '+f.label).join('; '):'No flexible meals planned.');
 const wk=h.weeks[week.id]||{};
 lines.push('Habits: '+(wk.habits||'none'),'Obstacle: '+(wk.obstacle||'none'),'One adjustment: '+(wk.adjust||'none'));
 if(opts.context){const tags=dates.filter(d=>h.days[d]&&h.days[d].context).map(d=>d+' '+h.days[d].context);lines.push(tags.length?'Context tags: '+tags.join(', '):'Context tags: none')}
 else lines.push('Context tags are not included.');
 if(opts.priv){const notes=dates.filter(d=>h.days[d]&&h.days[d].privateNote);notes.forEach(d=>lines.push('Private note '+d+': '+h.days[d].privateNote));if(!notes.length)lines.push('Private notes: none')}
 else lines.push('Private notes are not included.');
 lines.push('Saved goals were not changed.');
 return lines.join('\n')}
function h50Num(n){return (Math.round((+n||0)*10)/10).toLocaleString('en-US')}

let h50View='';
function h50Selected(){if(h50Index(h50Sel))return h50Sel;const t=typeof today==='function'?today():H50_START;if(h50Index(t))return t;return t<H50_START?H50_START:H50_END}
function holidayEntry(){const t=typeof today==='function'?today():H50_START,n=h50Index(t);
 const line=n?'Calendar day '+n+' of 50.':(t<H50_START?'Starts Thu Nov 5.':'Day 50 was Thu Dec 24.');
 return `<button type="button" class="card h50go" onclick="show('holiday')"><b>Holiday 50</b><small>${line} Nov 5 to Dec 24. Food, workouts, and weigh-ins stay in their own logs.</small></button>`}
function h50Paint(){const y=window.scrollY;renderHoliday();window.scrollTo(0,y)}
function h50Open(iso){if(!h50Index(iso))return;h50Sel=iso;h50Paint()}
function h50ShiftDay(n){const d=h50Shift(h50Selected(),n);if(h50Index(d))h50Open(d)}
function h50Dot(on,part,letter){return `<i class="${on?'on':part?'part':''}">${letter}</i>`}
function h50MD(iso){return h50Date(iso).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function h50Full(iso){return h50Date(iso).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
function h50Month(iso){return h50Date(iso).toLocaleDateString('en-US',{month:'long',year:'numeric'})}
function h50Grid(){let prev='';
 return `<div class="card" id="h50grid"><p class="h50legend"><b>M</b> movement <b>W</b> workout <b>F</b> food complete <b>R</b> reflection</p>${H50_WEEKS.map(w=>{const month=h50Month(w.start),banner=month===prev?'':`<h4 class="h50month">${month}</h4>`,n=h50WeekChecked(S,w);prev=month;
  const cells=h50Range(w.start,w.end).map(d=>{const m=h50Marks(S,d),rest=m.train==='rest'||m.train==='clinic'||m.train==='medical';
   const tag=m.train==='medical'?'Medical':m.train==='clinic'?'Clinic':m.train==='rest'?'Rest':'';
   return `<button type="button" class="h50cell${d===h50Selected()?' on':''}${m.before?' before':''}${rest?' rest':''}" data-day="${d}" aria-pressed="${d===h50Selected()?'true':'false'}" aria-label="${h50Esc(h50Full(d))}${m.before?'. Before you started.':''}${m.move?' Movement checked.':' Movement open.'}${m.workout?' Workout checked.':' Workout open.'}" onclick="h50Open('${d}')"><b>${h50Date(d).getDate()}</b><small>${h50Date(d).toLocaleDateString('en-US',{weekday:'narrow'})}</small><span class="h50dots" aria-hidden="true">${h50Dot(m.move,0,'M')}${h50Dot(m.workout,0,'W')}${h50Dot(m.food==='complete',m.food==='partial','F')}${h50Dot(m.reflect,0,'R')}</span>${tag?`<em>${tag}</em>`:''}</button>`}).join('');
  return banner+`<div class="h50wk"><div class="h50wkhead"><b>Week ${w.id}, ${h50MD(w.start)} to ${h50MD(w.end)}</b><span>Workouts checked: ${n}</span></div><div class="h50cells">${cells}</div></div>`}).join('')}</div>`}
function h50CheckButtons(iso){const m=h50Marks(S,iso);
 const btn=(key,on,label)=>`<button type="button" class="chip${on?' on':''}" data-check="${key}" aria-pressed="${on?'true':'false'}" onclick="h50Toggle('${iso}','${key}')">${label}</button>`;
 return `<div class="trwin" id="h50checks" role="group" aria-label="Self-confirmed checks">${btn('move',m.move,'Movement')}${btn('workout',m.workout,'Workout done')}${btn('reflect',m.reflect,'Reflection')}</div><p class="muted">Self-confirmed. Uncheck any box to correct it. These boxes do not add food, weight, or workout records.</p>`}

function renderHoliday(){
 const iso=h50Selected(),week=h50Week(iso),h=h50Read(S),modelFood=h50Food(S,iso),on=h50OnFile(S,iso),plan=h50Program(S,iso);
 const day=h.days[iso]||{},train=h50Train(day.train),before=h50Before(h,iso),n=h50Index(iso);
 const flex=(h.flex||[]).filter(f=>week&&f.date>=week.start&&f.date<=week.end);
 const steps=h50StepGoal(h),wk=h.weeks[week.id]||{};
 const asOf=typeof today==='function'?today():iso,win=h50Win(week.saturday);
 const wA=win?h50Weight(S.weights,win.start,win.end):null,prev=win?H50_WINS.find(w=>w.id===win.id-1):null;
 const wB=prev?h50Weight(S.weights,prev.start,prev.end):null,unit=S.settings&&S.settings.unit==='kg'?'kg':'lb';
 const g=S.settings||{};
 const foodWord={unknown:'Unknown',complete:'Complete',partial:'Partial',none:'Not logged'}[modelFood.status]||'Unknown';
 $('#holiday').innerHTML=`
 <div class="ovh" id="h50top"><h2>Holiday 50</h2>
 <p>Challenge tracker, November 5 to December 24, 2026</p>
 <p><b>Day ${n} of 50</b>, ${h50Esc(h50Full(iso))}</p>
 <p class="muted">Tap a day to check it.</p>
 ${h.enrolled?'':`<button type="button" class="btn" onclick="h50Start()">Start from today</button>`}</div>
 ${h50Grid()}
 <div class="card" id="h50day"><h3>${h50Esc(h50Full(iso))}</h3>
 <div class="h50nav"><button type="button" onclick="h50ShiftDay(-1)" aria-label="Previous day">Prev</button><b>Day ${n} of 50</b><button type="button" onclick="h50ShiftDay(1)" aria-label="Next day">Next</button></div>
 ${before?'<p class="h50note">Before you started. Nothing is required for this day.</p>':''}
  <h4>Food</h4>
  <div class="trwin" role="group" aria-label="Food completeness">${[['unknown','Unknown'],['complete','Complete'],['partial','Partial'],['none','Not logged']].map(([v,l])=>`<button type="button" class="chip${modelFood.status===v?' on':''}" aria-pressed="${modelFood.status===v?'true':'false'}" onclick="trendSetStatus('${iso}','${v}')">${l}</button>`).join('')}</div>
  <p class="muted">${foodWord}. ${modelFood.n?modelFood.n+' item'+(modelFood.n===1?'':'s')+' on file.':'Nothing logged on this date.'} Unknown until you choose.</p>
  <h4 id="h50move">Habits</h4>
  <p>${plan?'Program: '+h50Esc(plan.name)+'. A plan is not a completed workout. ':'No weekday program is saved. '}${on.any?'On file: '+h50Esc((on.sessions[0]&&on.sessions[0].day)||'workout')+'.':'No finished workout on file.'}</p>
  ${h50CheckButtons(iso)}
  <div class="trwin" role="group" aria-label="Training note">${[['unknown','No note'],['plan','Planned training'],['rest','Planned rest'],['clinic','Clinic-restricted'],['medical','Medical rest']].map(([v,l])=>`<button type="button" class="chip${train===v?' on':''}" aria-pressed="${train===v?'true':'false'}" onclick="h50TrainSet('${iso}','${v}')">${l}</button>`).join('')}</div>
  <p class="muted">${train==='medical'?'Medical rest. No steps or workout are required. A blank session stays unknown.':train==='clinic'?'Clinic-restricted. This does not mean a walk or a row is allowed.':train==='rest'?'Planned rest. Empty checks are not a miss.':train==='plan'?'Planned training. The plan is not a completed session.':'No training note.'}</p>
  <details id="h50more"><summary>Weight, reflection, and notes</summary>
  <p class="muted">${h50DayWeight(S.weights,iso,unit)}.</p>
  <label>Weight for this date, optional<input id="h50wt" inputmode="decimal" placeholder="Leave blank to add nothing"></label>
  <button type="button" class="btn sec" onclick="h50WeightSave()">Save weight in the weight log</button>
  <label>Movement, in your words, optional<input id="h50mlabel" maxlength="80" value="${h50Esc(h.moveLabel||'')}" onchange="h50MoveLabelSet(this.value)" placeholder="Only if you want a name for it"></label>
  <label>One-line reflection, optional<input id="h50note" maxlength="280" value="${h50Esc(day.note||'')}" onchange="h50NoteSet('${iso}',this.value)"></label>
  <label>Context tag, optional<select aria-label="Context tag" onchange="h50ContextSet('${iso}',this.value)">${[['','None'],['cycle','Cycle'],['travel','Travel'],['event','Event'],['other','Other']].map(([v,l])=>`<option value="${v}"${(day.context||'')===v?' selected':''}>${l}</option>`).join('')}</select></label>
  <label>Private note, optional<textarea id="h50priv" rows="2" maxlength="500" onchange="h50PrivateSet('${iso}',this.value)">${h50Esc(day.privateNote||'')}</textarea></label>
  <p class="muted">A private note stays on this phone unless you include it in a copy.</p>
  <button type="button" class="btn sec" onclick="show('food')">Open Food</button>
  <button type="button" class="btn sec" onclick="show('workout')">Open Workout</button></details></div>
 <div class="card" id="h50checkin"><h3>Saturday check-in</h3><p class="muted">Week ${week.id}, ${h50Esc(h50MD(week.start))} to ${h50Esc(h50MD(week.end))}. Check-in day is ${h50Esc(h50Full(week.saturday))}.</p>
  <p>${h50Esc(week.prompt)}</p>
  <label>Habits<input value="${h50Esc(wk.habits||'')}" onchange="h50WeekSet(${week.id},'habits',this.value)"></label>
  <label>Obstacle<input value="${h50Esc(wk.obstacle||'')}" onchange="h50WeekSet(${week.id},'obstacle',this.value)"></label>
  <label>One realistic adjustment<input value="${h50Esc(wk.adjust||'')}" onchange="h50WeekSet(${week.id},'adjust',this.value)"></label>
  <p class="muted">${h50WeightLine(win,wA,wB,asOf,unit)}</p>
  <button type="button" class="btn" id="h50-copy" onclick="h50Copy()">Copy for Coach</button></div>
 ${h50WeighCard(asOf,unit)}
 <div class="card"><h3>Flexible meals</h3><p class="muted">Optional plans for this week. They are not added to the food log, and they do not change saved goals.</p>
  ${flex.length?`<ul class="h50ev">${flex.map(f=>`<li>${h50Esc(h50Nice(f.date))}: ${h50Esc(f.label)} <button type="button" class="link" onclick="h50FlexRemove('${f.id}')">Remove</button></li>`).join('')}</ul>`:'<p class="muted">None planned.</p>'}
  <label>Date<input id="h50fd" type="date" min="${H50_START}" max="${H50_END}" value="${iso}"></label>
  <label>Name<input id="h50fl" maxlength="80" placeholder="Dinner out"></label>
  <button type="button" class="btn sec" onclick="h50FlexAdd()">Add planned meal</button></div>
 <div class="card"><h3>Movement goal</h3><p class="muted">Step baseline is unknown until you enter one. There is no default of 7,000, and a goal is saved only after a baseline. The usual program stays Thu Push, Fri Pull, Sat Legs, and Sun Conditioning. Nothing here adds extra sessions.</p>
  <label>Baseline, optional<input id="h50base" inputmode="numeric" value="${steps.baseline==null?'':steps.baseline}" onchange="h50BaseSet(this.value)"></label>
  <label>Goal, optional<input id="h50goal" inputmode="numeric" value="${steps.goal==null?'':steps.goal}" onchange="h50GoalSet(this.value)"></label></div>
 <details class="card h50def" id="h50help"><summary>Help</summary>
 <p>Week 1 is Thu Nov 5 to Sun Nov 8. Weeks 2 to 6 are Monday to Sunday. Week 7 is Mon Dec 14 to Thu Dec 24. Saturday is the check-in day.</p>
 <p>M, W, and R are self-confirmed. F is complete only when you choose Complete. Unknown is the default, including older days. An empty box is not a miss. Days before you start are optional.</p>
 <p>A planned workout does not check W. A finished workout on file does not check it either, and there is no time minimum. Saved goals stay ${isFinite(+g.kcal)?Math.round(g.kcal):'unset'} kcal and ${isFinite(+g.p)?Math.round(g.p):'unset'} g protein. They are not marked medically approved.</p>
 ${h.enrolled?`<button type="button" class="link" onclick="h50ClearStart()">Clear start date</button>`:''}
 </details>`;
}
function h50WeightLine(win,wA,wB,asOf,unit){
 if(!win)return 'Dec 24 stands on its own, outside the 7-day weigh-in weeks.';
 if(!wA||wA.n===0)return 'No weigh-ins from '+h50MD(win.start)+' to '+h50MD(win.end)+'.';
 const word=wA.n===1?'1 weigh-in':wA.n+' weigh-ins',avg=word+', average '+h50Num(wA.avg)+' '+unit;
 if(asOf<=win.end)return avg+' from '+h50MD(win.start)+' to '+h50MD(win.end)+'. This week is still open.';
 if(!wA.enough||!wB||!wB.enough)return avg+' from '+h50MD(win.start)+' to '+h50MD(win.end)+'. Not enough weigh-ins to call a trend.';
 const d=Math.round((wA.avg-wB.avg)*10)/10;
 return avg+' from '+h50MD(win.start)+' to '+h50MD(win.end)+'. Prior week averaged '+h50Num(wB.avg)+' '+unit+' from '+wB.n+' weigh-in'+(wB.n===1?'':'s')+'. Change '+h50Num(d)+'.'}
function h50DayWeight(weights,iso,unit){const hit=(weights||[]).find(w=>w&&w.d===iso&&isFinite(+w.w));return hit?h50Num(hit.w)+' '+unit+' on this date':'No weigh-in on this date'}
function h50WeighPhrase(w,s,unit,asOf){const when=h50MD(w.start)+' to '+h50MD(w.end);
 if(!s||s.n===0)return when+': no weigh-ins'+(w.start<=asOf&&w.end>=asOf?' yet':'');
 const word=s.n===1?'1 weigh-in':s.n+' weigh-ins';
 return when+': '+word+', average '+h50Num(s.avg)+' '+unit+(s.enough?'':', not enough to call a trend')}
function h50WeighCard(asOf,unit){const now=[],later=[];
 H50_WINS.forEach(w=>{const s=h50Weight(S.weights,w.start,w.end),line=`<div class="trwk"><span>${h50Esc(h50WeighPhrase(w,s,unit,asOf))}</span></div>`;
  if(w.start>asOf&&s.n===0)later.push(line);else now.push(line)});
 const dec=h50Weight(S.weights,'2026-12-24','2026-12-24'),decLine=`<div class="trwk"><span>${h50Esc('Dec 24: '+(dec.n?h50Num(dec.avg)+' '+unit:'no weigh-in'))}</span></div>`;
 if(asOf>='2026-12-24'||dec.n)now.push(decLine);else later.push(decLine);
 return `<div class="card" id="h50weigh"><h3>Weigh-ins</h3><p class="muted">Same weight log as Food. Days without a weigh-in are left out of the average.</p>${now.join('')||'<p class="muted">No weigh-ins in the challenge yet.</p>'}${later.length?`<details><summary>Later weeks</summary>${later.join('')}</details>`:''}</div>`}

function h50Start(){const t=typeof today==='function'?today():H50_START,d=t<H50_START?H50_START:(t>H50_END?H50_END:t);h50EnrollPut(S,d);save();h50Paint();toast('Started '+d+'. Earlier days stay optional.')}
function h50ClearStart(){delete h50Write().enrolled;save();h50Paint()}
function h50TrainSet(iso,v){h50TrainPut(S,iso,v);save();h50Paint()}
function h50NoteSet(iso,v){h50NotePut(S,iso,v);save()}
function h50StepsSet(iso,v){if(!h50StepsPut(S,iso,v))toast('Enter steps as a number, or leave the field blank.');else save()}
function h50ContextSet(iso,v){h50ContextPut(S,iso,v);save()}
function h50PrivateSet(iso,v){h50PrivatePut(S,iso,v);save()}
function h50WeekSet(id,key,v){h50WeekPut(S,id,key,v);save()}
function h50FlexAdd(){const date=$('#h50fd')?$('#h50fd').value:'',label=$('#h50fl')?$('#h50fl').value:'',res=h50FlexPut(S,date,label);
 if(!res.ok){toast(res.error);return}save();h50Paint();toast('Planned meal saved. The food log was not changed.')}
function h50FlexRemove(id){h50FlexDel(S,id);save();h50Paint()}
function h50BaseSet(v){const res=h50BaselinePut(S,v);if(!res.ok){toast(res.error);return}save();toast(res.baseline==null?'Baseline cleared.':'Baseline saved. There is still no default goal.')}
function h50GoalSet(v){const res=h50GoalPut(S,v);if(!res.ok){toast(res.error);return}save();toast('Goal saved on this phone.')}
function h50Toggle(iso,key){const day=(h50Read(S).days||{})[iso]||{};const on=!(day.checks&&day.checks[key]);const res=h50CheckPut(S,iso,key,on);
 if(!res.ok){toast(res.error||'That check did not save.');return}save();h50Paint()}
function h50MoveLabelSet(v){h50MoveLabelPut(S,v);save()}
function h50WeightSave(){const iso=h50Selected(),raw=$('#h50wt')?String($('#h50wt').value||'').trim():'';
 if(!raw){toast('No weight entered. Nothing was added.');return}const w=Math.round((+raw)*10)/10;if(!(w>0)){toast('Enter a weight to save it. Nothing was added.');return}
 const food=JSON.stringify(S.log),sessions=JSON.stringify(S.sessions),goals=JSON.stringify(S.settings);
 S.weights=(S.weights||[]).filter(x=>!x||x.d!==iso);S.weights.push({d:iso,w});S.weights.sort((a,b)=>a.d<b.d?-1:1);
 if(JSON.stringify(S.log)!==food||JSON.stringify(S.sessions)!==sessions||JSON.stringify(S.settings)!==goals){toast('Stopped. Saved logs would have changed.');return}
 save();h50Paint();toast('Weight saved in your weight log.')}
function h50Copy(opts){if(opts)h50CopyOpts=Object.assign({context:false,priv:false},opts);const week=h50Week(h50Selected());
 const text=h50CoachText(S,week.id,h50CopyOpts,typeof today==='function'?today():h50Selected());window.__coachText=text;
 modal(`<h3>Copy for Coach</h3><p class="muted">This is the text that will be copied. Context tags and private notes stay off unless you include them.</p>
 <label class="mchk"><input type="checkbox" id="h50-inc-context" ${h50CopyOpts.context?'checked':''} onchange="h50Copy({context:this.checked,priv:h50CopyOpts.priv})"> Include context tags</label>
 <label class="mchk"><input type="checkbox" id="h50-inc-priv" ${h50CopyOpts.priv?'checked':''} onchange="h50Copy({context:h50CopyOpts.context,priv:this.checked})"> Include private notes</label>
 <pre id="h50-preview" class="copypre">${h50Esc(text)}</pre>
 <button type="button" class="btn" id="h50-copy-go" onclick="h50CopyNow()">Copy this text</button>`)}
function h50CopyNow(){const text=window.__coachText||'';const ok=()=>toast('Copied for your coach.');
 const fail=()=>{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');ok()}catch(e){toast('Could not copy. Try again.')}ta.remove()};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(ok).catch(fail);else fail()}
