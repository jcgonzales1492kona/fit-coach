const {chromium}=await import(process.env.PW||'playwright-core');
import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=process.argv[2]||'/opt/cursor/artifacts';
fs.mkdirSync(out,{recursive:true});
const port=4178;
const server=spawn('python3',['-m','http.server',String(port),'--bind','127.0.0.1'],{cwd:root,stdio:'ignore'});
await new Promise(r=>setTimeout(r,400));

const browser=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block'});
await context.grantPermissions(['clipboard-read','clipboard-write']);
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error'&&!/404|favicon/i.test(m.text()))errors.push(m.text())});

function fail(msg){console.error(msg);process.exitCode=1}

await page.goto(`http://127.0.0.1:${port}/test/trends-harness.html`,{waitUntil:'domcontentloaded'});
await page.waitForFunction(()=>document.documentElement.dataset.ready==='1',{timeout:15000});
const text=await page.locator('#trends').innerText();
const expect=[
 'COVERAGE','2 complete','1 partial','1 not logged','3 unknown','1,700','n=2','1,720','saved goal','not marked medically approved',
 'not counted as zero','184.6','Down 0.8','Partial, separate','900','Log time is not used'
];
for(const s of expect){if(!text.includes(s))fail('7-day view missing: '+s)}
if(/Not tracking|Way over|under 125|cut calories/i.test(text))fail('old off-track copy is still visible');
if(/[\u2013\u2014]/.test(text))fail('em dash or en dash in trends text');
const h=await page.locator('#trends').evaluate(el=>el.getBoundingClientRect().height);
console.log('trends height',Math.round(h));

await page.screenshot({path:path.join(out,'trends_7_day.png')});
const fit7=await page.evaluate(()=>{const r=document.querySelector('#trends').getBoundingClientRect();return {top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height)}});
console.log('7-day box',JSON.stringify(fit7));
if(fit7.bottom>844)console.log('7-day card extends past the viewport');

await page.locator('.trwin [data-win="14"]').click();
await page.waitForSelector('#trends[data-win="14"]');
const rows14=await page.locator('.trli').count();
if(rows14!==14)fail('14-day daily rows '+rows14);

await page.locator('.trwin [data-win="28"]').click();
await page.waitForSelector('#trends[data-win="28"]');
const t28=await page.locator('#trends').innerText();
if(!t28.includes('COVERAGE')||!t28.includes('complete'))fail('28-day view missing coverage');
const weeks=await page.locator('.trwk').count();
if(weeks!==4)fail('expected 4 week rows, got '+weeks);
if(/[\u2013\u2014]/.test(t28))fail('em dash in 28-day view');
await page.evaluate(()=>{const last=document.querySelector('.trwk:last-child');const extra=last.getBoundingClientRect().bottom-812;if(extra>0)window.scrollBy(0,extra)});
await page.screenshot({path:path.join(out,'trends_28_day.png')});

await page.locator('.trwin [data-win="7"]').click();
await page.waitForSelector('#trends[data-win="7"]');
await page.locator('#trend-copy').click();
await page.waitForSelector('#trend-preview');
let copied=await page.locator('#trend-preview').innerText();
if(copied.includes('Sample private line'))fail('private note was included before the box was checked');
if(!copied.includes('Private notes are not included.'))fail('preview did not say private notes are off');
await page.locator('#trend-inc-priv').check();
await page.waitForSelector('#trend-preview');
copied=await page.locator('#trend-preview').innerText();
for(const s of ['FitCoach summary','Coverage:','confirmed complete','1,700','n=2','not marked medically approved','Partial days, separate','not counted as zero','Sample private line']){
  if(!copied.includes(s))fail('summary missing: '+s);
}
if(/[\u2013\u2014]/.test(copied))fail('dash in summary');
await page.locator('#trend-copy-go').click();
const clip=await page.evaluate(async()=>{try{return await navigator.clipboard.readText()}catch(e){return ''}});
const live=await page.evaluate(()=>window.__coachText||'');
if(clip&&live&&clip!==live)fail('clipboard text differs from summary');
await page.screenshot({path:path.join(out,'trends_copied_summary.png')});
console.log('summary\n'+copied);

const before=await page.evaluate(()=>JSON.stringify(S.log));
await page.evaluate(()=>{const box=document.getElementById('copyshot');if(box)box.hidden=true;document.querySelector('.cycar button[aria-pressed="false"]').click()});
const after=await page.evaluate(()=>({log:JSON.stringify(S.log),weights:S.weights.length,on:document.querySelectorAll('.cyc[aria-pressed="true"]').length,kcal:S.settings.kcal}));
if(after.log!==before)fail('cycle toggle changed the food log');
if(after.on<1)fail('cycle toggle did not stick');
if(after.kcal!==1720)fail('settings changed');

await context.close();

const fresh=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block'});
const app=await fresh.newPage();
const appErrors=[];
app.on('pageerror',e=>appErrors.push(String(e)));
await app.addInitScript(()=>{
  localStorage.setItem('fit',JSON.stringify({
    tgt1750:1,marker:'preserve-me',
    settings:{kcal:1800,p:150,c:160,f:50,unit:'lb',bar:45,barKg:20,plates:[45,35,25,10,5,2.5,1.25],platesKg:[25,20,15,10,5,2.5,1.25],rest:90,tdee:2200,tdeeSrc:'me'},
    log:{'2020-01-01':[{fid:'b1',name:'Egg, whole',g:50,kcal:72,p:6,c:0,f:5,slot:'b',t:1577900000000}]},
    weights:[{d:'2020-01-01',w:199.5}],
    custom:[{id:'keepme',name:'Keep me',kcal:10,p:1,c:1,f:0,custom:1}],
    favs:['keepme'],recents:[],sessions:[{date:'2020-01-02',day:'Upper',sets:[{ex:'Squat',w:100,r:5}]}],
    cycleDays:{'2020-05-01':1}
  }));
});
await app.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
await app.waitForSelector('#trends');
const kept=await app.evaluate(()=>({
  marker:S.marker,kcal:S.settings.kcal,p:S.settings.p,tdee:S.settings.tdee,
  egg:S.log['2020-01-01']&&S.log['2020-01-01'][0].name,
  w:S.weights.find(x=>x.d==='2020-01-01')&&S.weights.find(x=>x.d==='2020-01-01').w,
  custom:S.custom.some(x=>x.id==='keepme'),fav:S.favs.includes('keepme'),
  sess:S.sessions.length,cycle:S.cycleDays['2020-05-01'],target:document.querySelector('#trends').innerText
}));
if(kept.marker!=='preserve-me'||kept.kcal!==1800||kept.p!==150||kept.tdee!==2200)fail('settings or marker were rewritten '+JSON.stringify(kept));
if(kept.egg!=='Egg, whole'||kept.w!==199.5||!kept.custom||!kept.fav||kept.sess!==1||kept.cycle!==1)fail('existing data missing '+JSON.stringify(kept));
if(!kept.target.includes('1,800'))fail('trends did not read the saved calorie target');
if(!kept.target.includes('0 of 7')||!kept.target.includes('Unknown'))fail('empty recent week should stay unknown');
if(/Not tracking/.test(kept.target))fail('empty week still shows the old alert');
await app.locator('.cycar button').first().click();
const still=await app.evaluate(()=>({egg:S.log['2020-01-01'][0].name,w:S.weights.find(x=>x.d==='2020-01-01').w,cycle:S.cycleDays['2020-05-01'],custom:S.custom.some(x=>x.id==='keepme'),marker:S.marker}));
if(still.egg!=='Egg, whole'||still.w!==199.5||still.cycle!==1||!still.custom||still.marker!=='preserve-me')fail('toggle removed saved data '+JSON.stringify(still));

const blank=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,serviceWorkers:'block'});
const empty=await blank.newPage();
await empty.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
await empty.waitForSelector('#trends');
const emptyText=await empty.locator('#trends').innerText();
if(!emptyText.includes('Trends')||!emptyText.includes('0 of 7')||!emptyText.includes('Copy for Coach'))fail('empty app trends missing');
if(/[\u2013\u2014]/.test(emptyText))fail('dash in empty trends');

if(errors.length)fail('harness errors '+errors.join(' | '));
if(appErrors.length)fail('app errors '+appErrors.join(' | '));
console.log(process.exitCode?'done with failures':'browser checks passed');
await browser.close();
server.kill();
process.exit(process.exitCode||0);
