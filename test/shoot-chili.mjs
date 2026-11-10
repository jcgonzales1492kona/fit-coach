const {chromium}=await import(process.env.PW||'/tmp/pw/node_modules/playwright-core/index.mjs');
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]||'/opt/cursor/artifacts';
fs.mkdirSync(out,{recursive:true});
const port=4187;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
await new Promise(r=>setTimeout(r,400));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,timezoneId:'America/New_York',serviceWorkers:'block'});
await context.addInitScript(()=>{
  if(localStorage.getItem('fit'))return;
  localStorage.setItem('fit',JSON.stringify({
    tgt1750:1,
    settings:{kcal:1800,p:150,c:160,f:50,unit:'lb',tdee:2100,tdeeSrc:'me',bar:45,barKg:20,plates:[45,25,10],platesKg:[20,10,5],rest:90},
    log:{'2020-01-01':[{fid:'ex',name:'Example oats',g:100,kcal:100,p:10,c:12,f:2,slot:'b'}]},
    meals:[{id:'m-keep',name:'Example leftover bowl',course:'lunch',servings:1,items:[],note:'keep'}],
    mig:{mealSeed:1,mealSeedCookbook4:1,mealSeedBurrito:1,mealDropPlainZiti:1,mealCompute:1},
    weights:[],sessions:[],custom:[],favs:[],recents:[],customEx:[]
  }));
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&&!/404|favicon/i.test(m.text()))errors.push(m.text())});
function fail(msg){console.error(msg);process.exitCode=1}
await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('h4');
const info=await page.evaluate(()=>{
  const m=S.meals.find(x=>x.name==='Turkey Chili Rice Bowl');
  const v=mealPer(m);
  return {course:mealCourse(m),kcal:v.kcal,p:v.p,c:v.c,f:v.f,n:S.meals.filter(x=>x.name==='Turkey Chili Rice Bowl').length,keep:S.meals.some(x=>x.id==='m-keep'),oats:S.log['2020-01-01'][0].name,goal:S.settings.kcal,cache:document.querySelector('link[rel=stylesheet]').href};
});
if(info.n!==1||info.course!=='dinner'||info.kcal!==670||info.p!==52||info.c!==73||info.f!==17)fail('meal '+JSON.stringify(info));
if(!info.keep||info.oats!=='Example oats'||info.goal!==1800)fail('saved data changed '+JSON.stringify(info));
if(!info.cache.includes('v=44'))fail('cache '+info.cache);
await page.addStyleTag({content:'header,nav{display:none !important}'});
await page.locator('.mcourse',{hasText:'Dinner'}).locator('button.mdd').click();
await page.waitForSelector('#mmenu-dinner:not([hidden])');
const dinner=await page.locator('#mmenu-dinner').innerText();
if(!dinner.includes('Turkey Chili Rice Bowl'))fail('dinner menu missing the meal');
await page.evaluate(()=>{
  const h=[...document.querySelectorAll('h4')].find(el=>el.textContent==='Meals');
  const box=document.createElement('div');box.id='mealshot';box.style.cssText='padding:12px';
  const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;font-weight:700';
  h.before(box);box.append(p,h,h.nextElementSibling);
});
await page.locator('#mealshot').screenshot({path:path.join(out,'chili_dinner_example.png')});
if(errors.length)fail('console '+errors.join(' | '));
console.log(process.exitCode?'chili browser check failed':'chili browser check passed');
await browser.close();
server.kill();
process.exit(process.exitCode||0);
