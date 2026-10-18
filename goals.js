/* ---------- goals, projection, macro calculator (loaded before app.js; functions only) ---------- */
const GOAL_DAY=864e5,GOAL_START={d:'2026-10-13',w:187};
const GOAL_COACH={m1:{w:183,set:'2026-10-13',date:'2026-11-13'},m6:{w:166,set:'2026-10-13',date:'2027-04-13'},lt:{w:145,set:'2026-10-13'}};
const GOAL_NAMES={m1:'1-month goal',m6:'6-month goal',lt:'Long-term goal'},GOAL_SPAN={m1:30,m6:182};
const gDay=d=>Math.round(Date.parse(d+'T00:00:00Z')/GOAL_DAY);
const gDate=n=>new Date(n*GOAL_DAY+43200000).toISOString().slice(0,10);
const gFmt=n=>{const d=new Date(n*GOAL_DAY+43200000),y=d.getUTCFullYear()!==new Date().getFullYear();return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:y?'numeric':undefined,timeZone:'UTC'})};
const gMon=n=>{const d=new Date(n*GOAL_DAY+43200000);return d.toLocaleDateString(undefined,{month:'short',timeZone:'UTC'})+(d.getUTCFullYear()!==new Date().getFullYear()?" '"+String(d.getUTCFullYear()).slice(2):'')};
const gLb=()=>S.settings.unit==='kg'?0.45359237:1;
const gU=()=>S.settings.unit||'lb';
const gNum=x=>(Math.round(x*10)/10).toLocaleString();
function goalState(){S.goals||={};return S.goals}
/* 7-day moving average by calendar day (entry plus any entries in the 6 days before it) */
function wMA(){const W=[...S.weights].sort((a,b)=>a.d<b.d?-1:1).map(x=>({d:x.d,n:gDay(x.d),w:+x.w}));
 return W.map((x,i)=>{const win=W.filter(y=>y.n<=x.n&&y.n>x.n-7);return{...x,ma:win.reduce((a,y)=>a+y.w,0)/win.length}})}
function goalTrend(M){if(!M.length)return null;const last=M.at(-1).n,P=M.filter(x=>x.n>last-28);
 if(P.length<4||last-P[0].n<10)return null;const k=P.length,mx=P.reduce((a,x)=>a+x.n,0)/k,my=P.reduce((a,x)=>a+x.ma,0)/k;
 const sxx=P.reduce((a,x)=>a+(x.n-mx)**2,0),sxy=P.reduce((a,x)=>a+(x.n-mx)*(x.ma-my),0);
 return{rate:-(sxy/sxx)*7,span:last-P[0].n,count:k}}
function goalPlan(){const g=S.settings;return g.tdee?{rate:(g.tdee-g.kcal)*7/3500*gLb(),def:g.tdee-g.kcal}:null}
function goalCalc(){const M=wMA(),G=goalState(),tr=goalTrend(M),pl=goalPlan(),now=gDay(today()),cur=M.length?M.at(-1).ma:null,curN=M.length?M.at(-1).n:now;
 const flat=0.1*gLb(),useTr=!!tr,rate=tr?tr.rate:(pl?pl.rate:null),moving=rate!=null&&rate>flat;
 const goals=['m1','m6','lt'].filter(k=>G[k]&&G[k].w).map(k=>{const g=G[k],tN=g.date?gDay(g.date):null,o={k,g,tN};
  if(cur==null)return o;o.rem=cur-g.w;if(o.rem<=0){o.reached=1;return o}
  if(moving){o.projN=Math.round(curN+o.rem/(rate/7));if(tN)o.onTrack=o.projN<=tN}
  if(pl&&pl.rate>flat)o.planN=Math.round(curN+o.rem/(pl.rate/7));
  if(tN){const wk=(tN-now)/7;o.past=tN<now;o.need=wk>0?o.rem/wk:null;o.fast=o.need!=null&&o.need>1.5*gLb()}
  return o});
 let recal=null;if(tr&&tr.span>=14){const e=Math.round((S.settings.kcal+tr.rate/gLb()*500)/10)*10;if(e>=1200&&e<=4500)recal=e}
 return{M,tr,pl,rate,useTr,moving,cur,curN,now,goals,recal}}
function goalCard(){const g=S.settings,u=gU(),G=goalState(),R=goalCalc();let h='<div class="card goals"><h3>Goals</h3>';
 const coachDiff=['m1','m6','lt'].some(k=>!G[k]||Math.abs(G[k].w-GOAL_COACH[k].w*gLb())>0.05);
 if(G.start)h+=`<p class="muted">Started at ${gNum(G.start.w)} ${u} on ${gFmt(gDay(G.start.d))}${R.cur!=null?` · ${R.cur<=G.start.w?'down':'up'} ${gNum(Math.abs(G.start.w-R.cur))} ${u} so far`:''}</p>`;
 // rates
 if(R.tr)h+=`<p class="gl"><b>Your trend:</b> ${R.tr.rate>0.1*gLb()?`losing ${gNum(R.tr.rate)} ${u}/week`:R.tr.rate<-0.1*gLb()?`up ${gNum(-R.tr.rate)} ${u}/week`:'holding steady'} over the last ${R.tr.span+1} days (7-day average).</p>`;
 else h+=`<p class="muted">${R.cur==null?'Log your weight above to see projections.':'Log a few more weigh-ins to see your real trend.'}</p>`;
 if(R.pl)h+=`<p class="gl"><b>Your plan:</b> ${R.pl.def>0?`about ${gNum(R.pl.rate)} ${u}/week (${g.tdee} maintenance minus ${g.kcal} target = ${R.pl.def} kcal/day)`:`no deficit (target ${g.kcal} is at or above maintenance ${g.tdee})`}. Realistic range: ${u==='kg'?'0.35 to 0.45 kg':'0.75 to 1 lb'}/week.</p>`;
 else h+=`<p class="muted">Add your maintenance calories in Settings to see your plan rate.</p>`;
 const iv=goalIntake();if(iv&&g.tdee)h+=`<p class="muted">If you hit your calories: your last ${iv.days} logged day${iv.days>1?'s':''} averaged ${iv.kcal} kcal, about ${gNum(Math.max(0,(g.tdee-iv.kcal)*7/3500*gLb()))} ${u}/week at ${g.tdee} maintenance.</p>`;
 if(R.recal)h+=`<div class="gsug"><div><b>Real maintenance looks like about ${R.recal} kcal</b><small>From your ${R.tr.span+1}-day trend, assuming you eat about ${g.kcal} a day.</small></div>${Math.abs(R.recal-(g.tdee||0))>=20?`<button class="btn sm" onclick="goalUseTdee(${R.recal},'trend')">Use this</button>`:'<span class="pill">In use</span>'}</div>`;
 // goals
 h+=['m1','m6','lt'].map(k=>{const o=R.goals.find(x=>x.k===k);if(!o)return `<div class="grow1"><div><b>${GOAL_NAMES[k]}</b><small>Not set</small></div><button class="btn sec sm" onclick="goalForm('${k}')">Set</button></div>`;
  let s='';const by=o.tN?` by ${gFmt(o.tN)}`:'';
  if(R.cur==null)s='Log your weight to see your projection.';
  else if(o.reached)s=`<span class="gok">Reached. Nice work!</span>`;
  else{s=`${gNum(o.rem)} ${u} to go. `;
   if(R.moving)s+=`At ${R.useTr?'your current pace':'your plan pace'} you'd get there around <b>${gFmt(o.projN)}</b>. `+(o.tN?(o.onTrack?'<span class="gok">On track.</span>':`<span class="gwarn">About ${Math.max(1,Math.round((o.projN-o.tN)/7))} week${Math.round((o.projN-o.tN)/7)>1?'s':''} behind.</span>`):'');
   else s+=`<span class="gwarn">At this pace you won't reach it.</span> Try logging every bite for a week and check your maintenance number. `+(o.planN?`On plan you'd get there around ${gFmt(o.planN)}.`:'');
   if(o.past)s+=' The target date has passed, so set a new one when you are ready.';
   else if(o.fast)s+=` <span class="gwarn">Faster than your coach recommends (needs ${gNum(o.need)} ${u}/week).</span>`}
  return `<div class="grow1"><div class="grow"><b>${GOAL_NAMES[k]}: ${gNum(o.g.w)} ${u}${by}</b><small>${s}</small></div><button class="btn sec sm" onclick="goalForm('${k}')">Edit</button></div>`}).join('');
 if(coachDiff){const c=GOAL_COACH,L=gLb();h+=`<div class="gsug"><div><b>Coach suggestion</b><small>${gNum(c.m1.w*L)} ${u} by ${gFmt(gDay(c.m1.date))}, ${gNum(c.m6.w*L)} ${u} by ${gFmt(gDay(c.m6.date))}, long-term ${gNum(c.lt.w*L)} ${u}. Paced from ${gNum(GOAL_START.w*L)} ${u} on ${gFmt(gDay(GOAL_START.d))}.</small></div><button class="btn sm" onclick="goalCoach()">Apply</button></div>`}
 if(S.weights.length&&(R.goals.length||R.rate))h+=`<div class="chips gview"><button class="chip ${S.goalView!=='6m'?'on':''}" onclick="S.goalView='1m';save();renderFood()">Next month</button><button class="chip ${S.goalView==='6m'?'on':''}" onclick="S.goalView='6m';save();renderFood()">Long view</button></div>`;
 return h+'</div>'}
function goalIntake(){const days=[];for(let i=1;i<=7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=d.toLocaleDateString('en-CA');if((S.log[k]||[]).length)days.push(dayTotals(k).kcal)}
 return days.length?{days:days.length,kcal:Math.round(avg(days))}:null}
function goalForm(k){const G=goalState(),o=G[k],u=gU(),def=o&&o.date?o.date:(GOAL_SPAN[k]?gDate(gDay(today())+GOAL_SPAN[k]):'');
 modal(`<h3>${GOAL_NAMES[k]}</h3><label>Goal weight (${u})<input id="gw" type="number" step="0.1" inputmode="decimal" value="${o?o.w:''}"></label>
 ${GOAL_SPAN[k]?`<label>Target date<input id="gd" type="date" value="${def}"></label><p class="muted">New goals default to ${GOAL_SPAN[k]} days from today.</p>`:'<p class="muted">No fixed date. FitCoach projects when you will get there.</p>'}
 <div class="inl"><button class="btn" onclick="goalSave('${k}')">Save</button>${o?`<button class="btn danger" onclick="goalClear('${k}')">Clear</button>`:''}</div>`)}
function goalSave(k){const w=+$('#gw').value;if(!w)return;const G=goalState(),o={w,set:today()};
 if(GOAL_SPAN[k])o.date=($('#gd')&&$('#gd').value)||gDate(gDay(today())+GOAL_SPAN[k]);G[k]=o;save();closeModal();renderFood()}
function goalClear(k){delete goalState()[k];save();closeModal();renderFood()}
function goalCoach(){const G=goalState(),L=gLb(),has=['m1','m6','lt'].some(k=>G[k]);
 if(has&&!confirm('Replace your current goals with the coach suggestion?'))return;
 for(const k in GOAL_COACH){G[k]={...GOAL_COACH[k],w:Math.round(GOAL_COACH[k].w*L*10)/10}}G.start={d:GOAL_START.d,w:Math.round(GOAL_START.w*L*10)/10};save();renderFood()}
function goalUseTdee(v,src){S.settings.tdee=v;S.settings.tdeeSrc=src;save();toast(`Maintenance set to ${v} kcal.`,3000);
 if(location.hash==='#settings')renderSettings();else renderFood()}
/* chart: weights, 7-day average, expected range band, projection, goal markers */
function drawWeight(){const R=goalCalc(),M=R.M.slice(-60),u=gU(),L=gLb();if(!M.length)return;
 const ds=[{label:'Weight',data:M.map(x=>({x:x.n,y:x.w})),borderColor:'#8E8E93',backgroundColor:'#8E8E93',pointRadius:2,showLine:false},
  {label:'7-day avg',data:M.map(x=>({x:x.n,y:Math.round(x.ma*10)/10})),borderColor:'#22c55e',pointRadius:0,tension:.3,borderWidth:2}];
 const gs=R.goals.filter(o=>!o.reached),view=S.goalView==='6m'?'6m':'1m';
 let end=R.curN+35;const ends=gs.map(o=>o.tN||o.projN||o.planN).filter(Boolean);
 if(view==='1m'){const m1=R.goals.find(o=>o.k==='m1');end=Math.max(end,m1&&m1.tN?m1.tN+3:0)}else end=Math.max(end,...ends.map(n=>n+7));
 end=Math.min(end,R.curN+730);
 if(R.cur!=null&&R.pl&&R.pl.rate>0){const lo=0.75*L,hi=1*L,d=end-R.curN;
  ds.push({label:'_hi',data:[{x:R.curN,y:R.cur},{x:end,y:R.cur-hi*d/7}],borderColor:'transparent',pointRadius:0,fill:false},
   {label:'Expected range',data:[{x:R.curN,y:R.cur},{x:end,y:R.cur-lo*d/7}],borderColor:'transparent',backgroundColor:'#22c55e1f',pointRadius:0,fill:'-1'})}
 if(R.cur!=null&&R.moving){const d=end-R.curN;ds.push({label:R.useTr?'Projection (trend)':'Projection (plan)',data:[{x:R.curN,y:R.cur},{x:end,y:R.cur-R.rate*d/7}],borderColor:'#ffffff',borderDash:[6,5],borderWidth:1.5,pointRadius:0})}
 const col={m1:'#3b82f6',m6:'#f59e0b',lt:'#a855f7'};
 R.goals.filter(o=>view==='6m'||(o.tN&&o.tN<=end)).forEach(o=>{if(o.tN&&o.tN<=end)ds.push({label:GOAL_NAMES[o.k],data:[{x:o.tN,y:o.g.w}],borderColor:col[o.k],backgroundColor:col[o.k],pointStyle:'rectRot',pointRadius:6,showLine:false});
  else if(!o.tN||o.tN>end)ds.push({label:GOAL_NAMES[o.k]+(o.tN?' (later)':''),data:[{x:M[0].n,y:o.g.w},{x:end,y:o.g.w}],borderColor:col[o.k]+'99',borderDash:[2,4],borderWidth:1,pointRadius:0})});
 const ys=ds.flatMap(s=>s.data.map(p=>p.y)),ymin=Math.min(...ys),ymax=Math.max(...ys);
 mkChart('wchart','line',[],ds,{scales:{x:{type:'linear',min:M[0].n,max:end,ticks:{color:'#94a3b8',maxTicksLimit:view==='6m'?6:5,maxRotation:0,callback:v=>view==='6m'?gMon(v):gFmt(v).replace(/, \d{4}$/,'')},grid:{color:'#1e293b'}},
   y:{min:Math.floor(ymin-1),max:Math.ceil(ymax+1),ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}}},
  plugins:{legend:{labels:{color:'#cbd5e1',boxWidth:10,font:{size:10},filter:i=>!i.text.startsWith('_')}},tooltip:{callbacks:{title:it=>it.length?gFmt(it[0].parsed.x):'',label:c=>`${c.dataset.label}: ${gNum(c.parsed.y)} ${u}`}}}})}
/* macro calculator (Settings) */
function macroIn(){const g=S.settings,c=g.calc||{},M=wMA(),u=gU();
 return{sex:c.sex||'f',age:c.age||34,hFt:c.hFt??5,hIn:c.hIn??5,hCm:c.hCm||165,w:c.w||(M.length?Math.round(M.at(-1).ma*10)/10:Math.round(187*gLb()*10)/10),act:c.act||1.4,def:c.def??450,
  gw:c.gw||((S.goals&&(S.goals.lt||S.goals.m6))?(S.goals.lt||S.goals.m6).w:Math.round(145*gLb()*10)/10)}}
function macroTdee(i){const kg=gU()==='kg'?i.w:i.w*0.45359237,cm=gU()==='kg'?i.hCm:(i.hFt*12+ +i.hIn)*2.54;
 const bmr=10*kg+6.25*cm-5*i.age+(i.sex==='m'?5:-161);return{bmr:Math.round(bmr),tdee:Math.round(bmr*i.act/10)*10}}
function macroTargets(i,t){const kcal=Math.round((t.tdee-i.def)/10)*10,gwLb=gU()==='kg'?i.gw/0.45359237:i.gw,p=Math.round(gwLb),f=Math.round(gwLb*0.3),c=Math.max(0,Math.round((kcal-p*4-f*9)/4));return{kcal,p,c,f}}
function macroCard(){const i=macroIn(),u=gU(),t=macroTdee(i),g=S.settings,m=macroTargets(i,t),dd=g.kcal-0;
 const acts=[[1.2,'Mostly sitting'],[1.3,'Light, about 6k steps'],[1.4,'About 10k steps + lifting'],[1.55,'Very active'],[1.7,'Hard training daily']];
 return `<div class="card" id="macroc"><h3>Macro calculator</h3><p class="muted">Mifflin-St Jeor BMR times activity. Change anything and it updates.</p>
 <div class="grid4 g2"><label>Sex<select id="mx_sex" onchange="macroSet()"><option value="f" ${i.sex==='f'?'selected':''}>Female</option><option value="m" ${i.sex==='m'?'selected':''}>Male</option></select></label>
 <label>Age<input id="mx_age" type="number" inputmode="numeric" value="${i.age}" onchange="macroSet()"></label>
 ${u==='kg'?`<label>Height (cm)<input id="mx_hCm" type="number" inputmode="decimal" value="${i.hCm}" onchange="macroSet()"></label>`:`<label>Height (ft, in)<div class="inl"><input id="mx_hFt" type="number" inputmode="numeric" value="${i.hFt}" onchange="macroSet()"><input id="mx_hIn" type="number" inputmode="decimal" value="${i.hIn}" onchange="macroSet()"></div></label>`}
 <label>Weight (${u})<input id="mx_w" type="number" step="0.1" inputmode="decimal" value="${i.w}" onchange="macroSet()"></label></div>
 <label>Activity<select id="mx_act" onchange="macroSet()">${acts.map(([v,l])=>`<option value="${v}" ${+i.act===v?'selected':''}>${v} · ${l}</option>`).join('')}</select></label>
 <div class="mxres"><div><small>BMR</small><b>${t.bmr}</b></div><div><small>Maintenance</small><b>${t.tdee}</b></div><div><small>Deficit at ${g.kcal}</small><b>${t.tdee-g.kcal}</b></div><div><small>Per week</small><b>${gNum(Math.max(0,(t.tdee-g.kcal)*7/3500*gLb()))} ${u}</b></div></div>
 <button class="btn" onclick="goalUseTdee(${t.tdee},'calc')">Use as maintenance</button>${g.tdee===t.tdee?' <span class="pill">In use</span>':''}
 <h4>Optional: new daily targets</h4><div class="grid4 g2"><label>Deficit (kcal/day)<input id="mx_def" type="number" inputmode="numeric" value="${i.def}" onchange="macroSet()"></label><label>Goal weight (${u})<input id="mx_gw" type="number" step="0.1" inputmode="decimal" value="${i.gw}" onchange="macroSet()"></label></div>
 <p class="muted">Would be ${m.kcal} kcal · P${m.p} C${m.c} F${m.f} (protein 1 g and fat 0.3 g per lb of goal weight, carbs fill the rest). Yours now: ${g.kcal} · P${g.p} C${g.c} F${g.f}.</p>
 <button class="btn sec" onclick="macroApply()">Apply targets</button></div>`}
function macroSet(){const c=S.settings.calc||={},v=id=>{const e=$('#mx_'+id);return e?e.value:undefined};
 c.sex=v('sex');for(const k of['age','hFt','hIn','hCm','w','act','def','gw']){const x=v(k);if(x!==undefined&&x!=='')c[k]=+x}save();renderSettings()}
function macroApply(){const i=macroIn(),m=macroTargets(i,macroTdee(i)),g=S.settings;
 if(!confirm(`Replace your daily targets ${g.kcal} kcal · P${g.p} C${g.c} F${g.f} with ${m.kcal} kcal · P${m.p} C${m.c} F${m.f}?`))return;
 Object.assign(g,m);save();toast('Daily targets updated.',3000);renderSettings()}
