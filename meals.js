/* ---------- saved meals (loaded before app.js; functions only, mealMigrate() is called from app.js) ---------- */
const MEAL_SEED={name:'Chili-Lime Chicken Burrito Bowls',servings:4,cook:{kcal:520,p:45},/* cookbook claim, shown for reference only */
 items:[['Chicken thigh, boneless skinless, raw',907],['White rice, dry',185],['Black beans, canned, drained',480],['Corn, canned, drained',250],['Bell pepper',120],['Onion',40],['Greek yogurt 2% plain',245],['Lime juice',45],['Olive oil',2]],
 note:'Per serving: about 420 g bowl base (160 g chicken, 135 g rice, 120 g beans), 105 g corn salsa, 65 g yogurt sour cream.'};
/* v31: remaining 4-day cookbook meals. cook is the claim for reference; label stays null so macros come from ingredients.
   Tortillas are 42 g each (8 per batch), an estimate. Spices, herbs, and cilantro are omitted. */
const MEAL_SEEDS=[
 {name:'Sheet Pan Turkey Tacos with Cottage Cheese Queso',servings:4,cook:{kcal:550,p:45},
  items:[['Ground turkey 93/7, raw',680],['Bell pepper',240],['Onion',150],['Olive oil',2],['Cottage cheese 2%',340],['Cheddar cheese',113],['Green chiles, canned',113],['Salsa',185],['Low carb tortilla',336]],
  note:'Per serving: about 205 g taco filling, 155 g cottage cheese queso, 2 low-carb tortillas (42 g each, an estimate; check the bag), and 30 g salsa.'},
 {name:'Stealth-Health Chicken Pasta Salad',servings:4,cook:{kcal:500,p:42},
  items:[['Chicken breast, raw',680],['Chickpea pasta, dry',227],['Cucumber',300],['Tomato',300],['Cottage cheese 2%',225],['Greek yogurt 2% plain',120],['Lemon juice',45],['Garlic, raw',5],['Olive oil',2]],
  note:'Per serving: about 395 g salad (125 g chicken, 125 g chickpea pasta, 145 g cucumber and tomatoes), 100 g herb dressing.'},
 {name:'High-Protein Baked Ziti',servings:4,cook:{kcal:580,p:48},
  items:[['Ground beef 93/7, raw',567],['Onion',75],['Garlic, raw',15],['Marinara sauce',680],['Cottage cheese 2%',450],['Spinach',120],['Pasta, dry',227],['Mozzarella part-skim',227]],
  note:'Per serving: about 550 g baked ziti. Weigh the whole bake, subtract the dish, and divide by 4.'}];
let mealDraft=null;
const mealById=id=>(S.meals||[]).find(m=>m.id===id);
const mealR1=x=>Math.round(x*10)/10;
/* whole-recipe totals and per-serving numbers computed from ingredients */
function mealCalc(m){const t={kcal:0,p:0,c:0,f:0,miss:0};(m.items||[]).forEach(it=>{const f=foodById(it.fid),k=(+it.g||0)/100;if(!f){t.miss++;return}t.kcal+=f.kcal*k;t.p+=f.p*k;t.c+=f.c*k;t.f+=f.f*k});
 const n=+m.servings||1;return{kcal:Math.round(t.kcal/n),p:mealR1(t.p/n),c:mealR1(t.c/n),f:mealR1(t.f/n),miss:t.miss,total:t}}
function mealPer(m){return m.label?{kcal:Math.round(+m.label.kcal||0),p:mealR1(+m.label.p||0),c:mealR1(+m.label.c||0),f:mealR1(+m.label.f||0)}:mealCalc(m)}
function mealMigrate(){S.meals||=[];S.mig||={};mealSeed();mealSeedCookbook4();mealSeedBurrito();mealMigrateCompute()}
function mealSeed(){if(S.mig.mealSeed)return;S.mig.mealSeed=1;S.mig.mealCompute=1;
 if(S.meals.some(m=>m.name.toLowerCase()===MEAL_SEED.name.toLowerCase()))return;
 const items=MEAL_SEED.items.map(([n,g])=>{const f=FOODS.find(x=>x.name===n);return f?{fid:f.id,g}:null}).filter(Boolean);
 S.meals.push({id:'m'+Date.now(),name:MEAL_SEED.name,servings:MEAL_SEED.servings,items,note:MEAL_SEED.note,label:null,cook:{...MEAL_SEED.cook}})}
/* phones that already ran mealSeed still get the three later cookbook meals, once, if the name is missing */
function mealSeedCookbook4(){if(S.mig.mealSeedCookbook4)return;
 const have=new Set(S.meals.map(m=>m.name.toLowerCase())),base=Date.now(),add=[];
 for(let i=0;i<MEAL_SEEDS.length;i++){const seed=MEAL_SEEDS[i];if(have.has(seed.name.toLowerCase()))continue;
  const items=seed.items.map(([n,g])=>{const f=FOODS.find(x=>x.name===n);return f?{fid:f.id,g}:null});if(items.some(x=>!x))return;
  add.push({id:'m'+(base+i+1),name:seed.name,servings:seed.servings,items,note:seed.note,label:null,cook:{...seed.cook}})}
 add.forEach(m=>S.meals.push(m));S.mig.mealSeedCookbook4=1;save()}
/* v33: breakfast burritos. cook is the card claim (~430 kcal, 40 g protein); label stays null so macros come from ingredients.
   Turkey is 567 g of the shared 907 g raw batch. Spices are omitted. Tortillas are 70 g high-fiber whole wheat each. */
const MEAL_BURRITO={name:'High-Protein Breakfast Burritos',servings:8,cook:{kcal:430,p:40},
 items:[['Ground turkey 93/7, raw',567],['Egg, whole',400],['Liquid egg whites',454],['Cottage cheese 1%',150],['Bell pepper',240],['Onion',150],['Spinach',60],['Black beans, canned, drained',170],['High-fiber whole wheat tortilla',560],['Shredded Mexican blend',80],['Greek yogurt nonfat plain',200],['Salsa',200]],
 note:'Per serving: about 235 g cooked filling (110 g egg scramble, 53 g turkey sausage, 72 g veg, beans, and cheese) and 50 g yogurt-salsa swirl. Turkey is 567 g of the shared raw batch. Tortillas are 70 g each. Freezer-friendly; prep about 20 min, cook about 25 min.'};
function mealSeedBurrito(){if(S.mig.mealSeedBurrito)return;
 const seed=MEAL_BURRITO,have=(S.meals||[]).some(m=>m.name.toLowerCase()===seed.name.toLowerCase());
 if(have){S.mig.mealSeedBurrito=1;save();return}
 const items=seed.items.map(([n,g])=>{const f=FOODS.find(x=>x.name===n);return f?{fid:f.id,g}:null});if(items.some(x=>!x))return;
 S.meals.push({id:'m'+(Date.now()+4),name:seed.name,servings:seed.servings,items,note:seed.note,label:null,cook:{...seed.cook}});
 S.mig.mealSeedBurrito=1;save()}
/* v25: the seeded bowl used the cookbook override (520 kcal, P45); switch it to the ingredient numbers unless she changed it */
function mealMigrateCompute(){if(S.mig.mealCompute)return;S.mig.mealCompute=1;
 const m=S.meals.find(x=>x.name.toLowerCase()===MEAL_SEED.name.toLowerCase());
 if(!m||!m.label||m.src!=='cookbook'||+m.label.kcal!==MEAL_SEED.cook.kcal||+m.label.p!==MEAL_SEED.cook.p||+m.label.c!==61.3||+m.label.f!==10.5)return;
 m.label=null;delete m.src;m.cook={...MEAL_SEED.cook};const v=mealPer(m),t=today();
 const old=(S.log[t]||[]).filter(e=>e.meal===m.id&&e.sv>0&&Math.abs(e.kcal/e.sv-MEAL_SEED.cook.kcal)<1);
 const msg=`${m.name} now uses its ingredient numbers: ${v.kcal} kcal · P${v.p} per serving.`;
 setTimeout(()=>old.length?toast(msg+` Update today's ${old.length===1?'entry':old.length+' entries'}?`,20000,'Update',()=>{old.forEach(e=>Object.assign(e,{kcal:v.kcal*e.sv,p:v.p*e.sv,c:v.c*e.sv,f:v.f*e.sv}));save();if(!$('#food').hidden)renderFood();toast(`Updated today's ${m.name}.`,3000)}):toast(msg,6000),400)}
function mealRow(){const M=S.meals||[];return `<h4>Meals</h4><div class="chips">${M.map(m=>`<button class="chip meal" onclick="mealPick('${m.id}')">${esc(m.name)}</button>`).join('')}<button class="chip add" onclick="mealForm()">+ New meal</button></div>`}
function mealSearch(words){return(S.meals||[]).filter(m=>words.every(w=>m.name.toLowerCase().includes(w))).map(m=>{const v=mealPer(m);
 return `<div class="row tap" onclick="mealPick('${m.id}')"><div><b>${esc(m.name)}</b><small>per serving · P${v.p} C${v.c} F${v.f} · <i class="sbadge mbadge">Meal</i></small></div><div class="rt">${v.kcal}</div></div>`}).join('')}
function mealPick(id){const m=mealById(id);if(!m)return;const v=mealPer(m),c=m.label?mealCalc(m):null;
 modal(`<h3>${esc(m.name)} <i class="sbadge mbadge">Meal</i></h3><p class="muted">${v.kcal} kcal · P${v.p} C${v.c} F${v.f} per serving · recipe makes ${m.servings}</p>
 ${m.label?`<p class="muted">Using ${m.src==='cookbook'?'cookbook':'label'} numbers.${c&&c.total.kcal?` Ingredients add up to ${c.kcal} kcal · P${c.p} per serving.`:''}</p>`:m.cook?`<p class="muted">Cookbook says ${m.cook.kcal} kcal; ingredients add up to ${v.kcal}.</p>`:''}${m.note?`<p class="mnote">${esc(m.note)}</p>`:''}
 <label>Servings<div class="inl"><button class="btn sec sm" onclick="mealStep(-0.5)">−</button><input id="msv" type="number" inputmode="decimal" step="0.5" min="0.5" value="1" oninput="mealPrev('${id}')"><button class="btn sec sm" onclick="mealStep(0.5)">+</button></div></label>
 <div id="mprev" class="muted"></div>${slotPills()}<div class="inl"><button class="btn" onclick="mealLog('${id}')">Add to log</button><button class="btn sec" onclick="mealForm('${id}')">Edit meal</button></div>`);mealPrev(id)}
function mealStep(d){const e=$('#msv'),v=Math.max(0.5,Math.round(((+e.value||0)+d)*2)/2);e.value=v;e.oninput()}
function mealPrev(id){const m=mealById(id),v=mealPer(m),n=+$('#msv').value||0;$('#mprev').textContent=`${n} serving${n===1?'':'s'}: ${Math.round(v.kcal*n)} kcal · P${mealR1(v.p*n)} C${mealR1(v.c*n)} F${mealR1(v.f*n)}`}
function mealLog(id){const m=mealById(id),n=+$('#msv').value;if(!m||!(n>0))return;const v=mealPer(m);
 (S.log[viewDate]||=[]).push({fid:m.id,meal:m.id,sv:n,name:m.name,g:0,kcal:v.kcal*n,p:v.p*n,c:v.c*n,f:v.f*n,slot:slotTake(),t:Date.now()});save();closeModal();renderFood()}
/* new / edit form */
function mealForm(id){const m=id&&mealById(id);mealDraft=m?structuredClone(m):{id:null,name:'',servings:1,items:[],label:null,note:''};const d=mealDraft;
 modal(`<h3>${m?'Edit meal':'New meal'}</h3><label>Name<input id="mfn" value="${esc(d.name)}" oninput="mealDraft.name=this.value"></label>
 <label>Servings the recipe makes<input id="mfs" type="number" inputmode="decimal" step="0.5" min="0.5" value="${d.servings}" oninput="mealDraft.servings=+this.value||0;mealFormSum()"></label>
 <h4>Ingredients (grams for the whole recipe)</h4><div id="mfi"></div>
 <input id="mfq" placeholder="🔍 Add an ingredient from your foods" autocomplete="off" oninput="mealFormSearch()"><div id="mfr"></div>
 <label class="mchk"><input type="checkbox" id="mfl" ${d.label?'checked':''} onchange="mealFormLabel(this.checked)"> Use label numbers instead (per serving)</label>
 <div id="mflv" class="grid4" ${d.label?'':'hidden'}>${['kcal','p','c','f'].map(k=>`<label>${{kcal:'kcal',p:'Protein',c:'Carbs',f:'Fat'}[k]}<input id="mfl_${k}" type="number" inputmode="decimal" value="${d.label?d.label[k]:''}" oninput="mealDraft.label&&(mealDraft.label.${k}=+this.value||0);mealFormSum()"></label>`).join('')}</div>
 <label>Note (optional)<input id="mfnote" value="${esc(d.note||'')}" oninput="mealDraft.note=this.value"></label>
 <p id="mfsum" class="mnote"></p><p id="mferr" class="warn muted"></p>
 <div class="inl"><button class="btn" onclick="mealSave()">Save meal</button>${m?`<button class="btn danger" onclick="mealDel('${m.id}')">Delete</button>`:''}</div>`);mealFormItems()}
function mealFormItems(){const d=mealDraft;$('#mfi').innerHTML=d.items.length?d.items.map((it,i)=>{const f=foodById(it.fid);
  return `<div class="row mrow"><div class="grow"><b>${f?esc(f.name):'Missing food'}</b><small>${f?`${f.kcal} kcal per 100g`:'This food was deleted'}</small></div><input class="mg" type="number" inputmode="decimal" value="${it.g}" oninput="mealDraft.items[${i}].g=+this.value||0;mealFormSum()" aria-label="grams"><span class="muted">g</span><button class="x" onclick="mealDraft.items.splice(${i},1);mealFormItems()">✕</button></div>`}).join(''):'<p class="muted">No ingredients yet.</p>';mealFormSum()}
function mealFormSearch(){const q=$('#mfq').value.toLowerCase().trim();if(!q){$('#mfr').innerHTML='';return}const w=q.split(/\s+/);
 $('#mfr').innerHTML=allFoods().filter(f=>{const h=(f.name+' '+(f.brand||'')).toLowerCase();return w.every(x=>h.includes(x))}).slice(0,8).map(f=>`<div class="row tap" onclick="mealFormAdd('${f.id}')"><div><b>${esc(f.name)}</b><small>per 100g · ${f.kcal} kcal · P${f.p} C${f.c} F${f.f}${f.barcode?' · <i class="sbadge">Scanned</i>':''}</small></div><div class="rt">+</div></div>`).join('')||'<p class="muted">No match.</p>'}
function mealFormAdd(fid){mealDraft.items.push({fid,g:100});$('#mfq').value='';$('#mfr').innerHTML='';mealFormItems();const g=document.querySelectorAll('#mfi .mg');if(g.length){g[g.length-1].focus();g[g.length-1].select()}}
function mealFormLabel(on){const d=mealDraft;if(on){const c=mealCalc(d);d.label={kcal:c.kcal||0,p:c.p||0,c:c.c||0,f:c.f||0};['kcal','p','c','f'].forEach(k=>$('#mfl_'+k).value=d.label[k]||'')}else d.label=null;$('#mflv').hidden=!on;mealFormSum()}
function mealFormSum(){const d=mealDraft,c=mealCalc(d),v=mealPer(d);if($('#mferr'))$('#mferr').textContent='';
 $('#mfsum').textContent=(d.label?`Per serving (label): ${v.kcal} kcal · P${v.p} C${v.c} F${v.f}`:`Per serving: ${c.kcal} kcal · P${c.p} C${c.c} F${c.f}`)+(d.label&&c.total.kcal?`. Ingredients say ${c.kcal} kcal · P${c.p}.`:'')}
function mealSave(){const d=mealDraft,err=t=>{$('#mferr').textContent=t};d.name=$('#mfn').value.trim();d.servings=+$('#mfs').value||0;d.items=d.items.filter(it=>(+it.g)>0);
 if(!d.name)return err('Give the meal a name.');if(!(d.servings>0))return err('Servings must be more than 0.');
 if(d.label&&!(+d.label.kcal>0))return err('Enter the label calories per serving.');if(!d.label&&!d.items.length)return err('Add at least one ingredient with grams, or use label numbers.');
 if(!d.label&&!(mealCalc(d).kcal>0))return err('These ingredients add up to 0 kcal.');
 S.meals||=[];if(d.id){const i=S.meals.findIndex(m=>m.id===d.id);if(i>=0){if(!d.label)delete d.src;S.meals[i]=d}}else{d.id='m'+Date.now();S.meals.push(d)}
 save();toast(`Saved ${d.name}.`,2500);mealDraft=null;renderFood();mealPick(d.id)}
function mealDel(id){const m=mealById(id);if(!m||!confirm(`Delete the meal "${m.name}"? Entries you already logged stay.`))return;S.meals=S.meals.filter(x=>x.id!==id);save();closeModal();renderFood()}
