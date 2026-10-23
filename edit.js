/* v28: edit logged entries, edit weigh-ins, weight from Apple Health */
const HEALTH_URL='https://jcgonzales1492kona.github.io/fit-coach/';
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
 <div class="inl"><button class="btn" id="esave" onclick="entrySave(${i})">Save</button><button class="btn sec danger" onclick="entryDel(${i})">Delete</button></div>${cust&&!foodLow(f)?`<div><button class="link" onclick="fixLabelForm('${f.id}')">✎ Fix from label</button></div>`:''}`);entryPrev(i)}
function entryStep(d,i){const el=$('#esv'),v=Math.max(0.5,Math.round(((+el.value||0)+d)*2)/2);el.value=v;entryPrev(i)}
function entryCalc(e){if(e.meal){const n=+$('#esv').value;if(!(n>0))return null;const m=mealById(e.meal);
  if(m){const v=mealPer(m);return{sv:n,kcal:v.kcal*n,p:v.p*n,c:v.c*n,f:v.f*n}}const k=n/(e.sv||1);return{sv:n,kcal:e.kcal*k,p:e.p*k,c:e.c*k,f:e.f*k}}
 const g=+$('#eg').value;if(!(g>0))return null;const f=foodById(e.fid);
 if(f){const k=g/100;return{g,kcal:f.kcal*k,p:f.p*k,c:f.c*k,f:f.f*k}}const k=e.g>0?g/e.g:1;return{g,kcal:e.kcal*k,p:e.p*k,c:e.c*k,f:e.f*k}}
function entryPrev(i){const e=S.log[viewDate][i],v=entryCalc(e),el=$('#eprev');if(el)el.textContent=v?`${Math.round(v.kcal)} kcal · P${r1(v.p)} C${r1(v.c)} F${r1(v.f)}`:'Enter an amount.'}
function entrySave(i){const e=(S.log[viewDate]||[])[i];if(!e)return;const v=entryCalc(e);if(!v){toast('Enter an amount above 0.',2500);return}
 Object.assign(e,v);if(SLOT_NAMES[slotSel])e.slot=slotSel;slotSel=null;save();closeModal();renderFood();toast(`Updated ${e.name}.`,2500)}
function entryDel(i){const e=(S.log[viewDate]||[])[i];if(!e||!confirm(`Delete ${e.name} from your log?`))return;S.log[viewDate].splice(i,1);save();closeModal();renderFood();toast(`Deleted ${e.name}.`,2500)}
/* ---- weigh-ins ---- */
function wFmt(d){return new Date(d+'T12:00').toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}
function weighList(){const u=S.settings.unit,L=[...S.weights].sort((a,b)=>a.d<b.d?1:-1),V=wAll?L:L.slice(0,14);if(!L.length)return'';
 return `<h4>Recent weigh-ins</h4><div class="wlist">${V.map(x=>`<div class="row tap" onclick="weighEdit('${x.d}')"><div class="grow"><b>${wFmt(x.d)}</b></div><div class="rt">${x.w} ${u}</div></div>`).join('')}</div>${L.length>14?`<button class="link" onclick="wAll=!wAll;renderFood()">${wAll?'Show fewer':`Show all (${L.length})`}</button>`:''}`}
function weighEdit(d){const x=S.weights.find(w=>w.d===d);if(!x)return;
 modal(`<h3>Edit weigh-in</h3><label>Weight (${S.settings.unit})<input id="ew" type="number" step="0.1" inputmode="decimal" value="${x.w}"></label><label>Date<input id="ed" type="date" value="${d}" max="${today()}"></label>
 <div class="inl"><button class="btn" onclick="weighSave('${d}')">Save</button><button class="btn sec danger" onclick="weighDel('${d}')">Delete</button></div>`)}
function weighSave(d0){const w=r1(+$('#ew').value),d=$('#ed').value;
 if(!(w>0)){toast('Enter a weight.',2500);return}if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){toast('Pick a date.',2500);return}if(d>today()){toast('That date is in the future.',2500);return}
 const other=d!==d0&&S.weights.find(x=>x.d===d);
 if(other&&!confirm(`${wFmt(d)} already has ${other.w} ${S.settings.unit}. Replace it with ${w}?`))return;
 S.weights=S.weights.filter(x=>x.d!==d0&&x.d!==d);S.weights.push({d,w});S.weights.sort((a,b)=>a.d<b.d?-1:1);save();closeModal();renderFood();toast('Weigh-in updated.',2500)}
function weighDel(d){const x=S.weights.find(w=>w.d===d);if(!x||!confirm(`Delete ${x.w} ${S.settings.unit} on ${wFmt(d)}?`))return;S.weights=S.weights.filter(w=>w.d!==d);save();closeModal();renderFood();toast('Weigh-in deleted.',2500)}
/* ---- Apple Health: ?w=187.2&d=YYYY-MM-DD&u=lb|kg, or paste from clipboard ---- */
function healthUnit(u){u=String(u||'').trim().toLowerCase();return /^(kg|kgs|kilo|kilos|kilograms?)$/.test(u)?'kg':/^(lb|lbs|pounds?)$/.test(u)?'lb':u?null:''}
function healthLog(raw,uIn,dIn){const my=S.settings.unit==='kg'?'kg':'lb',u=healthUnit(uIn);
 const n=+String(raw??'').trim().replace(',','.');
 if(raw==null||String(raw).trim()===''||!isFinite(n))return{ok:0,msg:"Couldn't read a weight from Health."};
 if(u===null)return{ok:0,msg:`Unknown weight unit "${uIn}". Use lb or kg.`};
 const from=u||my;let w=from===my?n:my==='kg'?n/2.20462:n*2.20462;w=r1(w);
 const lb=my==='kg'?w*2.20462:w;if(lb<50||lb>700)return{ok:0,msg:`${r1(n)} ${from} doesn't look like a body weight, so it wasn't logged.`};
 let d=today();if(dIn){if(!/^\d{4}-\d{2}-\d{2}$/.test(dIn)||isNaN(new Date(dIn+'T12:00')))return{ok:0,msg:'The date from Health is not valid.'};if(dIn>today())return{ok:0,msg:'The date from Health is in the future.'};d=dIn}
 const old=S.weights.find(x=>x.d===d);if(old&&Math.abs(+old.w-w)<0.05)return{ok:1,same:1,w,d,msg:`${w} ${my} is already logged for ${d===today()?'today':wFmt(d)}.`};
 S.weights=S.weights.filter(x=>x.d!==d);S.weights.push({d,w});S.weights.sort((a,b)=>a.d<b.d?-1:1);save();
 return{ok:1,w,d,msg:`Logged ${w} ${my} from Health${d===today()?'':' for '+wFmt(d)}${old?` (was ${old.w})`:''}`}}
function healthImport(){const q=new URLSearchParams(location.search);if(!q.has('w'))return;
 const r=healthLog(q.get('w'),q.get('u'),q.get('d'));
 ['w','d','u'].forEach(k=>q.delete(k));const s=q.toString();history.replaceState(null,'',location.pathname+(s?'?'+s:'')+location.hash);
 if(r.ok)viewDate=today();show('food');setTimeout(()=>toast(r.msg,r.ok?5000:7000),50);return r}
async function healthPaste(){let t='';
 try{t=await navigator.clipboard.readText()}catch(e){toast('Could not read the clipboard. Paste the number into the weight box instead.',5000);return}
 const m=/(-?\d+(?:[.,]\d+)?)\s*([a-z]*)/i.exec(t||'');if(!m){toast("The clipboard doesn't have a weight. Run your Health shortcut first.",5000);return}
 const r=healthLog(m[1],m[2]);renderFood();toast(r.msg,r.ok?4000:6000)}
/* ---- Settings help ---- */
function healthHelp(){return `<div class="card" id="hhelp"><h3>Auto-log weight from your scale</h3>
 <p class="muted">If your scale syncs to Apple Health, an iPhone shortcut can send the latest weight to FitCoach.</p>
 <ol class="steps"><li>Open the <b>Shortcuts</b> app, tap <b>+</b>, and name it <b>FitCoach weight</b>.</li>
 <li>Add <b>Find Health Samples</b>. Set Type to <b>Weight</b>, Sort by <b>Start Date</b>, Order <b>Latest First</b>, turn on <b>Limit</b>, and get <b>1</b> sample.</li>
 <li>Add <b>Get Details of Health Sample</b> and choose <b>Value</b>.</li>
 <li>Add <b>Copy to Clipboard</b>. It copies the Value.</li>
 <li>Run the shortcut, open FitCoach from your Home Screen, and tap <b>Paste from Health</b> under Body weight.</li></ol>
 <p class="muted"><b>Optional, runs every morning:</b> in Shortcuts go to <b>Automation</b>, tap <b>+</b>, pick <b>Time of Day</b>, choose a time after you usually weigh in, set it to <b>Run Immediately</b>, and pick FitCoach weight. Then just open the app and tap Paste from Health.</p>
 <p class="muted"><b>Why the paste step:</b> the FitCoach icon on your Home Screen keeps its own data, separate from Safari. A shortcut link opens Safari, so it would log the weight into Safari's copy, not your app. The clipboard works with both.</p>
 <p class="muted"><b>Safari only:</b> instead of Copy to Clipboard, add <b>URL</b> with <span class="mono">${HEALTH_URL}?w=</span> and the Value, then <b>Open URLs</b>. This logs it straight into FitCoach in Safari.</p></div>`}
