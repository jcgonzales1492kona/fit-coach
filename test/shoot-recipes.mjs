const {chromium}=await import(process.env.PW||'/tmp/pw/node_modules/playwright-core/index.mjs');
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]||'/opt/cursor/artifacts';
fs.mkdirSync(out,{recursive:true});
const port=4191;
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
await page.goto(`http://127.0.0.1:${port}/index.html#recipes`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#recipes h2');
const nav=await page.locator('nav').innerText();
if(!nav.includes('Recipes')||/Holiday/i.test(nav))fail('nav '+nav);
const list=await page.locator('#recipes').innerText();
if(!list.includes('Jalapeño Popper Mac N Cheese')||!list.includes('Breakfast')||!list.includes('Full recipe not added yet'))fail('list '+list.slice(0,400));
if(/[\u2013\u2014]/.test(list))fail('dash in list');
await page.addStyleTag({content:'header,nav{display:none !important}body{padding-bottom:12px !important}'});
await page.evaluate(()=>{const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;padding:0 14px;font-weight:700';document.querySelector('#recipes').prepend(p)});
await page.locator('#recipes').screenshot({path:path.join(out,'recipes_list_example.png')});
await page.locator('#recipes button',{hasText:'Jalapeño Popper Mac N Cheese'}).click();
await page.waitForSelector('#recipes ol');
await page.evaluate(()=>{const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;font-weight:700';document.querySelector('#recipes').prepend(p)});
const open=await page.locator('#recipes').innerText();
if(!open.includes('510 kcal')||!open.includes('397 g')||!open.includes('Air fry chicken 12 min at 375.')||!open.includes('Log a serving'))fail('open '+open.slice(0,500));
if(/Full recipe not added yet/.test(open))fail('jalapeño was marked incomplete');
await page.locator('#recipes').screenshot({path:path.join(out,'recipes_open_example.png')});
const kept=await page.evaluate(()=>({oats:S.log['2020-01-01'][0].name,goal:S.settings.kcal,keep:S.meals.some(m=>m.id==='m-keep')}));
if(kept.oats!=='Example oats'||kept.goal!==1800||!kept.keep)fail('saved data '+JSON.stringify(kept));
if(errors.length)fail('console '+errors.join(' | '));
console.log(process.exitCode?'recipes browser check failed':'recipes browser check passed');
await browser.close();
server.kill();
process.exit(process.exitCode||0);
