const {chromium}=await import(process.env.PW||'/tmp/pw/node_modules/playwright-core/index.mjs');
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]||'/opt/cursor/artifacts';
fs.mkdirSync(out,{recursive:true});
const port=4186;
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
    weights:[
      {d:'2026-10-13',w:180},{d:'2026-10-14',w:179.8},{d:'2026-10-16',w:179.4},
      {d:'2026-10-20',w:178.6},{d:'2026-10-23',w:178},{d:'2026-10-24',w:177.8},
      {d:'2026-10-27',w:177.2},{d:'2026-10-30',w:176.6},
      {d:'2026-11-03',w:176},{d:'2026-11-04',w:175.8},{d:'2026-11-05',w:175.6},{d:'2026-11-06',w:175.4},
      {d:'2026-11-09',w:174.8}
    ],
    goals:{start:{d:'2026-10-13',w:170},m1:{w:165,set:'2026-10-13',date:'2026-11-20'}},
    goalView:'1m',sessions:[],custom:[],favs:[],recents:[],customEx:[]
  }));
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&&!/404|favicon/i.test(m.text()))errors.push(m.text())});
function fail(msg){console.error(msg);process.exitCode=1}
await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#foodweight');
const check=await page.evaluate(()=>{
  const chart=Chart.getChart('wchart');
  const x=chart.scales.x;
  const dots=chart.getDatasetMeta(0).data;
  const line=chart.getDatasetMeta(1).data;
  const M=wMA();
  const last=M.at(-1);
  const labels=x.ticks.map(t=>t.label);
  const proj=chart.data.datasets.find(d=>String(d.label).startsWith('Projection'));
  const day=gDay('2026-11-09');
  const i6=M.findIndex(p=>p.d==='2026-11-06'),i9=M.findIndex(p=>p.d==='2026-11-09'),i4=M.findIndex(p=>p.d==='2026-11-04'),i5=M.findIndex(p=>p.d==='2026-11-05');
  const gap3=dots[i9].x-dots[i6].x,gap1=dots[i5].x-dots[i4].x;
  const mash=S.meals.filter(m=>m.name==='Chicken + Gravy Protein Mash Bowls');
  const shown=Math.round(last.ma*10)/10;
  return {
    labels,last:last.d,lastW:last.w,ma:shown,
    sameX:Math.abs(dots[i9].x-line[i9].x)<0.5,
    dotY:chart.data.datasets[0].data[i9].y,
    projX:proj?proj.data[0].x:null,projY:proj?Math.round(proj.data[0].y*10)/10:null,day,
    gapRatio:gap3/gap1,
    meals:mash.length,kcal:mash[0]&&mealPer(mash[0]).kcal,p:mash[0]&&mealPer(mash[0]).p,
    kept:S.meals.some(m=>m.id==='m-keep'),oats:S.log['2020-01-01'][0].name,goal:S.settings.kcal,
    header:document.querySelector('#foodweight').innerText
  };
});
if(check.last!=='2026-11-09'||check.lastW!==174.8)fail('average '+JSON.stringify(check));
if(!check.labels.some(l=>/Nov 9/.test(l)))fail('latest date not labeled '+JSON.stringify(check.labels));
if(!check.sameX)fail('average line stops short of the latest dot');
if(check.dotY!==174.8)fail('dot is not the logged weight');
if(check.projX!==check.day||check.projY!==check.ma)fail('projection does not start at the latest average '+JSON.stringify(check));
if(Math.abs(check.gapRatio-3)>0.15)fail('gap spacing '+check.gapRatio);
if(check.meals!==1||check.kcal!==530||check.p!==56||!check.kept||check.oats!=='Example oats'||check.goal!==1800)fail('meal or saved data '+JSON.stringify(check));
if(!check.header.includes('Latest 174.8')||!check.header.includes(String(check.ma)))fail('header '+check.header);
await page.addStyleTag({content:'header,nav{display:none !important}body{padding-top:12px !important}'});
await page.locator('#foodweight').evaluate(el=>{const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;font-weight:700';el.prepend(p)});
await page.locator('#foodweight').screenshot({path:path.join(out,'weight_chart_example.png')});
await page.locator('.mcourse',{hasText:'Dinner'}).locator('button.mdd').click();
await page.waitForSelector('#mmenu-dinner:not([hidden])');
const dinner=await page.locator('#mmenu-dinner').innerText();
if(!dinner.includes('Chicken + Gravy Protein Mash Bowls'))fail('dinner menu missing the meal');
await page.evaluate(()=>{
  const h=[...document.querySelectorAll('h4')].find(el=>el.textContent==='Meals');
  const box=document.createElement('div');box.id='mealshot';box.style.cssText='padding:12px';
  const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;font-weight:700';
  h.before(box);box.append(p,h,h.nextElementSibling);
});
await page.locator('#mealshot').screenshot({path:path.join(out,'meal_mash_example.png')});
if(errors.length)fail('console '+errors.join(' | '));
console.log(process.exitCode?'chart and meal checks failed':'chart and meal checks passed',JSON.stringify(check.labels));
await browser.close();
server.kill();
process.exit(process.exitCode||0);
