const {chromium}=await import(process.env.PW||'/tmp/pw/node_modules/playwright-core/index.mjs');
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]||'/opt/cursor/artifacts';
fs.mkdirSync(out,{recursive:true});
const port=4189;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
await new Promise(r=>setTimeout(r,400));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,timezoneId:'America/New_York',serviceWorkers:'block'});
await context.addInitScript(()=>{
  if(localStorage.getItem('fit'))return;
  const day=n=>{const d=new Date();d.setDate(d.getDate()-n);return d.toLocaleDateString('en-CA')};
  localStorage.setItem('fit',JSON.stringify({
    tgt1750:1,
    settings:{kcal:1800,p:150,c:160,f:50,unit:'lb',tdee:2100,tdeeSrc:'me',bar:45,barKg:20,plates:[45,25,10],platesKg:[20,10,5],rest:90},
    log:{'2020-01-01':[{fid:'ex',name:'Example oats',g:100,kcal:100,p:10,c:12,f:2,slot:'b'}]},
    meals:[{id:'m-keep',name:'Example leftover bowl',course:'lunch',servings:1,items:[],note:'keep'}],
    holiday50:{v:1,days:{'2026-11-06':{checks:{move:1},confirmed:'self',note:'Example check'}},weeks:{},flex:[],steps:{}},
    weights:[
      {d:day(21),w:180},{d:day(14),w:178},{d:day(10),w:177},{d:day(7),w:176.2},
      {d:day(3),w:175.4},{d:day(0),w:174.8}
    ],
    goals:{start:{d:day(21),w:180},m1:{w:170,set:day(21),date:day(-10)}},
    goalView:'1m',sessions:[],custom:[],favs:[],recents:[],customEx:[]
  }));
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&&!/404|favicon/i.test(m.text()))errors.push(m.text())});
function fail(msg){console.error(msg);process.exitCode=1}
await page.goto(`http://127.0.0.1:${port}/index.html#holiday`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#foodweight');
const navText=await page.locator('nav').innerText();
if(/Holiday/i.test(navText))fail('Holiday is still in the nav');
if(await page.locator('#holiday,#h50grid,.h50go').count())fail('Holiday UI is still in the page');
const state=await page.evaluate(()=>{
  const chart=Chart.getChart('wchart');
  const labels=chart.scales.x.ticks.map(t=>t.label);
  const last=wMA().at(-1);
  return {hash:location.hash,move:S.holiday50.days['2026-11-06'].checks.move,note:S.holiday50.days['2026-11-06'].note,w:last.w,d:last.d,labels,kcal:S.settings.kcal,oats:S.log['2020-01-01'][0].name,tabs:[...document.querySelectorAll('nav button')].map(b=>b.dataset.t)};
});
if(state.hash!=='#food')fail('old holiday link did not open Food '+state.hash);
if(state.move!==1||state.note!=='Example check')fail('challenge checks were erased '+JSON.stringify(state));
if(state.w!==174.8||!state.labels.length)fail('chart '+JSON.stringify(state));
if(state.kcal!==1800||state.oats!=='Example oats')fail('saved data changed');
if(state.tabs.includes('holiday'))fail('holiday tab id remains');
await page.locator('nav').screenshot({path:path.join(out,'nav_no_holiday_example.png')});
await page.addStyleTag({content:'header,nav{display:none !important}'});
await page.locator('#foodweight').evaluate(el=>{const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;font-weight:700';el.prepend(p)});
await page.locator('#foodweight').screenshot({path:path.join(out,'food_weight_no_holiday_example.png')});
if(errors.length)fail('console '+errors.join(' | '));
console.log(process.exitCode?'hide holiday check failed':'hide holiday check passed',JSON.stringify(state.labels));
await browser.close();
server.kill();
process.exit(process.exitCode||0);
