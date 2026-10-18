/* ---------- barcode scanner (Food tab) ---------- */
const SCAN_LIB='https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.5/dist/iife/reader/index.js';
const SCAN_FMT=['EAN13','EAN8','UPCA','UPCE'],SCAN_NATIVE=['ean_13','ean_8','upc_a','upc_e'];
const scanSt={stream:null,run:0,det:undefined,lib:null,last:null,busy:false};
function scanLib(){if(window.ZXingWASM)return Promise.resolve(window.ZXingWASM);
 return scanSt.lib||=new Promise((res,rej)=>{const s=document.createElement('script');s.src=SCAN_LIB;s.crossOrigin='anonymous';
  s.onload=()=>window.ZXingWASM?res(window.ZXingWASM):rej(new Error('lib'));s.onerror=()=>{scanSt.lib=null;rej(new Error('lib'))};document.head.appendChild(s)})}
const SCAN_WASM='https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.5/dist/reader/zxing_reader.wasm';
async function scanZX(){const zx=await scanLib();let err;
 for(const host of[SCAN_WASM,null]){try{await zx.prepareZXingModule({overrides:host?{locateFile:(p,pre)=>p.endsWith('.wasm')?host:pre+p}:{},fireImmediately:true});return zx}catch(e){err=e;try{zx.purgeZXingModule()}catch(_){}}}
 throw err}
async function scanNative(){if(scanSt.det!==undefined)return scanSt.det;scanSt.det=null;
 try{if('BarcodeDetector'in window){const ok=(await BarcodeDetector.getSupportedFormats()).filter(f=>SCAN_NATIVE.includes(f));if(ok.length)scanSt.det=new BarcodeDetector({formats:ok})}}catch(e){}
 return scanSt.det}
const scanMsg=(t,cls)=>{const m=$('#bcmsg');if(m){m.textContent=t;m.className=cls||'muted'}};
function scanOpen(){scanStop();modal(`<h3>Scan barcode</h3>
 <div class="bcv" id="bcv" hidden><video id="bcvid" playsinline muted autoplay></video><i class="bcline"></i></div>
 <p id="bcmsg" class="muted">Point the rear camera at the barcode, or use a photo.</p>
 <div class="inl bcb"><button class="btn" id="bccam" onclick="scanCam()">Use camera</button><label class="btn sec file">Upload photo<input type="file" accept="image/*" hidden onchange="scanFile(this)"></label></div>
 <label>Or type the barcode number<div class="inl"><input id="bcn" inputmode="numeric" pattern="[0-9]*" autocomplete="off" placeholder="e.g. 3017620422003" onkeydown="if(event.key==='Enter')scanManual()"><button class="btn sm" onclick="scanManual()">Look up</button></div></label>`);
 scanLib().catch(()=>{});if(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)scanCam();else scanMsg('Camera is not available here. Use Upload photo or type the number.')}
function scanStop(){scanSt.run++;const s=scanSt.stream;scanSt.stream=null;if(s)s.getTracks().forEach(t=>t.stop());const v=$('#bcvid');if(v)v.srcObject=null}
async function scanCam(){if(!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia)){scanMsg('Camera is not available here. Use Upload photo or type the number.');return}
 scanStop();const run=scanSt.run;scanMsg('Starting camera...');
 let st;try{st=await navigator.mediaDevices.getUserMedia({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}})}
 catch(e){if(run!==scanSt.run)return;scanMsg(e&&e.name==='NotAllowedError'?'Camera access was blocked. Allow the camera for this site (iPhone Settings > Safari > Camera), or use Upload photo.':'Could not start the camera. Use Upload photo or type the number.','warn');return}
 const v=$('#bcvid');if(run!==scanSt.run||!v){st.getTracks().forEach(t=>t.stop());return}
 scanSt.stream=st;v.srcObject=st;$('#bcv').hidden=false;$('#bccam').hidden=true;try{await v.play()}catch(e){}
 scanMsg('Looking for a barcode... hold it flat, about a hand length away.');scanLoop(run)}
async function scanLoop(run){const v=$('#bcvid'),cv=document.createElement('canvas'),cx=cv.getContext('2d',{willReadFrequently:true});
 const det=await scanNative();let zx=null;if(!det){try{zx=await scanZX()}catch(e){if(run===scanSt.run){scanStop();$('#bcv').hidden=true;$('#bccam').hidden=false;scanMsg('Could not load the scanner. Check your connection and tap Use camera to retry, or type the number.','warn')}return}}
 while(run===scanSt.run){if(v.readyState>=2&&v.videoWidth){let code=null;
   try{if(det){const r=await det.detect(v);if(r.length)code={t:r[0].rawValue,f:r[0].format}}
    else{const k=Math.min(1,960/Math.max(v.videoWidth,v.videoHeight));cv.width=Math.round(v.videoWidth*k);cv.height=Math.round(v.videoHeight*k);cx.drawImage(v,0,0,cv.width,cv.height);
     const r=await zx.readBarcodes(cx.getImageData(0,0,cv.width,cv.height),{formats:SCAN_FMT,tryHarder:true,maxNumberOfSymbols:1});if(r.length&&r[0].text)code={t:r[0].text,f:r[0].format}}}catch(e){}
   if(code&&run===scanSt.run){scanStop();if(navigator.vibrate)navigator.vibrate(60);scanLookup(code.t,code.f);return}}
  await new Promise(r=>setTimeout(r,120))}}
async function scanImgData(file){let src;try{src=await createImageBitmap(file,{imageOrientation:'from-image'})}catch(e){src=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=URL.createObjectURL(file)})}
 const w=src.width||src.naturalWidth,h=src.height||src.naturalHeight,k=Math.min(1,1600/Math.max(w,h)),cv=document.createElement('canvas');cv.width=Math.round(w*k);cv.height=Math.round(h*k);
 const cx=cv.getContext('2d');cx.drawImage(src,0,0,cv.width,cv.height);return{cv,data:cx.getImageData(0,0,cv.width,cv.height)}}
async function scanFile(inp){const file=inp.files&&inp.files[0];inp.value='';if(!file)return;scanStop();$('#bcv').hidden=true;$('#bccam').hidden=false;scanMsg('Reading the photo...');
 let code=null;try{const {cv,data}=await scanImgData(file),det=await scanNative();
  if(det){try{const r=await det.detect(cv);if(r.length)code={t:r[0].rawValue,f:r[0].format}}catch(e){}}
  if(!code){const zx=await scanZX(),r=await zx.readBarcodes(data,{formats:SCAN_FMT,tryHarder:true,maxNumberOfSymbols:1});if(r.length&&r[0].text)code={t:r[0].text,f:r[0].format}
   else{try{const r2=await zx.readBarcodes(file,{formats:SCAN_FMT,tryHarder:true,maxNumberOfSymbols:1});if(r2.length&&r2[0].text)code={t:r2[0].text,f:r2[0].format}}catch(e){}}}}
 catch(e){scanMsg('Could not read that photo. Try another, or type the number.','warn');return}
 if(code)scanLookup(code.t,code.f);else scanMsg('No barcode found in that photo. Get closer so the bars fill the frame, keep it sharp, or type the number.','warn')}
function scanManual(){const c=($('#bcn').value||'').replace(/\D/g,'');if(c.length<8||c.length>14){scanMsg('Enter the 8 to 13 digits under the barcode.','warn');return}scanStop();scanLookup(c,'manual')}
function upcEtoA(e){if(!/^[01]\d{7}$/.test(e))return null;const m=e.slice(1,7),l=+m[5];let b;
 if(l<3)b=m[0]+m[1]+m[5]+'0000'+m[2]+m[3]+m[4];else if(l===3)b=m[0]+m[1]+m[2]+'00000'+m[3]+m[4];else if(l===4)b=m[0]+m[1]+m[2]+m[3]+'00000'+m[4];else b=m.slice(0,5)+'0000'+m[5];
 return e[0]+b+e[7]}
function scanCodes(c,fmt){const out=[c];if(/upc.?e/i.test(fmt||'')||c.length===8){const a=upcEtoA(c);if(a)out.push(a,'0'+a)}if(c.length===12)out.push('0'+c);if(c.length===13&&c[0]==='0')out.push(c.slice(1));return[...new Set(out)]}
const scanNum=v=>{const n=parseFloat(v);return isFinite(n)?n:null};
async function scanLookup(code,fmt){const codes=scanCodes(code,fmt),run=++scanSt.run;
 const local=S.custom.find(f=>f.barcode&&codes.includes(f.barcode));if(local){toast(local.name+' is already in your foods.',3000);pickFood(local.id,local.serving||0);return}
 modal(`<h3>Scan barcode</h3><p id="bcmsg" class="muted">Looking up ${esc(code)}...</p>`);
 let p=null,hit=code,net=false;
 for(const c of codes){try{const r=await fetch('https://world.openfoodfacts.org/api/v2/product/'+c+'.json?fields=product_name,brands,nutriments,serving_size,serving_quantity,categories_tags');
   if(r.ok){const j=await r.json();if(j.status===1&&j.product){p=j.product;hit=c;break}}else if(r.status!==404)net=true}catch(e){net=true}}
 if(run!==scanSt.run)return;
 if(!p){scanSt.last={code,name:''};scanFail(code,net?`Could not reach Open Food Facts. Check your connection and try again, or enter the food yourself.`:`No product found for barcode ${code}.`);return}
 const n=p.nutriments||{},kj=scanNum(n['energy-kj_100g'])??((n.energy_unit||'kJ').toLowerCase()==='kj'?scanNum(n.energy_100g):null),kc=scanNum(n['energy-kcal_100g'])??(kj!=null?kj/4.184:null);
 const name=(p.product_name||'').trim()||('Product '+hit),brand=(p.brands||'').split(',').map(x=>x.trim()).filter(Boolean).join(', '),b1=brand.split(',')[0];
 if(kc==null){scanSt.last={code:hit,name:b1&&!name.toLowerCase().includes(b1.toLowerCase())?name+' ('+b1+')':name};scanFail(code,`Found ${name}${brand?' by '+brand:''}, but it has no nutrition info.`);return}
 const sv=scanNum(p.serving_quantity),g=sv&&sv>0&&sv<5000?r1(sv):0;
 const vals={name,brand,kcal:Math.round(kc),p:r1(scanNum(n.proteins_100g)||0),c:r1(scanNum(n.carbohydrates_100g)||0),f:r1(scanNum(n.fat_100g)||0),barcode:hit,serving:g,custom:1,scanned:1,
  src:{size:(p.serving_size||'').trim(),q:g||null},flag:scanFlag(p,n,kc,g)};
 const old=S.custom.find(f=>f.barcode&&(f.barcode===hit||codes.includes(f.barcode)));if(old&&old.corrected){toast(old.name+' is already in your foods.',3000);pickFood(old.id,old.serving||0);return}
 const f=Object.assign(old||{id:'c'+Date.now()},vals);if(!old)S.custom.push(f);save();
 toast(`Saved ${name}${b1&&!name.toLowerCase().includes(b1.toLowerCase())?' ('+b1+')':''} to your foods.`,3000);pickFood(f.id,g||100)}
function scanFail(code,msg){modal(`<h3>Scan barcode</h3><p class="bcfail">${esc(msg)}</p><p class="muted">Barcode ${esc(code)}</p>
 <button class="btn wide" onclick="scanCreate()">Create custom food</button><button class="btn sec wide" onclick="scanOpen()">Scan again</button>`)}
function scanCreate(){const l=scanSt.last||{};customFoodForm(l.name||'',l.code||'')}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&scanSt.stream){scanStop();scanMsg('Camera paused.');const b=$('#bccam');if(b)b.hidden=false;const v=$('#bcv');if(v)v.hidden=true}});
/* Open Food Facts sanity check: per-serving numbers entered as per-100 g, or a food type that is often mislabeled */
const SCAN_RISKY=/creamer|\boils?\b|sauce|dressing/i;
function scanFlag(p,n,kc,sv){const txt=(p.product_name||'')+' '+(p.categories_tags||[]).join(' ');
 const same=['energy-kcal','proteins','carbohydrates','fat'].every(k=>n[k+'_serving']==null||n[k+'_100g']==null||Math.abs(+n[k+'_serving']-+n[k+'_100g'])<0.01)&&n['energy-kcal_serving']!=null;
 return(kc<100&&sv>=5&&Math.abs(sv-100)>1&&same)||SCAN_RISKY.test(txt.replace(/-/g,' '))?1:0}
/* Fix from label: per-serving values -> per 100 g */
function fixLabelForm(id){const f=foodById(id);if(!f)return;const sq=(f.src&&f.src.q)||f.serving||'';
 modal(`<h3>Fix from label</h3><p class="muted">${esc(f.name)}. Enter what the label says for one serving. mL counts as grams.</p>
 <label>Serving size (g or mL)<input id="flS" type="number" inputmode="decimal" value="${sq}" oninput="fixLabelPrev()"></label>
 <div class="grid4"><label>kcal<input id="flK" type="number" inputmode="decimal" oninput="fixLabelPrev()"></label><label>Protein<input id="flP" type="number" inputmode="decimal" oninput="fixLabelPrev()"></label><label>Carbs<input id="flC" type="number" inputmode="decimal" oninput="fixLabelPrev()"></label><label>Fat<input id="flF" type="number" inputmode="decimal" oninput="fixLabelPrev()"></label></div>
 <p id="flPrev" class="muted">Now: ${f.kcal} kcal · P${f.p} C${f.c} F${f.f} per 100g</p><button class="btn" onclick="fixLabelSave('${id}')">Save per 100 g values</button>`)}
function fixLabelVals(){const s=+$('#flS').value;if(!(s>0))return null;const k=100/s,v=x=>+$(x).value||0;
 return{kcal:Math.round(v('#flK')*k),p:r1(v('#flP')*k),c:r1(v('#flC')*k),f:r1(v('#flF')*k)}}
function fixLabelPrev(){const v=fixLabelVals();if(v)$('#flPrev').textContent=`Per 100 g: ${v.kcal} kcal · P${v.p} C${v.c} F${v.f}`}
function fixLabelApply(f,v){Object.assign(f,v,{corrected:1,flag:0});let n=0;
 for(const d in S.log)(S.log[d]||[]).forEach(e=>{if(e.fid===f.id){const k=e.g/100;Object.assign(e,{name:f.name,kcal:f.kcal*k,p:f.p*k,c:f.c*k,f:f.f*k});n++}});return n}
function fixLabelSave(id){const f=S.custom.find(x=>x.id===id),v=fixLabelVals();if(!f||!v){toast('Enter the serving size in grams or mL.',3000);return}
 const cnt=Object.values(S.log).flat().filter(e=>e.fid===id).length;
 Object.assign(f,v,{corrected:1,flag:0});if(cnt&&confirm(`Also update ${cnt} logged entr${cnt>1?'ies':'y'} of ${f.name} with the new numbers?`))fixLabelApply(f,v);
 save();toast(`Saved ${f.name}: ${v.kcal} kcal per 100 g.`,3000);if(!$('#food').hidden)renderFood();pickFood(id)}
/* one-time data fix: Chobani cookie dough creamer was listed per serving on Open Food Facts */
(function scanMigrate(){S.mig||={};if(S.mig.chobani)return;const f=S.custom.find(x=>x.barcode==='0818290015075'||x.barcode==='818290015075');
 S.mig.chobani=1;if(f&&!f.corrected){fixLabelApply(f,{kcal:267,p:0,c:40,f:10});f.src||={size:'1 Tbsp (15 mL)',q:15};save();if(!$('#food').hidden)renderFood();setTimeout(()=>toast('Fixed Chobani cookie dough creamer from its label',6000),300)}else save()})();
