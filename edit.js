/* Edit logged foods and the shared body-weight list. */
let wAll=false;
function foodLow(f){return !!f&&!f.corrected&&(!!f.flag||(S.custom.some(x=>x.id===f.id)&&/creamer/i.test(f.name)))}
function lowWarn(f){return `<div class="gsug lowwarn"><div><b>Numbers look low. Check against the label.</b><small>${f.barcode?'Open Food Facts sometimes lists one serving as 100 g.':'Creamer is usually well over 100 kcal per 100 g.'}</small></div><button class="btn sm" onclick="fixLabelForm('${f.id}')">Fix from label</button></div>`}
/* ---- entry edit ---- */
function entryEdit(i){const e=(S.log[viewDate]||[])[i];if(!e)return;slotSel=e.slot||'s';
 const m=e.meal&&mealById(e.meal),f=!e.meal&&foodById(e.fid),cust=f&&S.custom.some(x=>x.id===f.id);
 const amt=e.meal?`<label>Servings<div class="inl"><button class="btn sec sm" onclick="entryStep(-0.5,${i})">−</button><input id="esv" type="number" inputmode="decimal" step="0.5" min="0.5" value="${e.sv}" oninput="entryPrev(${i})"><button class="btn sec sm" onclick="entryStep(0.5,${i})">+</button></div></label>`
  :`<label>Amount (grams)<input id="eg" type="number" inputmode="decimal" value="${e.g}" oninput="entryPrev(${i})"></label>`;
 const info=e.meal?(m?(()=>{const v=mealPer(m);return `<p class="muted">${v.kcal} kcal · P${v.p} C${v.c} F${v.f} per serving</p>`})():'<p class="muted">This meal was deleted. Numbers scale from what was logged.</p>')
  :(f?`<p class="muted">${f.kcal} kcal · P${f.p} C${f.c} F${f.f} per 100g</p>`:'<p class="muted">This food was deleted. Numbers scale from what was logged.</p>');
 modal(`<h3>${esc(e.name)}${e.meal?' <i class="sbadge mbadge">Meal</i>':''}</h3>${info}${f&&foodLow(f)?lowWarn(f):''}${amt}<p id="eprev" class="muted"></p>
 <div class="slots" role="radiogroup" aria-label="Meal">${SLOT_ORDER.map(s=>`<button type="button" class="chip slp ${s===slotSel?'on':''}" data-s="${s}" onclick="slotChoose('${s}')">${SLOT_NAMES[s]}</button>`).join('')}</div>
 <label>Eaten at, optional<input id="ema" type="time" value="${esc(e.mealAt||'')}"></label><p class="muted">The time you ate, if you know it. Leave it blank if you do not. The time the entry was saved is not used.</p>
 <div class="inl"><button class="btn" id="esave" onclick="entrySave(${i})">Save</button><button class="btn sec danger" onclick="entryDel(${i})">Delete</button></div>${cust&&!foodLow(f)?`<div><button class="link" onclick="fixLabelForm('${f.id}')">✎ Fix from label</button></div>`:''}`);entryPrev(i)}
function entryStep(d,i){const el=$('#esv'),v=Math.max(0.5,Math.round(((+el.value||0)+d)*2)/2);el.value=v;entryPrev(i)}
function entryCalc(e){if(e.meal){const n=+$('#esv').value;if(!(n>0))return null;const m=mealById(e.meal);
  if(m){const v=mealPer(m);return{sv:n,kcal:v.kcal*n,p:v.p*n,c:v.c*n,f:v.f*n}}const k=n/(e.sv||1);return{sv:n,kcal:e.kcal*k,p:e.p*k,c:e.c*k,f:e.f*k}}
 const g=+$('#eg').value;if(!(g>0))return null;const f=foodById(e.fid);
 if(f){const k=g/100;return{g,kcal:f.kcal*k,p:f.p*k,c:f.c*k,f:f.f*k}}const k=e.g>0?g/e.g:1;return{g,kcal:e.kcal*k,p:e.p*k,c:e.c*k,f:e.f*k}}
function entryPrev(i){const e=S.log[viewDate][i],v=entryCalc(e),el=$('#eprev');if(el)el.textContent=v?`${Math.round(v.kcal)} kcal · P${r1(v.p)} C${r1(v.c)} F${r1(v.f)}`:'Enter an amount.'}
function entrySave(i){const e=(S.log[viewDate]||[])[i];if(!e)return;const v=entryCalc(e);if(!v){toast('Enter an amount above 0.',2500);return}
 Object.assign(e,v);if(SLOT_NAMES[slotSel])e.slot=slotSel;const mt=$('#ema')?$('#ema').value:'';if(/^\d{2}:\d{2}$/.test(mt))e.mealAt=mt;else delete e.mealAt;slotSel=null;save();closeModal();renderFood();toast(`Updated ${e.name}.`,2500)}
function entryDel(i){const e=(S.log[viewDate]||[])[i];if(!e||!confirm(`Delete ${e.name} from your log?`))return;S.log[viewDate].splice(i,1);save();closeModal();renderFood();toast(`Deleted ${e.name}.`,2500)}
/* ---- weigh-ins ---- */
function wFmt(d){return new Date(d+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}
function weighList(){const u=S.settings.unit,L=[...S.weights].sort((a,b)=>a.d<b.d?1:-1),V=wAll?L:L.slice(0,14);if(!L.length)return'';
 return `<h4>Recent weigh-ins</h4><div class="wlist">${V.map(x=>`<div class="row tap" onclick="weighEdit('${x.d}')"><div class="grow"><b>${wFmt(x.d)}</b></div><div class="rt">${x.w} ${u}</div></div>`).join('')}</div>${L.length>14?`<button class="link" onclick="wAll=!wAll;renderFood()">${wAll?'Show fewer':`Show all (${L.length})`}</button>`:''}`}
function weighEdit(d){const rows=weightOn(S.weights,d);if(!rows.length)return;const x=rows[rows.length-1];
 modal(`<h3>Edit weigh-in</h3><label>Weight (${S.settings.unit})<input id="ew" type="number" step="0.1" inputmode="decimal" value="${x.w}"></label><label>Date<input id="ed" type="date" value="${d}" max="${today()}"></label>
 <div class="inl"><button class="btn" onclick="weighSave('${d}')">Save</button><button class="btn sec danger" onclick="weighDel('${d}')">Delete</button></div>`)}
function weighSave(d0){const w=r1(+$('#ew').value),d=$('#ed').value;
 if(!(w>0)){toast('Enter a weight.',2500);return}if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){toast('Pick a date.',2500);return}if(d>today()){toast('That date is in the future.',2500);return}
 const other=d!==d0&&weightOn(S.weights,d).length;
 if(other&&!confirm(`${wFmt(d)} already has a weigh-in. Replace it with ${w}?`))return;
 let list=d===d0?S.weights:S.weights.filter(x=>x&&x.d!==d0);
 S.weights=weightSet(list,d,w);save();closeModal();showWeight();toast('Weigh-in updated.',2500)}
function weighDel(d){const rows=weightOn(S.weights,d);if(!rows.length||!confirm(`Delete the weigh-in on ${wFmt(d)}?`))return;S.weights=weightSet(S.weights,d,null);save();closeModal();showWeight();toast('Weigh-in deleted.',2500)}
function weightOn(weights,date){return (Array.isArray(weights)?weights:[]).filter(x=>x&&x.d===date&&isFinite(+x.w)&&+x.w>0)}
function weightSet(weights,date,w){const next=(Array.isArray(weights)?weights:[]).filter(x=>x&&x.d!==date);
 if(w!=null&&isFinite(+w)&&+w>0)next.push({d:date,w:Math.round(+w*10)/10});
 next.sort((a,b)=>String(a.d)<String(b.d)?-1:String(a.d)>String(b.d)?1:0);return next}
function showWeight(){const t=(location.hash||'').replace('#','');if(t==='holiday'&&typeof renderHoliday==='function')renderHoliday();else if(typeof renderFood==='function')renderFood()}
