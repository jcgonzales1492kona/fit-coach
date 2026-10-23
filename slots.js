/* ---------- meal slots: Breakfast / Lunch / Dinner / Snack (loaded before app.js; functions only) ---------- */
/* Start times in minutes after midnight. Breakfast b..l, Lunch l..a, Snack a..d, Dinner d..n (inclusive), Snack after n and before b. */
const SLOT_DEF={b:240,l:630,a:900,d:1020,n:1260};
const SLOT_ORDER=['b','l','d','s'],SLOT_NAMES={b:'Breakfast',l:'Lunch',d:'Dinner',s:'Snack'};
const SLOT_STICKY_MS=10*60000;
let slotSel=null,slotForce=null;
const slotTimes=()=>Object.assign({},SLOT_DEF,S.settings.slotTimes||{});
function slotAt(dt){const m=dt.getHours()*60+dt.getMinutes(),T=slotTimes();
 return m<T.b?'s':m<T.l?'b':m<T.a?'l':m<T.d?'s':m<=T.n?'d':'s'}
function slotDefault(){const now=Date.now();
 if(slotForce&&now-slotForce.t<5*60000)return slotForce.s;
 if(viewDate===today()&&S.lastSlot&&now-S.lastSlot.t<SLOT_STICKY_MS)return S.lastSlot.s;
 return slotAt(new Date())}
function slotPills(){slotSel=slotDefault();return `<div class="slots" role="radiogroup" aria-label="Meal">${SLOT_ORDER.map(s=>`<button type="button" class="chip slp ${s===slotSel?'on':''}" data-s="${s}" onclick="slotChoose('${s}')">${SLOT_NAMES[s]}</button>`).join('')}</div>`}
function slotChoose(s){slotSel=s;document.querySelectorAll('#modal .slp').forEach(b=>b.classList.toggle('on',b.dataset.s===s))}
function slotTake(){const s=SLOT_NAMES[slotSel]?slotSel:slotDefault();S.lastSlot={s,t:Date.now()};slotForce=null;slotSel=null;return s}
function slotMigrate(){let n=0;for(const d in S.log)(S.log[d]||[]).forEach(e=>{if(!SLOT_NAMES[e.slot]){e.slot=e.t?slotAt(new Date(e.t)):'s';n++}});return n}
function slotSum(L){return L.reduce((a,{e})=>({kcal:a.kcal+e.kcal,p:a.p+e.p,c:a.c+e.c,f:a.f+e.f}),{kcal:0,p:0,c:0,f:0})}
function slotLogCard(entries){const all=entries.map((e,i)=>({e,i}));let h='<div class="card logc"><h3>Logged</h3>';
 if(!all.length)h+='<p class="muted">Nothing logged yet.</p>';
 for(const s of SLOT_ORDER){const L=all.filter(x=>(x.e.slot||'s')===s);
  if(!L.length){h+=`<div class="slh empty" data-s="${s}"><b>${SLOT_NAMES[s]}</b><button class="link sadd" onclick="slotAdd('${s}')">+ Add</button></div>`;continue}
  const t=slotSum(L);h+=`<div class="slsec" data-s="${s}"><div class="slh" data-slot="${s}"><b>${SLOT_NAMES[s]}</b><small>${Math.round(t.kcal)} kcal · P${r1(t.p)} C${r1(t.c)} F${r1(t.f)}</small><button class="link sadd" onclick="slotAdd('${s}')" aria-label="Add to ${SLOT_NAMES[s]}">+ Add</button></div><div class="slitems">`;
  h+=L.map(({e,i})=>`<div class="row tap" onclick="entryEdit(${i})"><div class="grow"><b>${esc(e.name)}</b><small>${e.meal?`${e.sv} serving${e.sv===1?'':'s'} · <i class="sbadge mbadge">Meal</i>`:e.g+'g'} · P${r1(e.p)} C${r1(e.c)} F${r1(e.f)}</small></div><div class="rt"><button class="spill" onclick="event.stopPropagation();slotMoveForm(${i})" aria-label="Move to another meal">${SLOT_NAMES[s]} ▾</button>${Math.round(e.kcal)}<button class="x" onclick="event.stopPropagation();delEntry(${i})" aria-label="Delete">✕</button></div></div>`).join('')+'</div></div>'}
 const y=new Date(viewDate+'T12:00');y.setDate(y.getDate()-1);const yd=y.toLocaleDateString('en-CA'),Y=S.log[yd]||[];
 const cp=SLOT_ORDER.filter(s=>Y.some(e=>(e.slot||'s')===s));
 if(cp.length)h+=`<div class="chips scopy">${cp.map(s=>`<button class="chip" onclick="slotCopy('${s}')">Copy yesterday's ${SLOT_NAMES[s].toLowerCase()}</button>`).join('')}</div>`;
 return h+'</div>'}
function slotAdd(s){slotForce={s,t:Date.now()};const q=$('#fq');if(q){q.scrollIntoView({block:'center'});q.focus()}toast(`Adding to ${SLOT_NAMES[s]}. Search, scan, or tap a quick add or meal.`,3500)}
function slotMoveForm(i){const e=(S.log[viewDate]||[])[i];if(!e)return;slotSel=e.slot||'s';
 modal(`<h3>Move to another meal</h3><p class="muted">${esc(e.name)} · ${Math.round(e.kcal)} kcal</p><div class="slots">${SLOT_ORDER.map(s=>`<button type="button" class="chip slp ${s===slotSel?'on':''}" data-s="${s}" onclick="slotChoose('${s}')">${SLOT_NAMES[s]}</button>`).join('')}</div><button class="btn" onclick="slotMove(${i})">Move</button>`)}
function slotMove(i){const e=(S.log[viewDate]||[])[i];if(e&&SLOT_NAMES[slotSel])e.slot=slotSel;slotSel=null;save();closeModal();renderFood()}
function slotCopy(s){const y=new Date(viewDate+'T12:00');y.setDate(y.getDate()-1);const Y=(S.log[y.toLocaleDateString('en-CA')]||[]).filter(e=>(e.slot||'s')===s);if(!Y.length)return;
 const now=Date.now();(S.log[viewDate]||=[]).push(...Y.map(e=>({...structuredClone(e),slot:s,t:now})));save();renderFood();toast(`Copied ${Y.length} item${Y.length>1?'s':''} to ${SLOT_NAMES[s]}.`,3000)}
/* Settings: editable boundaries */
const slotHM=m=>String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');
const slotMin=v=>{const m=/^(\d{1,2}):(\d{2})$/.exec(v||'');return m?(+m[1])*60+(+m[2]):NaN};
function slotSettings(){const T=slotTimes(),F=[['b','Breakfast from'],['l','Lunch from'],['a','Afternoon snack from'],['d','Dinner from'],['n','Dinner until']];
 return `<div class="card" id="slotc"><h3>Meal times</h3><p class="muted">New entries go into the meal for the time you add them. After dinner and overnight count as Snack.</p><div class="grid4 g2">${F.map(([k,l])=>`<label>${l}<input id="st_${k}" type="time" value="${slotHM(T[k])}"></label>`).join('')}</div>
 <div class="inl"><button class="btn sec" onclick="slotSaveTimes()">Save meal times</button><button class="link" onclick="delete S.settings.slotTimes;save();renderSettings();toast('Meal times reset.',2500)">Reset</button></div></div>`}
function slotSaveTimes(){const o={};for(const k of['b','l','a','d','n']){o[k]=slotMin($('#st_'+k).value);if(isNaN(o[k])){toast('Enter every time as hh:mm.',3000);return}}
 if(!(o.b<o.l&&o.l<o.a&&o.a<o.d&&o.d<=o.n)){toast('Times need to go in order through the day.',3500);return}
 S.settings.slotTimes=o;save();renderSettings();toast('Meal times saved.',2500)}
