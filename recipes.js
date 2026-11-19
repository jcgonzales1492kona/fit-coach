/* Recipes for the meals Jenna saved. Steps are copied from a saved note.
   A meal with no method in the source stays marked incomplete. */
let recipeSel='';
const RECIPE_STEPS={
 'jalapeño popper mac n cheese':[
  'Air fry chicken 12 min at 375.',
  'Blend sauce.',
  'Cook pasta.',
  'Crisp diced bacon.',
  'Warm sauce in pan off heat.',
  'Combine with pasta and chicken.',
  'Top with bacon and chives.']};
function recipeSteps(name){return RECIPE_STEPS[String(name||'').toLowerCase()]||null}
function recipeSaved(name){return (S.meals||[]).find(m=>m.name.toLowerCase()===String(name||'').toLowerCase())||null}
function recipeItems(seed,saved){
 if(saved&&Array.isArray(saved.items)&&saved.items.length)return saved.items.map(it=>{const f=typeof foodById==='function'?foodById(it.fid):null;return {name:f?f.name:'Missing food',g:+it.g||0}});
 return (seed.items||[]).map(([name,g])=>({name,g:+g||0}))}
function recipeModel(seed){
 const saved=recipeSaved(seed.name);
 if(saved)return saved;
 const items=(seed.items||[]).map(([n,g])=>{const f=typeof FOODS!=='undefined'&&FOODS.find(x=>x.name===n);return f?{fid:f.id,g}:null}).filter(Boolean);
 const row={name:seed.name,servings:seed.servings,items,note:seed.note||'',course:seed.course||mealGuessCourse(seed.name)};
 if(seed.label)row.label={...seed.label};
 if(seed.cook)row.cook={...seed.cook};
 return row}
function recipeCards(){
 const shipped=typeof mealShipped==='function'?mealShipped():[];
 const seen=new Set();
 const rows=shipped.map(seed=>{seen.add(seed.name.toLowerCase());const model=recipeModel(seed);return {name:seed.name,course:mealCourse(model),model,saved:recipeSaved(seed.name),steps:recipeSteps(seed.name)}});
 (S.meals||[]).forEach(m=>{if(seen.has(m.name.toLowerCase()))return;rows.push({name:m.name,course:mealCourse(m),model:m,saved:m,steps:recipeSteps(m.name)})});
 return rows}
function recipeOpen(enc){recipeSel=decodeURIComponent(enc||'');renderRecipes()}
function recipeBack(){recipeSel='';renderRecipes()}
function recipeLog(id){if(typeof mealPick==='function')mealPick(id)}
function renderRecipes(){
 const rows=recipeCards(),open=rows.find(r=>r.name===recipeSel);
 if(open){
  const m=open.model,v=mealPer(m),course=open.course.charAt(0).toUpperCase()+open.course.slice(1);
  const seed=typeof mealShipped==='function'?mealShipped().find(s=>s.name===open.name):null;
  const items=recipeItems(seed||{items:[]},open.saved);
  $('#recipes').innerHTML=`<button type="button" class="link" onclick="recipeBack()">‹ Recipes</button>
  <h2>${esc(open.name)}</h2>
  <p>${course} · ${m.servings} serving${m.servings===1?'':'s'}</p>
  <p><b>${v.kcal} kcal</b> · P${v.p} C${v.c} F${v.f} per serving</p>
  ${m.label?'<p class="muted">These per-serving numbers are the estimate stored with the meal.</p>':m.cook?`<p class="muted">Card says ${m.cook.kcal} kcal and ${m.cook.p} g protein. The numbers above come from the ingredient amounts.</p>`:''}
  ${open.steps?'':`<p class="muted">Full recipe not added yet.</p>`}
  <h3>Ingredients</h3>
  <p class="muted">Amounts are for the whole batch.</p>
  <ul class="rsteps">${items.map(it=>`<li>${esc(it.name)}, ${it.g} g</li>`).join('')||'<li>No ingredient amounts are saved.</li>'}</ul>
  ${open.steps?`<h3>Steps</h3><ol class="rsteps">${open.steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:`<h3>Saved note</h3><p class="mnote">${esc(m.note||'No note is saved.')}</p>`}
  ${open.saved?`<button type="button" class="btn" onclick="recipeLog('${open.saved.id}')">Log a serving</button>`:'<p class="muted">This meal is not in Meals, so it cannot be logged from here.</p>'}`;
  return}
 const groups=[['breakfast','Breakfast'],['lunch','Lunch'],['dinner','Dinner']];
 $('#recipes').innerHTML=`<h2>Recipes</h2><p class="muted">Tap a recipe. A serving logs into Food.</p>`+groups.map(([key,label])=>{
  const list=rows.filter(r=>r.course===key);
  if(!list.length)return '';
  return `<h3>${label}</h3><div class="card">${list.map(r=>{const v=mealPer(r.model);return `<button type="button" class="rbtn" onclick="recipeOpen('${encodeURIComponent(r.name)}')"><b>${esc(r.name)}</b><small>${r.model.servings} serving${r.model.servings===1?'':'s'} · ${v.kcal} kcal${r.steps?'':' · Full recipe not added yet'}</small></button>`}).join('')}</div>`}).join('');
}
