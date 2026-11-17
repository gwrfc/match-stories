const $=s=>document.querySelector(s), form=$('#form'), c=$('#story'),ctx=c.getContext('2d');
const layouts=[['match','⚑','Match day'],['kickoff','↗','Kick-off'],['score','≡','Score update'],['half','◷','Half-time'],['try','★','GW try'],['full','✓','Full-time'],['lineup','☷','Lineup']];
let mode='match',ready=false;
for(const team of opponents){const option=new Option(team.name,team.name);form.elements.opponent.add(option)}
form.elements.opponent.value='William & Mary';
syncLineup();
const defaults=Object.fromEntries(new FormData(form));
try{const old=JSON.parse(localStorage.getItem('gw-story-v1')||'null');if(old){mode=layouts.some(x=>x[0]===old.mode)?old.mode:'match';for(const [k,v]of Object.entries(old.fields||{}))if(form.elements[k])form.elements[k].value=v;if(!opponents.some(t=>t.name===form.elements.opponent.value))form.elements.opponent.value='William & Mary';syncLineup(old.fields?.captain||'')}}catch{}
function load(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src})}
let backgrounds={},gwCrest,opponentImages={},headlines={};
const headlineFiles={match:"match-day",kickoff:"kick-off",score:"score-update",half:"half-time",try:"gw-try",full:"full-time"};
async function init(){try{[backgrounds.buff,backgrounds.blue,gwCrest]=await Promise.all([load('assets/story-background-buff-v4.png'),load('assets/story-background-blue-v4.png'),load('assets/clubs/george-washington-university.png')]);await Promise.all(opponents.map(async team=>{opponentImages[team.name]=await load(team.src)}));await Promise.all(Object.entries(headlineFiles).map(async ([key,file])=>{headlines[key]={buff:await load('assets/headlines/'+file+'.svg'),blue:await load('assets/headlines/'+file+'-white.svg')}}));await Promise.allSettled([document.fonts.load('700 60px "Story Avenir"'),document.fonts.load('italic 600 60px "Story Avenir"')]);ready=true;render()}catch{$('#status').textContent='Could not load the club artwork. Please refresh.';setExportEnabled(false)}}
function fields(){return Object.fromEntries(new FormData(form))}
function save(){try{localStorage.setItem('gw-story-v1',JSON.stringify({mode,fields:fields()}));$('#saved').textContent='Saved on this device'}catch{$('#saved').textContent='Changes kept for this session'}}
function selectMode(m){mode=m;$('#moments').innerHTML=layouts.map(([id,icon,label])=>`<button type="button" class="moment ${m===id?'active':''}" aria-pressed="${m===id}" data-mode="${id}"><b>${icon}</b>${label}</button>`).join('');$('#scoreFields').hidden=m==='match'||m==='kickoff'||m==='lineup';$('#lineupFields').hidden=m!=='lineup';$('#matchFields').hidden=false;for(const name of ['address','note'])form.elements[name].closest('label').hidden=m==='lineup';syncLineup();render()}
$('#moments').addEventListener('click',e=>{const b=e.target.closest('button');if(b){selectMode(b.dataset.mode);save()}});
function text(str,x,y,size=60,color,max=930,italic=false){
  if(!str)return;
  color=color||(fields().theme==='blue'?'#ffffff':'#092b50');
  ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';
  const font=()=>`${italic?'italic ':''}${italic?600:700} ${size}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`;
  ctx.font=font();while(ctx.measureText(str).width>max&&size>18){size-=2;ctx.font=font()}
  ctx.fillStyle=color;ctx.fillText(str,x,y);ctx.restore();
}
function teamName(str,x,y,max=370){
  ctx.save();ctx.font='700 46px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif';
  const words=str.toUpperCase().split(' '),lines=[];let line='';
  for(const word of words){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>max){lines.push(line);line=word}else line=next}if(line)lines.push(line);ctx.restore();
  // Names in this curated list fit on at most two lines.
  if(lines.length>2){text(str.toUpperCase(),x,y,46,undefined,max);return}
  lines.forEach((l,i)=>text(l,x,y+(i-(lines.length-1)/2)*52,46,undefined,max));
}
function badge(which,x,y,r){
  const im=which==='gw'?gwCrest:opponentImages[fields().opponent];if(!im)return;
  // Each supplied image includes its own circular white badge: fit the whole image.
  const scale=Math.min(r*1.86/im.width,r*1.86/im.height);
  ctx.save();
  if(fields().theme==='buff'){ctx.shadowColor='rgba(9,43,80,0.42)';ctx.shadowBlur=28;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;}
  ctx.fillStyle='#ffffff';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.shadowColor='transparent';
  ctx.drawImage(im,x-im.width*scale/2,y-im.height*scale/2,im.width*scale,im.height*scale);ctx.restore();
}
function drawHeadline(top,maxHeight){
  const im=headlines[mode]?.[fields().theme];if(!im)return;
  const scale=Math.min(1000/im.width,maxHeight/im.height);
  ctx.drawImage(im,(1080-im.width*scale)/2,top,im.width*scale,im.height*scale);
}
function drawScores(home,away,ink){
  const values=[home,away].map(value=>String(Math.min(999,Math.max(0,Number(value)||0))));
  ctx.save();let size=370;
  const font=()=>`700 ${size}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`;
  ctx.font=font();
  // Use one shared size so both scores stay equally tall, even with different digit counts.
  while(Math.max(...values.map(value=>ctx.measureText(value).width))*.88>350&&size>220){size-=2;ctx.font=font()}
  values.forEach((value,i)=>{
    ctx.save();ctx.translate(i===0?310:770,905);ctx.scale(.88,1.1);
    ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.fillStyle=ink;
    const metrics=ctx.measureText(value);
    ctx.fillText(value,0,(metrics.actualBoundingBoxAscent-metrics.actualBoundingBoxDescent)/2);
    ctx.restore();
  });
  // A solid, centered dash keeps the separator strong at every score size.
  ctx.fillStyle=ink;ctx.fillRect(491,892,98,26);ctx.restore();
}
function detailLines(value,maxWidth,size){
  ctx.font=`700 ${size}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`;
  const words=String(value).trim().split(/\s+/),lines=[];let line='';
  for(const word of words){
    if(ctx.measureText(word).width>maxWidth)return null;
    const next=line?line+' '+word:word;
    if(line&&ctx.measureText(next).width>maxWidth){lines.push(line);line=word}else line=next;
  }
  if(line)lines.push(line);return lines.length<=2?lines:null;
}
function drawDetail(value,top,ink,preferredSize=66){
  if(!String(value).trim())return;
  const maxWidth=780;let size=preferredSize,lines;
  ctx.save();
  while(size>=8){lines=detailLines(value,maxWidth,size);if(lines)break;size-=2}
  if(lines){const lineHeight=size*1.18;lines.forEach((line,i)=>text(line,540,top+size/2+i*lineHeight,size,ink,maxWidth))}
  ctx.restore();
}
function drawWin(ink){
  const label='REVS WIN!',size=94,targetWidth=780;
  ctx.save();ctx.font=`italic 600 ${size}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`;
  const width=ctx.measureText(label).width;
  ctx.translate(540,595);ctx.scale(targetWidth/width,1);
  text(label,0,0,size,ink,2000,true);ctx.restore();
}
function syncLineup(selected=form.elements.captain.value){
  const players=lineupTools.parse(form.elements.players.value),captain=form.elements.captain;
  captain.replaceChildren(new Option('No captain selected',''));
  for(let i=1;i<=Math.min(players.length,23);i++)captain.add(new Option(String(i),String(i)));
  captain.value=Number(selected)>0&&Number(selected)<=Math.min(players.length,23)?String(selected):'';
  const count=players.length,valid=lineupTools.valid(players);
  $('#lineupCount').textContent=count===0?'Enter your squad to start.':valid?`${count} players · ready to export`:count<15?`${count} players entered · add ${15-count} more to reach 15.`:`${count} players entered · remove ${count-23} to stay within 23. Preview shows the first 23.`;
  $('#players').setAttribute('aria-invalid',String(count>0&&!valid));
  return players;
}
function drawLineup(f,ink){
  const titleX=145,circleX=875,circleRadius=94;
  ctx.save();let titleSize=184;
  const titleFont=()=>`700 ${titleSize}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`;
  ctx.textAlign='left';ctx.textBaseline='middle';ctx.font=titleFont();
  while(ctx.measureText('LINEUP').width>500&&titleSize>60){titleSize-=2;ctx.font=titleFont()}
  const titleRight=titleX+ctx.measureText('LINEUP').actualBoundingBoxRight;
  ctx.fillStyle=ink;ctx.fillText('LINEUP',titleX,320);
  const circleLeft=circleX-circleRadius,separator=f.setting==='Away'?'@':'vs';
  const separatorCenter=(titleRight+circleLeft)/2;let separatorSize=76;
  const separatorFont=()=>`700 ${separatorSize}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`;
  ctx.font=separatorFont();
  while(ctx.measureText(separator).width>circleLeft-titleRight-32&&separatorSize>20){separatorSize-=2;ctx.font=separatorFont()}
  const metrics=ctx.measureText(separator);
  ctx.fillText(separator,separatorCenter-(metrics.actualBoundingBoxRight-metrics.actualBoundingBoxLeft)/2,320);
  ctx.restore();badge('opponent',circleX,320,circleRadius);
  const players=lineupTools.parse(f.players).slice(0,23),rowCount=Math.max(15,players.length);
  const rowHeight=Math.min(76,1200/rowCount),baseSize=Math.min(66,rowHeight*.91);
  for(let i=0;i<rowCount;i++){
    const y=510+i*rowHeight,name=players[i]?lineupTools.name(players,i,f.captain):'—';
    ctx.save();ctx.font=`700 ${baseSize}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`;
    ctx.textBaseline='middle';ctx.fillStyle=ink;ctx.textAlign='left';
    const number=String(i+1),numberMetrics=ctx.measureText(number);
    ctx.fillText(number,205-numberMetrics.actualBoundingBoxRight,y);ctx.fillText('.',218,y);
    let size=baseSize;
    while(ctx.measureText(name).width>675&&size>14){size-=1;ctx.font=`700 ${size}px "Story Avenir", "Avenir Next Condensed", "Arial Narrow", sans-serif`}
    ctx.fillText(name,260,y);ctx.restore();
  }
  let date='';if(f.date){const d=new Date(f.date+'T12:00:00');if(!isNaN(d))date=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase()}
  text([date,f.kickoff].filter(Boolean).join('  ·  '),540,1775,56,ink,950,true);
  text(f.venue,540,1850,68,ink,950,true);
}
function render(){
  if(!ready)return;const f=fields(),blue=f.theme==='blue',ink=blue?'#ffffff':'#092b50';
  ctx.clearRect(0,0,1080,1920);ctx.drawImage(backgrounds[f.theme]||backgrounds.buff,0,0,1080,1920);
  if(mode==='lineup'){drawLineup(f,ink);prepareExport();return}

  const match=mode==='match',kick=mode==='kickoff',separator=f.setting==='Away'?'@':'vs';
  if(match){
    drawHeadline(200,510);
    badge('gw',315,1000,150);badge('opponent',765,1000,150);text(separator,540,1000,90,ink,130);
    teamName('GW REVS',315,1210);teamName(f.opponent,765,1210);
  }else{
    drawHeadline(190,350);
    if(kick)text("LET'S GO REVS!",540,650,110,ink,950);
    else{
      const win=mode==='full'&&Number(f.gwScore)>Number(f.oppScore);
      if(win)drawWin(ink);
      drawDetail(f.detail||(mode==='try'?'RAISE HIGH. RAISE HELL.':''),win?650:570,ink,win?42:66);
    }
    drawScores(kick?0:f.gwScore,kick?0:f.oppScore,ink);
    badge('gw',310,1280,140);badge('opponent',770,1280,140);text(separator,540,1280,82,ink,140);

  }
  let date='';if(f.date){const d=new Date(f.date+'T12:00:00');if(!isNaN(d))date=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase()}
  const dateAndTime=[date,f.kickoff?'KICK-OFF '+f.kickoff:''].filter(Boolean).join('  ·  ');
  if(match){
    text(dateAndTime,540,1460,76,ink,950,true);
    text(f.venue,540,1595,112,ink,950,true);
    text(f.address,540,1720,82,ink,950,true);
    text(f.note,540,1845,68,ink,950,true);
  }else{
    text(dateAndTime,540,kick?1625:1660,72,ink,950,true);
    text(f.venue,540,kick?1725:1760,106,ink,950,true);
    text(f.address,540,kick?1815:1855,76,ink,950,true);
    if(kick)text(f.note,540,1880,58,ink,950,true);
  }
  prepareExport();
}
form.addEventListener('input',e=>{if(e.target.name==='players')syncLineup();render();save()});form.addEventListener('change',e=>{if(e.target.name==='players')syncLineup();render();save()});
document.querySelectorAll('[data-points]').forEach(b=>b.onclick=()=>{const field=b.dataset.team==='opponent'?form.elements.oppScore:form.elements.gwScore;field.value=Math.min(999,Math.max(0,Number(field.value)||0)+Number(b.dataset.points));render();save()});
$('#guides').onclick=()=>{const on=$('.safe-overlay').hidden;$('.safe-overlay').hidden=!on;$('#guides').setAttribute('aria-pressed',on)};
$('#reset').onclick=()=>{for(const[k,v]of Object.entries(defaults))form.elements[k].value=v;selectMode('match');save()};
let preparedFile=null,exportRevision=0,exportTimer,previewUrl;
function setExportEnabled(enabled){for(const id of ['saveStory','viewImage','download'])$('#'+id).disabled=!enabled}
function prepareExport(){
  const revision=++exportRevision;clearTimeout(exportTimer);preparedFile=null;setExportEnabled(false);
  exportTimer=setTimeout(()=>c.toBlob(blob=>{
    if(revision!==exportRevision)return;
    if(!blob){$('#status').textContent='Could not prepare the image. Please try again.';return}
    const name=`gw-${mode}-${fields().opponent.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`;
    preparedFile=new File([blob],name,{type:'image/png'});setExportEnabled(mode!=='lineup'||lineupTools.valid(lineupTools.parse(fields().players)));
  },'image/png'),120);
}
function openImage(){
  if(!preparedFile)return;
  if(previewUrl)URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(preparedFile);$('#exportImage').src=previewUrl;
  $('#imageDialog').showModal();
}
function downloadStory(){
  if(!preparedFile)return;
  const a=document.createElement('a'),url=URL.createObjectURL(preparedFile);
  a.href=url;a.download=preparedFile.name;document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  $('#status').textContent='PNG download started. To save to Photos, try Save / share or Open image to save.';
}
$('#saveStory').onclick=()=>{
  if(!preparedFile)return;
  const data={files:[preparedFile]};
  if(window.isSecureContext&&navigator.share&&navigator.canShare&&navigator.canShare(data)){
    // The PNG is prepared before the tap so the native share sheet keeps its user gesture.
    navigator.share(data).then(()=>{$('#status').textContent='Share sheet closed. Choose Save Image there to keep a copy in Photos.'}).catch(error=>{
      if(error.name==='AbortError'){$('#status').textContent='Sharing cancelled. Your story is still ready.';return}
      $('#status').textContent='Sharing is unavailable here. Press and hold the image to save it.';openImage();
    });
  }else{openImage();$('#status').textContent='Press and hold the full-size image to see your phone’s save options.'}
};
$('#download').onclick=downloadStory;$('#dialogDownload').onclick=downloadStory;
$('#viewImage').onclick=openImage;$('#closeImage').onclick=()=>$('#imageDialog').close();
$('#imageDialog').addEventListener('close',()=>{if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;$('#exportImage').removeAttribute('src')}});
selectMode(mode);init();
