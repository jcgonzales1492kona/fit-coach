/* Food trends. Reads the log, weigh-ins, and settings. Adds S.cycleDays only when a day is marked.
   Does not migrate, rewrite, or delete existing logs, weights, meals, or settings. */
let trendWin=7;
const TREND_LB=0.45359237;
function trendN(n){return Math.round(n).toLocaleString('en-US')}
function trendR1(x){return Math.round(x*10)/10}
function trendEsc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function trendWinN(w){return w===14?14:w===28?28:7}
function trendFactor(unit){return unit==='kg'?TREND_LB:1}
function trendParts(iso){const [y,m,d]=String(iso||'').split('-').map(Number);return {y,m,d}}
function trendDate(iso){const p=trendParts(iso);return new Date(p.y,(p.m||1)-1,p.d||1,12,0,0,0)}
function trendISO(dt){const y=dt.getFullYear(),m=String(dt.getMonth()+1).padStart(2,'0'),d=String(dt.getDate()).padStart(2,'0');return y+'-'+m+'-'+d}
function trendShift(iso,days){const x=trendDate(iso);x.setDate(x.getDate()+days);return trendISO(x)}
function trendDates(end,n){const out=[];for(let i=n-1;i>=0;i--)out.push(trendShift(end,-i));return out}
function trendNice(iso){const dt=trendDate(iso);return dt.toLocaleDateString('en-US',{weekday:'short'})+' '+dt.toLocaleDateString('en-US',{month:'short',day:'numeric'})}
function trendShort(iso){const dt=trendDate(iso);return dt.toLocaleDateString('en-US',{weekday:'short'})+' '+dt.getDate()}
function trendMD(iso,year){return trendDate(iso).toLocaleDateString('en-US',year?{month:'short',day:'numeric',year:'numeric'}:{month:'short',day:'numeric'})}
function trendRange(a,b){const same=a.slice(0,4)===b.slice(0,4);return trendMD(a,!same)+' to '+trendMD(b,true)}
function trendWd(iso){return trendDate(iso).toLocaleDateString('en-US',{weekday:'short'})}

function trendEntries(log,date){const v=log&&log[date];return Array.isArray(v)?v.filter(Boolean):[]}
function trendDay(log,date){
 const entries=trendEntries(log,date);
 if(!entries.length)return {date,status:'unlogged',kcal:0,p:0,meals:0,snack:0,evening:0,timed:0,untimed:0,n:0};
 let kcal=0,p=0,snack=0,evening=0,timed=0,untimed=0;const slots=new Set();
 entries.forEach(e=>{const k=+e.kcal||0,pr=+e.p||0;kcal+=k;p+=pr;
  const slot=e.slot&&SLOT_NAMES[e.slot]?e.slot:'s';slots.add(slot);if(slot==='s')snack+=k;
  if(e.t==null||e.t===''){untimed++;return}
  const dt=new Date(e.t);if(isNaN(dt.getTime())){untimed++;return}
  timed++;if(dt.getHours()*60+dt.getMinutes()>=19*60)evening+=k});
 const status=slots.size>=2&&Math.round(kcal)>=1000?'logged':'partial';
 return {date,status,kcal,p,meals:slots.size,snack,evening,timed,untimed,n:entries.length}}
function trendWeightMap(weights){const m={};(weights||[]).forEach(x=>{if(!x||!/^\d{4}-\d{2}-\d{2}$/.test(x.d||''))return;const w=+x.w;if(!isFinite(w))return;m[x.d]=w});return m}
function trendAvg(days,key){const L=days.filter(d=>d.status==='logged');if(!L.length)return {avg:null,n:0};return {avg:L.reduce((a,d)=>a+(+d[key]||0),0)/L.length,n:L.length}}
function trendWAvg(map,dates){const ws=dates.map(d=>map[d]).filter(v=>v!=null);if(!ws.length)return null;return ws.reduce((a,b)=>a+b,0)/ws.length}
function trendSnackPct(days){let k=0,s=0;days.forEach(d=>{k+=d.kcal;s+=d.snack});return k>0?s/k:null}
function trendEvePct(days){let k=0,e=0,timed=0,untimed=0;days.forEach(d=>{k+=d.kcal;e+=d.evening;timed+=d.timed;untimed+=d.untimed});if(!timed)return {pct:null,untimed};return {pct:k>0?e/k:null,untimed}}
function trendHits(days){return days.filter(d=>Math.round(d.p)>=130).length}
function trendHot(days,target){return days.filter(d=>Math.round(d.kcal)>target+400)}
function trendSnackDays(days){return days.filter(d=>d.kcal>0&&d.snack/d.kcal>0.25)}
function trendGap(days){let recent=null,cur=[];days.forEach(d=>{if(d.status!=='logged')cur.push(d);else{if(cur.length>=2)recent=cur.slice();cur=[]}});if(cur.length>=2)recent=cur.slice();return recent}
function trendJoin(names){if(names.length<=1)return names[0]||'';if(names.length===2)return names[0]+' and '+names[1];return names.slice(0,-1).join(', ')+', and '+names[names.length-1]}
function trendCycleMap(raw){const o={};if(!raw||typeof raw!=='object')return o;Object.keys(raw).forEach(k=>{if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&raw[k])o[k]=1});return o}
function trendAvgPhrase(avg,n,suffix){if(avg==null)return 'No logged days';return trendN(avg)+(suffix||'')+' avg over '+n+' day'+(n===1?'':'s')}
function trendVs(cur,prior,win,suffix){if(cur==null)return '';if(prior==null)return 'No prior logged days';
 const d=Math.round(cur)-Math.round(prior),w=win===7?'prior 7\u00A0days':win===14?'prior 14\u00A0days':'prior 28\u00A0days',u=suffix||'';
 if(d===0)return 'flat vs '+w;if(d>0)return 'up '+trendN(d)+u+' vs '+w;return 'down '+trendN(-d)+u+' vs '+w}
function trendLatestW(weights){let best=null;(weights||[]).forEach(x=>{if(!x||!/^\d{4}-\d{2}-\d{2}$/.test(x.d||'')||!isFinite(+x.w))return;if(!best||x.d>best.d)best={d:x.d,w:+x.w}});return best}

function trendBuild(state,end,win){
 win=trendWinN(win);const log=state&&state.log||{},weights=state&&state.weights||[],settings=state&&state.settings||{};
 const kcalT=+settings.kcal||1720,pT=+settings.p||145,unit=settings.unit==='kg'?'kg':'lb';
 const cycle=trendCycleMap(state&&state.cycleDays),need=Math.max(win*2,28);
 const all=trendDates(end,need).map(d=>trendDay(log,d)),by={};all.forEach(d=>by[d.date]=d);
 const cur=trendDates(end,win).map(d=>by[d]),prior=trendDates(trendShift(end,-win),win).map(d=>by[d]);
 const d7=trendDates(end,7).map(d=>by[d]),d14=trendDates(end,14).map(d=>by[d]),d21=trendDates(end,21);
 const logged7=d7.filter(d=>d.status==='logged').length,logged14=d14.filter(d=>d.status==='logged').length;
 const gapAll=trendGap(d14),recentSet=new Set(d7.map(d=>d.date));
 const gap=gapAll&&gapAll.some(d=>recentSet.has(d.date))?gapAll:null,notTracking=!!gap||logged7<5;
 const kc=trendAvg(cur,'kcal'),kp=trendAvg(cur,'p'),pc=trendAvg(prior,'kcal'),pp=trendAvg(prior,'p');
 const map=trendWeightMap(weights),wCur=trendWAvg(map,trendDates(end,7)),wPrev=trendWAvg(map,trendDates(trendShift(end,-7),7));
 const d28=trendDates(end,28),weeks=[];
 for(let i=0;i<4;i++){const dates=d28.slice(i*7,i*7+7),ds=dates.map(x=>by[x]),a=trendAvg(ds,'kcal'),b=trendAvg(ds,'p');
  weeks.push({start:dates[0],end:dates[6],dates,avgKcal:a.avg,avgP:b.avg,logged:a.n,weight:trendWAvg(map,dates)})}
 const wA=trendWAvg(map,d21.slice(0,7)),wB=trendWAvg(map,d21.slice(7,14)),wC=trendWAvg(map,d21.slice(14));
 const band=0.3*trendFactor(unit);
 const flat=wA!=null&&wB!=null&&wC!=null&&(Math.max(wA,wB,wC)-Math.min(wA,wB,wC))<=band+1e-6;
 const wouldStall=flat&&logged7>=6,cycleStall=d21.some(d=>cycle[d]);
 const reasons=[];
 if(gap){const kinds=new Set(gap.map(d=>d.status)),what=kinds.size===1?(gap[0].status==='unlogged'?'unlogged':'partial'):'unlogged or partial';
  reasons.push(gap.length>4?gap.length+' days in a row were '+what+', from '+trendNice(gap[0].date)+' to '+trendNice(gap[gap.length-1].date)+'.':trendJoin(gap.map(d=>trendNice(d.date)))+' in a row were '+what+'.')}
 if(logged7<5)reasons.push('Only '+logged7+' of the last 7 days are fully logged.');
 const hot=trendHot(cur,kcalT),snackDays=trendSnackDays(cur),eve=trendEvePct(cur);
 let wSub,wCard;
 if(wCur==null){const latest=trendLatestW(weights);wSub=latest?'No weigh-in in the last 7 days. Latest '+trendR1(latest.w)+' '+unit+' on '+trendMD(latest.d)+'.':'No weigh-ins yet.';wCard=wSub}
 else{const c=trendR1(wCur);if(wPrev==null){wCard='no prior week';wSub='7-day avg, no prior week weigh-ins'}
  else{const dlt=trendR1(c-trendR1(wPrev));wCard=dlt===0?'flat vs prior week':dlt<0?'down '+trendR1(-dlt)+' '+unit+' vs prior\u00A0week':'up '+dlt+' '+unit+' vs prior\u00A0week';wSub='7-day avg, '+(dlt===0?'flat vs prior week':dlt<0?'down '+trendR1(-dlt)+' '+unit+' vs prior week':'up '+dlt+' '+unit+' vs prior week')}}
 const cycleOn=cur.filter(d=>cycle[d.date]).map(d=>d.date);
 const stallNote=wouldStall&&cycleStall?'Cycle days are marked in this stretch, so the stall flag is off.':
  cycleOn.length?(cycleOn.length===1?'Cycle day marked ('+trendNice(cycleOn[0])+'). ':'Cycle days marked ('+cycleOn.length+'). ')+'Marked weeks skip the stall flag.':'';
 return {end,win,kcalT,pT,unit,cur,prior,logged7,logged14,notTracking,reasons,gap,
  avgKcal:kc.avg,loggedN:kc.n,avgP:kp.avg,priorKcal:pc.avg,priorP:pp.avg,
  overAvg:kc.avg!=null&&Math.round(kc.avg)>kcalT+150,hot,pHits:trendHits(cur),pLow:kp.avg!=null&&Math.round(kp.avg)<125,
  snackPct:trendSnackPct(cur),snackDays,evePct:eve.pct,eveUntimed:eve.untimed,
  wCur,wPrev,wHead:wCur==null?'None':trendR1(wCur)+' '+unit,wSub,wCard,weeks,
  wouldStall,stall:wouldStall&&!cycleStall,stallNote,cycle,band}}

function trendSummaryText(M){
 const days=M.win===7?M.cur:null;
 const src=days||M.cur,range=trendRange(src[0].date,src[src.length-1].date);
 const hi=src.reduce((a,d)=>!a||d.kcal>=a.kcal?d:a,null);
 const un=src.filter(d=>d.status==='unlogged').map(d=>trendNice(d.date));
 const part=src.filter(d=>d.status==='partial').map(d=>trendNice(d.date));
 const lines=['FitCoach weekly summary',range,'',
  'Days logged: '+M.logged7+'/7',
  'Avg calories: '+(M.avgKcal==null?'no logged days':trendN(M.avgKcal)+' over '+M.loggedN+' day'+(M.loggedN===1?'':'s'))+' (target '+trendN(M.kcalT)+')',
  'Avg protein: '+(M.avgP==null?'no logged days':Math.round(M.avgP)+' g over '+M.loggedN+' day'+(M.loggedN===1?'':'s'))+' (target '+Math.round(M.pT)+' g)',
  'Days protein hit (130 g+): '+M.pHits+' of 7',
  'Highest day: '+(!hi||hi.kcal<=0?'none':trendNice(hi.date)+', '+trendN(hi.kcal)+' kcal'),
  'Snack share: '+(M.snackPct==null?'no food logged':Math.round(M.snackPct*100)+'%'),
  'After 7 pm: '+(M.evePct==null?'no entry times':Math.round(M.evePct*100)+'%'+(M.eveUntimed?' (some entries have no time)':'')),
  'Weight: '+(M.wCur==null?M.wSub.replace(/\.$/,''):trendR1(M.wCur)+' '+M.unit+' '+M.wSub),
  'Unlogged: '+(un.length?un.join(', '):'none')];
 if(part.length)lines.push('Partial: '+part.join(', '));
 return lines.join('\n')}
function trendSummary(){return trendSummaryText(trendBuild(S,today(),7))}

function trendBarColor(d,target){
 if(!d||d.status==='unlogged')return '#3A3A3C';
 if(Math.round(d.kcal)>target+400)return '#ff453a';
 if(d.status==='partial')return '#8E8E93';
 if(d.kcal>target)return '#ff9f0a';
 return '#30d158'}
function trendWeekColor(avg,target){if(avg==null)return '#3A3A3C';if(Math.round(avg)>target+400)return '#ff453a';if(avg>target)return '#ff9f0a';return '#30d158'}

function trendChart(M){
 const weekly=M.win===28;
 const cols=weekly?M.weeks.map(w=>({kcal:w.avgKcal||0,label:trendMD(w.start),sub:w.avgKcal==null?'0':trendN(w.avgKcal),p:null,color:trendWeekColor(w.avgKcal,M.kcalT),title:trendMD(w.start)+' to '+trendMD(w.end)+(w.avgKcal==null?', no logged days':', '+trendN(w.avgKcal)+' kcal average')})):
  M.cur.map(d=>({kcal:d.status==='unlogged'?0:d.kcal,label:M.win===7?trendDate(d.date).toLocaleDateString('en-US',{weekday:'short'}):String(trendDate(d.date).getDate()),sub:d.status==='unlogged'?'0':trendN(d.kcal),p:d.status==='unlogged'?null:Math.round(d.p),color:trendBarColor(d,M.kcalT),title:trendNice(d.date)+', '+(d.status==='unlogged'?'unlogged':trendN(d.kcal)+' kcal, P'+Math.round(d.p)+', '+d.status)}));
 const max=Math.max(M.kcalT*1.08,...cols.map(c=>c.kcal),1)*1.08,line=M.kcalT/max*100;
 const bars=cols.map(c=>`<div class="trcol" title="${trendEsc(c.title)}"><div class="trtrack"><i style="height:${Math.max(0,Math.min(100,c.kcal/max*100))}%;background:${c.color}"></i></div></div>`).join('');
 const labs=cols.map(c=>`<span><b>${M.win===14?'':trendEsc(c.sub)}</b>${c.p!=null&&M.win===7?'<small>P'+c.p+'</small>':''}${trendEsc(c.label)}</span>`).join('');
 const cap=weekly?'Weekly averages of logged days. The line is your '+trendN(M.kcalT)+' target.':'Daily calories. The line is your '+trendN(M.kcalT)+' target.';
 return `<div class="trbox" role="img" aria-label="${trendEsc(cap+' '+cols.map(c=>c.title).join(', '))}"><div class="trplot"><em class="trline" style="bottom:${line.toFixed(2)}%"></em>${bars}</div><div class="trlabs">${labs}</div><p class="trkey"><i style="background:#30d158"></i>Under <i style="background:#ff9f0a"></i>Over <i style="background:#ff453a"></i>Way over <i style="background:#8E8E93"></i>Partial <s></s>Target ${trendN(M.kcalT)}</p><p class="muted trcap">${trendEsc(cap)}</p></div>`}

function trendDays(M){if(M.win!==14)return '';
 return `<div class="trdays">${M.cur.map(d=>{const label=d.status==='logged'?'Logged':d.status==='partial'?'Partial':'Unlogged';
  const mid=d.status==='unlogged'?'No entries':trendN(d.kcal)+' kcal · P'+Math.round(d.p)+(d.meals?` · ${d.meals} meal${d.meals===1?'':'s'}`:'');
  return `<div class="trli ${d.status}"><span>${trendEsc(trendShort(d.date))}</span><span>${mid}</span><em>${label}</em></div>`}).join('')}</div>`}

function trendWeeks(M){if(M.win!==28)return '';
 return `<div class="trweeks">${M.weeks.map(w=>{const kcal=w.avgKcal==null?'No logged days':trendAvgPhrase(w.avgKcal,w.logged);
  const p=w.avgP==null?'':` · P${Math.round(w.avgP)}`,wt=w.weight==null?'':` · ${trendR1(w.weight)} ${trendEsc(M.unit)}`;
  return `<div class="trwk"><b>${trendEsc(trendMD(w.start))} to ${trendEsc(trendMD(w.end))}</b><span>${trendEsc(kcal)}${p} · ${w.logged}/7 logged${wt}</span></div>`}).join('')}</div>`}

function trendCycleRow(M){const dates=M.win===28?trendDates(M.end,28):M.cur.map(d=>d.date);
 return `<div class="cycar" role="group" aria-label="Cycle days">${dates.map(d=>{const on=!!M.cycle[d];
  return `<button type="button" class="cyc${on?' on':''}" data-date="${d}" aria-pressed="${on?'true':'false'}" aria-label="${on?'Cycle day':'Mark as cycle day'} ${trendEsc(trendNice(d))}" onclick="trendCycle('${d}')"><b>${trendEsc(trendWd(d))}</b><small>${trendDate(d).getDate()}</small></button>`}).join('')}</div>`}

function trendCard(){const M=trendBuild(S,today(),trendWin),u=trendEsc(M.unit);
 const calFlags=[M.overAvg?`<p class="trflag">Average is ${trendN(Math.round(M.avgKcal)-M.kcalT)} kcal over the ${trendN(M.kcalT)} target.</p>`:'',
  ...M.hot.map(d=>`<p class="trflag">${trendEsc(trendNice(d.date))} was ${trendN(Math.round(d.kcal)-M.kcalT)} kcal over target.</p>`)].join('');
 const eveLine=M.evePct==null?'After 7 pm: no entry times':`After 7 pm ${Math.round(M.evePct*100)}%`+(M.eveUntimed?' · some entries have no time':'');
 const snackLine=M.snackPct==null?'No food logged yet':`Snacks ${Math.round(M.snackPct*100)}% · ${eveLine}`;
 const snackFlag=M.snackDays.length?`<p class="trflag">${M.snackDays.length} day${M.snackDays.length===1?'':'s'} with snacks over 25% of calories.</p>`:'';
 const wClass=M.wCur==null||M.wPrev==null?'':trendR1(trendR1(M.wCur)-trendR1(M.wPrev))<0?' down':trendR1(trendR1(M.wCur)-trendR1(M.wPrev))>0?' up':'';
 return `<div class="card trends" id="trends" data-win="${M.win}">
 <div class="trtop"><h3>Trends</h3><button type="button" class="btn sm trcopy" id="trend-copy" onclick="trendCopy()">Copy for Coach</button></div>
 <div class="trwin" role="group" aria-label="Trend window">${[7,14,28].map(n=>`<button type="button" class="chip${M.win===n?' on':''}" data-win="${n}" aria-pressed="${M.win===n?'true':'false'}" onclick="trendSet(${n})">${n} days</button>`).join('')}</div>
 ${M.notTracking?`<div class="tralert" role="status"><b>Not tracking</b><span>${trendEsc(M.reasons.join(' '))}</span></div>`:''}
 <p class="trcomp"><b>${M.logged7} of 7</b> days logged <span>· ${M.logged14} of 14</span></p>
 <p class="muted trule">A logged day is 2 or more meals and at least 1,000 kcal. Averages use those days.</p>
 <div class="trpair">
  <div><div class="lbl">Calories</div><div class="travg"><b>${M.avgKcal==null?'None':trendN(M.avgKcal)}</b><span>${M.avgKcal==null?'no logged days':'avg over '+M.loggedN+' day'+(M.loggedN===1?'':'s')}</span></div><p class="trvs">${trendEsc(trendVs(M.avgKcal,M.priorKcal,M.win))}</p></div>
  <div><div class="lbl">Weight · 7-day</div><div class="travg"><b class="w${wClass}">${trendEsc(M.wHead)}</b></div><p class="trvs${wClass}">${trendEsc(M.wCard)}</p></div>
 </div>
 ${calFlags}
 ${M.stall?`<p class="trflag">Weight stall: weekly average stayed within ${M.unit==='kg'?'0.14 kg (0.3 lb)':'0.3 lb'} for 2 weeks, with ${M.logged7} of 7 days logged.</p>`:''}
 <div class="trpro"><div class="lbl">Protein</div><div class="travg"><b>${M.avgP==null?'None':Math.round(M.avgP)+' g'}</b><span>${M.avgP==null?'no logged days':'avg over '+M.loggedN+' day'+(M.loggedN===1?'':'s')}</span></div><p class="trvs">${M.pHits} of ${M.win} days at 130 g+ · target ${Math.round(M.pT)} g${M.avgP!=null?' · '+trendEsc(trendVs(M.avgP,M.priorP,M.win,' g')):''}</p>${M.pLow?'<p class="trflag">Average protein is under 125 g.</p>':''}</div>
 <div class="trsn"><div class="lbl">Evening and snacks</div><p class="trsnack">${snackLine}</p>${snackFlag}</div>
 ${trendChart(M)}
 ${M.win===28?trendWeeks(M):trendDays(M)}
 <h4>Cycle days</h4>
 ${trendCycleRow(M)}
 ${M.stallNote?`<p class="muted trnote">${trendEsc(M.stallNote)}</p>`:''}
 </div>`}

function trendSet(n){trendWin=trendWinN(n);const y=window.scrollY;renderFood();window.scrollTo(0,y)}
function trendCycle(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;S.cycleDays||={};if(S.cycleDays[d])delete S.cycleDays[d];else S.cycleDays[d]=1;save();const y=window.scrollY;renderFood();window.scrollTo(0,y)}
function trendCopy(){const text=trendSummary();window.__coachText=text;const ok=()=>toast('Copied for your coach.');
 const fail=()=>{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');ok()}catch(e){toast('Could not copy. Try again.')}ta.remove()};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(ok).catch(fail);else fail()}
