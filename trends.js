/* Food trends. Reads the log, weigh-ins, settings, and S.logStatus.
   A day is Complete, Partial, or Not logged only when the user says so.
   A missing status is Unknown, including older dates and today.
   Calories and protein averages use confirmed complete days only.
   Missing days are left out. They are not stored as zero.
   This file does not rewrite logs, weights, meals, or settings. */
let trendWin=7;
const TREND_LB=0.45359237,TREND_W_MIN=3;
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

function trendStatus(map,date){const v=map&&map[date];return v==='complete'||v==='partial'||v==='none'?v:'unknown'}
function trendApplyStatus(state,date,status){
 if(!state||!/^\d{4}-\d{2}-\d{2}$/.test(date))return false;
 const before=JSON.stringify(state.log||null);
 state.logStatus||={};
 if(status==='unknown')delete state.logStatus[date];
 else if(status==='complete'||status==='partial'||status==='none')state.logStatus[date]=status;
 else return false;
 return JSON.stringify(state.log||null)===before}
function trendEntries(log,date){const v=log&&log[date];return Array.isArray(v)?v.filter(Boolean):[]}
function trendMealMin(v){const m=/^(\d{1,2}):(\d{2})$/.exec(String(v||'').trim());if(!m)return null;const h=+m[1],min=+m[2];if(h>23||min>59)return null;return h*60+min}
function trendDay(log,date,map){
 const entries=trendEntries(log,date);
 let kcal=0,p=0,snack=0,timed=0,untimed=0,evening=0;
 entries.forEach(e=>{const k=+e.kcal||0,pr=+e.p||0;kcal+=k;p+=pr;if(e.slot==='s')snack+=k;
  const mm=trendMealMin(e.mealAt);if(mm==null){untimed++;return}timed++;if(mm>=19*60)evening+=k});
 return {date,status:trendStatus(map,date),kcal,p,snack,n:entries.length,timed,untimed,evening}}
function trendWeightMap(weights){const m={};(weights||[]).forEach(x=>{if(!x||!/^\d{4}-\d{2}-\d{2}$/.test(x.d||''))return;const w=+x.w;if(!isFinite(w))return;m[x.d]=w});return m}
function trendCompleteAvg(days,key){const L=days.filter(d=>d.status==='complete');if(!L.length)return {avg:null,n:0};return {avg:L.reduce((a,d)=>a+(+d[key]||0),0)/L.length,n:L.length}}
function trendPartial(days){const L=days.filter(d=>d.status==='partial');if(!L.length)return {n:0,kcal:0,p:0};return {n:L.length,kcal:L.reduce((a,d)=>a+d.kcal,0),p:L.reduce((a,d)=>a+d.p,0)}}
function trendCoverage(days){const c={complete:0,partial:0,none:0,unknown:0,total:days.length};days.forEach(d=>c[d.status]++);return c}
function trendWStats(map,dates){const ws=dates.map(d=>map[d]).filter(v=>v!=null&&isFinite(v));if(!ws.length)return {avg:null,n:0,enough:false};return {avg:ws.reduce((a,b)=>a+b,0)/ws.length,n:ws.length,enough:ws.length>=TREND_W_MIN}}
function trendSnack(days){let k=0,s=0,n=0;days.forEach(d=>{k+=d.kcal;s+=d.snack;n+=d.n});return n&&k>0?s/k:null}
function trendEvening(days){let n=0,untimed=0,k=0,e=0;days.forEach(d=>{n+=d.n;untimed+=d.untimed;k+=d.kcal;e+=d.evening});
 if(!n)return {claim:false,pct:null,why:'No entries on file.'};
 if(untimed)return {claim:false,pct:null,why:'Meal time is missing on some entries. Log time is not used, so evening share is not shown.'};
 return {claim:true,pct:k>0?e/k:null,why:''}}
function trendSaved(n){return isFinite(+n)?+n:null}
function trendCycleMap(raw){const o={};if(!raw||typeof raw!=='object')return o;Object.keys(raw).forEach(k=>{if(/^\d{4}-\d{2}-\d{2}$/.test(k)&&raw[k])o[k]=1});return o}
function trendJoin(names){if(names.length<=1)return names[0]||'';if(names.length===2)return names[0]+' and '+names[1];return names.slice(0,-1).join(', ')+', and '+names[names.length-1]}

function trendBuild(state,end,win){
 win=trendWinN(win);const log=state&&state.log||{},weights=state&&state.weights||[],settings=state&&state.settings||{},status=state&&state.logStatus;
 const kcalT=trendSaved(settings.kcal),pT=trendSaved(settings.p),unit=settings.unit==='kg'?'kg':'lb';
 const cycle=trendCycleMap(state&&state.cycleDays),need=Math.max(win*2,28);
 const all=trendDates(end,need).map(d=>trendDay(log,d,status)),by={};all.forEach(d=>by[d.date]=d);
 const curDates=trendDates(end,win),cur=curDates.map(d=>by[d]);
 const d7=trendDates(end,7).map(d=>by[d]),priorDates=trendDates(trendShift(end,-win),win);
 const prior=priorDates.map(d=>by[d]);
 const cov=trendCoverage(cur),kc=trendCompleteAvg(cur,'kcal'),kp=trendCompleteAvg(cur,'p');
 const pc=trendCompleteAvg(prior,'kcal'),pp=trendCompleteAvg(prior,'p'),part=trendPartial(cur);
 const map=trendWeightMap(weights);
 const wCur=trendWStats(map,trendDates(end,7)),wPrev=trendWStats(map,trendDates(trendShift(end,-7),7));
 const d28=trendDates(end,28),weeks=[];
 for(let i=0;i<4;i++){const dates=d28.slice(i*7,i*7+7),ds=dates.map(x=>by[x]),a=trendCompleteAvg(ds,'kcal'),b=trendCompleteAvg(ds,'p'),ws=trendWStats(map,dates);
  weeks.push({start:dates[0],end:dates[6],dates,avgKcal:a.avg,avgP:b.avg,n:a.n,pN:b.n,coverage:trendCoverage(ds),partial:trendPartial(ds),weight:ws})}
 const snackPct=trendSnack(cur),eve=trendEvening(cur);
 let wHead,wNote;
 if(wCur.avg==null){wHead='None';wNote='No weigh-ins in this 7-day window.'}
 else{wHead=trendR1(wCur.avg)+' '+unit;wNote=wCur.n+' weigh-in'+(wCur.n===1?'':'s')+' of 7 days';
  if(!wCur.enough||!wPrev.enough)wNote+='. Not enough weigh-ins to call a trend'+(wPrev.avg==null?'':', prior window n='+wPrev.n);
  else{const dlt=trendR1(trendR1(wCur.avg)-trendR1(wPrev.avg));wNote+=dlt===0?'. Flat vs the prior 7-day window (n='+wPrev.n+')':dlt<0?'. Down '+trendR1(-dlt)+' '+unit+' vs the prior 7-day window (n='+wPrev.n+')':'. Up '+dlt+' '+unit+' vs the prior 7-day window (n='+wPrev.n+')'}}
 return {end,win,kcalT,pT,unit,cur,prior,cov,avgKcal:kc.avg,avgN:kc.n,avgP:kp.avg,pN:kp.n,priorKcal:pc.avg,priorN:pc.n,priorP:pp.avg,priorPN:pp.n,
  partial:part,wCur,wPrev,wHead,wNote,weeks,snackPct,eve,cycle,band:0.3*trendFactor(unit)}}

function trendCovLine(c){return c.complete+' complete, '+c.partial+' partial, '+c.none+' not logged, '+c.unknown+' unknown'}
function trendGoalLine(n,unit){return n==null?'No saved goal on this phone':trendN(n)+(unit||'')+' saved goal, not marked medically approved'}
function trendSummaryText(M,opts){
 opts=opts||{};const src=M.cur,range=trendRange(src[0].date,src[src.length-1].date),c=M.cov;
 const lines=['FitCoach summary',range,'',
  'Coverage: '+trendCovLine(c)+' ('+c.total+' days)',
  'Eligible for averages: '+M.avgN+' of '+c.total+' confirmed complete days',
  'Calories, complete days only: '+(M.avgKcal==null?'no confirmed complete days':trendN(M.avgKcal)+' avg, n='+M.avgN),
  'Saved calorie goal: '+(M.kcalT==null?'none on this phone':trendN(M.kcalT)+', not marked medically approved'),
  'Protein, complete days only: '+(M.avgP==null?'no confirmed complete days':Math.round(M.avgP)+' g avg, n='+M.pN),
  'Saved protein goal: '+(M.pT==null?'none on this phone':Math.round(M.pT)+' g, not marked medically approved'),
  'Partial days, separate: '+(M.partial.n?'n='+M.partial.n+', '+trendN(M.partial.kcal)+' kcal and '+Math.round(M.partial.p)+' g protein on file':'none'),
  'Unknown and not logged days are left out. Missing days are not counted as zero.',
  'Weight, last 7 days: '+(M.wCur.avg==null?'no weigh-ins':trendR1(M.wCur.avg)+' '+M.unit+', n='+M.wCur.n),
  'Prior 7 days: '+(M.wPrev.avg==null?'no weigh-ins':trendR1(M.wPrev.avg)+' '+M.unit+', n='+M.wPrev.n),
  M.wNote,
  'Snack slot share of calories on file: '+(M.snackPct==null?'no calories on file':Math.round(M.snackPct*100)+'%'),
  'Evening: '+(M.eve.claim?Math.round((M.eve.pct||0)*100)+'% of calories on file, from meal times you entered':M.eve.why)];
 const marks=src.filter(d=>M.cycle[d.date]).map(d=>trendNice(d.date));
 if(opts.cycle&&marks.length)lines.push('Context tags: '+marks.join(', '));
 else lines.push('Context tags are not included.');
 if(opts.priv&&opts.notes&&opts.notes.length)opts.notes.forEach(n=>lines.push('Private note '+trendNice(n.date)+': '+String(n.note).replace(/\s+/g,' ')));
 else lines.push('Private notes are not included.');
 return lines.join('\n')}
function trendNotesIn(state,dates){const days=state&&state.holiday50&&state.holiday50.days||{},out=[];
 dates.forEach(d=>{const note=days[d]&&days[d].privateNote;if(note)out.push({date:d,note:String(note)})});return out}
function trendSummary(opts){const M=trendBuild(S,today(),7);opts=opts||{};if(opts.priv)opts.notes=trendNotesIn(S,M.cur.map(d=>d.date));return trendSummaryText(M,opts)}

function trendBarColor(d){if(d.status==='complete')return '#30d158';if(d.status==='partial')return '#ff9f0a';if(d.status==='unknown'&&d.n)return '#8E8E93';return 'transparent'}
function trendChart(M){
 const weekly=M.win===28;
 const cols=weekly?M.weeks.map(w=>({kcal:w.avgKcal||0,label:trendMD(w.start),sub:w.avgKcal==null?'n=0':trendN(w.avgKcal),color:w.avgKcal==null?'#3A3A3C':'#30d158',title:trendMD(w.start)+' to '+trendMD(w.end)+', complete n='+w.n+(w.avgKcal==null?', no complete days':', '+trendN(w.avgKcal)+' kcal avg')})):
  M.cur.map(d=>({kcal:d.status==='none'||!d.n?0:d.kcal,label:M.win===7?trendDate(d.date).toLocaleDateString('en-US',{weekday:'short'}):String(trendDate(d.date).getDate()),sub:d.status==='none'?'Not logged':!d.n?'Unknown':trendN(d.kcal),color:trendBarColor(d),title:trendNice(d.date)+', '+d.status+(d.n?', '+trendN(d.kcal)+' kcal on file':', no entries')}));
 const max=Math.max(M.kcalT||0,...cols.map(c=>c.kcal),1)*1.08,line=M.kcalT?M.kcalT/max*100:null;
 const bars=cols.map(c=>`<div class="trcol" title="${trendEsc(c.title)}"><div class="trtrack"><i style="height:${Math.max(c.kcal?2:0,Math.min(100,c.kcal/max*100))}%;background:${c.color}"></i></div></div>`).join('');
 const labs=cols.map(c=>`<span><b>${trendEsc(c.sub)}</b>${trendEsc(c.label)}</span>`).join('');
 const cap='Bar height is calories on file. Only confirmed complete days are averaged. Unknown is not zero.'+(M.kcalT==null?'':' The line is the saved calorie goal.');
 const lineEl=line==null?'':`<em class="trline" style="bottom:${line.toFixed(2)}%"></em>`;
 return `<div class="trbox" role="img" aria-label="${trendEsc(cap+' '+cols.map(c=>c.title).join(', '))}"><div class="trplot">${lineEl}${bars}</div><div class="trlabs">${labs}</div><p class="trkey"><i style="background:#30d158"></i>Complete <i style="background:#ff9f0a"></i>Partial <i style="background:#8E8E93"></i>Unknown, on file${M.kcalT==null?'':' <s></s>Saved goal '+trendN(M.kcalT)}</p><p class="muted trcap">${trendEsc(cap)}</p></div>`}

function trendDayRows(M){
 return `<div class="trdays">${M.cur.map(d=>{const mid=d.status==='none'?(d.n?'Marked not logged. Entries stay on file.':'Marked not logged'):d.n?trendN(d.kcal)+' kcal on file, P'+Math.round(d.p):'No entries';
  return `<div class="trli ${d.status}"><span>${trendEsc(trendShort(d.date))}</span><span>${mid}</span><label class="trpick"><span class="sr">Status</span><select aria-label="Logging status ${trendEsc(trendNice(d.date))}" onchange="trendSetStatus('${d.date}',this.value)">${trendStatusOpts(d.status)}</select></label></div>`}).join('')}</div>`}
function trendStatusOpts(cur){return [['unknown','Unknown'],['complete','Complete'],['partial','Partial'],['none','Not logged']].map(([v,l])=>`<option value="${v}"${cur===v?' selected':''}>${l}</option>`).join('')}
function trendWeeks(M){if(M.win!==28)return '';
 return `<div class="trweeks">${M.weeks.map(w=>{const kcal=w.avgKcal==null?'No confirmed complete days':trendN(w.avgKcal)+' kcal avg, n='+w.n;
  const p=w.avgP==null?'':`, P${Math.round(w.avgP)} avg`;
  const wt=w.weight.avg==null?'No weigh-ins':trendR1(w.weight.avg)+' '+M.unit+', n='+w.weight.n+(w.weight.enough?'':'. Not enough weigh-ins to call a trend');
  const part=w.partial.n?'Partial separate: n='+w.partial.n+', '+trendN(w.partial.kcal)+' kcal on file. ':'';
  return `<div class="trwk"><b>${trendEsc(trendMD(w.start))} to ${trendEsc(trendMD(w.end))}</b><span>${trendEsc(trendCovLine(w.coverage))}</span><span>${trendEsc(kcal)}${p}</span><span>${part}${trendEsc(wt)}</span></div>`}).join('')}</div>`}

function trendStatusCard(date){const st=trendStatus(S.logStatus,date),nice=trendNice(date),todayish=date===today();
 return `<div class="card logstat" id="logstat"><h3>Logging status</h3><p class="muted">${trendEsc(nice)}${todayish?' is still in progress.':''} FitCoach does not mark a day complete from calories or meal count. Unknown is the default until you choose.</p>
 <div class="trwin" role="group" aria-label="Logging status">${[['unknown','Unknown'],['complete','Complete'],['partial','Partial'],['none','Not logged']].map(([v,l])=>`<button type="button" class="chip${st===v?' on':''}" aria-pressed="${st===v?'true':'false'}" onclick="trendSetStatus('${date}','${v}')">${l}</button>`).join('')}</div></div>`}
function trendCard(){const M=trendBuild(S,today(),trendWin),c=M.cov;
 const wClass=M.wCur.enough&&M.wPrev.enough?(trendR1(M.wCur.avg)-trendR1(M.wPrev.avg)<0?' down':trendR1(M.wCur.avg)-trendR1(M.wPrev.avg)>0?' up':''):'';
 const snack=M.snackPct==null?'No calories on file yet.':`Snack slot is ${Math.round(M.snackPct*100)}% of calories on file. This is a description, not a target.`;
 const eve=M.eve.claim?`Evening share ${Math.round((M.eve.pct||0)*100)}% of calories on file, using meal times you entered.`:'Evening: '+M.eve.why;
 return `<div class="card trends" id="trends" data-win="${M.win}">
 <div class="trtop"><h3>Trends</h3><button type="button" class="btn sm trcopy" id="trend-copy" onclick="trendCopy()">Copy for Coach</button></div>
 <div class="trwin" role="group" aria-label="Trend window">${[7,14,28].map(n=>`<button type="button" class="chip${M.win===n?' on':''}" data-win="${n}" aria-pressed="${M.win===n?'true':'false'}" onclick="trendSet(${n})">${n} days</button>`).join('')}</div>
 <div class="trcov"><div class="lbl">Coverage</div><p class="trcomp"><b>${c.complete} complete</b> · ${c.partial} partial · ${c.none} not logged · ${c.unknown} unknown</p>
 <p class="muted trule">${M.avgN} of ${c.total} days are confirmed complete and eligible for averages. Unknown is the default. Missing days are not counted as zero.</p></div>
 <div class="trpair">
  <div><div class="lbl">Calories, complete only</div><div class="travg"><b>${M.avgKcal==null?'None':trendN(M.avgKcal)}</b><span>${M.avgKcal==null?'no confirmed complete days':'avg, n='+M.avgN}</span></div><p class="trvs">${trendEsc(trendGoalLine(M.kcalT))}</p></div>
  <div><div class="lbl">Weight, 7-day window</div><div class="travg"><b class="w${wClass}">${trendEsc(M.wHead)}</b></div><p class="trvs${wClass}">${trendEsc(M.wNote)}</p></div>
 </div>
 <div class="trpro"><div class="lbl">Protein, complete only</div><div class="travg"><b>${M.avgP==null?'None':Math.round(M.avgP)+' g'}</b><span>${M.avgP==null?'no confirmed complete days':'avg, n='+M.pN}</span></div><p class="trvs">${trendEsc(trendGoalLine(M.pT,' g'))}</p></div>
 <p class="trsnack">Partial, separate: ${M.partial.n?trendEsc('n='+M.partial.n+', '+trendN(M.partial.kcal)+' kcal and '+Math.round(M.partial.p)+' g protein on file. Not in the average.'):'no partial days.'}</p>
 <div class="trsn"><div class="lbl">Snacks and meal times</div><p class="trsnack">${snack}</p><p class="trsnack">${trendEsc(eve)}</p></div>
 ${trendChart(M)}
 ${M.win===28?trendWeeks(M):trendDayRows(M)}
 <h4>Context tags</h4>
 <p class="muted trnote">Optional. A tag does not explain a weight change.</p>
 ${trendCycleRow(M)}
 </div>`}
function trendCycleRow(M){const dates=M.cur.map(d=>d.date);
 return `<div class="cycar" role="group" aria-label="Context tags">${dates.map(d=>{const on=!!M.cycle[d];
  return `<button type="button" class="cyc${on?' on':''}" data-date="${d}" aria-pressed="${on?'true':'false'}" aria-label="${on?'Context tag on':'Add context tag'} ${trendEsc(trendNice(d))}" onclick="trendCycle('${d}')"><b>${trendEsc(trendWd(d))}</b><small>${trendDate(d).getDate()}</small></button>`}).join('')}</div>`}

function trendSet(n){trendWin=trendWinN(n);const y=window.scrollY;renderFood();window.scrollTo(0,y)}
function trendCycle(d){if(!/^\d{4}-\d{2}-\d{2}$/.test(d))return;S.cycleDays||={};if(S.cycleDays[d])delete S.cycleDays[d];else S.cycleDays[d]=1;save();const y=window.scrollY;renderFood();window.scrollTo(0,y)}
function trendSetStatus(date,status){if(!trendApplyStatus(S,date,status))return;save();const y=window.scrollY;
 if(location.hash==='#holiday'&&typeof renderHoliday==='function')renderHoliday();else renderFood();window.scrollTo(0,y)}
let trendCopyOpts={cycle:false,priv:false};
function trendCopy(opts){if(opts)trendCopyOpts=Object.assign({cycle:false,priv:false},opts);const text=trendSummary(trendCopyOpts);window.__coachText=text;
 modal(`<h3>Copy for Coach</h3><p class="muted">Check the preview. Context tags and private notes stay off unless you include them.</p>
 <label class="mchk"><input type="checkbox" id="trend-inc-cycle" ${trendCopyOpts.cycle?'checked':''} onchange="trendCopy({cycle:this.checked,priv:trendCopyOpts.priv})"> Include context tags</label>
 <label class="mchk"><input type="checkbox" id="trend-inc-priv" ${trendCopyOpts.priv?'checked':''} onchange="trendCopy({cycle:trendCopyOpts.cycle,priv:this.checked})"> Include private notes</label>
 <pre id="trend-preview" class="copypre">${trendEsc(text)}</pre>
 <button type="button" class="btn" id="trend-copy-go" onclick="trendCopyNow()">Copy this text</button>`)}
function trendCopyNow(){const text=window.__coachText||'';const ok=()=>toast('Copied for your coach.');
 const fail=()=>{const ta=document.createElement('textarea');ta.value=text;ta.setAttribute('readonly','');ta.style.position='fixed';ta.style.left='-9999px';document.body.appendChild(ta);ta.select();
  try{document.execCommand('copy');ok()}catch(e){toast('Could not copy. Try again.')}ta.remove()};
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(ok).catch(fail);else fail()}
