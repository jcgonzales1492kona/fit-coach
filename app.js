const $=s=>document.querySelector(s);
const today=()=>new Date().toLocaleDateString('en-CA');
const DEF={settings:{kcal:1750,p:145,c:165,f:55,unit:'lb',bar:45,barKg:20,plates:[45,35,25,10,5,2.5,1.25],platesKg:[25,20,15,10,5,2.5,1.25],rest:120},customEx:[],log:{},custom:[],favs:[],recents:[],weights:[],meso:null,sessions:[]};
const KEY='fit',BAK='fit-bak';let LOAD_NOTE='',NEED_RESTORE=false;
function readLS(k){try{return localStorage.getItem(k)}catch(e){return null}}
function loadState(){const raw=readLS(KEY);
 if(raw){try{const o=JSON.parse(raw);if(o&&typeof o==='object')return o;throw 0}catch(e){
  try{localStorage.setItem('fit-corrupt-'+Date.now(),raw)}catch(_){}LOAD_NOTE='Saved data could not be read. A copy was kept and a backup restore was attempted.'}}
 const b=readLS(BAK);if(b){try{const o=JSON.parse(b);if(o&&o.data){LOAD_NOTE||=(raw?'':'Main data was missing; ')+'restored from on-device backup ('+new Date(o.t).toLocaleString()+').';return o.data}}catch(e){}}
 NEED_RESTORE=true;return {}}
let S=Object.assign(structuredClone(DEF),loadState());
{const g=S.settings;if(!S.tgt1750){Object.assign(g,{kcal:1750,p:145,c:165,f:55});S.tgt1750=1}S.customEx||=[];g.bar??=45;g.barKg??=20;g.plates??=[45,35,25,10,5,2.5,1.25];g.platesKg??=[25,20,15,10,5,2.5,1.25];g.rest??=120;if(g.tdee===undefined){g.tdee=2200;g.tdeeSrc='coach'}S.active??=null;if(S.meso&&S.meso.program&&!S.myPlan)S.myPlan={name:S.meso.split,schedule:S.meso.schedule,days:structuredClone(S.meso.plan)}}
const LIB=()=>{const seen=new Set(EXERCISES.map(e=>e.name));return[...EXERCISES,...planEx().filter(e=>!seen.has(e.name)&&seen.add(e.name)),...S.customEx]};
const COARSE={chest:['Chest','Front Delts','Triceps'],back:['Lats','Upper Back','Biceps'],shoulders:['Side Delts','Front Delts'],biceps:['Biceps','Forearms'],triceps:['Triceps'],quads:['Quads','Glutes'],hamstrings:['Hamstrings','Glutes'],glutes:['Glutes','Hamstrings'],calves:['Calves'],abs:['Abs']};
const musOf=e=>e.muscles||COARSE[e.muscle]||[e.muscle];
const nSets=(e,w)=>e.reps?e.reps.length:setsFor(w,e.type);
const repRange=e=>{const v=e.reps.flatMap(r=>r.split('-').map(Number));return[Math.min(...v),Math.max(...v)]};
const repT=(e,si,sg)=>e.reps?(+String(e.reps[Math.min(si,e.reps.length-1)]).split('-')[0]):sg.r;
const isProg=()=>S.meso&&S.meso.program;
const planEx=()=>S.myPlan?S.myPlan.days.flatMap(d=>d.ex.map(({reps,...e})=>e)):[];
function loadProgram(){const P=S.myPlan;if(!P)return;S.meso={program:1,split:P.name,goal:'hypertrophy',schedule:P.schedule,plan:structuredClone(P.days),week:0,day:0,start:today()};S.active=null;save();closeModal();renderWorkout()}
function exportProgram(){const P=S.meso&&S.meso.program?{name:S.meso.split,schedule:S.meso.schedule,days:S.meso.plan}:S.myPlan;if(!P){alert('No saved program to export.');return}
 const out={type:'fitcoach-program',version:1,name:P.name,schedule:P.schedule,days:P.days.map(d=>({name:d.name,mins:d.mins,ex:d.ex.map(e=>({...e,video:(S.demoOv||{})[e.name]||e.video||(VIDEOS[e.name]?'https://www.youtube.com/watch?v='+VIDEOS[e.name]:'')}))}))};
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(out,null,1)],{type:'application/json'}));a.download=(P.name||'program').replace(/[^\w-]+/g,'-')+'.json';a.click()}
function importProgramText(t){let P;try{P=JSON.parse(t)}catch(e){alert('Not valid JSON');return}
 if(!P||!Array.isArray(P.days)||!P.days.length||!P.days.every(d=>d.name&&Array.isArray(d.ex))){alert('Not a FitCoach program file');return}
 P.days.forEach(d=>d.ex.forEach(e=>{e.muscle||='chest';e.type||='c';if(e.reps)e.reps=e.reps.map(String)}));
 if(S.meso&&!confirm(`Replace the current plan with "${P.name||'Imported program'}"? Logged history is kept.`))return;
 S.myPlan={name:P.name||'My program',schedule:P.schedule||P.days.map(d=>d.name),days:P.days};loadProgram();alert('Program imported');show('workout')}
function importProgram(){modal(`<h3>Import program</h3><p class="muted">Choose an exported program file, or paste its JSON.</p><label class="btn sec file">Choose file<input type="file" accept=".json,application/json" hidden onchange="const r=new FileReader();r.onload=()=>importProgramText(r.result);r.readAsText(this.files[0])"></label><textarea id="pj" rows="6" placeholder="Paste program JSON" style="width:100%;background:var(--c2);color:#fff;border:0;border-radius:12px;padding:10px;margin-top:8px"></textarea><button class="btn" onclick="importProgramText($('#pj').value)">Import pasted JSON</button>`)}
const ytId=u=>{const m=String(u||'').match(/(?:v=|youtu\.be\/|shorts\/|embed\/|live\/)([\w-]{11})/);return m?m[1]:null};
const encN=n=>encodeURIComponent(n).replace(/'/g,'%27');
function vidId(e){const o=(S.demoOv||{})[e.name];if(o)return ytId(o);const c=S.customEx.find(x=>x.name===e.name);return ytId(e.video||(c&&c.video))||VIDEOS[e.name]||null}
const ytT=u=>{const m=String(u||'').match(/[?&#](?:t|start)=(?:(\d+)h)?(?:(\d+)m)?(\d+)?s?/);return m?(+(m[1]||0))*3600+(+(m[2]||0))*60+(+(m[3]||0)):0};
const fmtVT=t=>t?Math.floor(t/60)+':'+String(t%60).padStart(2,'0'):'';
const parseVT=v=>{v=String(v||'').trim();if(!v)return 0;const p=v.split(':').map(Number);if(p.some(isNaN))return 0;return p.reduce((a,b)=>a*60+b,0)};
function editDemo(n){const cur=(S.demoOv||{})[n]||'',t=(S.demoT||{})[n]||ytT(demoUrl({name:n}));modal(`<h3>Demo link</h3><p class="muted">${esc(n)}</p><label>YouTube (or any) URL<input id="dl" type="url" value="${esc(cur)}" placeholder="${esc(demoUrl({name:n}).replace(/[?&]t=\d+s?/,''))}"></label><label>Start at (min:sec)<input id="dt" inputmode="numeric" placeholder="0:00" value="${fmtVT(t)}"></label><p class="muted">Tip: in YouTube, tap Share then "Start at" and paste that link, or just type the time here.</p><div class="inl"><button class="btn" onclick="saveDemo('${encN(n)}')">Save</button>${cur||t?`<button class="btn sec" onclick="saveDemo('${encN(n)}',1)">Reset to default</button>`:''}</div>`)}
function saveDemo(en,reset){const n=decodeURIComponent(en);S.demoOv||={};S.demoT||={};let v=reset?'':$('#dl').value.trim();if(v&&!/^https?:\/\//.test(v))v='https://'+v;
 let t=reset?0:(parseVT($('#dt').value)||ytT(v));const id=ytId(v);if(id)v='https://www.youtube.com/watch?v='+id;if(v)S.demoOv[n]=v;else delete S.demoOv[n];if(t)S.demoT[n]=t;else delete S.demoT[n];save();closeModal();if(typeof renderWorkout==='function'&&S.meso)renderWorkout();if(typeof renderCond==='function'&&$('#cond')&&!$('#cond').hidden)renderCond()}
function demoUrl(e){const u=demoUrl0(e),t=(S.demoT||{})[e.name];if(!t||!/youtu/.test(u)||/results\?/.test(u))return u;const id=ytId(u);return id?'https://www.youtube.com/watch?v='+id+'&t='+t+'s':u}
function demoUrl0(e){const o=(S.demoOv||{})[e.name];if(o)return o;if(e.video)return e.video;const c=S.customEx.find(x=>x.name===e.name);if(c&&c.video)return c.video;return VIDEOS[e.name]?'https://www.youtube.com/watch?v='+VIDEOS[e.name]:'https://www.youtube.com/results?search_query='+encodeURIComponent(e.name+' exercise form')}
function demoLink(e){return `<a class="demo" href="${esc(demoUrl(e))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">▶ Watch demo</a> <button class="edl" onclick="event.stopPropagation();editDemo(decodeURIComponent('${encN(e.name)}'))">✎ Edit</button>`}
function hasData(o){return !!o&&((o.weights&&o.weights.length)||(o.sessions&&o.sessions.length)||Object.values(o.log||{}).some(x=>x&&x.length)||(o.cond&&(Object.keys(o.cond.done||{}).length||(o.cond.tests||[]).length))||(o.custom&&o.custom.length)||!!o.meso)}
let bakTimer=null;
function save(){const j=JSON.stringify(S);try{localStorage.setItem(KEY,j)}catch(e){toast('Could not save — storage full or blocked. Export a backup.')}clearTimeout(bakTimer);bakTimer=setTimeout(()=>backupNow(j),1500)}
function backupNow(j=JSON.stringify(S)){if(!hasData(S)&&!readLS(BAK))return;const t=Date.now();try{localStorage.setItem(BAK,JSON.stringify({t,data:S}))}catch(e){}
 idb(db=>{const tx=db.transaction('kv','readwrite'),st=tx.objectStore('kv');st.put({t,data:j},'latest');st.put({t,data:j},'day-'+today());
  st.getAllKeys().onsuccess=e=>{const days=e.target.result.filter(k=>String(k).startsWith('day-')).sort();days.slice(0,-7).forEach(k=>st.delete(k))}});
 try{localStorage.setItem('fit-lastbak',String(t))}catch(e){}}
function idb(fn){try{const r=indexedDB.open('fitcoach',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>fn(r.result);r.onerror=()=>{}}catch(e){}}
function idbGet(k){return new Promise(res=>{let done=false;setTimeout(()=>{if(!done)res(null)},3000);idb(db=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>{done=true;res(q.result||null)};q.onerror=()=>{done=true;res(null)}})})}
function toast(m,ms=5000,label,fn){let t=document.getElementById('toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}t.textContent=m;if(label){const b=document.createElement('button');b.textContent=label;b.className='tbtn';b.onclick=()=>{t.hidden=true;fn()};t.appendChild(b)}t.hidden=false;clearTimeout(t._h);t._h=setTimeout(()=>t.hidden=true,ms)}
async function startupStorage(){
 if(NEED_RESTORE){const b=await idbGet('latest');if(b&&b.data){try{const o=JSON.parse(b.data);if(hasData(o)&&!hasData(S)){S=Object.assign(structuredClone(DEF),o);save();toast('Restored your data from the on-device backup ('+new Date(b.t).toLocaleString()+').',8000);show(location.hash.slice(1)||'food')}}catch(e){}}}
 else if(LOAD_NOTE){save();toast(LOAD_NOTE,8000)}
 if(hasData(S)&&!readLS(BAK))backupNow();
 try{if(navigator.storage&&navigator.storage.persist){window.__persisted=await navigator.storage.persisted();if(!window.__persisted)window.__persisted=await navigator.storage.persist()}}catch(e){}
 iosBanner()}
function isIOS(){return /iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)}
function isStandalone(){return navigator.standalone===true||matchMedia('(display-mode: standalone)').matches}
function iosBanner(){if(!isIOS()||isStandalone()||readLS('fit-ios-tip'))return;const d=document.createElement('div');d.id='iosb';
 d.innerHTML=`<b>Install FitCoach</b><p>Tap <span class="shr">Share ⬆︎</span> then <b>Add to Home Screen</b>. Safari can clear website data, and the Home Screen app keeps its <b>own separate data</b> from Safari, so pick one place to log (Home Screen is best) and export a backup now and then.</p><div class="inl"><button class="btn sm" onclick="exportData()">Export backup</button><button class="btn sec sm" onclick="localStorage.setItem('fit-ios-tip','1');this.closest('#iosb').remove()">Got it</button></div>`;document.body.appendChild(d)}
let viewDate=today(),charts={};
const allFoods=()=>[...S.custom,...FOODS];
const foodById=id=>allFoods().find(f=>f.id===id);
const r1=x=>Math.round(x*10)/10;
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

/* ---------- tabs ---------- */
document.querySelectorAll('nav button').forEach(b=>b.onclick=()=>show(b.dataset.t));
function show(t){if(t!=='workout'&&typeof KP!=='undefined'&&KP)closeKP(false);document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
 document.querySelectorAll('section.tab').forEach(s=>s.hidden=s.id!==t);
 ({food:renderFood,workout:renderWorkout,cond:renderCond,progress:renderProgress,settings:renderSettings})[t]();location.hash=t;window.scrollTo(0,0)}

/* ---------- food ---------- */
function ring(val,target,color,label,unit){const pct=Math.min(val/target,1),R=30,C=2*Math.PI*R;
 return `<div class="ring"><svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="${R}" class="bg"/><circle cx="36" cy="36" r="${R}" stroke="${val>target*1.05?'#ef4444':color}" stroke-dasharray="${C*pct} ${C}" transform="rotate(-90 36 36)"/></svg><div class="rv"><b>${Math.round(val)}</b><small>/${target}${unit}</small></div><span>${label}</span></div>`}
function dayTotals(d){return(S.log[d]||[]).reduce((a,e)=>({kcal:a.kcal+e.kcal,p:a.p+e.p,c:a.c+e.c,f:a.f+e.f}),{kcal:0,p:0,c:0,f:0})}
function renderFood(){const t=dayTotals(viewDate),g=S.settings,entries=S.log[viewDate]||[];
 const quick=[...new Set([...S.favs,...S.recents])].map(foodById).filter(Boolean).slice(0,12);
 $('#food').innerHTML=`
 <div class="datebar"><button onclick="shiftDay(-1)">‹</button><b>${viewDate===today()?'Today':new Date(viewDate+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}</b><button onclick="shiftDay(1)">›</button></div>
 <div class="card rings">${ring(t.kcal,g.kcal,'#22c55e','Calories','')}${ring(t.p,g.p,'#3b82f6','Protein','g')}${ring(t.c,g.c,'#f59e0b','Carbs','g')}${ring(t.f,g.f,'#a855f7','Fat','g')}</div>
 <p class="muted center">${Math.max(0,Math.round(g.kcal-t.kcal))} kcal · ${Math.max(0,Math.round(g.p-t.p))}g protein left</p>
 <div class="card"><div class="inl fsr"><input id="fq" placeholder="🔍 Search foods…" oninput="searchFood()" autocomplete="off"><button class="btn sec scanb" onclick="scanOpen()" aria-label="Scan barcode"><svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M3 5h2v14H3zm3 0h1v14H6zm2 0h2v14H8zm3 0h1v14h-1zm3 0h2v14h-2zm3 0h1v14h-1zm2 0h2v14h-2z"/></svg>Scan barcode</button></div><div id="fres"></div>
 ${quick.length?`<h4>Quick add</h4><div class="chips">${quick.map(f=>`<button class="chip" onclick="pickFood('${f.id}')">${S.favs.includes(f.id)?'★ ':''}${esc(f.name)}${f.barcode?'<i class="sbadge">Scanned</i>':''}</button>`).join('')}</div>`:''}
 ${mealRow()}
 <button class="link" onclick="customFoodForm()">+ Create custom food</button></div>
 ${slotLogCard(entries)}
 <div class="card"><h3>Body weight</h3><div class="inl"><input id="bw" type="number" step="0.1" inputmode="decimal" placeholder="Weight (${g.unit})"><button class="btn" onclick="addWeight()">Log</button></div><button class="btn sec sm hpaste" onclick="healthPaste()">Paste from Health</button>
 ${S.weights.length?`<p class="muted">Latest ${S.weights.at(-1).w} ${g.unit} · 7-day avg ${r1(wMA().at(-1).ma)}</p><div class="chart"><canvas id="wchart"></canvas></div>${weighList()}`:'<p class="muted">No entries yet.</p>'}</div>
 ${goalCard()}`;
 if(S.weights.length)drawWeight()}
const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;
function shiftDay(n){const d=new Date(viewDate+'T12:00');d.setDate(d.getDate()+n);viewDate=d.toLocaleDateString('en-CA');renderFood()}
function searchFood(){const q=$('#fq').value.toLowerCase().trim();if(!q){$('#fres').innerHTML='';return}
 const words=q.split(/\s+/),res=allFoods().filter(f=>{const h=(f.name+' '+(f.brand||'')).toLowerCase();return words.every(w=>h.includes(w))}).slice(0,15);
 $('#fres').innerHTML=(mealSearch(words)+res.map(f=>`<div class="row tap" onclick="pickFood('${f.id}')"><div><b>${esc(f.name)}</b><small>per 100g · P${f.p} C${f.c} F${f.f}${f.barcode?' · <i class="sbadge">Scanned</i>':''}</small></div><div class="rt">${f.kcal}</div></div>`).join(''))||'<p class="muted">No match. Scan it or create a custom food.</p>'}
function pickFood(id,g0){const f=foodById(id),last=Object.values(S.log).flat().reverse().find(e=>e.fid===id);
 modal(`<h3>${esc(f.name)}</h3>${f.barcode?`<p class="muted"><i class="sbadge">Scanned</i> ${f.brand?esc(f.brand)+' · ':''}${esc(f.barcode)}</p>`:''}<p class="muted">${f.kcal} kcal · P${f.p} C${f.c} F${f.f} per 100g</p>${f.src&&f.src.size?`<p class="muted">Label serving: ${esc(f.src.size)}</p>`:''}${f.corrected?'<p class="muted"><i class="sbadge fixd">Fixed from label</i></p>':foodLow(f)?lowWarn(f):''}
 <label>Amount (grams)<input id="fg" type="number" inputmode="decimal" value="${g0||(last?last.g:100)}" oninput="prevFood('${id}')"></label><div id="fprev" class="muted"></div>${slotPills()}
 <div class="inl"><button class="btn" onclick="logFood('${id}')">Add to log</button><button class="btn sec" onclick="toggleFav('${id}')">${S.favs.includes(id)?'★ Unfavorite':'☆ Favorite'}</button></div>${S.custom.some(x=>x.id===id)?`<div><button class="link" onclick="fixLabelForm('${id}')">✎ Fix from label</button></div>`:''}`);prevFood(id)}
function prevFood(id){const f=foodById(id),g=+$('#fg').value||0;$('#fprev').textContent=`${Math.round(f.kcal*g/100)} kcal · P${r1(f.p*g/100)} C${r1(f.c*g/100)} F${r1(f.f*g/100)}`}
function logFood(id){const f=foodById(id),g=+$('#fg').value;if(!g)return;const k=g/100;
 (S.log[viewDate]||=[]).push({fid:id,name:f.name,g,kcal:f.kcal*k,p:f.p*k,c:f.c*k,f:f.f*k,slot:slotTake(),t:Date.now()});
 S.recents=[id,...S.recents.filter(x=>x!==id)].slice(0,15);save();closeModal();renderFood()}
function toggleFav(id){S.favs=S.favs.includes(id)?S.favs.filter(x=>x!==id):[id,...S.favs];save();closeModal();renderFood()}
function delEntry(i){S.log[viewDate].splice(i,1);save();renderFood()}
function customFoodForm(n0,bc0){modal(`<h3>Custom food (per 100g)</h3>${bc0?`<p class="muted">Barcode ${esc(bc0)}. Copy the per 100 g values from the label.</p><input id="cbc" type="hidden" value="${esc(bc0)}">`:''}<label>Name<input id="cn" value="${esc(n0||'')}"></label><div class="grid4">
 <label>kcal<input id="ck" type="number"></label><label>Protein<input id="cp" type="number"></label><label>Carbs<input id="cc" type="number"></label><label>Fat<input id="cf" type="number"></label></div>
 <button class="btn" onclick="saveCustom()">Save</button>`)}
function saveCustom(){const n=$('#cn').value.trim();if(!n)return;const bc=$('#cbc')?$('#cbc').value:'',old=bc&&S.custom.find(x=>x.barcode===bc);
 const f=Object.assign(old||{id:'c'+Date.now()},{name:n,kcal:+$('#ck').value||0,p:+$('#cp').value||0,c:+$('#cc').value||0,f:+$('#cf').value||0,custom:1},bc?{barcode:bc}:{});
 if(!old)S.custom.push(f);save();closeModal();pickFood(f.id)}
function addWeight(){const w=+$('#bw').value;if(!w)return;S.weights=S.weights.filter(x=>x.d!==today());S.weights.push({d:today(),w});S.weights.sort((a,b)=>a.d<b.d?-1:1);save();renderFood()}
/* drawWeight() lives in goals.js */
function mkChart(id,type,labels,datasets,opt={}){charts[id]?.destroy();const el=document.getElementById(id);if(!el||!window.Chart)return;
 charts[id]=new Chart(el,{type,data:{labels,datasets},options:Object.assign({animation:false,maintainAspectRatio:false,responsive:true,plugins:{legend:{labels:{color:'#cbd5e1',boxWidth:10}}},scales:{x:{ticks:{color:'#94a3b8',maxTicksLimit:6},grid:{color:'#1e293b'}},y:{ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}}}},opt)})}

/* ---------- workouts ---------- */
const SPLITS={3:{name:'Full Body',days:[['quads','chest','back','hamstrings','shoulders','biceps'],['hamstrings','back','chest','quads','triceps','abs'],['glutes','chest','back','quads','shoulders','calves']].map((m,i)=>({name:'Full Body '+'ABC'[i],m}))},
 4:{name:'Upper / Lower',days:[{name:'Upper A',m:['chest','back','shoulders','biceps','triceps']},{name:'Lower A',m:['quads','hamstrings','glutes','calves','abs']},{name:'Upper B',m:['back','chest','shoulders','triceps','biceps']},{name:'Lower B',m:['hamstrings','quads','glutes','calves','abs']}]},
 5:{name:'PPL + Upper/Lower',days:[{name:'Push',m:['chest','chest','shoulders','triceps']},{name:'Pull',m:['back','back','shoulders','biceps']},{name:'Legs',m:['quads','hamstrings','glutes','calves']},{name:'Upper',m:['chest','back','shoulders','biceps','triceps']},{name:'Lower',m:['glutes','quads','hamstrings','abs']}]}};
const GOALS={hypertrophy:{label:'Hypertrophy',reps:[8,12],compoundReps:[6,10]},strength:{label:'Strength + size',reps:[8,12],compoundReps:[4,6]},glutes:{label:'Lower-body / glute focus',reps:[10,15],compoundReps:[6,10]}};
const WEEKS=5,RIR=[3,3,2,1,0],DELOAD_RIR=4;
function setsFor(week,type){if(week>=WEEKS)return type==='c'?2:1;return(type==='c'?2:2)+Math.floor(week*(type==='c'?2:2.5)/(WEEKS-1)*.99)}
function genMeso(days,goal){const sp=SPLITS[days],used={};
 const plan=sp.days.map(d=>{let m=[...d.m];if(goal==='glutes'&&/Lower|Legs|Full/.test(d.name))m.push('glutes');
  const seen=new Set();return{name:d.name,ex:m.map(mu=>{const pool=LIB().filter(e=>e.muscle===mu&&!seen.has(e.name));
   pool.sort((a,b)=>(used[a.name]||0)-(used[b.name]||0)||(a.type==='c'?-1:1)-(b.type==='c'?-1:1)||Math.random()-.5);
   const e=pool[0];seen.add(e.name);used[e.name]=(used[e.name]||0)+1;return{...e}})}});
 S.meso={days,goal,split:sp.name,plan,week:0,day:0,start:today()};save();renderWorkout()}
function lastSets(name){for(let i=S.sessions.length-1;i>=0;i--){const s=S.sessions[i].sets.filter(x=>x.ex===name);if(s.length)return{date:S.sessions[i].date,sets:s}}return null}
/* ---- equipment / plates ---- */
const BARBELL=new Set(['Barbell Bench Press','Incline Barbell Press','Close-Grip Bench Press','Barbell Row','Overhead Press','Barbell Curl','Back Squat','Front Squat','Romanian Deadlift','Stiff-Leg Deadlift','Good Morning','Hip Thrust','Glute Bridge','Deadlift']);
const UNI=new Set(['One-Arm Dumbbell Row','Bulgarian Split Squat','Walking Lunge','Step-Up','Cable Kickback','Cable Lateral Raise']);
const isBar=e=>e.equip?e.equip==='barbell':BARBELL.has(e.name);
const isUni=e=>e.uni!==undefined?!!e.uni:UNI.has(e.name);
const PLATE_SETS={lb:[45,35,25,10,5,2.5,1.25],kg:[25,20,15,10,5,2.5,1.25]};
const PCOL={lb:{45:'#3b6fd8',35:'#e5c02a',25:'#2fa84f',10:'#d4d4d8',5:'#3b82f6',2.5:'#71717a',1.25:'#e4e4e7'},kg:{25:'#d93a3a',20:'#3b6fd8',15:'#e5c02a',10:'#2fa84f',5:'#e4e4e7',2.5:'#d93a3a',1.25:'#a1a1aa'}};
const plates=()=>S.settings.unit==='kg'?S.settings.platesKg:S.settings.plates;
const barW=()=>S.settings.unit==='kg'?S.settings.barKg:S.settings.bar;
function loadPlan(target){const bar=barW(),av=[...plates()].sort((a,b)=>b-a),q=4,maxSide=Math.max(0,Math.ceil((target-bar)/2)+50)*q;
 // dp over per-side weight in quarter units, fewest plates
 const best=new Array(maxSide+1).fill(Infinity),from=new Array(maxSide+1).fill(-1);best[0]=0;
 for(let s=0;s<=maxSide;s++)if(best[s]<Infinity)for(const p of av){const t=s+Math.round(p*q);if(t<=maxSide&&best[s]+1<best[t]){best[t]=best[s]+1;from[t]=p}}
 let bs=0,bd=Infinity;for(let s=0;s<=maxSide;s++)if(best[s]<Infinity){const tot=bar+2*s/q,d=Math.abs(tot-target);if(d<bd-1e-9||(Math.abs(d-bd)<1e-9&&tot<bar+2*bs/q)){bd=d;bs=s}}
 const list=[];let s=bs;while(s>0){list.push(from[s]);s-=Math.round(from[s]*q)}list.sort((a,b)=>b-a);
 return{bar,side:bs/q,total:bar+2*bs/q,list,exact:bd<1e-6,target}}
const roundLoad=w=>w===''||w==null?w:loadPlan(+w).total;
function plateSVG(list){const u=S.settings.unit,mh=u==='kg'?25:45;let x=34,r='';
 for(const p of list){const h=Math.max(26,Math.round(96*Math.sqrt(p/mh))),w=p>=25?14:p>=10?10:8;r+=`<rect x="${x}" y="${60-h/2}" width="${w}" height="${h}" rx="2.5" fill="${PCOL[u][p]||'#aaa'}"/>`;x+=w+2}
 return `<svg viewBox="0 0 ${Math.max(150,x+20)} 120" class="psvg"><rect x="0" y="54" width="22" height="12" rx="2" fill="#6b6b70"/><rect x="22" y="40" width="9" height="40" rx="2" fill="#8e8e93"/><rect x="31" y="53" width="${Math.max(110,x-20)}" height="14" rx="3" fill="#a1a1a6"/>${r}<rect x="${x+1}" y="48" width="6" height="24" rx="2" fill="#d4d4d8"/></svg>`}
function plateBanner(w){if(w===''||w==null||isNaN(+w))return `<div class="plates" onclick="plateModal()"><span class="muted">Enter a weight to see plates</span></div>`;
 const P=loadPlan(+w),u=S.settings.unit,cnt={};P.list.forEach(p=>cnt[p]=(cnt[p]||0)+1);
 return `<div class="plates" onclick="plateModal()">${plateSVG(P.list)}<div><b>${Object.entries(cnt).sort((a,b)=>b[0]-a[0]).map(([p,n])=>`${n} x ${p}`).join(', ')||'Empty bar'}</b>
 <small>${P.side} ${u} per side + ${P.bar} ${u} bar = ${P.total} ${u}</small>${P.exact?'':`<small class="warn">${P.target} ${u} isn't loadable, nearest: ${P.total} ${u}</small>`}</div></div>`}
function plateModal(){const u=S.settings.unit,k=u==='kg'?'platesKg':'plates',bk=u==='kg'?'barKg':'bar';
 modal(`<h3>Bar & plates (${u})</h3><label>Bar weight<input type="number" inputmode="decimal" value="${barW()}" onchange="S.settings.${bk}=+this.value||0;save();refreshKP()"></label>
 <label>Available plates</label><div class="chips">${PLATE_SETS[u].map(p=>`<button class="chip ${plates().includes(p)?'on':''}" onclick="togPlate(${p})">${p}</button>`).join('')}</div>`)}
function togPlate(p){const k=S.settings.unit==='kg'?'platesKg':'plates';S.settings[k]=S.settings[k].includes(p)?S.settings[k].filter(x=>x!==p):[...S.settings[k],p];if(!S.settings[k].length)S.settings[k]=[p];save();plateModal();refreshKP()}

/* ---- progression ---- */
function suggest(ex){const L=lastSets(ex.name),g=GOALS[S.meso.goal],[lo,hi]=ex.reps?repRange(ex):ex.type==='c'?g.compoundReps:g.reps,inc=S.settings.unit==='lb'?(ex.type==='c'?5:2.5):(ex.type==='c'?2.5:1),R=w=>isBar(ex)?roundLoad(w):w;
 if(!L)return{txt:`Pick a weight for ~${hi} reps at target RIR`,w:'',r:hi};
 const top=L.sets.reduce((a,b)=>b.w*(1+b.r/30)>a.w*(1+a.r/30)?b:a);
 if(S.meso.week>=WEEKS&&!isProg()){const w=R(top.w);return{txt:`Deload: ${w} × ${Math.max(lo,Math.round(top.r/2))}, easy`,w,r:Math.round(top.r/2)}}
 if(top.r>=hi){const w=R(top.w+inc);return{txt:`↑ Add weight: ${w} × ${lo+1}-${lo+3}`,w,r:lo+2}}
 const w=R(top.w);return{txt:`↑ Same weight, add a rep: ${w} × ${top.r+1}`,w,r:top.r+1}}
const thumb=e=>vidId(e)?`<img src="https://i.ytimg.com/vi/${vidId(e)}/mqdefault.jpg" alt="" loading="lazy">`:`<span>${esc(e.name.split(/\s+/).map(w=>w[0]).join('').slice(0,2))}</span>`;
const thumbLink=(e,cls='th')=>`<a class="${cls}" href="${esc(demoUrl(e))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${thumb(e)}<i>▶</i></a>`;
const nameLink=e=>`<a class="nm" href="${esc(demoUrl(e))}" target="_blank" rel="noopener" onclick="event.stopPropagation()">${esc(e.name)}</a>`;
const curRIR=()=>isProg()?2:S.meso.week>=WEEKS?DELOAD_RIR:RIR[S.meso.week];

/* ---- active workout state (persisted) ---- */
function act(){const M=S.meso,key=M.week+'-'+M.day;if(!S.active||S.active.key!==key)return null;return S.active}
function startWorkout(){const M=S.meso,day=M.plan[M.day];
 S.active={key:M.week+'-'+M.day,cur:0,started:Date.now(),sets:day.ex.map(e=>{const sg=suggest(e);return Array.from({length:nSets(e,M.week)},(_,si)=>({w:sg.w,r:repT(e,si,sg),rir:'',done:false,pre:true}))})};save();renderWorkout()}
function renderWorkout(){const M=S.meso;
 if(!M){$('#workout').innerHTML=`${S.myPlan?`<div class="card"><h3>${esc(S.myPlan.name)}</h3><p class="muted">${S.myPlan.schedule.map(esc).join(' · ')}</p><button class="btn" onclick="loadProgram()">Use my program</button></div>`:''}<div class="card"><h3>Have a program file?</h3><button class="btn sec" onclick="importProgram()">Import program</button></div><div class="card"><h3>Or generate a mesocycle</h3><p class="muted">${WEEKS-1} accumulation weeks with sets ramping up and RIR dropping (3→0), then a deload week.</p>
  <label>Days per week<select id="md"><option>3</option><option selected>4</option><option>5</option></select></label>
  <label>Goal<select id="mg">${Object.entries(GOALS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select></label>
  <button class="btn" onclick="genMeso(+$('#md').value,$('#mg').value)">Generate plan</button></div>`;return}
 act()&&!showOv?renderActive():renderOverview()}
function renderOverview(){const M=S.meso,day=M.plan[M.day],deload=M.week>=WEEKS&&!isProg(),sets=day.ex.map(e=>nSets(e,M.week)),tot=sets.reduce((a,b)=>a+b,0);
 const mins=day.mins||Math.round(tot*(S.settings.rest+45)/60+5),mus={},hits={};day.ex.forEach((e,i)=>musOf(e).forEach((m,k)=>{(mus[m]||={n:0,s:0});mus[m].n++;mus[m].s+=sets[i]*(k?0.5:1);hits[m]=Math.max(hits[m]||0,k?0.5:1)}));
 $('#workout').innerHTML=`<div class="ovh"><small class="muted">${M.split} · ${isProg()?'Your plan':GOALS[M.goal].label} · Week ${M.week+1}${deload?' (Deload)':''}</small>
 <div class="ovt"><h2>${day.name}</h2><select onchange="jumpDay(this.value)">${M.plan.map((d,i)=>`<option value="${i}" ${i===M.day?'selected':''}>${d.name}</option>`).join('')}</select></div>
 <div class="meta"><span>⏱ ~${mins} min</span><span>${day.ex.length} exercises</span><span>${tot} sets</span><span>RIR ${curRIR()}</span></div></div>
 ${isProg()?`<div class="weeks sched">${M.schedule.map((d,i)=>`<span class="${d===day.name?'cur':d==='Rest'?'':'done'}">${['M','T','W','T','F','S','S'][i]}<br>${d}</span>`).join('')}</div>`:''}<div class="weeks" ${isProg()?'hidden':''}>${Array.from({length:WEEKS+1},(_,i)=>`<span class="${i<M.week?'done':i===M.week?'cur':''}">W${i+1}${i===WEEKS?'D':''}</span>`).join('')}</div>
 <h4>Target muscles</h4><div class="mcar">${Object.entries(mus).sort((a,b)=>b[1].s-a[1].s).map(([m,v])=>`<div class="mc">${bodySVG(VIEW_OF(m),{[m]:1},CROP[m],'mcfig')}<div><b>${m}</b><small>${v.n} exercise${v.n>1?'s':''}</small><small>${v.s} sets</small></div></div>`).join('')}</div>
 <div class="card fullmap">${bodySVG('front',hits)}${bodySVG('back',hits)}<div class="legend"><span><i class="p"></i>Primary</span><span><i class="s"></i>Secondary</span></div></div>
 <h4>Exercises</h4><div class="card flat">${day.ex.map((e,i)=>{const sg=suggest(e);return `<div class="exrow">${thumbLink(e)}<div class="grow">${nameLink(e)}<small>${e.reps?e.reps.join(' / ')+' reps':sets[i]+' sets × '+sg.r+' reps'}${sg.w!==''?' · '+sg.w+' '+S.settings.unit:''}</small>${musOf(e).map((m,k)=>`<span class="mtag ${k?'':'pri'}">${m}</span>`).join(' ')} <button class="edl" onclick="editDemo(decodeURIComponent('${encN(e.name)}'))">✎ Demo link</button></div><button class="link" onclick="swapEx(${i})">⇄</button></div>`}).join('')}</div>
 ${act()?`<button class="btn wide" onclick="showOv=false;renderWorkout()">Resume workout</button>`:`<button class="btn wide" onclick="showOv=false;startWorkout()">Start workout</button>`}
 <button class="link center" onclick="planModal()">Change plan</button>`}
function planModal(){modal(`<h3>Change plan</h3><p class="muted">Logged history is kept.</p>${S.myPlan&&!isProg()?`<button class="btn wide" onclick="loadProgram()">Use ${esc(S.myPlan.name)}</button>`:''}<button class="btn sec wide" onclick="closeModal();importProgram()">Import program</button><button class="btn sec wide" onclick="if(confirm('Leave the current plan and generate a new mesocycle? Your program stays saved on this phone.')){S.meso=null;S.active=null;save();closeModal();renderWorkout()}">Generate a mesocycle instead</button>`)}
function renderActive(){const M=S.meso,A=act(),day=M.plan[M.day],ci=A.cur,e=day.ex[ci],L=lastSets(e.name),sg=suggest(e),u=S.settings.unit,uni=isUni(e);
 const ds=A.sets[ci],uL=u[0].toUpperCase()+u.slice(1);
 $('#workout').innerHTML=`<div class="atop"><button class="link" onclick="showOv=true;closeKP(false);renderWorkout()">‹ Overview</button><b>${day.name}</b><button id="rest" class="restpill" onclick="restModal()">Rest</button><button class="more" aria-label="Workout options" onclick="workoutMenu()">⋯</button><button class="btn sm" onclick="finishWorkout()">Finish</button></div>
 <div class="car">${day.ex.map((x,i)=>{const d=A.sets[i],n=d.filter(s=>s.done).length;return `<button class="ci ${i===ci?'on':''} ${n===d.length?'fin':''}" onclick="S.active.cur=${i};save();renderWorkout()"><div class="cth">${thumb(x)}</div><small>${esc(x.name)}</small><em>${n}/${d.length}</em></button>`}).join('')}</div>
 <div class="card">
  <div class="exh">${thumbLink(e,'th big')}<div class="grow">${nameLink(e)}<div>${musOf(e).slice(0,2).map((m,k)=>`<span class="mtag ${k?'':'pri'}">${m}</span>`).join(' ')} ${demoLink(e)}</div></div><button class="link" onclick="swapEx(${ci})">⇄ Swap</button></div>
  <div class="sug">${sg.txt} · RIR ${curRIR()}</div>
  <div class="stbl"><div class="sh"><span>Set</span><span>Previous</span><span>${uL}${uni?'/Side':''}</span><span>Reps${uni?'/Side':''}</span><span>RIR</span><span></span></div>
  ${ds.map((s,si)=>{const p=L&&L.sets[si];return `<div class="sr ${s.done?'ok':''}"><span>${si+1}</span><span class="prev">${p?`${p.w}×${p.r}`:'–'}</span>
   ${['w','r','rir'].map(k=>`<button class="cell ${k==='rir'?'small':''} ${s.pre&&k!=='rir'?'pre':''} ${KP&&KP.ei===ci&&KP.si===si&&KP.k===k?'edit':''}" onclick="openKP(${ci},${si},'${k}')">${s[k]===''?(k==='rir'?curRIR():'–'):s[k]}</button>`).join('')}
   <button class="ckb" onclick="toggleSet(${ci},${si})">${s.done?'✓':''}</button></div>`}).join('')}</div>
  <div class="inl"><button class="link" onclick="S.active.sets[${ci}].push({...S.active.sets[${ci}].at(-1),done:false});save();renderWorkout()">+ Add set</button><span class="grow"></span>${ci<day.ex.length-1?`<button class="btn sec sm" onclick="S.active.cur++;save();renderWorkout()">Next exercise ›</button>`:''}</div>
 </div>`;tickRest()}
let showOv=false;
function toggleSet(ei,si){const s=S.active.sets[ei][si];s.done=!s.done;if(s.done){s.pre=false;if(s.rir==='')s.rir=curRIR();startRest()}closeKP(false);save();renderWorkout()}
function jumpDay(i){S.meso.day=+i;save();renderWorkout()}

/* ---- keypad ---- */
let KP=null;
function openKP(ei,si,k){KP={ei,si,k,buf:''};renderWorkout();drawKP()}
function drawKP(){if(!KP)return;const A=S.active,e=S.meso.plan[S.meso.day].ex[KP.ei],s=A.sets[KP.ei][KP.si],v=KP.buf!==''?KP.buf:s[KP.k];
 const lbl={w:S.settings.unit+(isUni(e)?' / side':''),r:'reps'+(isUni(e)?' / side':''),rir:'RIR'}[KP.k];
 $('#kp').innerHTML=`${KP.k==='w'&&isBar(e)?plateBanner(v):''}<div class="kph"><span class="muted">Set ${KP.si+1} · ${lbl}</span><b>${v===''?'–':v}</b></div>
 <div class="keys">${['1','2','3','4','5','6','7','8','9',KP.k==='w'?'.':'−','0','⌫'].map(x=>`<button onclick="kp('${x}')">${x}</button>`).join('')}
 <button class="kpm" onclick="kp('-')">${KP.k==='w'?'−'+(S.settings.unit==='lb'?5:2.5):'−1'}</button><button class="kpm" onclick="kp('+')">${KP.k==='w'?'+'+(S.settings.unit==='lb'?5:2.5):'+1'}</button><button class="done" onclick="closeKP()">Done</button></div>`;$('#kp').hidden=false}
function kp(x){const s=S.active.sets[KP.ei][KP.si],st=KP.k==='w'?(S.settings.unit==='lb'?5:2.5):1;let cur=KP.buf!==''?KP.buf:String(s[KP.k]);
 if(x==='⌫'){KP.buf=(KP.buf===''?cur:KP.buf).slice(0,-1);if(KP.buf==='')KP.buf=' '}
 else if(x==='+'||x==='-'){KP.buf=String(Math.max(0,(+cur||0)+(x==='+'?st:-st)))}
 else if(x==='−')return;else{if(KP.buf===''||KP.buf===' ')KP.buf='';if(x==='.'&&KP.buf.includes('.'))return;KP.buf+=x}
 const val=KP.buf.trim();s[KP.k]=val===''?'':+val;if(KP.k!=='rir')s.pre=false;save();renderWorkout();drawKP()}
function refreshKP(){if(KP){renderWorkout();drawKP()}}
function closeKP(re=true){KP=null;$('#kp').hidden=true;if(re&&S.active)renderWorkout()}

/* ---- rest timer ---- */
let restEnd=0,restIv=null;
function startRest(sec=S.settings.rest){restEnd=Date.now()+sec*1000;clearInterval(restIv);restIv=setInterval(tickRest,500);tickRest()}
function tickRest(){const el=$('#rest');if(!restEnd){if(el)el.textContent='Rest '+fmt(S.settings.rest);return}const left=Math.round((restEnd-Date.now())/1000);
 if(left<=0){restEnd=0;clearInterval(restIv);navigator.vibrate&&navigator.vibrate([300,150,300]);if(el){el.textContent='Rest done';el.classList.add('ding')}return}
 if(el){el.textContent='⏱ '+fmt(left);el.classList.add('run')}}
const fmt=s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
function restModal(){const left=restEnd?Math.max(0,Math.round((restEnd-Date.now())/1000)):0;
 modal(`<h3>Rest timer</h3><p class="big center">${restEnd?fmt(left):'Not running'}</p>${restEnd?`<div class="inl"><button class="btn sec" onclick="restEnd-=15000;restModal()">−15s</button><button class="btn sec" onclick="restEnd+=15000;restModal()">+15s</button><button class="btn sec" onclick="restEnd=0;tickRest();closeModal()">Skip</button></div>`:''}
 <label>Default rest</label><div class="chips">${[60,90,120,150,180,240].map(s=>`<button class="chip ${S.settings.rest===s?'on':''}" onclick="S.settings.rest=${s};save();restModal();tickRest()">${fmt(s)}</button>`).join('')}</div>
 <button class="btn" onclick="startRest();closeModal()">Start ${fmt(S.settings.rest)}</button>`)}

/* ---- swap / custom ---- */
function swapEx(ei){const e=S.meso.plan[S.meso.day].ex[ei],L=LIB();
 modal(`<h3>Swap ${esc(e.name)}</h3><p class="muted">${esc(e.name)} · ${demoLink(e)}</p>${L.map((o,i)=>o.muscle===e.muscle&&o.name!==e.name?`<div class="row tap" onclick="doSwap(${ei},${i})"><div class="inl">${thumbLink(o)}<div><b>${esc(o.name)}</b><small>${o.type==='c'?'compound':'isolation'}${o.custom?' · custom':''}</small></div></div>${demoLink(o)}</div>`:'').join('')}
 <button class="link" onclick="customExForm('${e.muscle}',${ei})">+ Add custom exercise</button>`)}
function doSwap(ei,i){const o=LIB()[i],old=S.meso.plan[S.meso.day].ex[ei];S.meso.plan[S.meso.day].ex[ei]={...o,...(old.reps?{reps:old.reps}:{})};
 if(act()){const sg=suggest(o);S.active.sets[ei]=Array.from({length:nSets(S.meso.plan[S.meso.day].ex[ei],S.meso.week)},(_,si)=>({w:sg.w,r:repT(S.meso.plan[S.meso.day].ex[ei],si,sg),rir:'',done:false,pre:true}))}save();closeModal();renderWorkout()}
function customExForm(mu='chest',ei=-1){modal(`<h3>Custom exercise</h3><label>Name<input id="xn"></label>
 <label>Muscle group<select id="xm">${MUSCLES.map(m=>`<option ${m===mu?'selected':''}>${m}</option>`).join('')}</select></label>
 <label>Type<select id="xt"><option value="c">Compound</option><option value="i">Isolation</option></select></label>
 <label>Equipment<select id="xq"><option value="barbell">Barbell (plate calculator)</option><option value="dumbbell">Dumbbell</option><option value="cable">Cable</option><option value="machine" selected>Machine</option><option value="bodyweight">Bodyweight</option></select></label>
 <label><input type="checkbox" id="xu" style="width:auto"> Unilateral (log per side)</label>
 <label>Demo video URL (optional)<input id="xv" type="url" placeholder="https://youtube.com/..."></label>
 <button class="btn" onclick="saveCustomEx(${ei})">Save</button>`)}
function saveCustomEx(ei){const n=$('#xn').value.trim();if(!n)return;if(LIB().some(x=>x.name.toLowerCase()===n.toLowerCase())){alert('That exercise already exists');return}
 let v=$('#xv').value.trim();if(v&&!/^https?:\/\//.test(v))v='https://'+v;
 S.customEx.push({name:n,muscle:$('#xm').value,type:$('#xt').value,equip:$('#xq').value,uni:$('#xu').checked,video:v,custom:1});save();
 if(ei>=0)swapEx(ei);else{closeModal();renderSettings()}}
function workoutMenu(){modal(`<h3>Workout options</h3><button class="btn danger wide" onclick="discardWorkout()">Discard workout</button><p class="muted">Clears this in-progress workout without saving. Your program day won't change.</p>`)}
function discardWorkout(){if(!confirm('Discard this workout? Logged sets in it will not be saved.'))return;const copy=S.active,cur=showOv;S.active=null;restEnd=0;clearInterval(restIv);closeKP(false);showOv=false;save();closeModal();renderWorkout();window.scrollTo(0,0)
 toast('Workout discarded',5000,'Undo',()=>{S.active=copy;save();renderWorkout()})}
function openSession(i){const s=S.sessions[i];if(!s)return;const by={};s.sets.forEach(x=>(by[x.ex]||=[]).push(x));
 modal(`<h3>${esc(s.day)}</h3><p class="muted">${s.date} · ${s.sets.length} sets · ${Math.round(s.sets.reduce((a,x)=>a+x.w*x.r,0)).toLocaleString()} vol</p>${Object.entries(by).map(([n,xs])=>`<div class="row"><div><b>${esc(n)}</b><small>${xs.map(x=>`${x.w}×${x.r}${x.rir!==undefined?'@'+x.rir:''}`).join(', ')}</small></div></div>`).join('')}
 <button class="btn danger wide" onclick="deleteSession(${i})">Delete workout</button>`)}
function deleteSession(i){if(!confirm('Delete this workout from your history? Charts and previous numbers will update.'))return;const [rm]=S.sessions.splice(i,1);save();closeModal();renderCur()
 toast('Workout deleted',5000,'Undo',()=>{S.sessions.splice(i,0,rm);save();renderCur()})}
function renderCur(){const t=location.hash.slice(1)||'food';({food:renderFood,workout:renderWorkout,cond:renderCond,progress:renderProgress,settings:renderSettings}[t]||renderProgress)()}
function finishWorkout(){const M=S.meso,A=act(),day=M.plan[M.day],sets=[];
 day.ex.forEach((e,ei)=>(A.sets[ei]||[]).forEach(s=>{if(s.done&&s.w!==''&&s.r!=='')sets.push({ex:e.name,muscle:e.muscle,w:+s.w,r:+s.r,rir:+(s.rir===''?curRIR():s.rir)})}));
 if(!sets.length){alert('Check off at least one set first.');return}
 if(!confirm(`Finish workout with ${sets.length} sets?`))return;
 const prev=S.sessions.slice();S.sessions.push({date:today(),week:M.week,day:day.name,sets});S.active=null;restEnd=0;closeKP(false);M.day++;if(M.day>=M.plan.length){M.day=0;M.week++;if(M.week>WEEKS&&!isProg()){alert('Mesocycle complete! Generate a new one.');S.meso=null}}
 save();renderWorkout();window.scrollTo(0,0);doneSummary(day.name,sets,prev)}

/* ---------- progress ---------- */
const e1rm=s=>s.w*(1+s.r/30);
function renderProgress(){const lifts=[...new Set(S.sessions.flatMap(s=>s.sets.map(x=>x.ex)))];
 $('#progress').innerHTML=!S.sessions.length?'<div class="card"><p class="muted">Log workouts to see progress (or load demo data in Settings).</p></div>':`
 <div class="card"><h3>Lift progress</h3><select id="lsel" onchange="drawLift()">${lifts.map(l=>`<option>${esc(l)}</option>`).join('')}</select><div id="lstat" class="muted"></div><div class="chart"><canvas id="lchart"></canvas></div></div>
 <div class="card"><h3>Weekly sets per muscle</h3><div class="chart tall"><canvas id="vchart"></canvas></div></div>
 <div class="card"><h3>Recent sessions</h3>${S.sessions.slice(-6).reverse().map((s,ri)=>`<div class="row tap" onclick="openSession(${S.sessions.length-1-ri})"><div><b>${s.day}</b><small>${s.date} · ${s.sets.length} sets</small></div><div class="rt">${Math.round(s.sets.reduce((a,x)=>a+x.w*x.r,0)).toLocaleString()} vol</div></div>`).join('')}</div>`;
 if(S.sessions.length){drawLift();drawVolume()}}
function drawLift(){const n=$('#lsel').value,pts=S.sessions.map(s=>({d:s.date,sets:s.sets.filter(x=>x.ex===n)})).filter(p=>p.sets.length);
 const e=pts.map(p=>r1(Math.max(...p.sets.map(e1rm)))),top=pts.map(p=>Math.max(...p.sets.map(x=>x.w)));
 $('#lstat').textContent=`Best e1RM ${Math.max(...e)} ${S.settings.unit} · ${pts.length} sessions`;
 mkChart('lchart','line',pts.map(p=>p.d.slice(5)),[{label:'Est. 1RM (Epley)',data:e,borderColor:'#22c55e',tension:.3},{label:'Top set weight',data:top,borderColor:'#3b82f6',tension:.3}])}
function wkKey(d){const x=new Date(d+'T12:00');x.setDate(x.getDate()-((x.getDay()+6)%7));return x.toLocaleDateString('en-CA').slice(5)}
function drawVolume(){const wks=[...new Set(S.sessions.map(s=>wkKey(s.date)))].slice(-6),cols=['#22c55e','#3b82f6','#f59e0b','#a855f7','#ef4444','#14b8a6','#eab308','#ec4899','#64748b','#f97316'];
 const ds=MUSCLES.map((m,i)=>({label:m,backgroundColor:cols[i],data:wks.map(w=>S.sessions.filter(s=>wkKey(s.date)===w).flatMap(s=>s.sets).filter(x=>x.muscle===m).length)}));
 mkChart('vchart','bar',wks.map(w=>'wk '+w),ds,{scales:{x:{stacked:true,ticks:{color:'#94a3b8'}},y:{stacked:true,ticks:{color:'#94a3b8'},grid:{color:'#1e293b'}}},plugins:{legend:{position:'bottom',labels:{color:'#cbd5e1',boxWidth:8,font:{size:10}}}}})}

/* ---------- settings ---------- */
function renderSettings(){const g=S.settings;
 $('#settings').innerHTML=`<div class="card"><h3>Daily targets</h3><div class="grid4">
 ${[['kcal','Calories'],['p','Protein g'],['c','Carbs g'],['f','Fat g']].map(([k,l])=>`<label>${l}<input type="number" value="${g[k]}" onchange="S.settings.${k}=+this.value;save()"></label>`).join('')}</div>
 <p class="muted" id="mcal"></p><label>Maintenance calories (TDEE)<input id="tdee" type="number" inputmode="numeric" placeholder="Not set" value="${g.tdee??''}" onchange="S.settings.tdee=+this.value||null;S.settings.tdeeSrc=this.value?'me':null;save();renderSettings()"></label><p class="muted">${g.tdee?({coach:'Estimate from Fitness Coach.',calc:'From the macro calculator below.',trend:'Recalibrated from your weight trend.',me:'Set by you.'}[g.tdeeSrc]||'')+' Used for goal projections.':'Add this to see your plan rate on the Goals card.'}</p><label>Weight unit<select onchange="S.settings.unit=this.value;save();renderSettings()"><option ${g.unit==='lb'?'selected':''}>lb</option><option ${g.unit==='kg'?'selected':''}>kg</option></select></label></div>
 ${slotSettings()}${healthHelp()}${macroCard()}<div class="card"><h3>Gym setup</h3><p class="muted">Bar ${barW()} ${S.settings.unit} · plates ${plates().join(', ')} · rest ${fmt(S.settings.rest)}</p><button class="btn sec" onclick="plateModal()">Bar & plates</button> <button class="btn sec" onclick="restModal()">Rest timer</button></div><div class="card"><h3>Custom exercises</h3>${S.customEx.length?S.customEx.map((x,i)=>`<div class="row"><div><b>${esc(x.name)}</b><small>${x.muscle} · ${demoLink(x)}</small></div><button class="x" onclick="S.customEx.splice(${i},1);save();renderSettings()">✕</button></div>`).join(''):'<p class="muted">None yet. They become available in new plans and swaps.</p>'}<button class="btn sec" onclick="customExForm()">+ Add exercise</button></div><div class="card"><h3>Data &amp; backups</h3><p class="muted">Everything is stored only in this browser on this phone${isIOS()?(isStandalone()?' (Home Screen app — separate from Safari)':' (Safari — separate from the Home Screen app)'):''}.</p>
 ${(()=>{const lb=+readLS('fit-lastbak')||0,le=S.lastExport||0,old=!le||Date.now()-le>7*864e5;return `<div class="bk ${old?'warn':''}"><div><small>Last auto backup (on this device)</small><b>${lb?new Date(lb).toLocaleString():'not yet'}</b></div><div><small>Last exported backup file</small><b>${le?new Date(le).toLocaleDateString():'never'}</b></div>${old?'<p>Export a backup file so you can restore if this browser clears its data.</p>':''}<button class="btn" onclick="exportData()">Export backup</button></div>`})()}
 <p class="muted">Storage ${window.__persisted?'is marked persistent ✓':'may be cleared by the browser'}.</p>
 <button class="btn sec" onclick="seedDemo()">Load demo data</button> <button class="btn sec" onclick="exportData()">Export backup</button> <button class="btn sec" onclick="exportProgram()">Export program</button> <button class="btn sec" onclick="importProgram()">Import program</button>
 <label class="btn sec file">Import backup<input type="file" accept=".json" onchange="importData(this)" hidden></label> <button class="btn danger" onclick="if(confirm('Erase ALL data, including on-device backups?')){['fit','fit-bak','fit-lastbak'].forEach(k=>localStorage.removeItem(k));try{indexedDB.deleteDatabase('fitcoach')}catch(e){}setTimeout(()=>location.reload(),300)}">Reset all</button></div>
 <p class="muted center">FitCoach v1 · ${FOODS.length} foods · ${LIB().length} exercises</p>`;
 $('#mcal').textContent=`Macros = ${g.p*4+g.c*4+g.f*9} kcal`}
function exportData(){S.lastExport=Date.now();save();const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S)],{type:'application/json'}));a.download='fitcoach-'+today()+'.json';a.click()}
function importData(inp){const r=new FileReader();r.onload=()=>{S=Object.assign(structuredClone(DEF),JSON.parse(r.result));save();location.reload()};r.readAsText(inp.files[0])}
function seedDemo(){if(!confirm('Add demo data (sample food, weights, 3 weeks of workouts)?'))return;
 const d=n=>{const x=new Date();x.setDate(x.getDate()-n);return x.toLocaleDateString('en-CA')};
 for(let i=30;i>=0;i--)S.weights.push({d:d(i),w:r1(150-i*0.05*-1-(30-i)*0.08+Math.sin(i)*0.6)});
 const byName=n=>FOODS.find(f=>f.name===n);
 [['Greek yogurt nonfat plain',200],['Rolled oats, dry',50],['Blueberries',80],['Chicken breast, cooked',150],['White rice, cooked',180],['Broccoli',120],['Whey protein powder',30]].forEach(([n,g])=>{const f=byName(n),k=g/100;(S.log[today()]||=[]).push({fid:f.id,name:f.name,g,kcal:f.kcal*k,p:f.p*k,c:f.c*k,f:f.f*k});S.recents.unshift(f.id)});
 S.favs=[byName('Egg, whole').id,byName('Ground turkey 93/7, cooked').id];
 if(!S.meso)genMeso(4,'hypertrophy');const M=S.meso,base={};let n=M.plan.length*3*2;
 for(let w=0;w<3;w++)M.plan.forEach((day,di)=>{const sets=[];day.ex.forEach(e=>{base[e.name]??=e.type==='c'?95:20;const b=base[e.name]+w*(e.type==='c'?5:2.5);
  for(let s=0;s<nSets(e,w);s++)sets.push({ex:e.name,muscle:e.muscle,w:b,r:10-s+w%2,rir:RIR[w]})});S.sessions.push({date:d(n),week:w,day:day.name,sets});n-=2});
 M.week=isProg()?3:3;M.day=0;save();alert('Demo data loaded');show('food')}

/* ---------- modal ---------- */
function modal(h){$('#modal').innerHTML=`<div class="sheet">${h}<button class="link center" onclick="closeModal()">Cancel</button></div>`;$('#modal').hidden=false}
function closeModal(){if(typeof scanStop==='function')scanStop();$('#modal').hidden=true;if(location.hash==='#settings')renderSettings()}
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
mealMigrate();slotMigrate();
startupStorage();show((location.hash.slice(1)in{food:1,workout:1,cond:1,progress:1,settings:1})?location.hash.slice(1):'food');
healthImport();
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js');

function doneSummary(name,sets,prev){const u=S.settings.unit||'lb',by={};sets.forEach(x=>(by[x.ex]||=[]).push(x));
 const best={};prev.forEach(ss=>ss.sets.forEach(x=>{const v=x.w*(1+x.r/30);if(v>(best[x.ex]||0))best[x.ex]=v}));
 const vol=Math.round(sets.reduce((a,x)=>a+x.w*x.r,0)),reps=sets.reduce((a,x)=>a+x.r,0);let prs=0;
 const rows=Object.entries(by).map(([ex,xs])=>{const top=xs.reduce((a,b)=>b.w*(1+b.r/30)>a.w*(1+a.r/30)?b:a);const v=top.w*(1+top.r/30),pr=best[ex]&&v>best[ex]+0.01;if(pr)prs++;
  return `<div class="row"><div><b>${esc(ex)}</b><small>${xs.length} set${xs.length>1?'s':''} · top ${top.w} ${u} × ${top.r}</small></div>${pr?'<span class="prb">PR</span>':''}</div>`}).join('');
 modal(`<div class="done"><div class="big">🎉</div><h3>Workout complete!</h3><p class="muted">${esc(name)} done. Great work, Jenna.</p>
 <div class="dstats"><div><b>${sets.length}</b><small>sets</small></div><div><b>${reps}</b><small>reps</small></div><div><b>${vol.toLocaleString()}</b><small>${u} moved</small></div><div><b>${prs}</b><small>PR${prs===1?'':'s'}</small></div></div>
 ${prs?`<p class="prmsg">New personal best${prs>1?'s':''} today. Keep it up!</p>`:''}<div class="dlist">${rows}</div></div>`);
 const c=$('#modal .sheet>button.link');if(c)c.textContent='Done'}
