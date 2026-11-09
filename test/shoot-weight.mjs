const {chromium}=await import(process.env.PW||'/tmp/pw/node_modules/playwright-core/index.mjs');
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]||'/opt/cursor/artifacts';
fs.mkdirSync(out,{recursive:true});
const port=4184;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
await new Promise(r=>setTimeout(r,400));
const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,timezoneId:'America/New_York',serviceWorkers:'block'});
await context.addInitScript(()=>{
  if(localStorage.getItem('fit'))return;
  localStorage.setItem('fit',JSON.stringify({
    tgt1750:1,marker:'example-keep',
    settings:{kcal:1800,p:150,c:160,f:50,unit:'lb',bar:45,barKg:20,plates:[45,35,25,10,5,2.5,1.25],platesKg:[25,20,15,10,5,2.5,1.25],rest:90,tdee:2200,tdeeSrc:'me'},
    log:{'2020-01-01':[{fid:'ex',name:'Example oats',g:100,kcal:100,p:10,c:12,f:2,slot:'b'}]},
    weights:[{d:'2020-01-01',w:150},{d:'2026-11-06',w:181.4}],
    sessions:[],custom:[],favs:[],recents:[],customEx:[]
  }));
});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&&!/404|favicon/i.test(m.text()))errors.push(m.text())});
function fail(msg){console.error(msg);process.exitCode=1}
await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
await page.waitForSelector('#foodweight');
const launch=await page.locator('body').innerText();
if(/Paste from Health|No weigh-in yet today|FitCoach weight shortcut/i.test(launch))fail('health shortcut still appears');
if(await page.locator('#modal:not([hidden])').count())fail('a popup opened at launch');
await page.addStyleTag({content:'nav{display:none !important}body{padding-bottom:12px !important}'});
await page.locator('#foodweight').evaluate(el=>{const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;font-weight:700';el.prepend(p)});
await page.locator('#foodweight').screenshot({path:path.join(out,'weight_food_example.png')});
if(!(await page.locator('#foodweight').innerText()).includes('181.4'))fail('food list missing 181.4');
await page.locator('nav').evaluate(el=>{el.style.display='flex'});
await page.evaluate(()=>show('holiday'));
await page.waitForSelector('#h50wline');
const hol=await page.locator('#h50day').innerText();
if(!hol.includes('181.4')||!hol.includes('Friday, November 6, 2026'))fail('holiday did not show the food weigh-in');
await page.addStyleTag({content:'header,nav{display:none !important}'});
await page.locator('#h50day').evaluate(el=>{const p=document.createElement('p');p.textContent='EXAMPLE DATA. Not a real log.';p.style.cssText='margin:0 0 8px;font-weight:700';el.prepend(p)});
await page.locator('#h50day').screenshot({path:path.join(out,'weight_holiday_example.png')});
await page.locator('[data-day="2026-11-07"]').click();
const other=await page.locator('#h50wline').innerText();
if(other.includes('181.4'))fail('Nov 7 showed Nov 6');
await page.locator('#h50wt').fill('177.2');
await page.locator('#h50day button',{hasText:'Save'}).click();
await page.locator('#h50wt').fill('177.2');
await page.locator('#h50day button',{hasText:'Save'}).click();
await page.locator('#h50checks [data-check="move"]').click();
const counts=await page.evaluate(()=>({
  six:S.weights.filter(x=>x.d==='2026-11-06').length,
  seven:S.weights.filter(x=>x.d==='2026-11-07').map(x=>x.w),
  old:S.weights.find(x=>x.d==='2020-01-01').w,
  name:S.log['2020-01-01'][0].name,
  kcal:S.settings.kcal
}));
if(counts.six!==1||counts.seven.length!==1||counts.seven[0]!==177.2||counts.old!==150||counts.name!=='Example oats'||counts.kcal!==1800)fail('shared log changed '+JSON.stringify(counts));
await page.reload({waitUntil:'domcontentloaded'});
await page.evaluate(()=>show('holiday'));
await page.waitForSelector('#h50grid');
await page.locator('[data-day="2026-11-07"]').click();
if(!(await page.locator('#h50wline').innerText()).includes('177.2'))fail('reload lost the shared weigh-in');
await page.evaluate(()=>show('food'));
await page.waitForSelector('#foodweight');
if(!(await page.locator('#foodweight').innerText()).includes('177.2'))fail('food did not show the holiday weigh-in');
if(errors.length)fail('console '+errors.join(' | '));
console.log(process.exitCode?'weight browser checks failed':'weight browser checks passed');
await browser.close();
server.kill();
process.exit(process.exitCode||0);
