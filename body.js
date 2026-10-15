// Flat 2D muscle map: front & back silhouettes with addressable regions. viewBox 0 0 100 220, left half drawn then mirrored.
const BODY={front:[
 ['base','c',50,14,8.5],['base','r',45,22,10,8],
 ['Upper Traps','p','44,27 37,31 45,31'],
 ['Side Delts','e',27.5,38,4.5,7],['Front Delts','e',32.5,36.5,4.8,5.8],
 ['Chest','p','49.4,33 37.5,32.5 34,40 36,49 49.4,51'],
 ['Biceps','e',27.5,53,4.3,8.5],['Forearms','p','23.5,63 30.5,63 28.5,86 22,86'],['base','e',24.5,91,3.4,5],
 ['Abs','p','43,53 49.4,53 49.4,86 43.5,84'],['Serratus','p','36,50 42,53 42,63 37,59'],['base','p','36.5,61 42,65 42.5,85 37,82'],
 ['base','p','36.5,83 43.5,85.5 49.4,89 49.4,97 38,95'],['Abductors','p','32,87 36.5,85 37.5,94 34,103 31,96'],
 ['Quads','p','31.5,100 37.5,95 46,99 46.5,135 37,140 31,120'],['Adductors','p','46.2,97 49.4,98 49.4,110 46.5,127'],
 ['base','e',41.5,144,5,5],['Calves','p','35.5,150 46,150 44.5,180 38.5,181 35,166'],['base','p','38.5,182 44.5,182 44,201 39.5,201'],['base','e',41.5,205,5,3.5]],
back:[
 ['base','c',50,14,8.5],['base','r',45,22,10,8],
 ['Upper Traps','p','49.4,23 43,27 35,32.5 49.4,40'],
 ['Side Delts','e',27.5,38,4.5,7],['Rear Delts','e',32.5,36.5,4.8,5.8],
 ['Upper Back','p','49.4,40 36,34 37,47 49.4,56'],['Lats','p','37,47 49.4,57 47,76 39.5,71 34.5,56'],
 ['Triceps','e',27.5,53,4.3,8.5],['Forearms','p','23.5,63 30.5,63 28.5,86 22,86'],['base','e',24.5,91,3.4,5],
 ['Lower Back','p','40,72 49.4,77 49.4,88 41,88'],
 ['Abductors','p','31.5,86 40.5,86.5 38,94 32,97'],['Glutes','p','32,97 38.5,90 49.4,90 49.4,110 36,111 32.5,105'],
 ['Hamstrings','p','32.5,108 46,111 46,137 37,140 31.5,121'],['Adductors','p','46.2,110 49.4,110 49.4,121 46.5,129'],
 ['base','e',41.5,144,5,5],['Calves','p','34.5,148 47,148 46,172 40.5,182 35,170'],['base','p','39.5,182 45,182 44,201 39.5,201'],['base','e',41.5,205,5,3.5]]};
const FRONT_M=new Set(['Chest','Front Delts','Biceps','Abs','Serratus','Quads']);
const VIEW_OF=m=>FRONT_M.has(m)||m==='Forearms'?'front':m==='Adductors'?'front':'back';
const CROP={Chest:[18,22,64,40],'Front Delts':[16,22,40,34],'Side Delts':[14,22,40,34],'Rear Delts':[16,22,40,34],'Upper Traps':[24,14,52,34],'Upper Back':[24,24,52,40],Lats:[24,34,52,52],Biceps:[14,36,36,40],Triceps:[14,36,36,40],Forearms:[12,56,36,40],Abs:[26,46,48,48],Serratus:[26,42,48,40],'Lower Back':[26,64,48,36],Glutes:[22,80,56,42],Abductors:[20,78,48,40],Adductors:[30,90,40,48],Quads:[22,92,56,56],Hamstrings:[22,100,56,48],Calves:[24,140,52,48]};
function shp(s,fill){const[,t,...a]=s;
 if(t==='c')return `<circle cx="${a[0]}" cy="${a[1]}" r="${a[2]}" fill="${fill}"/>`;
 if(t==='r')return `<rect x="${a[0]}" y="${a[1]}" width="${a[2]}" height="${a[3]}" rx="2" fill="${fill}"/>`;
 if(t==='e')return `<ellipse cx="${a[0]}" cy="${a[1]}" rx="${a[2]}" ry="${a[3]}" fill="${fill}"/>`;
 return `<polygon points="${a[0]}" fill="${fill}" stroke-linejoin="round"/>`}
// hits: {muscle: 1 (primary) | 0.5 (secondary)}
function bodySVG(view,hits={},crop,cls='bmap'){const col=m=>m==='base'?'#3A3A3C':hits[m]>=1?'#2F80FF':hits[m]?'#2F80FF77':'#48484A';
 const g=BODY[view].map(s=>shp(s,col(s[0]))).join(''),vb=crop?crop.join(' '):'14 2 72 210';
 return `<svg class="${cls}" viewBox="${vb}" preserveAspectRatio="xMidYMid meet"><g stroke="#1E1E20" stroke-width=".6">${g}<g transform="translate(100 0) scale(-1 1)">${g}</g></g></svg>`}
