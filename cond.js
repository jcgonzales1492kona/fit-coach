/* ---------- conditioning: 8-week program ---------- */
const COND=[
 {weeks:'1–2',A:{t:'Easy row',d:'20 min easy row'},B:{t:'Row intervals',d:'6 rounds: 1 min hard row / 2 min easy',timer:{type:'int',rounds:6,work:60,rest:120}},C:{t:'Brisk walk',d:'30–40 min brisk walk',opt:true}},
 {weeks:'3–4',A:{t:'Easy row',d:'25 min easy row'},B:{t:'Row intervals',d:'8 rounds: 1 min hard / 1.5 min easy',timer:{type:'int',rounds:8,work:60,rest:90}},C:{t:'Circuit',d:'3 rounds: 10 KB/DB swings, 10 goblet squats, 40 m farmer carry, 250 m row. 2 min rest between rounds.',timer:{type:'rest',rounds:3,rest:120}}},
 {weeks:'5–6',A:{t:'Easy row',d:'30 min easy row'},B:{t:'500 m repeats',d:'5 rounds: 500 m hard row, 2 min rest',timer:{type:'rest',rounds:5,rest:120}},C:{t:'EMOM 16',d:'16 min EMOM rotating: 12 cal row, 10 swings, 8 DB thrusters, 40 m carry',timer:{type:'emom',mins:16,stations:['12 cal row','10 swings','8 DB thrusters','40 m carry']}}},
 {weeks:'7–8',A:{t:'Easy row',d:'30–35 min easy row'},B:{t:'All-out intervals',d:'10 rounds: 30 s all-out / 90 s easy',timer:{type:'int',rounds:10,work:30,rest:90}},C:{t:'Circuit',d:'4 rounds: 300 m row, 12 swings, 10 DB push press, 40 m carry, 10 burpees'}}];
const CV={"Rowing Machine":"7EQJFjM4Vs8","Kettlebell Swing":"bDCeXbMJVNs","Goblet Squat":"7-80HiXX1K8","Farmer's Carry":"1uOs1hP3u4A","Dumbbell Thruster":"UipBcISeiGU","Dumbbell Push Press":"sElIkjcfyNY","Burpee":"qLBImHhCXSw","Brisk Walk":"gknH0pQwohc"};
for(const k in CV)if(!VIDEOS[k])VIDEOS[k]=CV[k];
const RM='Rowing Machine',CMOVES=[{A:[[RM,'20 min easy pace']],B:[[RM,'6 rounds · 1 min hard / 2 min easy']],C:[['Brisk Walk','30-40 min']]},
 {A:[[RM,'25 min easy pace']],B:[[RM,'8 rounds · 1 min hard / 1.5 min easy']],C:[['Kettlebell Swing','10 reps'],['Goblet Squat','10 reps'],["Farmer's Carry",'40 m'],[RM,'250 m']]},
 {A:[[RM,'30 min easy pace']],B:[[RM,'5 rounds · 500 m hard, 2 min rest']],C:[[RM,'12 cal'],['Kettlebell Swing','10 reps'],['Dumbbell Thruster','8 reps'],["Farmer's Carry",'40 m']]},
 {A:[[RM,'30-35 min easy pace']],B:[[RM,'10 rounds · 30 s all-out / 90 s easy']],C:[[RM,'300 m'],['Kettlebell Swing','12 reps'],['Dumbbell Push Press','10 reps'],["Farmer's Carry",'40 m'],['Burpee','10 reps']]}];
const CDAY={A:'Saturday',B:'Wednesday',C:'Monday'},CWHY={A:'Easy recovery on your rest day',B:'Hard effort, away from leg days',C:'Rest day after Booty, before Push'};
const movesOf=w=>CMOVES[Math.min(3,Math.max(0,Math.ceil(w/2)-1))];
const mvChips=ms=>`<div class="cmoves">${ms.map(([m,det])=>{const e={name:m};return `<div class="exrow">${thumbLink(e)}<div class="grow">${nameLink(e)}<small>${esc(det)}</small></div><button class="edl" onclick="editDemo(decodeURIComponent('${encodeURIComponent(m)}'))">✎ Edit</button></div>`}).join('')}</div>`;
let condWeek=null;
function cst(){S.cond||={start:today(),done:{},tests:[]};S.cond.done||={};S.cond.tests||=[];return S.cond}
function curCondWeek(){const c=cst(),d=Math.floor((new Date(today()+'T12:00')-new Date(c.start+'T12:00'))/864e5);return Math.floor(d/7)+1}
const blockOf=w=>COND[Math.min(3,Math.max(0,Math.ceil(w/2)-1))];
const fmtT=s=>{if(s==null||isNaN(s))return '–';const m=Math.floor(s/60),r=s-m*60;return m+':'+(r<10?'0':'')+r.toFixed(1)};
function parseT(v){const m=String(v).trim().match(/^(\d{1,2}):(\d{1,2}(?:\.\d)?)$/);return m?+m[1]*60+ +m[2]:null}
function renderCond(){const todayName=new Date().toLocaleDateString('en-US',{weekday:'long'}),c=cst(),cw=curCondWeek(),w=condWeek??Math.min(8,Math.max(1,cw)),B=blockOf(w);
 const isDone=k=>!!c.done['w'+w+k],req=w<=2?['A','B']:['A','B','C'],n=req.filter(isDone).length;
 const tests=[...c.tests].sort((a,b)=>a.date<b.date?-1:1),best=tests.length?Math.min(...tests.map(t=>t.t)):null;
 $('#cond').innerHTML=`
 <div class="ovh"><small class="muted">8-week conditioning · 2–3 sessions/week · fits your rest days (Mon, Wed, Sat)</small><div class="ovt"><h2>Week ${w}</h2><span class="pill">${cw<1?'Starts '+c.start:cw>8?'Program complete':'Current: week '+cw}</span></div></div>
 <div class="weeks wk8">${Array.from({length:8},(_,i)=>{const k=i+1,r=k<=2?['A','B']:['A','B','C'],d=r.filter(x=>c.done['w'+k+x]).length;return `<span class="${k===w?'cur':d>=r.length?'done':''} ${k===cw?'now':''}" onclick="condWeek=${k};renderCond()">W${k}${d?`<br><small>${d}/${r.length}</small>`:''}</span>`}).join('')}</div>
 <div class="card"><div class="exh"><div class="grow"><b>Week ${w} progress</b><small class="muted" style="display:block">${n}/${req.length} done${w<=2?' · C optional':''}</small></div><div class="wbar"><i style="width:${n/req.length*100}%"></i></div></div></div>
 ${['A','B','C'].map(k=>{const s=B[k],d=c.done['w'+w+k];return `<div class="card csess ${d?'ok':''}"><div class="exh"><span class="clet">${k}</span><div class="grow"><b>${s.t}${s.opt?' <small class="muted">(optional)</small>':''}</b><span class="cday ${CDAY[k]===todayName?'tod':''}">${CDAY[k]===todayName?'Today':CDAY[k]}</span><small class="muted" style="display:block">${s.d}</small><small class="muted cwhy">${CWHY[k]}</small></div><button class="ckb" onclick="condLog('${k}')">${d?'✓':''}</button></div>${mvChips(movesOf(w)[k])}
  ${d?`<small class="muted">Done ${d.date}${d.dur?' · '+d.dur+' min':''}${d.dist?' · '+d.dist+' m':''}${d.split?' · '+esc(d.split)+'/500m':''}${d.rpe?' · RPE '+d.rpe:''}${d.notes?' · '+esc(d.notes):''}</small>`:''}
  ${s.timer?`<button class="btn sec sm" style="margin-top:8px" onclick="condTimer(${w},'${k}')">⏱ ${s.timer.type==='emom'?'EMOM timer':s.timer.type==='rest'?'Rest timer':'Interval timer'}</button>`:''}</div>`}).join('')}
 ${(!tests.length)?`<div class="card prompt"><b>Log a baseline 2k row</b><p class="muted">Row 2,000 m at a hard, steady effort and log your time so you can see progress at the week-8 retest.</p><button class="btn" onclick="row2kForm()">Log baseline</button></div>`:''}
 ${(cw>=8||w===8)&&tests.length&&!tests.some(t=>t.date>=addDays(c.start,49))?`<div class="card prompt"><b>Week 8: 2k retest</b><p class="muted">Time to retest your 2k row and compare with your baseline.</p><button class="btn" onclick="row2kForm()">Log retest</button></div>`:''}
 <div class="card" id="row2k"><div class="exh"><h3 class="grow" style="margin:0">2k row test</h3><button class="btn sm" onclick="row2kForm()">+ Log</button></div>
 ${tests.length?`<p class="muted">Best ${fmtT(best)} · avg ${fmtT(best/4)}/500m${tests.length>1?` · ${tests.at(-1).t<=tests[0].t?'▼':'▲'} ${fmtT(Math.abs(tests.at(-1).t-tests[0].t))} vs first`:''}</p>
 <div class="chart"><canvas id="r2c"></canvas></div>${tests.slice().reverse().map(t=>`<div class="row"><div><b>${fmtT(t.t)}</b><small>${t.date} · ${fmtT(t.t/4)}/500m${t.notes?' · '+esc(t.notes):''}</small></div><button class="x" onclick="delTest('${t.id}')">✕</button></div>`).join('')}`:'<p class="muted">No tests yet.</p>'}</div>
 <div class="card"><label>Program start date<input type="date" value="${c.start}" onchange="if(this.value){cst().start=this.value;condWeek=null;save();renderCond()}"></label></div>`;
 if(tests.length)mkChart('r2c','line',tests.map(t=>t.date.slice(5)),[{label:'2k time',data:tests.map(t=>t.t),borderColor:'#22c55e',tension:.3},{label:'Avg /500m',data:tests.map(t=>t.t/4),borderColor:'#3b82f6',tension:.3,yAxisID:'y1'}],
  {scales:{x:{ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}},y:{reverse:true,ticks:{color:'#94a3b8',callback:v=>fmtT(v)},grid:{color:'#1e293b'},title:{display:true,text:'2k (lower = better)',color:'#94a3b8'}},y1:{position:'right',reverse:true,ticks:{color:'#94a3b8',callback:v=>fmtT(v)},grid:{display:false}}},plugins:{legend:{labels:{color:'#cbd5e1',boxWidth:10}},tooltip:{callbacks:{label:x=>x.dataset.label+': '+fmtT(x.raw)}}}})}
function addDays(d,n){const x=new Date(d+'T12:00');x.setDate(x.getDate()+n);return x.toLocaleDateString('en-CA')}
function condLog(k){const c=cst(),w=condWeek??Math.min(8,Math.max(1,curCondWeek())),key='w'+w+k,d=c.done[key]||{date:today()},s=blockOf(w)[k];
 modal(`<h3>Week ${w} · ${k}: ${s.t}</h3><p class="muted">${s.d}</p><label>Date<input id="cd" type="date" value="${d.date}"></label>
 <div class="grid4"><label>Min<input id="cdu" type="number" inputmode="decimal" value="${d.dur||''}"></label><label>Meters<input id="cdi" type="number" inputmode="numeric" value="${d.dist||''}"></label><label>Split /500<input id="csp" placeholder="2:10" value="${esc(d.split||'')}"></label><label>RPE<input id="crp" type="number" min="1" max="10" inputmode="numeric" value="${d.rpe||''}"></label></div>
 <label>Notes<input id="cno" value="${esc(d.notes||'')}" placeholder="How did it feel?"></label>
 <div class="inl"><button class="btn" onclick="condSave('${key}')">Mark done</button>${c.done[key]?`<button class="btn sec" onclick="delete cst().done['${key}'];save();closeModal();renderCond()">Not done</button>`:''}</div>`)}
function condSave(key){cst().done[key]={date:$('#cd').value||today(),dur:$('#cdu').value,dist:$('#cdi').value,split:$('#csp').value.trim(),rpe:$('#crp').value,notes:$('#cno').value.trim()};save();closeModal();renderCond()}
function row2kForm(){modal(`<h3>Log 2k row</h3><label>Time (mm:ss.t)<input id="rt" placeholder="8:15.3" inputmode="decimal"></label><label>Date<input id="rd" type="date" value="${today()}"></label><label>Notes<input id="rn" placeholder="Damper, how it felt…"></label><p id="rerr" class="warn"></p><button class="btn" onclick="saveTest()">Save</button>`)}
function saveTest(){const t=parseT($('#rt').value);if(!t||t<300||t>1200){$('#rerr').textContent='Enter a time like 8:15.3 (between 5:00 and 20:00).';return}
 cst().tests.push({id:'t'+Date.now(),t,date:$('#rd').value||today(),notes:$('#rn').value.trim()});save();closeModal();renderCond()}
function delTest(id){if(!confirm('Delete this 2k result?'))return;const c=cst(),i=c.tests.findIndex(t=>t.id===id),[rm]=c.tests.splice(i,1);save();renderCond();toast('2k result deleted',5000,'Undo',()=>{c.tests.splice(i,0,rm);save();renderCond()})}
/* ---- interval / EMOM timer ---- */
let CT=null;
function beep(f=880,ms=180){try{const a=window._ac||=new (window.AudioContext||window.webkitAudioContext)(),o=a.createOscillator(),g=a.createGain();o.frequency.value=f;o.connect(g);g.connect(a.destination);g.gain.setValueAtTime(.25,a.currentTime);g.gain.exponentialRampToValueAtTime(.001,a.currentTime+ms/1000);o.start();o.stop(a.currentTime+ms/1000)}catch(e){}}
function condTimer(w,k){const T=blockOf(w)[k].timer,ph=[];
 if(T.type==='int')for(let r=1;r<=T.rounds;r++){ph.push({l:'HARD',s:T.work,r,cls:'hard'});ph.push({l:'Easy',s:T.rest,r,cls:'easy'})}
 if(T.type==='rest')for(let r=1;r<=T.rounds;r++){ph.push({l:'Work',s:0,r,cls:'hard',manual:true});if(r<T.rounds||k==='B')ph.push({l:'Rest',s:T.rest,r,cls:'easy'})}
 if(T.type==='emom')for(let m=0;m<T.mins;m++)ph.push({l:T.stations[m%T.stations.length],s:60,r:m+1,cls:m%2?'easy':'hard'});
 CT={ph,i:0,left:ph[0].s,run:false,total:T.type==='emom'?T.mins:T.rounds,title:blockOf(w)[k].t,iv:null};
 let d=document.getElementById('ctimer');if(!d){d=document.createElement('div');d.id='ctimer';document.body.appendChild(d)}drawCT()}
function drawCT(){const d=document.getElementById('ctimer');if(!CT){d&&d.remove();return}const p=CT.ph[CT.i];
 d.className=p?p.cls:'';d.innerHTML=`<div class="ctt">${CT.title}</div>${p?`<div class="ctr">Round ${p.r} / ${CT.total}</div><div class="ctl">${esc(p.l)}</div><div class="ctn">${p.manual?'Go':fmt(Math.ceil(CT.left))}</div>${p.manual?'<p>Tap “Done” when you finish the work.</p>':''}${CT.ph[CT.i+1]?`<div class="ctx">Next: ${esc(CT.ph[CT.i+1].l)}</div>`:''}`:'<div class="ctl">Done! 🎉</div>'}
 <div class="inl ctb">${p?(p.manual?`<button class="btn" onclick="ctNext()">Done</button>`:`<button class="btn" onclick="ctToggle()">${CT.run?'Pause':'Start'}</button><button class="btn sec" onclick="ctNext()">Skip</button>`):''}<button class="btn sec" onclick="clearInterval(CT.iv);CT=null;drawCT()">Close</button></div>`}
function ctToggle(){CT.run=!CT.run;clearInterval(CT.iv);if(CT.run){beep(660,120);let last=Date.now();CT.iv=setInterval(()=>{const now=Date.now();CT.left-=(now-last)/1000;last=now;
 if(CT.left<=3.05&&CT.left>0&&Math.abs(CT.left-Math.round(CT.left))<.06)beep(520,80);if(CT.left<=0)ctNext(true);else drawCT()},100)}drawCT()}
function ctNext(auto){CT.i++;const p=CT.ph[CT.i];beep(p?(p.cls==='hard'?990:660):1200,p?250:600);navigator.vibrate&&navigator.vibrate(p?[200]:[300,100,300]);
 if(!p){clearInterval(CT.iv);CT.run=false;drawCT();return}CT.left=p.s;if(p.manual){clearInterval(CT.iv);CT.run=false}else if(!CT.run&&!auto)ctToggle();drawCT()}
